import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuración CORS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

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

        const { document_id } = await req.json();

        if (!document_id) {
            throw new Error("document_id is required");
        }

        // 1. Obtener datos del documento
        const { data: document, error: docError } = await supabaseClient
            .from("documents")
            .select("*")
            .eq("id", document_id)
            .single();

        if (docError || !document) {
            throw new Error(`Error fetching document: ${docError?.message}`);
        }

        // Si ya tiene QR, no hacer nada (o forzar regeneración si se solicita)
        // if (document.qr_file_path) {
        //   return new Response(
        //     JSON.stringify({ message: 'Document already has QR', file_path: document.qr_file_path }),
        //     { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        //   )
        // }

        // 2. Descargar el archivo original desde Storage
        const { data: fileData, error: downloadError } = await supabaseClient
            .storage
            .from("docs-originals")
            .download(
                document.original_file_path.split("/").pop()?.includes("/")
                    ? document.original_file_path
                    : `${document.organization_id}/${document.id}/${document.original_file_path}`,
            );
        // Nota: Asumimos que original_file_path puede ser relativo o incluir folders.
        // El bucket structure es {org_id}/{doc_id}/file.pdf o solo file.pdf. Ajustaremos según convención.
        // Mejor intentar bajar lo que está en original_file_path

        if (downloadError) {
            // Intento fallback: construir path
            const fallbackPath =
                `${document.organization_id}/${document.id}/${document.original_file_name}`;
            const { data: fileData2, error: downloadError2 } =
                await supabaseClient
                    .storage
                    .from("docs-originals")
                    .download(fallbackPath);

            if (downloadError2) {
                throw new Error(
                    `Error downloading file: ${downloadError?.message} || ${downloadError2?.message}`,
                );
            }
            var pdfBytes = await fileData2.arrayBuffer();
        } else {
            var pdfBytes = await fileData.arrayBuffer();
        }

        // 3. Cargar documento original
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // 4. Generar QR Code
        // Usamos api.qrserver.com como solicitado inicialmente para simplicidad en Deno
        const qrIdentifier = document.qr_identifier || "DOC-GEN-" + document_id;
        const qrUrl =
            `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${
                encodeURIComponent(qrIdentifier)
            }`;

        const qrImageBytes = await fetch(qrUrl).then((res) =>
            res.arrayBuffer()
        );
        const qrImage = await pdfDoc.embedPng(qrImageBytes);

        // 5. Estampar QR en la primera página (Esquina superior derecha)
        const qrDims = qrImage.scale(0.5); // Ajustar tamaño

        firstPage.drawImage(qrImage, {
            x: width - qrDims.width - 20,
            y: height - qrDims.height - 20,
            width: qrDims.width,
            height: qrDims.height,
        });

        // Agregar texto identificador debajo del QR
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        firstPage.drawText(qrIdentifier, {
            x: width - qrDims.width - 20,
            y: height - qrDims.height - 30,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
        });

        // 6. Guardar nuevo PDF
        const modifiedPdfBytes = await pdfDoc.save();

        // 7. Subir a Storage (mismo directorio, prefijo qr_)
        const fileName = document.original_file_name || "document.pdf";
        const newFileName = `qr_${fileName}`;
        const storagePath =
            `${document.organization_id}/${document.id}/${newFileName}`;

        const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from("docs-originals")
            .upload(storagePath, modifiedPdfBytes, {
                contentType: "application/pdf",
                upsert: true,
            });

        if (uploadError) {
            throw new Error(
                `Error uploading modified file: ${uploadError.message}`,
            );
        }

        // 8. Actualizar referencia en base de datos
        const { error: updateError } = await supabaseClient
            .from("documents")
            .update({
                qr_file_path: uploadData.path,
                updated_at: new Date().toISOString(),
            })
            .eq("id", document_id);

        if (updateError) {
            throw new Error(
                `Error updating document record: ${updateError.message}`,
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "QR added successfully",
                path: uploadData.path,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
