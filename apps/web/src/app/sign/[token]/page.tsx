import { Suspense } from "react";
import { createServiceRoleClient } from "@/lib/supabase/server";
import SigningPageClient from "./SigningPageClient";
import SigningPageClientFES from "./SigningPageClientFES";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

function renderError(title: string, message: string) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{title}</h1>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default async function SigningPage({ params }: PageProps) {
  const { token } = await params;
  
  // Usamos Service Role para hacer bypass de RLS ya que es una página pública
  // La seguridad la da el token único
  const supabase = createServiceRoleClient();

  // 1. Obtener firmante por token
  const { data: signerRaw, error: signerError } = await supabase
    .from("signing_signers")
    .select("*")
    .eq("signing_token", token)
    .single();

  if (signerError || !signerRaw) {
    console.error('Error al buscar firmante:', signerError);
    return renderError("Token inválido", "El enlace de firma no es válido o ha expirado.");
  }

  // 2. Verificar expiración
  if (signerRaw.token_expires_at && new Date(signerRaw.token_expires_at) < new Date()) {
    return renderError("Enlace expirado", "Este enlace de firma ha expirado. Por favor contacte al remitente.");
  }

  // 3. Obtener documento
  const { data: document, error: docError } = await supabase
    .from("signing_documents")
    .select("*, provider:signing_providers(*)")
    .eq("id", signerRaw.document_id)
    .single();

  if (docError || !document) {
    console.error('Error al buscar documento:', docError);
    return renderError("Documento no encontrado", "No se pudo encontrar el documento asociado.");
  }

  // 4. Obtener todos los firmantes (para el orden)
  const { data: allSigners, error: signersError } = await supabase
    .from("signing_signers")
    .select("id, email, full_name, status, signing_order, signed_at")
    .eq("document_id", document.id);

  if (signersError) {
     console.error('Error al buscar lista de firmantes:', signersError);
  }

  // 5. Obtener order_number si hay order_id
  let orderNumber: string | null = null;
  if (document.order_id) {
    const { data: order } = await supabase
      .from("orders")
      .select("order_number")
      .eq("id", document.order_id)
      .single();
    orderNumber = order?.order_number || null;
  }

  // 6. Buscar firma previa de este firmante (por email)
  let previousSignatureBase64: string | null = null;
  const { data: prevSigner } = await supabase
      .from("signing_signers")
      .select("handwritten_signature_path")
      .eq("email", signerRaw.email)
      .not("handwritten_signature_path", "is", null)
      .order("signed_at", { ascending: false })
      .limit(1)
      .single();

  if (prevSigner?.handwritten_signature_path) {
      // Descargar imagen de Storage y convertir a base64
      const { data: imgData } = await supabase.storage
          .from("docs-signed")
          .download(prevSigner.handwritten_signature_path);
      if (imgData) {
          const buffer = await imgData.arrayBuffer();
          previousSignatureBase64 = `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;
      }
  }

  // Determinar tipo de firma
  const productSlug = document.metadata?.signature_product?.slug || "";
  const isFES = productSlug.startsWith("fes"); // fes_cl, fesb_cl, fes_claveunica_cl
  const isClaveunica = productSlug === "fes_claveunica_cl";

  // Generación on-demand del enlace ClaveÚnica
  if (isClaveunica && signerRaw.status !== "signed") {
    const needsGeneration = !signerRaw.claveunica_signer_url || signerRaw.claveunica_status === "failed";
    
    if (needsGeneration && signerRaw.rut) {
      try {
        console.log(`[page.tsx] Generando enlace ClaveÚnica on-demand para ${signerRaw.email}`);
        const resp = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/identyz-claveunica`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            signer_id: signerRaw.id,
            signer_rut: signerRaw.rut,
            signer_name: signerRaw.full_name,
            document_id: document.id,
            signing_token: token,
          }),
        });
        
        const result = await resp.json();
        
        if (result.success) {
          console.log(`[page.tsx] Enlace generado exitosamente: ${result.signerURL}`);
          // Actualizar objeto local para pasarlo al cliente
          signerRaw.claveunica_signer_url = result.signerURL;
          signerRaw.claveunica_status = "pending";
        } else {
          console.error("[page.tsx] Error en respuesta Identyz:", result.error);
        }
      } catch (e) {
        console.error("[page.tsx] Error generando enlace ClaveUnica:", e);
      }
    }
  }

  // Construir objeto completo para el cliente
  const signer = {
    ...signerRaw,
    previousSignatureBase64,
    is_claveunica: isClaveunica,
    claveunica_status: signerRaw.claveunica_status || "none",
    claveunica_signer_url: signerRaw.claveunica_signer_url || null,
    document: {
      ...document,
      order_number: orderNumber,
      all_signers: allSigners || []
    }
  };

  // Renderizar componente cliente correspondiente
  if (isFES) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-pulse text-[var(--tp-brand)]">Cargando...</div>
        </div>
      }>
        <SigningPageClientFES signer={signer} />
      </Suspense>
    );
  }

  return <SigningPageClient signer={signer} />;
}
