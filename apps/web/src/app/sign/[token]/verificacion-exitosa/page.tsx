"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function VerificacionExitosaPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/sign/${token}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, token]);

  const progressPercentage = ((5 - countdown) / 5) * 100;

  return (
    <div className="min-h-screen bg-[var(--tp-background-light)] flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-card w-full max-w-md rounded-2xl shadow-[var(--tp-shadow-xl)] border border-border p-8 text-center">
        <div className="w-20 h-20 bg-[var(--tp-success-light)] dark:bg-[var(--tp-success)]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-[var(--tp-success)]" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Verificación Exitosa
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Tu identidad fue verificada correctamente con ClaveÚnica. Estamos procesando tu firma.
        </p>

        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-foreground mb-2">
            <span>Redirigiendo...</span>
            <span>{countdown}s</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--tp-success)] transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => router.push(`/sign/${token}`)}
          className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <span>Ir al documento ahora</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        
        <p className="text-xs text-muted-foreground mt-4">
          Si no eres redirigido automáticamente, haz clic en el botón.
        </p>
      </div>
    </div>
  );
}
