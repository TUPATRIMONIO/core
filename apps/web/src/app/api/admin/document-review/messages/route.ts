import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * API Route: POST /api/admin/document-review/messages
 * 
 * Permite enviar un mensaje en el hilo de conversación de un documento.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { document_id, message, is_internal = false } = body;

    if (!document_id || !message) {
      return NextResponse.json({ error: "document_id y message son requeridos" }, { status: 400 });
    }

    // Insertar el mensaje
    // Dejamos que el RLS maneje si el usuario puede o no insertar.
    // Como ya corregimos el RLS para administradores, debería funcionar.
    const { data, error } = await supabase
      .from("signing_document_messages")
      .insert({
        document_id,
        message: message.trim(),
        is_internal,
        user_id: user.id
      })
      .select(`
        *,
        user:users(id, email, full_name)
      `)
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return NextResponse.json({ error: "No tienes permisos para enviar mensajes en este documento", details: error.message }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      message: data
    });

  } catch (error: any) {
    console.error("Error en /api/admin/document-review/messages:", error);
    return NextResponse.json(
      { error: "Error interno", details: error.message },
      { status: 500 }
    );
  }
}
