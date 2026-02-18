"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileSignature,
  UserCheck,
  MapPin,
  PenLine,
  KeyRound,
} from "lucide-react";
import SignaturePad from "@/components/signing/SignaturePad";

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
  | "claveunica_validation"
  | "claveunica_waiting"
  | "identity_validation"
  | "signing"
  | "success"
  | "signed" // Cuando el firmante ya firmó (recarga de página)
  | "error";

const POLL_INTERVAL_MS = 3000;

export default function SigningPageClientFES({ signer }: SigningPageClientFESProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isClaveunica = Boolean(signer.is_claveunica);
  const [step, setStep] = useState<SigningStep>("reviewing");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // Cache buster para evitar que el navegador sirva PDFs cacheados corruptos
  const [cacheBuster, setCacheBuster] = useState(() => Date.now());

  // Identity Validation State
  const [confirmedName, setConfirmedName] = useState(signer.confirmed_full_name || signer.full_name || "");
  const [confirmedIdType, setConfirmedIdType] = useState(
    signer.metadata?.identifier_type || (signer.rut ? "rut" : "other")
  );
  const [confirmedIdValue, setConfirmedIdValue] = useState(
    signer.confirmed_identifier_value || signer.rut || signer.metadata?.identifier_value || ""
  );
  const [signatureBase64, setSignatureBase64] = useState<string | null>(signer.previousSignatureBase64 || null);
  const [clientIp, setClientIp] = useState<string>("");

  const pollClaveunicaStatus = useCallback(async () => {
    const res = await fetch(`/api/signing/claveunica-status?token=${signer.signing_token}`);
    const data = await res.json();
    return data;
  }, [signer.signing_token]);

  // 1. Verificar si ya firmó al cargar
  useEffect(() => {
    if (signer.status === "signed") {
      setStep("signed");
      setCacheBuster(Date.now());
    }
  }, [signer.status]);

  // 2. Si es ClaveÚnica y ya está verificado, precargar datos (sin saltar de paso)
  useEffect(() => {
    if (isClaveunica && signer.claveunica_status === "verified") {
      setConfirmedName(signer.confirmed_full_name || signer.full_name || "");
      setConfirmedIdType("rut");
      setConfirmedIdValue(signer.confirmed_identifier_value || signer.rut || "");
    }
  }, [isClaveunica, signer.claveunica_status, signer.confirmed_full_name, signer.confirmed_identifier_value, signer.full_name, signer.rut]);

  // 3. Si vuelve de ClaveÚnica con ?claveunica=completed, ir a waiting
  useEffect(() => {
    if (isClaveunica && searchParams.get("claveunica") === "completed" && step === "reviewing") {
      setStep("claveunica_waiting");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [isClaveunica, searchParams, step]);

  // 4. Polling cuando está en claveunica_waiting
  useEffect(() => {
    if (step !== "claveunica_waiting") return;
    const check = async () => {
      const data = await pollClaveunicaStatus();
      if (data.status === "verified") {
        setConfirmedName(data.verified_name || "");
        setConfirmedIdType("rut");
        setConfirmedIdValue(data.verified_rut || "");
        // Ejecutar firma automaticamente
        handleSignClaveunica(data.verified_name, data.verified_rut);
      } else if (data.status === "failed") {
        setError("La validación con ClaveÚnica no pudo completarse.");
        setStep("error");
      }
    };
    const id = setInterval(check, POLL_INTERVAL_MS);
    check();
    return () => clearInterval(id);
  }, [step, pollClaveunicaStatus]);

  // 5. Obtener IP del cliente
  useEffect(() => {
    fetch("/api/signing/client-ip")
      .then((res) => res.json())
      .then((data) => setClientIp(data.ip))
      .catch(() => setClientIp("No disponible"));
  }, []);

  const refreshSignedDocument = () => {
    setCacheBuster(Date.now());
    router.refresh();
  };

  const handleSignClaveunica = async (verifiedName: string, verifiedRut: string) => {
    setIsLoading(true);
    setError("");
    setStep("signing");

    try {
      const response = await fetch("/api/signing/execute-fes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signing_token: signer.signing_token,
          confirmed_name: verifiedName,
          confirmed_id_type: "rut",
          confirmed_id_value: verifiedRut,
          client_ip: clientIp,
          // Sin signature_image
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
          confirmed_name: confirmedName,
          confirmed_id_type: confirmedIdType,
          confirmed_id_value: confirmedIdValue,
          signature_image: signatureBase64,
          client_ip: clientIp,
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
                  Revisar Documento
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
                  Por favor revise el documento cuidadosamente antes de proceder a la firma.
                </p>

                <button
                  onClick={() => {
                    if (isClaveunica) {
                      if (signer.claveunica_status === "verified") {
                        handleSignClaveunica(confirmedName, confirmedIdValue);
                      } else {
                        setStep("claveunica_validation");
                      }
                    } else {
                      setStep("identity_validation");
                    }
                  }}
                  className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white font-semibold py-3 rounded-xl flex items-center justify-center transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        );

      case "claveunica_validation":
        return (
          <div className="space-y-6">
            <div className="bg-secondary dark:bg-secondary/50 border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--tp-brand-10)] dark:bg-[var(--tp-brand)]/20 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-[var(--tp-brand)]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Validar con ClaveÚnica
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Para este documento necesitamos que valides tu identidad con ClaveÚnica.
                Serás redirigido para autenticarte de forma segura.
              </p>
              {signer.claveunica_signer_url ? (
                <button
                  onClick={() => {
                    window.location.href = signer.claveunica_signer_url;
                  }}
                  className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <KeyRound className="w-5 h-5" />
                  Validar con ClaveÚnica
                </button>
              ) : (
                <div className="bg-[var(--tp-warning)]/10 border border-[var(--tp-warning)]/30 rounded-xl p-4 text-sm text-muted-foreground">
                  No se pudo generar el enlace de validación. Por favor contacta al remitente del documento.
                </div>
              )}
              <button
                onClick={() => setStep("reviewing")}
                className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        );

      case "claveunica_waiting":
        return (
          <div className="space-y-6">
            <div className="bg-secondary dark:bg-secondary/50 border border-border rounded-xl p-6">
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-12 h-12 text-[var(--tp-brand)] animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Verificando tu identidad</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Hemos recibido tu validación con ClaveÚnica. Estamos procesando los datos.
                  Si acabas de regresar, esta página se actualizará en unos segundos.
                </p>
                <p className="text-xs text-muted-foreground mt-4">No cierres esta ventana.</p>
              </div>
            </div>
          </div>
        );

      case "identity_validation":
        return (
          <div className="space-y-6">
            <div className="bg-secondary dark:bg-secondary/50 border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--tp-brand-10)] dark:bg-[var(--tp-brand)]/20 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-[var(--tp-brand)]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Validación de Identidad
                </h3>
              </div>

              <div className="space-y-6">
                {/* 1. Confirmar Datos (o mostrar datos verificados por ClaveÚnica) */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--tp-brand)]" />
                    {isClaveunica ? "Datos verificados con ClaveÚnica" : "Confirma tus datos"}
                  </h4>
                  
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Nombre Completo</label>
                      {isClaveunica ? (
                        <div className="w-full px-3 py-2 rounded-lg border border-input bg-muted/50 text-sm">
                          {confirmedName || "—"}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={confirmedName}
                          onChange={(e) => setConfirmedName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-[var(--tp-brand)] focus:border-transparent outline-none"
                          placeholder="Tu nombre completo"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Tipo ID</label>
                        {isClaveunica ? (
                          <div className="w-full px-3 py-2 rounded-lg border border-input bg-muted/50 text-sm">
                            RUT
                          </div>
                        ) : (
                          <select
                            value={confirmedIdType}
                            onChange={(e) => setConfirmedIdType(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-[var(--tp-brand)] focus:border-transparent outline-none"
                          >
                            <option value="rut">RUT</option>
                            <option value="dni">DNI</option>
                            <option value="passport">Pasaporte</option>
                            <option value="other">Otro</option>
                          </select>
                        )}
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Número ID</label>
                        {isClaveunica ? (
                          <div className="w-full px-3 py-2 rounded-lg border border-input bg-muted/50 text-sm">
                            {confirmedIdValue || "—"}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={confirmedIdValue}
                            onChange={(e) => setConfirmedIdValue(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-[var(--tp-brand)] focus:border-transparent outline-none"
                            placeholder="12.345.678-9"
                          />
                        )}
                      </div>
                    </div>

                    {!isClaveunica && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 p-2 rounded-lg border border-border/50">
                        <MapPin className="w-3 h-3" />
                        <span>IP registrada: {clientIp || "Cargando..."}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-border/50 my-4"></div>

                {/* 2. Firma Manuscrita */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <PenLine className="w-4 h-4 text-[var(--tp-brand)]" />
                    Tu firma manuscrita
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Dibuja tu firma en el recuadro usando tu dedo o mouse, o sube una imagen.
                  </p>
                  
                  {signer.previousSignatureBase64 && (
                    <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-lg flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>Se ha cargado tu firma anterior. Puedes usarla o crear una nueva.</p>
                    </div>
                  )}

                  <SignaturePad 
                    onSignatureChange={setSignatureBase64}
                    initialSignature={signer.previousSignatureBase64}
                    className="w-full"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSign}
                    disabled={isLoading || !confirmedName || !confirmedIdValue || !signatureBase64}
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
                        Confirmar y Firmar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setStep("reviewing")}
                    disabled={isLoading}
                    className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Volver a revisar
                  </button>
                </div>
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
              onClick={() => {
                setError("");
                setStep(isClaveunica ? "claveunica_validation" : "reviewing");
              }}
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
