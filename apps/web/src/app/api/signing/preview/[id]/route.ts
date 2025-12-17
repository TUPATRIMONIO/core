import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    const documentId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    try {
        let hasAccess = false;
        const adminClient = createServiceRoleClient();

        // 1. Verify access via Token (External Signer)
        if (token) {
            const { data: signer, error: signerError } = await adminClient
                .from("signing_signers")
                .select("id, document_id")
                .eq("signing_token", token)
                .eq("document_id", documentId)
                .single();

            if (!signerError && signer) {
                hasAccess = true;
            } else {
                console.warn(
                    `Preview API - Token invalid for doc ${documentId}. Token: ${
                        token?.substring(0, 5)
                    }...`,
                );
            }
        }

        // 2. Verify access via Session (Internal User/Admin)
        if (!hasAccess) {
            const supabase = await createClient(); // Await because createClient is async
            const { data: { user }, error: userError } = await supabase.auth
                .getUser();
            if (user && !userError) {
                // Authenticated user check
                // Ideally should check organization_id, but assuming auth user has access for now
                const { data: doc, error: docError } = await adminClient
                    .from("signing_documents")
                    .select("id")
                    .eq("id", documentId)
                    .single();

                if (!docError && doc) {
                    hasAccess = true;
                }
            }
        }

        if (!hasAccess) {
            console.warn(
                `Preview API - Unauthorized access to doc ${documentId}`,
            );
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 3. Fetch Document Path
        // Use adminClient to bypass RLS on storage/tables for the download itself
        // NOTE: Column is original_file_path, NOT file_path
        const { data: document, error: docError } = await adminClient
            .from("signing_documents")
            .select("original_file_path, current_signed_file_path")
            .eq("id", documentId)
            .single();

        if (docError || !document) {
            console.error("Preview API - Document retrieval error:", docError);
            return new NextResponse("Document not found", { status: 404 });
        }

        // Use current signed path if exists, otherwise original file path
        const filePath = document.current_signed_file_path ||
            document.original_file_path;
        // console.log(`Preview API - Fetching file: ${filePath}`); // Comment out to avoid log spam, un-comment for debugging

        if (!filePath) {
            console.error("Preview API - File path missing in DB record");
            return new NextResponse("File path missing", { status: 404 });
        }

        // 4. Download file from Storage
        const { data: fileData, error: downloadError } = await adminClient
            .storage
            .from("signing-documents")
            .download(filePath);

        if (downloadError || !fileData) {
            console.error(
                `Preview API - Download error for ${filePath}:`,
                downloadError,
            );
            return new NextResponse("Error downloading file", { status: 500 });
        }

        // 5. Return File Blob
        const headers = new Headers();
        headers.set("Content-Type", "application/pdf");
        headers.set("Content-Disposition", "inline"); // Display in browser/iframe

        return new NextResponse(fileData, {
            status: 200,
            headers,
        });
    } catch (error: any) {
        console.error("Preview API - Internal Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
