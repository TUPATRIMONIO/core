/**
 * API Route: Gestión de Cuenta SendGrid
 *
 * GET: Obtener cuenta SendGrid de la organización del usuario
 * POST: Crear o actualizar cuenta SendGrid
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getSendGridAccount,
  upsertSendGridAccount,
} from "@/lib/sendgrid/accounts";
import { getUserActiveOrganization } from "@/lib/organization/utils";
import type { SendGridAccountInput } from "@/lib/sendgrid/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener organización activa del usuario
    const { organization, error: orgError } = await getUserActiveOrganization(
      supabase,
    );

    if (!organization) {
      return NextResponse.json(
        { error: orgError || "Usuario no pertenece a ninguna organización" },
        { status: 400 },
      );
    }

    // Obtener cuenta SendGrid (sin API key por seguridad)
    const account = await getSendGridAccount(organization.id);

    if (!account) {
      return NextResponse.json({ data: null });
    }

    // No retornar API key por seguridad
    const { api_key, ...accountWithoutKey } = account;

    return NextResponse.json({
      data: {
        ...accountWithoutKey,
        has_api_key: true, // Indicar que tiene API key configurada
      },
    });
  } catch (error: any) {
    console.error("Error al obtener cuenta SendGrid:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener cuenta SendGrid" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener organización activa del usuario
    const { organization, error: orgError } = await getUserActiveOrganization(
      supabase,
    );

    if (!organization) {
      return NextResponse.json(
        { error: orgError || "Usuario no pertenece a ninguna organización" },
        { status: 400 },
      );
    }

    // Verificar permisos - obtener rol del usuario en la organización
    const { data: orgUserRole } = await supabase
      .from("organization_users")
      .select("role:roles(level)")
      .eq("user_id", user.id)
      .eq("organization_id", organization.id)
      .eq("status", "active")
      .single();

    // Verificar que sea admin o superior (level >= 7)
    const roleLevel = (orgUserRole?.role as any)?.level || 0;
    if (roleLevel < 7) {
      return NextResponse.json(
        {
          error:
            "No tienes permisos para configurar SendGrid. Se requiere rol de administrador.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { api_key, from_email, from_name } = body as SendGridAccountInput;

    // Validaciones
    if (!api_key || !from_email || !from_name) {
      return NextResponse.json(
        { error: "api_key, from_email y from_name son campos requeridos" },
        { status: 400 },
      );
    }

    if (!from_email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      return NextResponse.json({ error: "from_email no es válido" }, {
        status: 400,
      });
    }

    // Crear o actualizar cuenta
    const result = await upsertSendGridAccount(
      organization.id,
      { api_key, from_email, from_name },
      user.id,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // No retornar API key por seguridad
    const { api_key: _, ...accountWithoutKey } = result.data!;

    return NextResponse.json({
      success: true,
      data: {
        ...accountWithoutKey,
        has_api_key: true,
      },
    });
  } catch (error: any) {
    console.error("Error al guardar cuenta SendGrid:", error);
    return NextResponse.json(
      { error: error.message || "Error al guardar cuenta SendGrid" },
      { status: 500 },
    );
  }
}
