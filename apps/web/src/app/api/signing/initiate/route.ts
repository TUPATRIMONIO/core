import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiateSigningProcess } from "@/lib/signing/initiate-signing";

/**
 * API Route: POST /api/signing/initiate
 *
 * Inicia el proceso de firma de un documento.
 * Encapsula la lógica en initiateSigningProcess para reuso.
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { document_id } = body;

        if (!document_id) {
            return NextResponse.json(
                { error: "document_id es requerido" },
                { status: 400 },
            );
        }

        const result = await initiateSigningProcess(supabase, document_id);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error, details: result.details },
                { status: result.status || 500 },
            );
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error en /api/signing/initiate:", error);
        return NextResponse.json(
            {
                error: "Error al iniciar proceso de firma",
                details: error.message,
            },
            { status: 500 },
        );
    }
}
