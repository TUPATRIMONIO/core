'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface NavigationContextType {
  showNav: boolean;
  setShowNav: (show: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  showNav: true,
  setShowNav: () => {},
});

export function useNavigation() {
  return useContext(NavigationContext);
}

interface NavigationProviderProps {
  children: React.ReactNode;
  defaultShowNav?: boolean;
}

export function NavigationProvider({ 
  children, 
  defaultShowNav = true 
}: NavigationProviderProps) {
  const [showNav, setShowNav] = useState(defaultShowNav);

  const handleSetShowNav = useCallback((show: boolean) => {
    setShowNav(show);
  }, []);

  return (
    <NavigationContext.Provider value={{ showNav, setShowNav: handleSetShowNav }}>
      {children}
    </NavigationContext.Provider>
  );
}

