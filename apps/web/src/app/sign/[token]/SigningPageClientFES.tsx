"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileSignature,
} from "lucide-react";

// Dynamic import to avoid SSR issues with pdf.js
const PDFViewer = dynamic(() => import("@/components/shared/PDFViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded-lg">
      <Loader2 className="w-8 h-8 text-[#800039] animate-spin" />
    </div>
  ),
});

interface SigningPageClientFESProps {
  signer: any;
}

type SigningStep =
  | "reviewing"
  | "signing"
  | "success"
  | "signed" // Cuando el firmante ya firmó (recarga de página)
  | "error";

export default function SigningPageClientFES({ signer }: SigningPageClientFESProps) {
  const router = useRouter();
  const [step, setStep] = useState<SigningStep>("reviewing");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // Cache buster para evitar que el navegador sirva PDFs cacheados corruptos
  const [cacheBuster, setCacheBuster] = useState(() => Date.now());

  // 1. Verificar si ya firmó al cargar
  useEffect(() => {
    if (signer.status === "signed") {
      setStep("signed");
      setCacheBuster(Date.now());
    }
  }, [signer.status]);

  const refreshSignedDocument = () => {
    setCacheBuster(Date.now());
    router.refresh();
  };

  const handleSign = async () => {
    setIsLoading(true);
    setError("");
    setStep("signing");

    try {
      const response = await fetch("/api/signing/execute-fes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signing_token: signer.signing_token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Error al firmar documento");
      }

      setStep("success");

      if (data.signed) {
        setTimeout(() => {
          refreshSignedDocument();
        }, 1500);
      }
    } catch (err: any) {
      console.error("Error signing:", err);
      setError(err.message || "Error inesperado al firmar");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Helpers ---

  const renderHeader = () => (
    <div className="bg-gradient-to-r from-[var(--tp-brand)] to-[var(--tp-brand-light)] p-8 text-white">
      <h1 className="text-3xl font-bold mb-2 text-white">Firmar Documento</h1>
      <p className="text-white/90 mb-3">{signer.document.title}</p>
      <div className="flex flex-wrap gap-3 text-xs">
        {signer.document.order_number && (
          <span className="bg-white/20 px-3 py-1 rounded-full">
            Pedido: #{signer.document.order_number}
          </span>
        )}
        <span className="bg-white/20 px-3 py-1 rounded-full">
          Doc: {signer.document.id}
        </span>
        <span className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
          <FileSignature className="w-3 h-3" />
          Firma Simple
        </span>
      </div>
    </div>
  );

  const renderStatus = () => {
    switch (step) {
      case "reviewing":
        return (
          <div className="space-y-6">
            <div className="bg-secondary dark:bg-secondary/50 border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--tp-brand-10)] dark:bg-[var(--tp-brand)]/20 flex items-center justify-center">
                  <FileSignature className="w-5 h-5 text-[var(--tp-brand)]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Confirmar Firma
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Firmante:</p>
                  <p className="font-medium text-foreground">{signer.full_name}</p>
                  <p className="text-sm text-muted-foreground">{signer.email}</p>
                  {signer.rut && <p className="text-sm text-muted-foreground">RUT: {signer.rut}</p>}
                </div>

                <p className="text-sm text-muted-foreground">
                  Al hacer clic en "Firmar Documento", usted acepta firmar electrónicamente este documento.
                </p>

                <button
                  onClick={handleSign}
                  disabled={isLoading}
                  className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white font-semibold py-3 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Procesando firma...
                    </>
                  ) : (
                    <>
                      <FileSignature className="w-5 h-5 mr-2" />
                      Firmar Documento
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );

      case "signing":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-[var(--tp-brand)] animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">Aplicando firma electrónica...</p>
            <p className="text-sm text-muted-foreground mt-2">Por favor espere, esto puede tomar unos segundos.</p>
          </div>
        );

      case "success":
        return (
          <div className="bg-card dark:bg-card rounded-2xl shadow-[var(--tp-shadow-xl)] border border-[var(--tp-success-border)] dark:border-[var(--tp-success)]/30 p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-[var(--tp-success)]/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[var(--tp-success)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">¡Documento Firmado Exitosamente!</h2>
                <p className="text-sm text-muted-foreground mt-1">Su firma electrónica simple ha sido aplicada.</p>
              </div>
            </div>
            
            <div className="bg-[var(--tp-success-light)] dark:bg-[var(--tp-success)]/10 border border-[var(--tp-success-border)] dark:border-[var(--tp-success)]/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--tp-success)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--tp-success)]">Firma Electrónica Simple</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Firmado el {new Date().toLocaleDateString('es-CL', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                El documento firmado ahora está disponible para visualización.
              </p>
              <button
                onClick={() => {
                  refreshSignedDocument();
                }}
                className="bg-[var(--tp-success)] hover:bg-[var(--tp-success)]/90 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                Ver Documento Firmado
              </button>
            </div>
          </div>
        );

      case "signed":
        return (
          <div className="bg-card dark:bg-card rounded-2xl shadow-[var(--tp-shadow-xl)] border border-[var(--tp-success-border)] dark:border-[var(--tp-success)]/30 p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-[var(--tp-success)]/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[var(--tp-success)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">¡Documento Firmado!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Usted ya firmó este documento.
                </p>
              </div>
            </div>
            
            <div className="bg-[var(--tp-success-light)] dark:bg-[var(--tp-success)]/10 border border-[var(--tp-success-border)] dark:border-[var(--tp-success)]/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--tp-success)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--tp-success)]">Firma Electrónica Simple</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Firmado el {signer.signed_at ? new Date(signer.signed_at).toLocaleDateString('es-CL', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'fecha no disponible'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Puede descargar el documento firmado desde el visor de arriba.
            </p>
          </div>
        );

      case "error":
        return (
          <div className="bg-[var(--tp-error-light)] dark:bg-[var(--tp-error)]/10 border border-[var(--tp-error-border)] dark:border-[var(--tp-error)]/30 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-[var(--tp-error)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-[var(--tp-error)]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Error</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => setStep("reviewing")}
              className="px-6 py-2.5 bg-[var(--tp-error)] hover:bg-[var(--tp-error)]/90 text-white rounded-xl font-semibold transition-colors"
            >
              Volver a intentar
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-card shadow-[var(--tp-shadow-xl)] rounded-2xl overflow-hidden border border-border">
          {renderHeader()}

          <div className="p-8">
            {/* Document Preview */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Vista previa del documento</h2>
                <span className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded-lg">Modo Lectura</span>
              </div>
              <div className="border border-border rounded-xl overflow-hidden shadow-[var(--tp-shadow-md)]">
                <PDFViewer
                  url={`/api/signing/preview/${signer.document.id}?token=${signer.signing_token}&_t=${cacheBuster}`}
                  className="h-[550px]"
                />
              </div>
            </div>

            {/* Dynamic Status Section */}
            <div className="mt-8 border-t border-border pt-8">
              {renderStatus()}
            </div>
            
            {/* Legal Footer */}
            {step !== "success" && (
              <div className="mt-8 p-4 bg-[var(--tp-warning)]/10 border border-[var(--tp-warning)]/20 rounded-xl">
                <p className="text-xs text-[var(--tp-warning)] dark:text-amber-400 flex items-start">
                  <ShieldCheck className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Información Legal:</strong> Al proceder con la firma, usted acepta que este proceso cumple con la Ley 19.799 sobre Documentos Electrónicos y Firma Electrónica.
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sequential Order Info */}
        {signer.document.signing_order === "sequential" && step !== "success" && (
          <div className="mt-8 bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <Loader2 className="w-5 h-5 mr-2 text-[#800039]" />
              Orden de Firma Secuencial
            </h3>
            <div className="space-y-4">
              {signer.document.all_signers
                .sort((a: any, b: any) => a.signing_order - b.signing_order)
                .map((s: any, index: number) => {
                  const isCurrent = s.id === signer.id;
                  const isCompleted = s.status === "signed";
                  
                  return (
                    <div 
                      key={s.id} 
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isCurrent ? "bg-[#800039]/5 border-[#800039]/20 ring-1 ring-[#800039]/10" : "bg-white border-gray-100"
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4 ${
                          isCompleted ? "bg-green-100 text-green-600" : (isCurrent ? "bg-[#800039] text-white" : "bg-gray-100 text-gray-400")
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                        </div>
                        <div>
                          <p className={`font-bold ${isCurrent ? "text-gray-900" : "text-gray-600"}`}>{s.full_name}</p>
                          <p className="text-sm text-gray-400">{s.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isCompleted ? (
                          <span className="text-xs font-bold uppercase tracking-wider text-green-600 bg-green-50 px-3 py-1 rounded-full">Completado</span>
                        ) : (isCurrent ? (
                          <span className="text-xs font-bold uppercase tracking-wider text-[#800039] bg-[#800039]/10 px-3 py-1 rounded-full animate-pulse">Su Turno</span>
                        ) : (
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-300 bg-gray-50 px-3 py-1 rounded-full">Pendiente</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
