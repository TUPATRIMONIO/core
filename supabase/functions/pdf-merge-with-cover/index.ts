import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

// URL base de la app (para generar URL del repositorio)
const APP_URL = Deno.env.get("PUBLIC_APP_URL") || "https://tupatrimonio.app";

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        const { document_id, cover_path, force_regenerate = false } = await req.json();

        if (!document_id) {
            throw new Error("document_id es requerido");
        }

        // 1. Obtener datos del documento desde signing.documents (usando vista signing_documents)
        const { data: document, error: docError } = await supabaseClient
            .from("signing_documents")
            .select("*")
            .eq("id", document_id)
            .single();

        if (docError || !document) {
            throw new Error(`Error obteniendo documento: ${docError?.message}`);
        }

        // Si ya tiene qr_file_path y no se fuerza regeneracion, salir
        if (document.qr_file_path && !force_regenerate) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Documento ya tiene portada con QR",
                    path: document.qr_file_path,
                    skipped: true,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        // 2. Determinar tipo de servicio y país para la portada
        const hasElectronicSignature = Boolean(document.metadata?.signature_product);
        const hasSignature = true; // Todos los documentos de este módulo requieren firma
        const hasNotary = document.notary_service !== "none";
        const countryCode = document.metadata?.country_code || "chile";

        // Construir nombre de portada según combinación
        let coverFileName: string;
        if (hasSignature && hasNotary) {
            coverFileName = `firma-notaria-${countryCode}.pdf`;
        } else if (hasNotary) {
            coverFileName = `notaria-${countryCode}.pdf`;
        } else {
            coverFileName = `firma-${countryCode}.pdf`;
        }

        const coverTemplatePath = cover_path || document.custom_cover_path || coverFileName;

        // 3. Descargar portada desde cover-templates
        let coverData: Blob | null = null;
        const { data: initialData, error: initialError } = await supabaseClient
            .storage
            .from("cover-templates")
            .download(coverTemplatePath);

        if (initialError) {
            console.log(`Portada ${coverTemplatePath} no encontrada, buscando default.pdf...`);
            const { data: fallbackData, error: fallbackError } = await supabaseClient
                .storage
                .from("cover-templates")
                .download("default.pdf");

            if (fallbackError || !fallbackData) {
                throw new Error(`No se encontró portada: ${coverTemplatePath} ni default.pdf`);
            }
            coverData = fallbackData;
        } else {
            coverData = initialData;
        }

        if (!coverData) {
            throw new Error("Error inesperado: no se pudo obtener los datos de la portada");
        }

        const coverPdfBytes = await coverData.arrayBuffer();

        // 3.5. Descargar template de página de firmas (si tiene firma electrónica)
        let signaturePagePdfBytes: ArrayBuffer | null = null;
        if (hasElectronicSignature) {
            const signaturePagePath = "signature-page-default.pdf";
            const { data: signaturePageData, error: signaturePageError } = await supabaseClient
                .storage
                .from("signature-page-templates")
                .download(signaturePagePath);

            if (signaturePageError) {
                console.warn(`No se encontró template de página de firmas: ${signaturePageError.message}. Se usará una página en blanco.`);
            } else if (signaturePageData) {
                signaturePagePdfBytes = await signaturePageData.arrayBuffer();
            }
        }

        // 4. Descargar documento original
        const originalPath = document.original_file_path;
        if (!originalPath) {
            throw new Error("El documento no tiene archivo original");
        }

        const { data: originalData, error: originalError } = await supabaseClient
            .storage
            .from("docs-originals")
            .download(originalPath);

        if (originalError) {
            throw new Error(`Error descargando documento original: ${originalError.message}`);
        }

        const originalPdfBytes = await originalData.arrayBuffer();

        // 5. Cargar ambos PDFs
        const coverPdf = await PDFDocument.load(coverPdfBytes);
        const originalPdf = await PDFDocument.load(originalPdfBytes);

        // 6. Crear nuevo documento combinado
        const mergedPdf = await PDFDocument.create();

        // 7. Copiar pagina de portada
        const [coverPage] = await mergedPdf.copyPages(coverPdf, [0]);
        mergedPdf.addPage(coverPage);

        // 8. Generar QR con URL del repositorio
        const qrIdentifier = document.qr_identifier || `DOC-${document_id.substring(0, 8).toUpperCase()}`;
        const repositoryUrl = `${APP_URL}/repository/${document_id}`;
        
        // Generar QR usando api.qrserver.com
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(repositoryUrl)}`;
        const qrImageBytes = await fetch(qrApiUrl).then((res) => res.arrayBuffer());
        const qrImage = await mergedPdf.embedPng(qrImageBytes);

        // 9. Estampar QR en la pagina de portada (primera pagina del merged)
        const firstPage = mergedPdf.getPages()[0];
        const { width, height } = firstPage.getSize();
        
        // Posicion del QR: centrado horizontalmente, en la mitad superior
        const qrSize = 120;
        const qrX = (width - qrSize) / 2;
        const qrY = height * 0.6; // 60% desde abajo (mitad superior)

        firstPage.drawImage(qrImage, {
            x: qrX,
            y: qrY,
            width: qrSize,
            height: qrSize,
        });

        // 10. Agregar texto del identificador debajo del QR
        const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
        const fontSize = 10;
        const textWidth = font.widthOfTextAtSize(qrIdentifier, fontSize);
        
        firstPage.drawText(qrIdentifier, {
            x: (width - textWidth) / 2,
            y: qrY - 15,
            size: fontSize,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
        });

        // Agregar URL debajo del identificador
        const urlFontSize = 8;
        const urlText = repositoryUrl;
        const urlTextWidth = font.widthOfTextAtSize(urlText, urlFontSize);
        
        firstPage.drawText(urlText, {
            x: (width - urlTextWidth) / 2,
            y: qrY - 28,
            size: urlFontSize,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
        });

        // 11. Copiar todas las paginas del documento original
        const originalPageIndices = originalPdf.getPageIndices();
        const copiedOriginalPages = await mergedPdf.copyPages(originalPdf, originalPageIndices);
        copiedOriginalPages.forEach((page) => {
            mergedPdf.addPage(page);
        });

        // 11.5. Agregar página de firmas (si aplica)
        if (hasElectronicSignature) {
            let signaturePage;
            if (signaturePagePdfBytes) {
                const signaturePdf = await PDFDocument.load(signaturePagePdfBytes);
                const [copiedPage] = await mergedPdf.copyPages(signaturePdf, [0]);
                signaturePage = mergedPdf.addPage(copiedPage);
            } else {
                // Crear página en blanco si no hay template
                signaturePage = mergedPdf.addPage([595.276, 841.89]); // A4 estándar
            }

            const { width: pageWidth, height: pageHeight } = signaturePage.getSize();
            const totalPages = mergedPdf.getPageCount();

            // Obtener firmantes
            const { data: signers, error: signersError } = await supabaseClient
                .from("signing_signers")
                .select("id, signing_order")
                .eq("document_id", document_id)
                .neq("status", "removed")
                .order("signing_order", { ascending: true });

            if (!signersError && signers) {
                const STAMP_WIDTH = 250;
                const STAMP_HEIGHT = 80;
                const MARGIN = 30;
                const V_SPACING = 20;
                const COLUMNS = 2;

                for (let i = 0; i < signers.length; i++) {
                    const col = i % COLUMNS;
                    const row = Math.floor(i / COLUMNS);

                    // Calcular posiciones (esquina inferior izquierda)
                    const colWidth = (pageWidth - MARGIN * 2 - MARGIN) / COLUMNS;
                    const x_lower_left = MARGIN + col * (colWidth + MARGIN);
                    const y_upper = pageHeight - MARGIN - row * (STAMP_HEIGHT + V_SPACING);
                    const y_lower_left = y_upper - STAMP_HEIGHT;
                    
                    const x_upper_right = x_lower_left + STAMP_WIDTH;
                    const y_upper_right = y_upper;

                    // Actualizar coordenadas en BD
                    await supabaseClient
                        .from("signing_signers")
                        .update({
                            use_custom_coordinates: true,
                            signature_page: totalPages,
                            coord_x_lower_left: x_lower_left,
                            coord_y_lower_left: y_lower_left,
                            coord_x_upper_right: x_upper_right,
                            coord_y_upper_right: y_upper_right,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", signers[i].id);
                }
            }
        }

        // 12. Guardar PDF combinado
        const mergedPdfBytes = await mergedPdf.save();

        // 13. Subir a Storage (Bucket docs-signed para documentos listos para firma)
        const fileName = document.original_file_name || "document.pdf";
        const storagePath = `${document.organization_id}/${document.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from("docs-signed")
            .upload(storagePath, mergedPdfBytes, {
                contentType: "application/pdf",
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Error subiendo archivo: ${uploadError.message}`);
        }

        // 14. Actualizar base de datos
        const { error: updateError } = await supabaseClient
            .from("signing_documents")
            .update({
                qr_file_path: uploadData.path,
                current_signed_file_path: uploadData.path,
                updated_at: new Date().toISOString(),
            })
            .eq("id", document_id);

        if (updateError) {
            throw new Error(`Error actualizando documento: ${updateError.message}`);
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "Portada con QR agregada exitosamente",
                path: uploadData.path,
                qr_identifier: qrIdentifier,
                repository_url: repositoryUrl,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        console.error("Error en pdf-merge-with-cover:", errorMessage);
        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
            }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
