import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiateSigningProcess } from "@/lib/signing/initiate-signing";

/**
 * API Route: POST /api/admin/document-review/action
 * 
 * Maneja las acciones administrativas sobre un documento en revisión.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar que el usuario está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { document_id, action, comment, is_internal = false } = body;

    if (!document_id || !action) {
      return NextResponse.json({ error: "document_id y action son requeridos" }, { status: 400 });
    }

    // 1. Determinar nuevo estado
    let newStatus: string;
    switch (action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'request_changes':
        newStatus = 'needs_correction';
        break;
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

    // 2. Insertar comentario si existe
    if (comment?.trim()) {
      const { error: msgError } = await supabase
        .from("signing_document_messages")
        .insert({
          document_id,
          message: comment.trim(),
          is_internal,
          user_id: user.id
        });

      if (msgError) {
        console.error("Error inserting message:", msgError);
      }
    }

    // 3. Actualizar estado del documento
    const { error: updateError } = await supabase
      .from("signing_documents")
      .update({ status: newStatus })
      .eq("id", document_id);

    if (updateError) {
      console.error("Error updating document status:", updateError);
      return NextResponse.json({ error: "No tienes permisos para actualizar este documento" }, { status: 403 });
    }

    // 4. Si es aprobación, iniciar el proceso de firma automáticamente
    if (action === 'approve') {
      console.log("[action] Iniciando proceso de firma para documento:", document_id);
      
      const signResult = await initiateSigningProcess(supabase, document_id);
      
      if (!signResult.success) {
        console.error("[action] Error al iniciar firma automática:", signResult.error);
        return NextResponse.json({ 
          success: true, 
          message: "Documento aprobado, pero hubo un error al iniciar la firma automática.",
          warning: signResult.error,
          details: signResult.details
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "Documento aprobado e iniciado proceso de firma",
        new_status: "pending_signature"
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: action === 'reject' ? "Documento rechazado" : "Corrección solicitada",
      new_status: newStatus
    });

  } catch (error: any) {
    console.error("Error en /api/admin/document-review/action:", error);
    return NextResponse.json(
      { error: "Error interno al procesar la acción", details: error.message },
      { status: 500 }
    );
  }
}
