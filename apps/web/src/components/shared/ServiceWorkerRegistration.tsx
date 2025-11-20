'use client';

/**
 * Componente para registrar el Service Worker PWA
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
      // Registrar Service Worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ PWA Service Worker registered:', registration.scope);

          // Verificar actualizaciones periódicamente
          setInterval(() => {
            registration.update();
          }, 60000); // Cada minuto

          // Listener para actualizaciones
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  console.log('🔄 Nueva versión del Service Worker disponible');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });

      // Listener para mensajes del Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          console.log('🔔 Update available:', event.data.version);
        }
      });

      // Listener para cuando el SW toma control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed');
      });
    } else {
      console.log('ℹ️ Service Worker not supported or not in production');
    }
  }, []);

  return null;
}

