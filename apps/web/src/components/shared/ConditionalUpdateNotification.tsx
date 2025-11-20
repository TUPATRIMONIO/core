/**
 * Update Notification Condicional
 * Solo se ejecuta en páginas públicas, no en admin
 */

'use client';

import { UpdateNotification } from '@tupatrimonio/update-notifier';
import { usePathname } from 'next/navigation';

export function ConditionalUpdateNotification() {
  const pathname = usePathname();
  
  // No mostrar update notification en páginas de admin
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return <UpdateNotification />;
}
