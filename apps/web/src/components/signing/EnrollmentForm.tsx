"use client";

import { useState } from "react";

interface EnrollmentFormProps {
  signerId: string;
  initialData?: {
    rut?: string;
    email?: string;
    nombres?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
  };
  onSuccess: () => void;
}

export default function EnrollmentForm({ 
  signerId, 
  initialData = {},
  onSuccess 
}: EnrollmentFormProps) {
  const [formData, setFormData] = useState({
    rut: initialData.rut || "",
    nombres: initialData.nombres || "",
    apellido_paterno: initialData.apellido_paterno || "",
    apellido_materno: initialData.apellido_materno || "",
    correo: initialData.email || "",
    numero_documento: "",
    clave_certificado: "",
    confirmar_clave: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatRut = (rut: string) => {
    // Eliminar puntos y guión
    const cleanRut = rut.replace(/[.-]/g, "");
    
    // Agregar guión antes del dígito verificador
    if (cleanRut.length > 1) {
      return cleanRut.slice(0, -1) + "-" + cleanRut.slice(-1);
    }
    
    return cleanRut;
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setFormData(prev => ({ ...prev, rut: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!formData.rut || !formData.nombres || !formData.apellido_paterno || 
        !formData.correo || !formData.numero_documento) {
      setError("Todos los campos marcados con * son obligatorios");
      return;
    }

    if (formData.clave_certificado && formData.clave_certificado !== formData.confirmar_clave) {
      setError("Las claves no coinciden");
      return;
    }

    if (formData.clave_certificado && formData.clave_certificado.length < 8) {
      setError("La clave debe tener al menos 8 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/signing/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signer_id: signerId,
          rut: formData.rut,
          nombres: formData.nombres,
          apellido_paterno: formData.apellido_paterno,
          apellido_materno: formData.apellido_materno,
          correo: formData.correo,
          numero_documento: formData.numero_documento,
          clave_certificado: formData.clave_certificado || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.details 
          ? `${data.error} (${data.details})`
          : data.error || "Error al enrolar firmante";
        throw new Error(errorMsg);
      }

      setSuccess(true);
      
      // Llamar a callback de éxito después de 1 segundo
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      console.error("Error completo:", err);
      setError(err.message || "Error al enrolar firmante");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              ¡Enrolamiento exitoso!
            </h3>
            <p className="text-green-700">
              Ahora puede proceder a firmar el documento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* RUT */}
      <div>
        <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-2">
          RUT *
        </label>
        <input
          type="text"
          id="rut"
          name="rut"
          value={formData.rut}
          onChange={handleRutChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800039] focus:border-transparent text-gray-900 bg-white"
          placeholder="12345678-9"
          disabled={isLoading}
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          Formato: 12345678-9 (sin puntos)
        </p>
      </div>

      {/* Nombres */}
      <div>
        <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-2">
          Nombres *
        </label>
        <input
          type="text"
          id="nombres"
          name="nombres"
          value={formData.nombres}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800039] focus:border-transparent text-gray-900 bg-white"
          placeholder="Juan Carlos"
          disabled={isLoading}
          required
        />
      </div>

      {/* Apellido Paterno */}
      <div>
        <label htmlFor="apellido_paterno" className="block text-sm font-medium text-gray-700 mb-2">
          Apellido Paterno *
        </label>
        <input
          type="text"
          id="apellido_paterno"
          name="apellido_paterno"
          value={formData.apellido_paterno}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800039] focus:border-transparent text-gray-900 bg-white"
          placeholder="Pérez"
          disabled={isLoading}
          required
        />
      </div>

      {/* Apellido Materno */}
      <div>
        <label htmlFor="apellido_materno" className="block text-sm font-medium text-gray-700 mb-2">
          Apellido Materno
        </label>
        <input
          type="text"
          id="apellido_materno"
          name="apellido_materno"
          value={formData.apellido_materno}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800039] focus:border-transparent text-gray-900 bg-white"
          placeholder="González"
          disabled={isLoading}
        />
      </div>

      {/* Correo */}
      <div>
        <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-2">
          Correo Electrónico *
        </label>
        <input
          type="email"
          id="correo"
          name="correo"
          value={formData.correo}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800039] focus:border-transparent text-gray-900 bg-white"
          placeholder="correo@example.com"
          disabled={isLoading}
          required
        />
      </div>

      {/* Número de Documento */}
      <div>
        <label htmlFor="numero_documento" className="block text-sm font-medium text-gray-700 mb-2">
          Número de Documento (sin puntos ni guión) *
        </label>
        <input
          type="text"
          id="numero_documento"
          name="numero_documento"
          value={formData.numero_documento}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800039] focus:border-transparent text-gray-900 bg-white"
          placeholder="12345678"
          disabled={isLoading}
          required
        />
      </div>

      {/* Clave del Certificado (Opcional) */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-4">
          <strong>Opcional:</strong> Puede definir una clave personalizada para su certificado FEA.
          Si no la define, el sistema generará una automáticamente.
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="clave_certificado" className="block text-sm font-medium text-gray-700 mb-2">
              Clave del Certificado
            </label>
            <input
              type="password"
              id="clave_certificado"
              name="clave_certificado"
              value={formData.clave_certificado}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800039] focus:border-transparent text-gray-900 bg-white"
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              disabled={isLoading}
            />
          </div>

          {formData.clave_certificado && (
            <div>
              <label htmlFor="confirmar_clave" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Clave
              </label>
              <input
                type="password"
                id="confirmar_clave"
                name="confirmar_clave"
                value={formData.confirmar_clave}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800039] focus:border-transparent text-gray-900 bg-white"
                placeholder="Confirmar clave"
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#800039] hover:bg-[#a00048] text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enrolando...
            </span>
          ) : (
            "Enrolar y Continuar"
          )}
        </button>
      </div>
    </form>
  );
}
