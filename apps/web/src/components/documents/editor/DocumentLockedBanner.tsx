'use client';

import { Lock, Wifi, WifiOff } from 'lucide-react';

interface DocumentLockedBannerProps {
  lockedBy: string;
  isConnected: boolean;
}

export function DocumentLockedBanner({ lockedBy, isConnected }: DocumentLockedBannerProps) {
  return (
    <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-700 px-4 py-3 flex items-center gap-3">
      <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-medium text-amber-800 dark:text-amber-200">
          {lockedBy} está editando este documento
        </p>
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Puedes ver el contenido pero no editarlo hasta que termine
        </p>
      </div>
      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
        {isConnected ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
      </div>
    </div>
  );
}
