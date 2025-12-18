import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuración CORS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

// Tipos de operaciones disponibles
type Operation =
    | "check-vigencia"
    | "enroll"
    | "request-second-factor"
    | "sign-multiple"
    | "get-document"
    | "unblock-certificate"
    | "unblock-second-factor"
    | "simple-flow";

interface CDSRequest {
    operation: Operation;
    organization_id: string;
    [key: string]: any;
}

interface CDSConfig {
    usuario: string;
    clave: string;
    base_url: string;
    endpoints: Record<string, string>;
    webhook_url?: string;
    webhook_secret?: string;
}

serve(async (req) => {
    // Manejo de preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        const payload: CDSRequest = await req.json();

        // Validar payload requerido
        if (!payload.operation || !payload.organization_id) {
            throw new Error("Requiere: operation y organization_id");
        }

        // Obtener configuración de CDS para la organización
        const config = await getCDSConfig(
            supabaseClient,
            payload.organization_id,
        );

        // Ejecutar operación según el tipo
        let result;
        switch (payload.operation) {
            case "check-vigencia":
                result = await checkVigenciaFEA(config, payload);
                break;
            case "enroll":
                result = await enrollFirmante(config, payload);
                break;
            case "request-second-factor":
                result = await requestSecondFactor(config, payload);
                break;
            case "sign-multiple":
                result = await signMultiple(config, payload);
                break;
            case "get-document":
                result = await getDocument(config, payload);
                break;
            case "unblock-certificate":
                result = await unblockCertificate(config, payload);
                break;
            case "unblock-second-factor":
                result = await unblockSecondFactor(config, payload);
                break;
            case "simple-flow":
                result = await simpleFlowFEA(config, payload);
                break;
            default:
                throw new Error(`Operación no soportada: ${payload.operation}`);
        }

        return new Response(
            JSON.stringify({
                success: true,
                operation: payload.operation,
                data: result,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (error: any) {
        console.error("Error en cds-signature:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Error desconocido",
                details: error.stack,
            }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});

/**
 * Obtiene la configuración de CDS para una organización
 */
async function getCDSConfig(
    supabase: any,
    organizationId: string,
): Promise<CDSConfig> {
    // Obtener proveedor CDS
    const { data: providers, error: providerError } = await supabase
        .from("signing_providers")
        .select("*")
        .eq("slug", "cds")
        .eq("is_active", true)
        .limit(1);

    const provider = providers?.[0];

    if (providerError || !provider) {
        throw new Error(
            `Proveedor CDS no encontrado o inactivo: ${
                providerError?.message || "No results"
            }`,
        );
    }

    // Obtener configuración de la organización
    const { data: configs, error: configError } = await supabase
        .from("signing_provider_configs")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("provider_id", provider.id)
        .eq("is_active", true)
        .limit(1);

    const config = configs?.[0];

    if (configError || !config) {
        throw new Error(
            `Configuración de CDS no encontrada para la organización ${organizationId}: ${
                configError?.message || "No results"
            }`,
        );
    }

    // Determinar URL base según modo de prueba
    const baseUrl = config.is_test_mode ? provider.test_url : provider.base_url;

    return {
        usuario: config.credentials.usuario,
        clave: config.credentials.clave,
        base_url: baseUrl,
        endpoints: provider.endpoints,
        webhook_url: config.webhook_url,
        webhook_secret: config.webhook_secret,
    };
}

/**
 * Consulta la vigencia de FEA de un firmante
 */
async function checkVigenciaFEA(config: CDSConfig, payload: any) {
    const { rut } = payload;
    if (!rut) throw new Error("RUT es requerido");

    const endpoint =
        `${config.base_url}${config.endpoints.consultaVigenciaFEA}`;

    // Estructura correcta según documentación (Nested Request)
    const requestBody = {
        request: {
            encabezado: {
                usuario: config.usuario,
                clave: config.clave,
            },
            parametro: {
                firmantes: [
                    { rut: rut },
                ],
            },
        },
    };

    console.log("Sending checkVigencia to CDS:", endpoint);
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log("CDS Vigencia Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
        throw new Error(`Error CDS: ${data.mensaje || response.statusText}`);
    }

    // CDS retorna "estado": "OK" y "errorCode": 0
    if (data.errorCode !== 0 && data.errorCode !== "0") {
        return {
            success: false,
            codigo: data.errorCode,
            mensaje: data.comentarios || data.mensaje,
            vigente: false,
            debug_data: data, // Para depuración en UI
        };
    }

    // Parsear respuesta para encontrar el solicitante específico
    const solicitante = data.solicitantes?.find((s: any) => s.rut === rut);

    if (!solicitante) {
        return {
            success: true,
            vigente: false,
            mensaje: "RUT no encontrado en respuesta de CDS",
            debug_data: data,
        };
    }

    return {
        success: true,
        vigente: solicitante.feaVigente === true ||
            solicitante.feaVigente === "true",
        fechaVencimiento: solicitante.fechaVencimiento,
        certificadoBloqueado: solicitante.certificadoBloqueado === true ||
            solicitante.certificadoBloqueado === "true",
        mensaje: data.comentarios,
        debug_data: data,
    };
}

/**
 * Enrola un nuevo firmante en CDS
 * Según documentación oficial, solo requiere: rut, correo, extranjero
 */
async function enrollFirmante(config: CDSConfig, payload: any) {
    const {
        rut,
        correo,
        extranjero = false, // Por defecto chileno
        enviaCorreo = true, // Por defecto enviar correo
        urlRetorno,
    } = payload;

    if (!rut || !correo) {
        throw new Error("Campos requeridos: rut, correo");
    }

    const endpoint = `${config.base_url}${config.endpoints.enrolarFirmanteFEA}`;

    // Estructura según documentación oficial de CDS
    const requestBody = {
        request: {
            encabezado: {
                usuario: config.usuario,
                clave: config.clave,
            },
            parametro: {
                urlNotificacion: config.webhook_url ||
                    "https://app.tupatrimonio.cl/api/webhooks/cds",
                authorization: config.webhook_secret || "SharedSecret123",
                urlRetorno: urlRetorno || "https://app.tupatrimonio.cl",
                enviaCorreo: enviaCorreo,
                firmantes: [
                    {
                        rut: rut,
                        correo: correo,
                        extranjero: extranjero,
                    },
                ],
            },
        },
    };

    console.log("Sending to CDS Enroll:", endpoint);
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log("CDS Enroll Response Status:", response.status);
    console.log("CDS Enroll Response Data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
        throw new Error(
            `Error CDS HTTP: ${
                data.comentarios || data.mensaje || response.statusText
            }`,
        );
    }

    // CDS usa "estado" en lugar de "codigo"
    if (data.estado && data.estado !== "OK") {
        console.error(
            "CDS returned error estado:",
            data.estado,
            "comentarios:",
            data.comentarios,
        );
        return {
            success: false,
            codigo: data.errorCode?.toString(),
            mensaje: data.comentarios || data.mensaje ||
                "Error desconocido de CDS",
            debug_data: data,
        };
    }

    // Fallback para estructura antigua (codigo)
    if (data.codigo && data.codigo !== "0") {
        console.error(
            "CDS returned error code:",
            data.codigo,
            "mensaje:",
            data.mensaje,
        );
        return {
            success: false,
            codigo: data.codigo,
            mensaje: data.mensaje || "Error desconocido de CDS",
            debug_data: data,
        };
    }

    return {
        success: true,
        mensaje: data.comentarios || data.mensaje || "Enrolamiento exitoso",
        enrolled: true,
        url: data.url, // URL retornado por CDS si enviaCorreo es false
        debug_data: data,
    };
}

/**
 * Solicita código de segundo factor
 */
async function requestSecondFactor(config: CDSConfig, payload: any) {
    const { rut, claveCertificado } = payload;
    // La documentación nueva pide 'solicitante: { rut, claveCertificado }'
    // El payload original tenía solo 'rut' y 'correo'.
    // Si viene 'claveCertificado' usamos la nueva estructura.

    if (!rut) throw new Error("RUT es requerido");

    const endpoint =
        `${config.base_url}${config.endpoints.solicitarSegundoFactor}`;

    const requestBody = {
        request: {
            encabezado: {
                usuario: config.usuario,
                clave: config.clave,
            },
            parametro: {
                solicitante: {
                    rut: rut,
                    claveCertificado: claveCertificado || config.clave ||
                        "123456", // Fallback si no viene, pero debería venir
                },
            },
        },
    };

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Error CDS: ${data.mensaje || response.statusText}`);
    }

    if (data.errorCode !== 0 && data.errorCode !== "0") {
        return {
            success: false,
            codigo: data.errorCode,
            mensaje: data.comentarios,
            debug_data: data,
        };
    }

    return {
        success: true,
        mensaje: data.comentarios,
        debug_data: data,
    };
}

/**
 * Firma múltiple de documentos (flujo principal / síncrono)
 */
async function signMultiple(config: CDSConfig, payload: any) {
    const {
        rut,
        claveCertificado,
        segundoFactor,
        documento, // Base64 (singular según nueva doc)
        nombreDocumento,
        qr = false,
        traeCoordenadas = false,
        pag,
        coordenadaXInferiorIzquierda,
        coordenadaYInferiorIzquierda,
        coordenadaXSuperiorDerecha,
        coordenadaYSuperiorDerecha,
    } = payload;

    if (
        !rut || !claveCertificado || !segundoFactor || !documento ||
        !nombreDocumento
    ) {
        throw new Error(
            "Campos requeridos: rut, claveCertificado, segundoFactor, documento, nombreDocumento",
        );
    }

    const endpoint =
        `${config.base_url}${config.endpoints.firmaMultipleFeaApi}`;

    const requestBody: any = {
        request: {
            encabezado: {
                usuario: config.usuario,
                clave: config.clave,
            },
            parametro: {
                nombreDocumento,
                qr,
                solicitante: {
                    rut,
                    claveCertificado,
                    segundoFactor,
                    traeCoordenadas,
                },
                documento, // Según doc va fuera de solicitante, directo en parametro
            },
        },
    };

    if (traeCoordenadas) {
        requestBody.request.parametro.solicitante.pag = pag || 1;
        requestBody.request.parametro.solicitante.coordenadaXInferiorIzquierda =
            coordenadaXInferiorIzquierda;
        requestBody.request.parametro.solicitante.coordenadaYInferiorIzquierda =
            coordenadaYInferiorIzquierda;
        requestBody.request.parametro.solicitante.coordenadaXSuperiorDerecha =
            coordenadaXSuperiorDerecha;
        requestBody.request.parametro.solicitante.coordenadaYSuperiorDerecha =
            coordenadaYSuperiorDerecha;
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Error CDS: ${data.mensaje || response.statusText}`);
    }

    if (data.estado === "FAIL" || (data.errorCode && data.errorCode !== 0)) {
        return {
            success: false,
            codigo: data.errorCode,
            mensaje: data.comentarios,
            debug_data: data,
        };
    }

    return {
        success: true,
        transaccion: data.transaccion,
        documentoFirmado: data.documentoFirmado,
        mensaje: data.comentarios,
        debug_data: data,
    };
}

/**
 * Obtiene documento firmado por código de transacción
 */
async function getDocument(config: CDSConfig, payload: any) {
    const { codigoTransaccion } = payload;
    if (!codigoTransaccion) throw new Error("codigoTransaccion es requerido");

    const endpoint =
        `${config.base_url}${config.endpoints.obtenerDocumentoPorCodigo}`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            usuario: config.usuario,
            clave: config.clave,
            codigoTransaccion,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Error CDS: ${data.mensaje || response.statusText}`);
    }

    if (data.codigo !== "0") {
        return {
            success: false,
            codigo: data.codigo,
            mensaje: data.mensaje,
            debug_data: data,
        };
    }

    return {
        success: true,
        documentos: data.documentos,
        mensaje: data.mensaje,
        debug_data: data,
    };
}

/**
 * Desbloquea certificado bloqueado
 * Estructura basada en patrón CDS con request anidado
 */
async function unblockCertificate(config: CDSConfig, payload: any) {
    const { rut, numDocumento, urlRetorno, enviarMail = true } = payload;
    if (!rut) throw new Error("RUT es requerido");

    const endpoint =
        `${config.base_url}${config.endpoints.desbloqueoCertificado}`;

    // Estructura según documentación oficial CDS para desbloqueoCertificado
    const requestBody = {
        request: {
            encabezado: {
                usuario: config.usuario,
                clave: config.clave,
            },
            parametro: {
                solicitante: {
                    rut: rut,
                    numDocumento: numDocumento || "",
                    urlRetorno: urlRetorno || "https://app.tupatrimonio.cl",
                    enviarMail: enviarMail, // true = envía correo, false = retorna URL
                },
            },
        },
    };

    console.log("Sending unblockCertificate to CDS:", endpoint);
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log(
        "CDS unblockCertificate Response:",
        JSON.stringify(data, null, 2),
    );

    if (!response.ok) {
        throw new Error(`Error CDS: ${data.mensaje || response.statusText}`);
    }

    // CDS retorna estado OK/FAIL
    if (data.estado === "FAIL") {
        return {
            success: false,
            codigo: data.errorCode,
            mensaje: data.comentarios,
            debug_data: data,
        };
    }

    return {
        success: true,
        url: data.url,
        mensaje: data.comentarios,
        debug_data: data,
    };
}

/**
 * Desbloquea segundo factor bloqueado
 * Según documentación: requiere rut, numDocumento, urlRetorno
 */
async function unblockSecondFactor(config: CDSConfig, payload: any) {
    const { rut, numDocumento, urlRetorno } = payload;
    if (!rut || !numDocumento) {
        throw new Error("Campos requeridos: rut, numDocumento");
    }

    const endpoint =
        `${config.base_url}${config.endpoints.desbloqueoSegundoFactor}`;

    // Estructura según documentación oficial de CDS
    const requestBody = {
        request: {
            encabezado: {
                usuario: config.usuario,
                clave: config.clave,
            },
            parametro: {
                solicitante: {
                    rut: rut,
                    numDocumento: numDocumento,
                    urlRetorno: urlRetorno || "https://app.tupatrimonio.cl",
                },
            },
        },
    };

    console.log("Sending unblockSecondFactor to CDS:", endpoint);
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log(
        "CDS unblockSecondFactor Response:",
        JSON.stringify(data, null, 2),
    );

    if (!response.ok) {
        throw new Error(`Error CDS: ${data.mensaje || response.statusText}`);
    }

    // CDS retorna estado OK/FAIL y url para desbloqueo
    if (data.estado === "FAIL") {
        return {
            success: false,
            codigo: data.errorCode,
            mensaje: data.comentarios,
            debug_data: data,
        };
    }

    return {
        success: true,
        url: data.url, // URL donde el usuario debe ir para desbloquear
        mensaje: data.comentarios,
        debug_data: data,
    };
}

/**
 * Flujo Simple FEA (Integración vía REST)
 */
async function simpleFlowFEA(config: CDSConfig, payload: any) {
    const {
        nombreDocumento,
        documento, // Base64 del documento
        qr = false,
        enviaCorreo = true,
        urlRetorno,
        posicionarFirma = false,
        firmantes,
    } = payload;

    if (
        !nombreDocumento || !documento || !firmantes ||
        !Array.isArray(firmantes)
    ) {
        throw new Error(
            "Campos requeridos: nombreDocumento, documento, firmantes (array)",
        );
    }

    const endpoint = `${config.base_url}${config.endpoints.flujoSimpleFEA}`;

    // Construir la lista de firmantes formateada para el servicio
    const listaFirmantes = firmantes.map((f: any) => {
        const firmante: any = {
            rut: f.rut,
            correo: f.correo,
            extranjero: f.extranjero || false,
        };

        if (posicionarFirma) {
            if (f.pag) firmante.pag = f.pag;
            if (f.coordenadaXInferiorIzquierda) {
                firmante.coordenadaXInferiorIzquierda =
                    f.coordenadaXInferiorIzquierda;
            }
            if (f.coordenadaYInferiorIzquierda) {
                firmante.coordenadaYInferiorIzquierda =
                    f.coordenadaYInferiorIzquierda;
            }
            if (f.coordenadaXSuperiorDerecha) {
                firmante.coordenadaXSuperiorDerecha =
                    f.coordenadaXSuperiorDerecha;
            }
            if (f.coordenadaYSuperiorDerecha) {
                firmante.coordenadaYSuperiorDerecha =
                    f.coordenadaYSuperiorDerecha;
            }
        }

        return firmante;
    });

    const requestBody = {
        request: {
            encabezado: {
                usuario: config.usuario,
                clave: config.clave,
            },
            parametro: {
                nombreDocumento,
                qr,
                enviaCorreo,
                urlNotificacion: config.webhook_url,
                authorization: config.webhook_secret || "DefaultSecret",
                urlRetorno: urlRetorno || "https://app.tupatrimonio.cl",
                posicionarFirma,
                firmantes: listaFirmantes,
                documento,
            },
        },
    };

    console.log("Sending Simple Flow to CDS:", endpoint);
    // Log truncado para no llenar logs con base64
    const logBody = { ...requestBody };
    logBody.request.parametro.documento = "[BASE64_DOCUMENT]";
    console.log("Request body:", JSON.stringify(logBody, null, 2));

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log("CDS Simple Flow Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
        throw new Error(
            `Error CDS HTTP: ${
                data.comentarios || data.mensaje || response.statusText
            }`,
        );
    }

    if (data.estado === "FAIL") {
        return {
            success: false,
            errorCode: data.errorCode,
            mensaje: data.comentarios || "Error en solicitud de flujo simple",
            debug_data: data,
        };
    }

    return {
        success: true,
        transaccion: data.transaccion || data.transacciones, // CDS devuelve 'transaccion' (string) o 'transacciones' (array) dependiendo de enviaCorreo
        estadoCorreo: data.estadoCorreo,
        comentarios: data.comentarios,
        errorCode: data.errorCode,
        debug_data: data,
    };
}
