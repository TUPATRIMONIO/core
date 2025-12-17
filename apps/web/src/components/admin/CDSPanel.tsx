"use client";

import { useState } from "react";
import { invokeCDSOperation } from "@/app/actions/cds";
import { 
  Search, 
  UserPlus, 
  ShieldCheck, 
  Zap, 
  FileText, 
  Unlock,
  CheckCircle2,
  XCircle,
  Loader2,
  Radio
} from "lucide-react";

type Tab = "vigencia" | "enroll" | "2fa" | "documents" | "unlock" | "simple";

const tabConfig: Record<Tab, { label: string; icon: typeof Search }> = {
  vigencia: { label: "Vigencia", icon: Search },
  enroll: { label: "Enrolar", icon: UserPlus },
  "2fa": { label: "2FA / OTP", icon: ShieldCheck },
  simple: { label: "Flujo Simple", icon: Zap },
  documents: { label: "Documentos", icon: FileText },
  unlock: { label: "Desbloqueo", icon: Unlock },
};

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

  const inputClasses = "mt-1 w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[var(--tp-brand-20)] focus:border-[var(--tp-brand)] transition-all duration-200";
  
  const labelClasses = "block text-sm font-medium text-foreground";

  const buttonClasses = "w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white py-2.5 px-4 rounded-lg font-medium shadow-[var(--tp-shadow-md)] hover:shadow-[var(--tp-shadow-lg)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const brandButtonClasses = "w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white py-2.5 px-4 rounded-lg font-medium shadow-[var(--tp-shadow-md)] hover:shadow-[var(--tp-shadow-lg)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="bg-card border border-border shadow-[var(--tp-shadow-lg)] rounded-xl p-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-2 px-2">
        {(["vigencia", "enroll", "2fa", "simple", "documents", "unlock"] as Tab[]).map(
          (tab) => {
            const TabIcon = tabConfig[tab].icon;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-[var(--tp-brand)] text-white shadow-[var(--tp-shadow-md)]"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tabConfig[tab].label}</span>
              </button>
            );
          }
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Area */}
        <div className="space-y-6">
          {activeTab === "vigencia" && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-[var(--tp-brand)]" />
                  <span>Consultar Vigencia FEA</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Verifica si un RUT tiene certificado vigente en CDS.
                </p>
              </div>
              <div>
                <label className={labelClasses}>RUT</label>
                <input
                  name="rut"
                  value={formData.rut}
                  onChange={handleChange}
                  placeholder="11.111.111-1"
                  className={inputClasses}
                />
              </div>
              <button
                onClick={() => handleAction("check-vigencia", { rut: formData.rut })}
                disabled={loading}
                className={buttonClasses}
              >
                {loading ? "Consultando..." : "Consultar Vigencia"}
              </button>
            </div>
          )}

          {activeTab === "enroll" && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[var(--tp-brand)]" />
                  <span>Enrolar Firmante</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Crea un nuevo usuario en CDS. Requiere datos reales para validación ClaveÚnica.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>RUT</label>
                  <input
                    name="rut"
                    value={formData.rut}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Nro. Documento</label>
                  <input
                    name="numeroDocumento"
                    value={formData.numeroDocumento}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Email</label>
                <input
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Nombres</label>
                  <input
                    name="nombres"
                    value={formData.nombres}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Apellido Paterno</label>
                  <input
                    name="apellidoPaterno"
                    value={formData.apellidoPaterno}
                    onChange={handleChange}
                    placeholder="Paterno"
                    className={inputClasses}
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
                className={brandButtonClasses}
              >
                {loading ? "Enrolando..." : "Enrolar Firmante"}
              </button>
            </div>
          )}

          {activeTab === "2fa" && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[var(--tp-brand)]" />
                  <span>Solicitar Código 2FA</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Envía un código de verificación al correo del firmante.
                </p>
              </div>
              <div>
                <label className={labelClasses}>RUT</label>
                <input
                  name="rut"
                  value={formData.rut}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Email</label>
                <input
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
              <button
                onClick={() => handleAction("request-second-factor", { rut: formData.rut, correo: formData.correo })}
                disabled={loading}
                className={buttonClasses}
              >
                {loading ? "Solicitando..." : "Solicitar Código"}
              </button>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[var(--tp-brand)]" />
                  <span>Obtener Documento</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Descargar documento firmado por código de transacción.
                </p>
              </div>
              <div>
                <label className={labelClasses}>Código Transacción</label>
                <input
                  name="codigoTransaccion"
                  value={formData.codigoTransaccion}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
              <button
                onClick={() => handleAction("get-document", { codigoTransaccion: formData.codigoTransaccion })}
                disabled={loading}
                className={buttonClasses}
              >
                {loading ? "Buscando..." : "Buscar Documento"}
              </button>
            </div>
          )}

          {activeTab === "simple" && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[var(--tp-brand)]" />
                  <span>Flujo Simple FEA</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Envía un documento para firmar vía link (con OTP WhatsApp).
                </p>
              </div>
              <div>
                <label className={labelClasses}>Nombre Documento</label>
                <input
                  name="nombreDocumento"
                  value={formData.nombreDocumento || "Documento Prueba"}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>RUT Firmante</label>
                  <input
                    name="rut"
                    value={formData.rut}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Email Firmante</label>
                  <input
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Documento (Base64 PDF)</label>
                <textarea
                  name="documento"
                  value={formData.documento}
                  onChange={(e) => setFormData({...formData, documento: e.target.value})}
                  placeholder="Pegar Base64 aquí..."
                  className={`${inputClasses} h-24 text-xs font-mono resize-none`}
                />
              </div>
              <button
                onClick={() => handleAction("simple-flow", {
                  nombreDocumento: formData.nombreDocumento || "Documento Prueba",
                  documento: formData.documento,
                  firmantes: [{ rut: formData.rut, correo: formData.correo }]
                })}
                disabled={loading}
                className={brandButtonClasses}
              >
                {loading ? "Enviando..." : "Iniciar Flujo Simple"}
              </button>
            </div>
          )}

          {activeTab === "unlock" && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2">
                  <Unlock className="w-5 h-5 text-[var(--tp-brand)]" />
                  <span>Desbloqueo</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Desbloquea certificados o segundo factor bloqueados.
                </p>
              </div>
              <div>
                <label className={labelClasses}>RUT</label>
                <input
                  name="rut"
                  value={formData.rut}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Email (requerido para 2FA)</label>
                <input
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction("unblock-certificate", { rut: formData.rut })}
                  disabled={loading}
                  className={`flex-1 bg-destructive hover:bg-destructive/90 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50`}
                >
                  {loading ? "..." : "Desbloquear Certificado"}
                </button>
                <button
                  onClick={() => handleAction("unblock-second-factor", { rut: formData.rut, correo: formData.correo })}
                  disabled={loading}
                  className={`flex-1 ${buttonClasses}`}
                >
                  {loading ? "..." : "Desbloquear 2FA"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="bg-[var(--tp-background-dark)] rounded-xl p-5 text-[var(--tp-gray-100)] font-mono text-sm overflow-auto max-h-[500px] border border-[var(--tp-lines-20)] shadow-inner">
          <div className="flex items-center justify-between mb-3 border-b border-[var(--tp-lines-30)] pb-3">
            <h4 className="text-[var(--tp-gray-200)] font-semibold flex items-center gap-2">
              <Radio className="w-3 h-3 text-[var(--tp-success)] animate-pulse" />
              Respuesta API
            </h4>
            {result && (
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                result.success 
                  ? "bg-[var(--tp-success-light)] text-[var(--tp-success)]" 
                  : "bg-[var(--tp-error-light)] text-[var(--tp-error)]"
              }`}>
                {result.success ? (
                  <><CheckCircle2 className="w-3 h-3" /> Success</>
                ) : (
                  <><XCircle className="w-3 h-3" /> Error</>
                )}
              </span>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-[var(--tp-info)] animate-spin" />
                <span className="text-[var(--tp-info)]">Procesando solicitud...</span>
              </div>
              <div className="animate-pulse space-y-3 mt-4">
                <div className="h-3 bg-[var(--tp-lines-20)] rounded w-3/4"></div>
                <div className="h-3 bg-[var(--tp-lines-20)] rounded"></div>
                <div className="h-3 bg-[var(--tp-lines-20)] rounded w-5/6"></div>
                <div className="h-3 bg-[var(--tp-lines-20)] rounded w-2/3"></div>
              </div>
            </div>
          ) : result ? (
            <pre className="text-[var(--tp-success)] leading-relaxed whitespace-pre-wrap break-words">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--tp-lines)]">
              <Radio className="w-10 h-10 mb-3 opacity-50" />
              <p className="italic">Esperando solicitud...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
