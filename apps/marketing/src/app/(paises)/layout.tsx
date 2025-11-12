'use client';

import { useEffect } from 'react';
import { useNavigation } from '@/components/NavigationProvider';

export default function PaisesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setShowNav } = useNavigation();

  // Ocultar navegación cuando montamos este layout
  useEffect(() => {
    setShowNav(false);
    
    // Restaurar navegación cuando desmontamos
    return () => {
      setShowNav(true);
    };
  }, [setShowNav]);

  return <>{children}</>;
}

