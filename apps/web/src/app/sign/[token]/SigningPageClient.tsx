"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Key, 
  MessageSquare, 
  ExternalLink,
  Unlock,
  Lock,
  AlertTriangle,
  Eye,
  EyeOff
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

interface SigningPageClientProps {
  signer: any;
}

type SigningStep = 
  | "verifying" 
  | "needs_enrollment" 
  | "ready_for_2fa" 
  | "waiting_code" 
  | "certificate_blocked" 
  | "sf_blocked"
  | "success"
  | "signed"  // Cuando el firmante ya firmó (recarga de página)
  | "error";

export default function SigningPageClient({ signer }: SigningPageClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<SigningStep>("verifying");
  const [claveCertificado, setClaveCertificado] = useState("");
  const [codigoSegundoFactor, setCodigoSegundoFactor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [vigenciaData, setVigenciaData] = useState<any>(null);
  // Cache buster para evitar que el navegador sirva PDFs cacheados corruptos
  const [cacheBuster, setCacheBuster] = useState(() => Date.now());
  // Modal para solicitar numDocumento al desbloquear certificado
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [numDocumento, setNumDocumento] = useState("");
  const [unblockType, setUnblockType] = useState<"certificate" | "2fa">("certificate");
  // Resultado del desbloqueo (éxito o error) - para mostrar en modal estilizado
  const [unblockResult, setUnblockResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  // Toggle para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);
  // Toggle para mostrar/ocultar código de segundo factor
  const [showCode, setShowCode] = useState(false);
  // Modal de error al firmar (segundo factor incorrecto, bloqueo, etc.)
  const [signError, setSignError] = useState<{ message: string; errorCode?: string | number } | null>(null);
  // Modal de mensaje de enrolamiento (éxito o error)
  const [enrollmentMessage, setEnrollmentMessage] = useState<{ type: "success" | "error"; message: string; url?: string } | null>(null);

  // 1. Verificar vigencia al cargar, o mostrar estado firmado si ya firmó
  useEffect(() => {
    // Si el firmante ya firmó, saltar verificación y mostrar estado firmado
    if (signer.status === "signed") {
      setStep("signed");
      return;
    }
    checkVigencia();
  }, [signer.signing_token, signer.status]);

  const checkVigencia = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/signing/check-fea?token=${signer.signing_token}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al verificar vigencia");

      setVigenciaData(data);
      
      // IMPORTANTE: Verificar bloqueo ANTES de verificar vigencia
      // Un certificado bloqueado puede tener vigente=false, pero no necesita enrolamiento
      if (data.certificadoBloqueado) {
        setStep("certificate_blocked");
      } else if (!data.vigente) {
        // Solo si NO está bloqueado Y no es vigente, necesita enrolamiento
        setStep("needs_enrollment");
      } else {
        setStep("ready_for_2fa");
      }
    } catch (err: any) {
      setError(err.message || "Error al verificar su estado de firma");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Intentamos enrolar (CDS retorna URL directamente)
      const response = await fetch("/api/signing/enroll-cds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signing_token: signer.signing_token })
      });
      const data = await response.json();
      if (!response.ok) {
        setEnrollmentMessage({ 
          type: "error", 
          message: data.error || "Error al iniciar enrolamiento" 
        });
        return;
      }

      // CDS retorna la URL de enrolamiento directamente
      const enrollmentUrl = data.enrollment_url;
      setEnrollmentMessage({ 
        type: "success", 
        message: data.message || "Para completar su enrolamiento, haga clic en el botón de abajo.",
        url: enrollmentUrl
      });
    } catch (err: any) {
      setEnrollmentMessage({ type: "error", message: err.message || "Error inesperado" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest2FA = async () => {
    if (!claveCertificado) {
      setError("Debe ingresar la clave de su certificado");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/signing/request-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          signing_token: signer.signing_token, 
          clave_certificado: claveCertificado 
        })
      });
      const data = await response.json();

      if (!response.ok) {
        // Si el certificado está bloqueado, ir a ese estado
        if (data.errorCode === "125" || data.errorCode === 125 || 
            data.errorCode === "122" || data.errorCode === 122) {
          setStep("certificate_blocked");
          return;
        }
        // Mostrar error en el modal con código de error para detectar bloqueos
        setSignError({ message: data.error || "Error al solicitar segundo factor", errorCode: data.errorCode });
        return;
      }

      setStep("waiting_code");
    } catch (err: any) {
      setSignError(err.message || "Error inesperado al solicitar SMS");
    } finally {
      setIsLoading(false);
    }
  };

  // Abre el modal para solicitar numDocumento antes de desbloquear
  const openUnblockModal = (type: "certificate" | "2fa") => {
    setUnblockType(type);
    setNumDocumento("");
    setUnblockResult(null);
    setShowUnblockModal(true);
  };

  const handleUnblock = async () => {
    if (!numDocumento.trim()) {
      setUnblockResult({ type: "error", message: "Debe ingresar el número de serie de su cédula de identidad" });
      return;
    }

    setIsLoading(true);
    setUnblockResult(null);
    try {
      const response = await fetch("/api/signing/unblock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          signing_token: signer.signing_token, 
          type: unblockType,
          numDocumento: numDocumento.trim()
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        setUnblockResult({ type: "error", message: data.error || "Error al solicitar desbloqueo" });
        return;
      }

      if (data.url) {
        // Abrir URL de desbloqueo en nueva pestaña
        window.open(data.url, "_blank");
        setUnblockResult({ 
          type: "success", 
          message: "Se ha abierto una nueva pestaña para completar el proceso de desbloqueo. Siga las instrucciones en esa página." 
        });
      } else {
        setUnblockResult({ 
          type: "success", 
          message: data.message || "Se ha enviado un correo electrónico con instrucciones para desbloquear su certificado. Revise su bandeja de entrada." 
        });
      }
    } catch (err: any) {
      setUnblockResult({ type: "error", message: err.message || "Error inesperado al solicitar desbloqueo" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    if (!claveCertificado || !codigoSegundoFactor) {
      setSignError({ message: "Clave de certificado y código SMS son requeridos" });
      return;
    }

    setIsLoading(true);
    setSignError(null);

    try {
      const response = await fetch("/api/signing/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signing_token: signer.signing_token,
          clave_fea: claveCertificado,
          codigo_segundo_factor: codigoSegundoFactor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si el segundo factor está bloqueado, ir a ese estado
        if (data.errorCode === "134" || data.errorCode === 134) {
          setStep("sf_blocked");
          return;
        }
        // Si el certificado está bloqueado
        if (data.errorCode === "122" || data.errorCode === 122) {
          setStep("certificate_blocked");
          return;
        }
        // Mostrar error en el modal con código para detectar bloqueos
        setSignError({ message: data.error || "Error al firmar documento", errorCode: data.errorCode });
        return;
      }

      setStep("success");
      
      if (data.signed) {
        setTimeout(() => {
          router.refresh();
        }, 3000);
      }
    } catch (err: any) {
      setSignError({ message: err.message || "Error inesperado al firmar" });
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
      </div>
    </div>
  );

  const renderStatus = () => {
    switch (step) {
      case "verifying":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-[var(--tp-brand)] animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">Verificando su estado de firma avanzada...</p>
          </div>
        );

      case "needs_enrollment":
        return (
          <div className="bg-[var(--tp-info)]/10 dark:bg-[var(--tp-info)]/20 border border-[var(--tp-info)]/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--tp-info)]/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-[var(--tp-info)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Enrolamiento Requerido</h3>
                <p className="text-muted-foreground mb-4">
                  Usted no cuenta con una Firma Electrónica Avanzada (FEA) vigente en el sistema de CDS. 
                  Para firmar este documento, primero debe enrolarse.
                </p>
                <button
                  onClick={handleEnroll}
                  disabled={isLoading}
                  className="bg-[var(--tp-info)] hover:bg-[var(--tp-info)]/90 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                  Iniciar Enrolamiento en CDS
                </button>
                <p className="mt-4 text-sm text-muted-foreground">
                  * CDS le enviará un correo electrónico para completar el proceso. Una vez listo, regrese aquí para firmar.
                </p>
              </div>
            </div>
          </div>
        );

      case "certificate_blocked":
        return (
          <div className="bg-[var(--tp-error-light)] dark:bg-[var(--tp-error)]/10 border border-[var(--tp-error-border)] dark:border-[var(--tp-error)]/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--tp-error)]/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-[var(--tp-error)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Certificado Bloqueado</h3>
                <p className="text-muted-foreground mb-4">
                  Su certificado ha sido bloqueado por demasiados intentos fallidos con su clave.
                </p>
                <button
                  onClick={() => openUnblockModal("certificate")}
                  disabled={isLoading}
                  className="bg-[var(--tp-error)] hover:bg-[var(--tp-error)]/90 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                  Recuperar Contraseña de Certificado
                </button>
              </div>
            </div>
          </div>
        );

      case "sf_blocked":
        return (
          <div className="bg-[var(--tp-warning)]/10 dark:bg-[var(--tp-warning)]/20 border border-[var(--tp-warning)]/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--tp-warning)]/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-[var(--tp-warning)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Segundo Factor Bloqueado</h3>
                <p className="text-muted-foreground mb-4">
                  Su sistema de segundo factor (SMS) ha sido bloqueado por intentos fallidos.
                </p>
                <button
                  onClick={() => openUnblockModal("2fa")}
                  disabled={isLoading}
                  className="bg-[var(--tp-warning)] hover:bg-[var(--tp-warning)]/90 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                  Desbloquear Segundo Factor
                </button>
              </div>
            </div>
          </div>
        );

      case "ready_for_2fa":
        return (
          <div className="space-y-6">
            <div className="bg-secondary dark:bg-secondary/50 border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--tp-brand-10)] dark:bg-[var(--tp-brand)]/20 flex items-center justify-center">
                  <Key className="w-5 h-5 text-[var(--tp-brand)]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Autentique su Certificado
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Clave de su Certificado FEA</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={claveCertificado}
                      onChange={(e) => setClaveCertificado(e.target.value)}
                      placeholder="Ingrese su clave"
                      className="w-full px-4 py-3 pr-12 border border-input bg-background rounded-xl focus:ring-2 focus:ring-[var(--tp-brand)] focus:border-transparent text-foreground placeholder:text-muted-foreground transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Es la clave que configuró al enrolarse en CDS.</p>
                  <button
                    type="button"
                    onClick={() => openUnblockModal("certificate")}
                    disabled={isLoading}
                    className="mt-3 text-sm text-[var(--tp-brand)] hover:text-[var(--tp-brand-light)] hover:underline flex items-center transition-colors"
                  >
                    <Unlock className="w-4 h-4 mr-1" />
                    ¿Olvidó su contraseña?
                  </button>
                </div>
                <button
                  onClick={handleRequest2FA}
                  disabled={isLoading || !claveCertificado}
                  className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white font-semibold py-3 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <MessageSquare className="w-5 h-5 mr-2" />}
                  Solicitar Código por SMS
                </button>
              </div>
            </div>
          </div>
        );

      case "waiting_code":
        return (
          <div className="space-y-6">
            <div className="bg-[var(--tp-success-light)] dark:bg-[var(--tp-success)]/10 border border-[var(--tp-success-border)] dark:border-[var(--tp-success)]/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--tp-success)]/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-[var(--tp-success)]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Validar Segundo Factor
                </h3>
              </div>
              <div className="space-y-4">
                <p className="text-[var(--tp-success)] text-sm">Se ha enviado un código a su celular registrado por SMS.</p>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Código recibido por SMS</label>
                  <div className="relative">
                    <input
                      type={showCode ? "text" : "password"}
                      value={codigoSegundoFactor}
                      onChange={(e) => setCodigoSegundoFactor(e.target.value)}
                      placeholder="Ingrese el código de 8 dígitos"
                      className="w-full px-4 py-3 pr-12 border border-[var(--tp-success-border)] dark:border-[var(--tp-success)]/30 bg-background rounded-xl focus:ring-2 focus:ring-[var(--tp-success)] focus:border-transparent text-foreground placeholder:text-muted-foreground transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCode(!showCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Botón para desbloquear segundo factor */}
                  <button
                    type="button"
                    onClick={() => openUnblockModal("2fa")}
                    disabled={isLoading}
                    className="mt-3 text-sm text-[var(--tp-success)] hover:text-[var(--tp-success)]/80 hover:underline flex items-center transition-colors"
                  >
                    <Unlock className="w-4 h-4 mr-1" />
                    ¿Segundo factor bloqueado?
                  </button>
                </div>
                <button
                  onClick={handleSign}
                  disabled={isLoading || !codigoSegundoFactor}
                  className="w-full bg-[var(--tp-success)] hover:bg-[var(--tp-success)]/90 text-white font-semibold py-3 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                  Finalizar y Firmar Documento
                </button>
                <button 
                  onClick={() => setStep("ready_for_2fa")}
                  className="w-full text-muted-foreground text-sm hover:text-foreground hover:underline transition-colors"
                >
                  Volver a ingresar clave
                </button>
              </div>
            </div>
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
                <p className="text-sm text-muted-foreground mt-1">Su firma electrónica ha sido aplicada legalmente.</p>
              </div>
            </div>
            
            <div className="bg-[var(--tp-success-light)] dark:bg-[var(--tp-success)]/10 border border-[var(--tp-success-border)] dark:border-[var(--tp-success)]/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--tp-success)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--tp-success)]">Firma válida según Ley 19.799</p>
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
                  setCacheBuster(Date.now());
                  router.refresh();
                }}
                className="bg-[var(--tp-success)] hover:bg-[var(--tp-success)]/90 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                Ver Documento Firmado
              </button>
            </div>
          </div>
        );

      case "signed":
        // Estado cuando el usuario ya firmó (recarga de página después de firmar)
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
                  <p className="text-sm font-medium text-[var(--tp-success)]">Firma válida según Ley 19.799</p>
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
              onClick={checkVigencia}
              className="px-6 py-2.5 bg-[var(--tp-error)] hover:bg-[var(--tp-error)]/90 text-white rounded-xl font-semibold transition-colors"
            >
              Reintentar verificación
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Modal para solicitar Número de Serie de Cédula y mostrar resultados
  const renderUnblockModal = () => (
    showUnblockModal && (
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-card dark:bg-card rounded-2xl max-w-md w-full p-6 shadow-[var(--tp-shadow-2xl)] border border-border">
          {/* Resultado de éxito o error */}
          {unblockResult ? (
            <>
              {/* Header con icono */}
              <div className={`flex items-center gap-3 mb-4 ${
                unblockResult.type === "success" 
                  ? "text-[var(--tp-success)]" 
                  : "text-[var(--tp-error)]"
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  unblockResult.type === "success"
                    ? "bg-[var(--tp-success-light)] dark:bg-[var(--tp-success)]/20"
                    : "bg-[var(--tp-error-light)] dark:bg-[var(--tp-error)]/20"
                }`}>
                  {unblockResult.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {unblockResult.type === "success" ? "Proceso Iniciado" : "Error en el Proceso"}
                </h3>
              </div>
              
              {/* Mensaje */}
              <div className={`p-4 rounded-xl mb-5 ${
                unblockResult.type === "success" 
                  ? "bg-[var(--tp-success-light)] dark:bg-[var(--tp-success)]/10 border border-[var(--tp-success-border)] dark:border-[var(--tp-success)]/30" 
                  : "bg-[var(--tp-error-light)] dark:bg-[var(--tp-error)]/10 border border-[var(--tp-error-border)] dark:border-[var(--tp-error)]/30"
              }`}>
                <p className={`text-sm leading-relaxed ${
                  unblockResult.type === "success" 
                    ? "text-[var(--tp-success)] dark:text-[var(--tp-success)]" 
                    : "text-[var(--tp-error)] dark:text-[var(--tp-error)]"
                }`}>
                  {unblockResult.message}
                </p>
              </div>
              
              {/* Acciones */}
              <div className="flex gap-3">
                {unblockResult.type === "error" && (
                  <button
                    onClick={() => setUnblockResult(null)}
                    className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 rounded-xl text-secondary-foreground font-medium transition-colors"
                  >
                    Reintentar
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowUnblockModal(false);
                    setUnblockResult(null);
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-colors ${
                    unblockResult.type === "success"
                      ? "bg-[var(--tp-success)] hover:bg-[var(--tp-success)]/90 text-white"
                      : "bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white"
                  }`}
                >
                  {unblockResult.type === "success" ? "Entendido" : "Cerrar"}
                </button>
              </div>
            </>
          ) : (
            /* Formulario para ingresar número de serie */
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--tp-brand-10)] dark:bg-[var(--tp-brand)]/20 flex items-center justify-center">
                  <Key className="w-5 h-5 text-[var(--tp-brand)]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {unblockType === "certificate" ? "Recuperar Contraseña" : "Desbloquear Segundo Factor"}
                </h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Para continuar, ingrese el <strong className="text-foreground">número de serie</strong> de su cédula de identidad.
                Este número se encuentra en la parte frontal de su cédula.
              </p>
              
              <div className="mb-5">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Número de Serie de Cédula
                </label>
                <input
                  type="text"
                  value={numDocumento}
                  onChange={(e) => setNumDocumento(e.target.value)}
                  placeholder="Ej: 123456789"
                  className="w-full px-4 py-3 border border-input bg-background rounded-xl focus:ring-2 focus:ring-[var(--tp-brand)] focus:border-transparent text-foreground placeholder:text-muted-foreground transition-all"
                  autoFocus
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  El número de serie aparece en su cédula junto a la foto.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnblockModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl text-foreground hover:bg-secondary transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUnblock}
                  disabled={!numDocumento.trim() || isLoading}
                  className="flex-1 bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continuar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  );

  // Modal para mostrar errores al firmar (código incorrecto, bloqueo, etc.)
  // Detecta si es un error de bloqueo para mostrar botón de desbloqueo
  const isSFBlocked = signError?.errorCode === "134" || signError?.errorCode === 134 || 
                      signError?.errorCode === "SF_BLOCKED";
  const isCertBlocked = signError?.errorCode === "122" || signError?.errorCode === 122 || 
                        signError?.errorCode === "125" || signError?.errorCode === 125 ||
                        signError?.errorCode === "CERTIFICATE_BLOCKED";
  // Detecta si el código SMS ya fue usado o expiró (necesita solicitar nuevo)
  const isCodeUsedOrExpired = signError?.errorCode === "129" || signError?.errorCode === 129 ||
                              signError?.errorCode === "128" || signError?.errorCode === 128 ||
                              signError?.message?.toLowerCase().includes("ya ha sido utilizado") ||
                              signError?.message?.toLowerCase().includes("expirado");
  
  const renderSignErrorModal = () => (
    signError && (
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-card dark:bg-card rounded-2xl max-w-md w-full p-6 shadow-[var(--tp-shadow-2xl)] border border-border">
          {/* Header con icono */}
          <div className="flex items-center gap-3 mb-4 text-[var(--tp-error)]">
            <div className="w-10 h-10 rounded-full bg-[var(--tp-error)]/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {isSFBlocked ? "Segundo Factor Bloqueado" : 
               isCertBlocked ? "Certificado Bloqueado" :
               isCodeUsedOrExpired ? "Código SMS Inválido" :
               "Error en el Proceso"}
            </h3>
          </div>
          
          {/* Mensaje */}
          <div className="p-4 rounded-xl mb-5 bg-[var(--tp-error-light)] dark:bg-[var(--tp-error)]/10 border border-[var(--tp-error-border)] dark:border-[var(--tp-error)]/30">
            <p className="text-sm leading-relaxed text-[var(--tp-error)]">
              {signError.message}
            </p>
            {isCodeUsedOrExpired && (
              <p className="text-sm leading-relaxed text-foreground/70 mt-2">
                Debe solicitar un nuevo código SMS para continuar.
              </p>
            )}
          </div>
          
          {/* Acciones - con botón de desbloqueo o solicitar nuevo código */}
          <div className="flex flex-col gap-3">
            {(isSFBlocked || isCertBlocked) && (
              <button
                onClick={() => {
                  setSignError(null);
                  setUnblockType(isSFBlocked ? "2fa" : "certificate");
                  setShowUnblockModal(true);
                }}
                className="w-full px-4 py-2.5 rounded-xl font-semibold transition-colors bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Desbloquear {isSFBlocked ? "Segundo Factor" : "Certificado"}
              </button>
            )}
            {isCodeUsedOrExpired && (
              <button
                onClick={() => {
                  setSignError(null);
                  setCodigoSegundoFactor("");
                  setStep("ready_for_2fa"); // Volver a solicitar 2FA con la misma clave
                }}
                className="w-full px-4 py-2.5 rounded-xl font-semibold transition-colors bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Solicitar Nuevo Código SMS
              </button>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setSignError(null)}
                className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 rounded-xl text-secondary-foreground font-medium transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={() => {
                  setSignError(null);
                  // Re-verificar vigencia para actualizar el estado desde CDS
                  checkVigencia();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold transition-colors bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // Modal para mostrar resultado del enrolamiento
  const renderEnrollmentModal = () => (
    enrollmentMessage && (
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-card dark:bg-card rounded-2xl max-w-md w-full p-6 shadow-[var(--tp-shadow-2xl)] border border-border">
          {/* Header con icono */}
          <div className={`flex items-center gap-3 mb-4 ${
            enrollmentMessage.type === "success" 
              ? "text-[var(--tp-success)]" 
              : "text-[var(--tp-error)]"
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              enrollmentMessage.type === "success"
                ? "bg-[var(--tp-success)]/20"
                : "bg-[var(--tp-error)]/20"
            }`}>
              {enrollmentMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {enrollmentMessage.type === "success" ? "Enrolamiento Iniciado" : "Error de Enrolamiento"}
            </h3>
          </div>
          
          {/* Mensaje */}
          <div className={`p-4 rounded-xl mb-5 ${
            enrollmentMessage.type === "success" 
              ? "bg-[var(--tp-success-light)] dark:bg-[var(--tp-success)]/10 border border-[var(--tp-success-border)] dark:border-[var(--tp-success)]/30" 
              : "bg-[var(--tp-error-light)] dark:bg-[var(--tp-error)]/10 border border-[var(--tp-error-border)] dark:border-[var(--tp-error)]/30"
          }`}>
            <p className={`text-sm leading-relaxed ${
              enrollmentMessage.type === "success" 
                ? "text-[var(--tp-success)]" 
                : "text-[var(--tp-error)]"
            }`}>
              {enrollmentMessage.message}
            </p>
          </div>
          
          {/* Botón para ir a enrolarse (solo si hay URL) */}
          {enrollmentMessage.type === "success" && enrollmentMessage.url && (
            <a
              href={enrollmentMessage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mb-4 px-4 py-3 rounded-xl font-semibold transition-colors bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Ir a Enrolarme en CDS
            </a>
          )}
          
          {/* Acciones */}
          <div className="flex gap-3">
            <button
              onClick={() => setEnrollmentMessage(null)}
              className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-colors ${
                enrollmentMessage.type === "success"
                  ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  : "bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white"
              }`}
            >
              {enrollmentMessage.type === "success" && enrollmentMessage.url ? "Cerrar" : "Entendido"}
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <>
      {renderUnblockModal()}
      {renderSignErrorModal()}
      {renderEnrollmentModal()}
      <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-card shadow-[var(--tp-shadow-xl)] rounded-2xl overflow-hidden border border-border">
          {renderHeader()}

          <div className="p-8">
            {error && step !== "error" && (
              <div className="mb-6 p-4 bg-[var(--tp-error-light)] dark:bg-[var(--tp-error)]/10 border border-[var(--tp-error-border)] dark:border-[var(--tp-error)]/30 rounded-xl flex items-center text-[var(--tp-error)]">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Document Preview - Always rendered but hidden during verifying */}
            <div 
              className={`mb-8 ${
                step === "verifying" ? "hidden" : ""
              }`}
            >
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
            {step !== "success" && step !== "verifying" && (
              <div className="mt-8 p-4 bg-[var(--tp-warning)]/10 border border-[var(--tp-warning)]/20 rounded-xl">
                <p className="text-xs text-[var(--tp-warning)] dark:text-amber-400 flex items-start">
                  <ShieldCheck className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Información Legal:</strong> Al proceder con la firma, usted acepta que este proceso cumple con la Ley 19.799 sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación de dicha firma. La Firma Electrónica Avanzada tiene la misma validez legal que su firma manuscrita.
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
    </>
  );
}
