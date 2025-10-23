'use client';

/**
 * Componente para registrar el Service Worker
 * Solo se ejecuta en producción y en navegadores compatibles
 */

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Solo registrar en producción y si el navegador lo soporta
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw-update.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);

          // Verificar actualizaciones periódicamente
          registration.update();
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
}

