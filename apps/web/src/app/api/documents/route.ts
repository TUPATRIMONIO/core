import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/documents - Lista documentos del usuario
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organization_id");

    if (!organizationId) {
        return NextResponse.json({ error: "organization_id required" }, {
            status: 400,
        });
    }

    // Usar la vista para SELECT (está permitido)
    const { data: documents, error } = await supabase
        .from("documents_documents")
        .select("*")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("Error fetching documents:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents });
}

// POST /api/documents - Crear nuevo documento usando RPC
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, organization_id } = body;

    if (!organization_id) {
        return NextResponse.json({ error: "organization_id required" }, {
            status: 400,
        });
    }

    // Usar RPC para crear documento
    const { data: document, error } = await supabase.rpc("create_document", {
        p_title: title || "Sin título",
        p_content: content || { type: "doc", content: [{ type: "paragraph" }] },
        p_organization_id: organization_id,
    });

    if (error) {
        console.error("Error creating document:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document }, { status: 201 });
}
