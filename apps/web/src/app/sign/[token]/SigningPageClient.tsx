"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EnrollmentForm from "@/components/signing/EnrollmentForm";

interface SigningPageClientProps {
  signer: any;
}

export default function SigningPageClient({ signer }: SigningPageClientProps) {
  const router = useRouter();
  const [isSigningStep, setIsSigningStep] = useState(
    signer.status === "enrolled" || signer.status === "pending"
  );
  const [claveFEA, setClaveFEA] = useState("");
  const [codigoSegundoFactor, setCodigoSegundoFactor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleEnrollmentComplete = () => {
    setIsSigningStep(true);
    router.refresh();
  };

  const handleSign = async () => {
    if (!claveFEA) {
      setError("Debe ingresar su clave FEA");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/signing/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signing_token: signer.signing_token,
          clave_fea: claveFEA,
          codigo_segundo_factor: codigoSegundoFactor || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al firmar documento");
      }

      setSuccess(true);
      
      // Si la firma fue inmediata, recargar después de 2 segundos
      if (data.signed) {
        setTimeout(() => {
          router.refresh();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Error al firmar documento");
    } finally {
      setIsLoading(false);
    }
  };

  // Si el firmante necesita enrolamiento, mostrar formulario
  if (signer.status === "needs_enrollment" && !isSigningStep) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Enrolamiento de Firma Electrónica Avanzada
              </h1>
              <p className="text-gray-600">
                Documento: <strong>{signer.document.title}</strong>
              </p>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800">
                Para firmar este documento, primero debe enrolarse en el sistema de Firma Electrónica Avanzada (FEA).
                Este proceso solo se realiza una vez y le permitirá firmar documentos electrónicos con validez legal.
              </p>
            </div>

            <EnrollmentForm
              signerId={signer.id}
              initialData={{
                rut: signer.rut || "",
                email: signer.email,
                nombres: "",
                apellido_paterno: "",
                apellido_materno: "",
              }}
              onSuccess={handleEnrollmentComplete}
            />
          </div>
        </div>
      </div>
    );
  }

  // Mostrar paso de firma
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#800039] to-[#a00048] p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Firmar Documento</h1>
            <p className="text-white/90">{signer.document.title}</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Mensaje de éxito */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-semibold text-green-800">¡Documento firmado exitosamente!</p>
                    <p className="text-sm text-green-700">
                      Su firma electrónica ha sido aplicada al documento.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Vista previa del documento */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Vista previa del documento
              </h2>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <iframe
                  src={`/api/signing/preview/${signer.document.id}?token=${signer.signing_token}`}
                  className="w-full h-[600px]"
                  title="Document Preview"
                />
              </div>
            </div>

            {/* Formulario de firma */}
            {!success && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  Ingrese su clave FEA
                </h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="claveFEA" className="block text-sm font-medium text-gray-700 mb-2">
                      Clave FEA *
                    </label>
                    <input
                      type="password"
                      id="claveFEA"
                      value={claveFEA}
                      onChange={(e) => setClaveFEA(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800039] focus:border-transparent text-gray-900 bg-white"
                      placeholder="Ingrese su clave FEA"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label htmlFor="codigoSF" className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Segundo Factor (si aplica)
                    </label>
                    <input
                      type="text"
                      id="codigoSF"
                      value={codigoSegundoFactor}
                      onChange={(e) => setCodigoSegundoFactor(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800039] focus:border-transparent text-gray-900 bg-white"
                      placeholder="Código de segundo factor"
                      disabled={isLoading}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Si ha configurado segundo factor, ingrese el código recibido por correo.
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleSign}
                      disabled={isLoading || !claveFEA}
                      className="w-full bg-[#800039] hover:bg-[#a00048] text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Firmando...
                        </span>
                      ) : (
                        "Firmar Documento"
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-sm text-amber-800">
                    <strong>Importante:</strong> Al firmar este documento, usted acepta que su firma electrónica
                    tiene la misma validez legal que su firma manuscrita según la Ley 19.799.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        {signer.document.signing_order === "sequential" && (
          <div className="mt-6 bg-white shadow-lg rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Orden de firma</h3>
            <p className="text-gray-600 mb-4">Este documento requiere firma secuencial.</p>
            <div className="space-y-2">
              {signer.document.all_signers
                .sort((a: any, b: any) => a.signing_order - b.signing_order)
                .map((s: any, index: number) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold mr-3">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{s.full_name}</p>
                        <p className="text-sm text-gray-500">{s.email}</p>
                      </div>
                    </div>
                    <div>
                      {s.status === "signed" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Firmado
                        </span>
                      )}
                      {s.id === signer.id && s.status !== "signed" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          Su turno
                        </span>
                      )}
                      {s.status === "pending" && s.id !== signer.id && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
