'use client'

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin, Globe, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";

function detectCountry(): string {
  if (typeof window === 'undefined') return 'cl';
  
  const language = navigator.language.toLowerCase();
  
  if (language.includes('es-co') || language.includes('co')) return 'co';
  if (language.includes('es-mx') || language.includes('mx')) return 'mx';
  
  return 'cl';
}

export default function VerificacionIdentidadRedirect() {
  useEffect(() => {
    const country = detectCountry();
    
    const timer = setTimeout(() => {
      window.location.href = `/${country}/verificacion-identidad`;
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg border p-8 text-center">
          <Shield className="w-16 h-16 text-[var(--tp-buttons)] mx-auto mb-6" />
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Verificación de Identidad
          </h1>
          
          <p className="text-gray-600 mb-8">
            KYC y verificación biométrica específica para cada país con sus documentos oficiales y regulaciones locales.
          </p>
          
          <div className="space-y-4">
            <Link href="/cl/verificacion-identidad">
              <Button className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white">
                <span className="mr-2">🇨🇱</span>
                Chile - Cédula + CMF
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <Link href="/co/verificacion-identidad">
              <Button variant="outline" className="w-full">
                <span className="mr-2">🇨🇴</span>
                Colombia - Próximamente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <Link href="/mx/verificacion-identidad">
              <Button variant="outline" className="w-full">
                <span className="mr-2">🇲🇽</span>
                México - Próximamente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Detectando tu ubicación... Serás redirigido automáticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}