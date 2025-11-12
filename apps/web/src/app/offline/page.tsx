'use client';

/**
 * Página Offline - TuPatrimonio
 * 
 * Se muestra cuando no hay conexión a internet
 * y el Service Worker no puede servir contenido desde caché
 */

import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Verificar estado de conexión
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Listeners para cambios de conexión
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    checkOnlineStatus();

    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);

  useEffect(() => {
    // Si vuelve a estar online, redirigir al dashboard
    if (isOnline) {
      window.location.href = '/dashboard';
    }
  }, [isOnline]);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    } else {
      alert('Aún no hay conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--tp-background-light)] px-4">
      <div className="max-w-md w-full text-center">
        {/* Ícono offline */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 rounded-full bg-[var(--tp-buttons-20)] flex items-center justify-center">
            <svg
              className="w-12 h-12 text-[var(--tp-buttons)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          </div>
        </div>

        {/* Contenido */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-[var(--tp-background-dark)]">
            Sin Conexión
          </h1>
          
          <p className="text-lg text-[var(--tp-lines)]">
            No hay conexión a internet en este momento
          </p>

          <p className="text-sm text-[var(--tp-lines)]">
            Verifica tu conexión e intenta nuevamente. Algunos contenidos guardados 
            pueden estar disponibles offline.
          </p>
        </div>

        {/* Botón retry */}
        <button
          onClick={handleRetry}
          className="mt-8 w-full px-6 py-3 bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white font-medium rounded-lg transition-colors duration-200 shadow-[var(--tp-shadow-md)]"
        >
          {isOnline ? 'Reintentar' : 'Verificar Conexión'}
        </button>

        {/* Status indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-[var(--tp-lines)]">
            {isOnline ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {/* Info adicional */}
        <div className="mt-8 p-4 bg-white rounded-lg border border-[var(--tp-lines-30)] text-left">
          <h3 className="font-semibold text-[var(--tp-background-dark)] mb-2">
            Funcionalidad Offline
          </h3>
          <ul className="text-sm text-[var(--tp-lines)] space-y-1">
            <li>• Algunas páginas visitadas pueden estar disponibles</li>
            <li>• Los datos se sincronizarán automáticamente al reconectar</li>
            <li>• Mantén la app abierta para sincronizar cuando vuelvas online</li>
          </ul>
        </div>

        {/* Logo */}
        <div className="mt-8">
          <p className="text-2xl font-bold text-[var(--tp-buttons)]">
            TuPatrimonio
          </p>
          <p className="text-xs text-[var(--tp-lines)] mt-1">
            Gestión de Patrimonio Personal
          </p>
        </div>
      </div>
    </div>
  );
}

