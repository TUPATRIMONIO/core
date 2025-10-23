'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import dinámico que solo se carga en el cliente
const DynamicVersionNotification = dynamic(() => 
  import('./ClientVersionNotification'), 
  { ssr: false }
);

/**
 * Provider del sistema de notificación de versiones para la app de marketing
 * Componente cliente que maneja el estado de versiones con lazy loading
 */
export function VersionNotificationProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <DynamicVersionNotification />;
}
