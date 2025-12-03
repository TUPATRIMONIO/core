/**
 * API Route: Template Individual
 * 
 * GET: Obtener template por ID
 * PATCH: Actualizar template
 * DELETE: Eliminar template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateTemplate, extractVariables, previewTemplate } from '@/lib/communications/template-engine';
import { requireApplicationAccess } from '@/lib/access/api-access-guard';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a Email Marketing
  const denied = await requireApplicationAccess(request, 'email_marketing');
  if (denied) return denied;

  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener organización del usuario
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Usuario no pertenece a ninguna organización' },
        { status: 400 }
      );
    }

    // Obtener template
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Template no encontrado' }, { status: 404 });
    }

    // Obtener parámetro preview
    const { searchParams } = new URL(request.url);
    const includePreview = searchParams.get('preview') === 'true';

    const response: any = { data };

    if (includePreview) {
      // Generar preview del template
      response.preview = {
        html: previewTemplate(data.body_html),
        subject: previewTemplate(data.subject),
      };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error al obtener template:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener template' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a Email Marketing
  const denied = await requireApplicationAccess(request, 'email_marketing');
  if (denied) return denied;

  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener organización del usuario
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Usuario no pertenece a ninguna organización' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, subject, body_html, body_text, variables, is_active } = body;

    // Construir objeto de actualización
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subject !== undefined) updateData.subject = subject;
    if (body_html !== undefined) {
      // Validar sintaxis del template
      const validation = validateTemplate(body_html);
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Template inválido: ${validation.error}` },
          { status: 400 }
        );
      }
      updateData.body_html = body_html;

      // Actualizar variables si se cambió el template
      const extractedVars = extractVariables(body_html);
      const templateVariables = variables || updateData.variables || {};
      extractedVars.forEach((varName) => {
        if (!templateVariables[varName]) {
          templateVariables[varName] = `Variable: ${varName}`;
        }
      });
      updateData.variables = templateVariables;
    }
    if (body_text !== undefined) updateData.body_text = body_text;
    if (variables !== undefined) updateData.variables = variables;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Actualizar template
    const { data, error } = await supabase
      .from('message_templates')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Template no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error al actualizar template:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a Email Marketing
  const denied = await requireApplicationAccess(request, 'email_marketing');
  if (denied) return denied;

  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener organización del usuario
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Usuario no pertenece a ninguna organización' },
        { status: 400 }
      );
    }

    // Verificar si el template está siendo usado en campañas activas
    const { data: activeCampaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('template_id', id)
      .in('status', ['draft', 'scheduled', 'sending'])
      .limit(1);

    if (activeCampaigns && activeCampaigns.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el template porque está siendo usado en campañas activas' },
        { status: 400 }
      );
    }

    // Eliminar template
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al eliminar template:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar template' },
      { status: 500 }
    );
  }
}

