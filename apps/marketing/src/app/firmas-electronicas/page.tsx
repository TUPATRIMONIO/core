'use client'

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";

// Simple country detection (can be enhanced with IP-based detection)
function detectCountry(): string {
  if (typeof window === 'undefined') return 'cl';
  
  // Try to detect from browser language
  const language = navigator.language.toLowerCase();
  
  if (language.includes('es-co') || language.includes('co')) return 'co';
  if (language.includes('es-mx') || language.includes('mx')) return 'mx';
  
  // Default to Chile
  return 'cl';
}

export default function FirmasElectronicasRedirect() {
  useEffect(() => {
    const country = detectCountry();
    
    // Redirect after 3 seconds, or user can choose manually
    const timer = setTimeout(() => {
      window.location.href = `/${country}/firmas-electronicas`;
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg border p-8 text-center">
          <Globe className="w-16 h-16 text-[var(--tp-buttons)] mx-auto mb-6" />
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Firma Electrónica TuPatrimonio
          </h1>
          
          <p className="text-gray-600 mb-8">
            Selecciona tu país para ver información específica, precios en moneda local y regulaciones aplicables.
          </p>
          
          <div className="space-y-4">
            <Link href="/cl/firmas-electronicas">
              <Button className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white">
                <span className="mr-2">🇨🇱</span>
                Chile - Ley 19.799
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <Link href="/co/firmas-electronicas">
              <Button variant="outline" className="w-full">
                <span className="mr-2">🇨🇴</span>
                Colombia - Próximamente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <Link href="/mx/firmas-electronicas">
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