import { createServiceRoleClient } from "@/lib/supabase/server";
import SigningPageClient from "./SigningPageClient";

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
  // IMPORTANTE: createServiceRoleClient es sincrono, no usar await si no retorna promesa
  // Revisando server.ts, retorna el cliente directamente.
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

  // Construir objeto completo para el cliente
  const signer = {
    ...signerRaw,
    document: {
      ...document,
      all_signers: allSigners || []
    }
  };

  // Si ya firmó, mostrar mensaje de éxito (o redirigir, pero el diseño actual muestra success)
  if (signer.status === "signed") {
     // OPCIONAL: Podemos mostrar el SigningPageClient igual, ya que él maneja el estado 'signed'
     // pero para consistencia con el código anterior:
     return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Documento firmado!
            </h1>
            <p className="text-gray-600 mb-4">
              Usted ya ha firmado este documento el{" "}
              {new Date(signer.signed_at).toLocaleDateString("es-CL", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-sm text-gray-500">
              Documento: <strong>{signer.document.title}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar componente cliente con datos del servidor
  return <SigningPageClient signer={signer} />;
}
