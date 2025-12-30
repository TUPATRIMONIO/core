import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Tipos para el formulario
interface BetaSignupData {
    email: string;
    first_name?: string;
    last_name?: string;
    company?: string;
}

// Validación de email simple
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
    try {
        // Parse el body
        const body: BetaSignupData = await request.json();

        // Validaciones
        if (!body.email || !isValidEmail(body.email)) {
            return NextResponse.json(
                { error: "Email inválido o no proporcionado" },
                { status: 400 },
            );
        }

        if (body.first_name && body.first_name.length > 50) {
            return NextResponse.json(
                { error: "El nombre no puede exceder 50 caracteres" },
                { status: 400 },
            );
        }

        if (body.last_name && body.last_name.length > 50) {
            return NextResponse.json(
                { error: "El apellido no puede exceder 50 caracteres" },
                { status: 400 },
            );
        }

        if (body.company && body.company.length > 100) {
            return NextResponse.json(
                {
                    error:
                        "El nombre de la empresa no puede exceder 100 caracteres",
                },
                { status: 400 },
            );
        }

        // Obtener IP y User-Agent
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";

        // Crear cliente de Supabase (sin auth, acceso anónimo)
        const supabase = await createClient();

        // Insertar usando RPC para evitar problemas de permisos de schema
        const { data: rpcResult, error } = await supabase.rpc(
            "subscribe_to_waitlist",
            {
                p_email: body.email.toLowerCase().trim(),
                p_first_name: body.first_name?.trim() || null,
                p_last_name: body.last_name?.trim() || null,
                p_company: body.company?.trim() || null,
                p_user_agent: userAgent,
                p_ip_address: ip,
                p_campaign: "beta",
            },
        );

        if (error) {
            console.error("RPC Error:", error);
            return NextResponse.json(
                {
                    error:
                        "Error al procesar tu solicitud. Por favor intenta nuevamente.",
                },
                { status: 500 },
            );
        }

        // Manejar errores lógicos retornados por la función
        // rpcResult es any, pero sabemos que devuelve { success: boolean, error?: string, id?: string }
        const result = rpcResult as any;

        if (!result.success) {
            if (result.error === "email_exists") {
                return NextResponse.json(
                    {
                        error:
                            "Este email ya está registrado en nuestra lista de beta testers",
                    },
                    { status: 409 },
                );
            }

            console.error("Beta subscription error:", result.message);
            return NextResponse.json(
                {
                    error:
                        "Error al registrarte. Por favor intenta nuevamente.",
                },
                { status: 500 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "¡Bienvenido al beta! Te contactaremos pronto.",
                data: {
                    id: result.id,
                    email: result.email,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Beta signup error:", error);
        return NextResponse.json(
            { error: "Error inesperado. Por favor intenta nuevamente." },
            { status: 500 },
        );
    }
}

// Método GET para verificar que el endpoint está activo (opcional)
export async function GET() {
    return NextResponse.json({
        status: "active",
        endpoint: "/api/beta/signup",
        methods: ["POST"],
    });
}
