'use client';

import { VersionNotification, useVersionCheck } from '@tupatrimonio/version';

/**
 * Componente que maneja el estado de versiones únicamente en el cliente
 * Separado para evitar problemas de SSR
 */
export default function ClientVersionNotification() {
  const versionCheck = useVersionCheck({
    checkIntervalMs: 5 * 60 * 1000, // 5 minutos
    enableOnlyInProduction: true,
    versionEndpoint: '/version.json'
  });

  return <VersionNotification versionCheck={versionCheck} />;
}
