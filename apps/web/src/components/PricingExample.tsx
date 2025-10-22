'use client'

import React from 'react';
import { useLocationContext } from './LocationProvider';
import { CheckCircle } from 'lucide-react';

export function PricingExample() {
  const { countryInfo, formatCurrency, getLocalizedContent } = useLocationContext();

  // Ejemplo de precios por país
  const pricingData = {
    cl: {
      simple: 500,
      advanced: 2500,
      qualified: 8500
    },
    mx: {
      simple: 15,
      advanced: 75,
      qualified: 200
    },
    co: {
      simple: 2000,
      advanced: 10000,
      qualified: 25000
    }
  };

  // Contenido localizado
  const localizedContent = getLocalizedContent({
    cl: {
      title: 'Precios en Chile',
      description: 'Cumple con Ley 19.799',
      available: true
    },
    mx: {
      title: 'Precios en México', 
      description: 'Próximamente - Cumplirá NOM-151-SCFI',
      available: false
    },
    co: {
      title: 'Precios en Colombia',
      description: 'Próximamente - Cumplirá Ley 527/1999', 
      available: false
    }
  });

  const prices = getLocalizedContent(pricingData);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{localizedContent.title}</h3>
          <p className="text-gray-600 text-sm">{localizedContent.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{countryInfo?.flag}</span>
          <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded-full">
            {countryInfo?.currency}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Firma Simple */}
        <div className={`border rounded-lg p-4 ${!localizedContent.available ? 'opacity-60' : ''}`}>
          <div className="text-center mb-4">
            <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-900">Firma Simple</h4>
            <p className="text-sm text-gray-600">Para documentos internos</p>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(prices.simple)}
            </div>
            <div className="text-sm text-gray-600">por documento</div>
          </div>
          
          {!localizedContent.available && (
            <div className="bg-gray-100 text-gray-500 text-center py-2 rounded text-sm">
              Próximamente
            </div>
          )}
        </div>

        {/* Firma Avanzada */}
        <div className={`border-2 border-blue-500 rounded-lg p-4 relative ${!localizedContent.available ? 'opacity-60' : ''}`}>
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
              Más Popular
            </span>
          </div>
          
          <div className="text-center mb-4">
            <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-900">Firma Avanzada</h4>
            <p className="text-sm text-gray-600">Para documentos comerciales</p>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(prices.advanced)}
            </div>
            <div className="text-sm text-gray-600">por documento</div>
          </div>
          
          {!localizedContent.available && (
            <div className="bg-gray-100 text-gray-500 text-center py-2 rounded text-sm">
              Próximamente
            </div>
          )}
        </div>

        {/* Firma Cualificada */}
        <div className={`border rounded-lg p-4 ${!localizedContent.available ? 'opacity-60' : ''}`}>
          <div className="text-center mb-4">
            <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-900">Firma Cualificada</h4>
            <p className="text-sm text-gray-600">Máximo nivel de seguridad</p>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(prices.qualified)}
            </div>
            <div className="text-sm text-gray-600">por documento</div>
          </div>
          
          {!localizedContent.available && (
            <div className="bg-gray-100 text-gray-500 text-center py-2 rounded text-sm">
              Próximamente
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t">
        <p className="text-xs text-gray-500 text-center">
          Los precios se muestran automáticamente en tu moneda local basado en tu ubicación
        </p>
      </div>
    </div>
  );
}
