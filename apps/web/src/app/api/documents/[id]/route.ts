import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/documents/[id] - Obtener documento específico
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Usar RPC para obtener documento
    const { data: document, error } = await supabase.rpc("get_document", {
        p_document_id: id,
    });

    if (error || !document) {
        console.error("Error getting document:", error);
        return NextResponse.json({ error: "Document not found" }, {
            status: 404,
        });
    }

    return NextResponse.json({ document });
}

// PUT /api/documents/[id] - Actualizar documento
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, status } = body;

    // Usar RPC para actualizar
    const { data: document, error } = await supabase.rpc("update_document", {
        p_document_id: id,
        p_title: title || null,
        p_content: content || null,
        p_status: status || null,
    });

    if (error) {
        console.error("Error updating document:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document });
}

// DELETE /api/documents/[id] - Eliminar documento
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Para DELETE, usar la tabla base directamente con schema
    const { error } = await supabase
        .schema("documents")
        .from("documents")
        .delete()
        .eq("id", id)
        .eq("created_by", user.id); // Solo el creador puede eliminar

    if (error) {
        console.error("Error deleting document:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
