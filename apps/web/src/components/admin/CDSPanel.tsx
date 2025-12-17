"use client";

import { useState } from "react";
import { invokeCDSOperation } from "@/app/actions/cds";

type Tab = "vigencia" | "enroll" | "2fa" | "documents" | "unlock" | "simple";

export default function CDSPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("vigencia");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    rut: "",
    correo: "",
    nombres: "Juan",
    apellidoPaterno: "Perez",
    apellidoMaterno: "Gonzalez",
    numeroDocumento: "111111111",
    codigoTransaccion: "",
    nombreDocumento: "Documento Prueba",
    documento: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAction = async (operation: string, payload: any) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await invokeCDSOperation(operation, payload);
      setResult(res);
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {(["vigencia", "enroll", "2fa", "simple", "documents", "unlock"] as Tab[]).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 font-medium capitalize whitespace-nowrap ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "2fa" ? "2FA / OTP" : tab}
            </button>
          )
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Area */}
        <div className="space-y-6">
          {activeTab === "vigencia" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Consultar Vigencia FEA</h3>
              <p className="text-sm text-gray-600">
                Verifica si un RUT tiene certificado vigente en CDS.
              </p>
              <div>
                <label className="block text-sm font-medium">RUT</label>
                <input
                  name="rut"
                  value={formData.rut}
                  onChange={handleChange}
                  placeholder="11.111.111-1"
                  className="mt-1 w-full px-3 py-2 border rounded"
                />
              </div>
              <button
                onClick={() => handleAction("check-vigencia", { rut: formData.rut })}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Consultando..." : "Consultar Vigencia"}
              </button>
            </div>
          )}

          {activeTab === "enroll" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Enrolar Firmante</h3>
              <p className="text-sm text-gray-600">
                Crea un nuevo usuario en CDS. Requiere datos reales para validación ClaveÚnica.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">RUT</label>
                  <input
                    name="rut"
                    value={formData.rut}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Nro. Documento</label>
                  <input
                    name="numeroDocumento"
                    value={formData.numeroDocumento}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Nombres</label>
                    <input
                        name="nombres"
                        value={formData.nombres}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Apellidos</label>
                    <input
                        name="apellidoPaterno"
                        value={formData.apellidoPaterno}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border rounded"
                        placeholder="Paterno"
                    />
                </div>
              </div>
              <button
                onClick={() => handleAction("enroll", {
                    rut: formData.rut,
                    nombres: formData.nombres,
                    apellidoPaterno: formData.apellidoPaterno,
                    apellidoMaterno: formData.apellidoMaterno,
                    correo: formData.correo,
                    numeroDocumento: formData.numeroDocumento
                })}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Enrolando..." : "Enrolar Firmante"}
              </button>
            </div>
          )}

          {activeTab === "2fa" && (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Solicitar Código 2FA</h3>
                <div>
                    <label className="block text-sm font-medium">RUT</label>
                    <input
                        name="rut"
                        value={formData.rut}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input
                        name="correo"
                        value={formData.correo}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border rounded"
                    />
                </div>
                <button
                    onClick={() => handleAction("request-second-factor", { rut: formData.rut, correo: formData.correo })}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? "Solicitando..." : "Solicitar Código"}
                </button>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Obtener Documento</h3>
                <p className="text-sm text-gray-600">Descargar documento firmado por código de transacción.</p>
                <div>
                    <label className="block text-sm font-medium">Código Transacción</label>
                    <input
                        name="codigoTransaccion"
                        value={formData.codigoTransaccion}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border rounded"
                    />
                </div>
                <button
                    onClick={() => handleAction("get-document", { codigoTransaccion: formData.codigoTransaccion })}
                    disabled={loading}
                    className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                >
                    {loading ? "Buscando..." : "Buscar Documento"}
                </button>
            </div>
          )}

          {activeTab === "simple" && (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Flujo Simple FEA</h3>
                <p className="text-sm text-gray-600">Envía un documento para firmar vía link (con OTP WhatsApp).</p>
                <div>
                    <label className="block text-sm font-medium">Nombre Documento</label>
                    <input
                        name="nombreDocumento"
                        value={formData.nombreDocumento || "Documento Prueba"}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border rounded"
                    />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">RUT Firmante</label>
                        <input
                            name="rut"
                            value={formData.rut}
                            onChange={handleChange}
                            className="mt-1 w-full px-3 py-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Email Firmante</label>
                        <input
                            name="correo"
                            value={formData.correo}
                            onChange={handleChange}
                            className="mt-1 w-full px-3 py-2 border rounded"
                        />
                    </div>
                </div>
                <div>
                     <label className="block text-sm font-medium">Documento (Base64 PDF)</label>
                     <textarea
                        name="documento"
                        value={formData.documento}
                        onChange={(e) => setFormData({...formData, documento: e.target.value})}
                        placeholder="Pegar Base64 aquí..."
                        className="mt-1 w-full px-3 py-2 border rounded h-24 text-xs font-mono"
                     />
                </div>
                <button
                    onClick={() => handleAction("simple-flow", {
                        nombreDocumento: formData.nombreDocumento || "Documento Prueba",
                        documento: formData.documento,
                        firmantes: [{ rut: formData.rut, correo: formData.correo }]
                    })}
                    disabled={loading}
                    className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                    {loading ? "Enviando..." : "Iniciar Flujo Simple"}
                </button>
            </div>
          )}

          {activeTab === "unlock" && (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Desbloqueo</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleAction("unblock-certificate", { rut: formData.rut })}
                        disabled={loading}
                        className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        Desbloquear Certificado
                    </button>
                    <button
                        onClick={() => handleAction("unblock-second-factor", { rut: formData.rut, correo: formData.correo })}
                        disabled={loading}
                        className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        Desbloquear 2FA
                    </button>
                </div>
                 <p className="text-xs text-gray-500 mt-2">Requiere RUT (y Correo para 2FA)</p>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-auto max-h-[500px]">
          <h4 className="text-gray-400 mb-2 border-b border-gray-700 pb-1">Respuesta API</h4>
          {loading ? (
             <div className="animate-pulse flex space-x-4">
                 <div className="flex-1 space-y-4 py-1">
                     <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                     <div className="h-4 bg-gray-700 rounded"></div>
                     <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                 </div>
             </div>
          ) : result ? (
            <pre>{JSON.stringify(result, null, 2)}</pre>
          ) : (
            <p className="text-gray-500 italic">Esperando solicitud...</p>
          )}
        </div>
      </div>
    </div>
  );
}
