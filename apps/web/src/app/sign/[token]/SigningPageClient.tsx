"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Key, 
  MessageSquare, 
  ExternalLink,
  Unlock,
  AlertTriangle
} from "lucide-react";

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
  | "error";

export default function SigningPageClient({ signer }: SigningPageClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<SigningStep>("verifying");
  const [claveCertificado, setClaveCertificado] = useState("");
  const [codigoSegundoFactor, setCodigoSegundoFactor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [vigenciaData, setVigenciaData] = useState<any>(null);

  // 1. Verificar vigencia al cargar
  useEffect(() => {
    checkVigencia();
  }, [signer.signing_token]);

  const checkVigencia = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/signing/check-fea?token=${signer.signing_token}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al verificar vigencia");

      setVigenciaData(data);
      
      if (!data.vigente) {
        setStep("needs_enrollment");
      } else if (data.certificadoBloqueado) {
        setStep("certificate_blocked");
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
      // Intentamos enrolar (CDS enviará correo)
      const response = await fetch("/api/signing/enroll-cds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signing_token: signer.signing_token, send_email: true })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al iniciar enrolamiento");

      alert("Se ha enviado un correo de CDS para que inicie su proceso de enrolamiento. Una vez completado, regrese a esta página.");
    } catch (err: any) {
      setError(err.message);
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
        if (data.errorCode === "125") setStep("certificate_blocked");
        throw new Error(data.error || "Error al solicitar segundo factor");
      }

      setStep("waiting_code");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (type: "certificate" | "2fa") => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/signing/unblock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signing_token: signer.signing_token, type })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al solicitar desbloqueo");

      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        alert(data.message || "Proceso de desbloqueo iniciado. Revise su correo.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    if (!claveCertificado || !codigoSegundoFactor) {
      setError("Clave de certificado y código SMS son requeridos");
      return;
    }

    setIsLoading(true);
    setError("");

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
        if (data.errorCode === "134") setStep("sf_blocked");
        throw new Error(data.error || "Error al firmar documento");
      }

      setStep("success");
      
      if (data.signed) {
        setTimeout(() => {
          router.refresh();
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Helpers ---

  const renderHeader = () => (
    <div className="bg-gradient-to-r from-[#800039] to-[#a00048] p-8 text-white">
      <h1 className="text-3xl font-bold mb-2">Firmar Documento</h1>
      <p className="text-white/90">{signer.document.title}</p>
    </div>
  );

  const renderStatus = () => {
    switch (step) {
      case "verifying":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-[#800039] animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Verificando su estado de firma avanzada...</p>
          </div>
        );

      case "needs_enrollment":
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <ShieldCheck className="w-6 h-6 text-blue-600 mr-4 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-blue-800 mb-2">Enrolamiento Requerido</h3>
                <p className="text-blue-700 mb-4">
                  Usted no cuenta con una Firma Electrónica Avanzada (FEA) vigente en el sistema de CDS. 
                  Para firmar este documento, primero debe enrolarse.
                </p>
                <button
                  onClick={handleEnroll}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                  Iniciar Enrolamiento en CDS
                </button>
                <p className="mt-4 text-sm text-blue-600">
                  * CDS le enviará un correo electrónico para completar el proceso. Una vez listo, regrese aquí para firmar.
                </p>
              </div>
            </div>
          </div>
        );

      case "certificate_blocked":
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-4 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-red-800 mb-2">Certificado Bloqueado</h3>
                <p className="text-red-700 mb-4">
                  Su certificado ha sido bloqueado por demasiados intentos fallidos con su clave.
                </p>
                <button
                  onClick={() => handleUnblock("certificate")}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center transition-colors disabled:opacity-50"
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
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-orange-600 mr-4 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-orange-800 mb-2">Segundo Factor Bloqueado</h3>
                <p className="text-orange-700 mb-4">
                  Su sistema de segundo factor (SMS) ha sido bloqueado por intentos fallidos.
                </p>
                <button
                  onClick={() => handleUnblock("2fa")}
                  disabled={isLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center transition-colors disabled:opacity-50"
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
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Key className="w-5 h-5 mr-2 text-[#800039]" />
                Autentique su Certificado
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clave de su Certificado FEA</label>
                  <input
                    type="password"
                    value={claveCertificado}
                    onChange={(e) => setClaveCertificado(e.target.value)}
                    placeholder="Ingrese su clave"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800039] focus:border-transparent text-gray-900 bg-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">Es la clave que configuró al enrolarse en CDS.</p>
                </div>
                <button
                  onClick={handleRequest2FA}
                  disabled={isLoading || !claveCertificado}
                  className="w-full bg-[#800039] hover:bg-[#a00048] text-white font-bold py-3 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Validar Segundo Factor
              </h3>
              <div className="space-y-4">
                <p className="text-green-700 text-sm">Se ha enviado un código a su celular registrado por SMS.</p>
                <div>
                  <label className="block text-sm font-medium text-green-800 mb-1">Código recibido por SMS</label>
                  <input
                    type="text"
                    value={codigoSegundoFactor}
                    onChange={(e) => setCodigoSegundoFactor(e.target.value)}
                    placeholder="Ingrese el código de 6 dígitos"
                    className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <button
                  onClick={handleSign}
                  disabled={isLoading || !codigoSegundoFactor}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                  Finalizar y Firmar Documento
                </button>
                <button 
                  onClick={() => setStep("ready_for_2fa")}
                  className="w-full text-green-700 text-sm hover:underline"
                >
                  Volver a ingresar clave
                </button>
              </div>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Documento Firmado Exitosamente!</h2>
            <p className="text-gray-600 italic">Su firma electrónica ha sido aplicada legalmente al documento.</p>
            <p className="mt-8 text-sm text-gray-500 animate-pulse">Redirigiendo en unos segundos...</p>
          </div>
        );

      case "error":
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">Error</h3>
            <p className="text-red-700 mb-6">{error}</p>
            <button
              onClick={checkVigencia}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar verificación
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          {renderHeader()}

          <div className="p-8">
            {error && step !== "error" && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Document Preview - Always visible after initial load */}
            {step !== "verifying" && step !== "success" && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Vista previa del documento</h2>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Modo Lectura</span>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <iframe
                    src={`/api/signing/preview/${signer.document.id}?token=${signer.signing_token}`}
                    className="w-full h-[600px] bg-gray-100"
                    title="Document Preview"
                  />
                </div>
              </div>
            )}

            {/* Dynamic Status Section */}
            <div className="mt-8 border-t border-gray-100 pt-8">
              {renderStatus()}
            </div>
            
            {/* Legal Footer */}
            {step !== "success" && step !== "verifying" && (
              <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs text-amber-800 flex items-start">
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
  );
}
