'use client'

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin, Globe, ArrowRight, DollarSign } from "lucide-react";
import Link from "next/link";

function detectCountry(): string {
  if (typeof window === 'undefined') return 'cl';
  
  const language = navigator.language.toLowerCase();
  
  if (language.includes('es-co') || language.includes('co')) return 'co';
  if (language.includes('es-mx') || language.includes('mx')) return 'mx';
  
  return 'cl';
}

export default function PreciosRedirect() {
  useEffect(() => {
    const country = detectCountry();
    
    const timer = setTimeout(() => {
      window.location.href = `/${country}/precios`;
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg border p-8 text-center">
          <DollarSign className="w-16 h-16 text-[var(--tp-buttons)] mx-auto mb-6" />
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Precios TuPatrimonio
          </h1>
          
          <p className="text-gray-600 mb-8">
            Precios específicos para cada país en moneda local con planes adaptados al mercado.
          </p>
          
          <div className="space-y-4">
            <Link href="/cl/precios">
              <Button className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white">
                <span className="mr-2">🇨🇱</span>
                Chile - Precios en CLP
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <Link href="/co">
              <Button variant="outline" className="w-full">
                <span className="mr-2">🇨🇴</span>
                Colombia - Próximamente COP
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <Link href="/mx">
              <Button variant="outline" className="w-full">
                <span className="mr-2">🇲🇽</span>
                México - Próximamente MXN
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-blue-600">CLP</div>
                <div className="text-gray-600">Chile</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-yellow-600">COP</div>
                <div className="text-gray-600">Colombia</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600">MXN</div>
                <div className="text-gray-600">México</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Detectando tu ubicación... Serás redirigido automáticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}