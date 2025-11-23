"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

/**
 * ThemeProvider - Wrapper de next-themes para toda la aplicación
 * 
 * Configuración:
 * - attribute: "class" - Agrega clase .dark al <html>
 * - defaultTheme: "system" - Sigue preferencias del sistema operativo
 * - enableSystem: true - Detecta tema del OS automáticamente
 * - storageKey: "tupatrimonio-web-theme" - Clave para localStorage
 * - disableTransitionOnChange: false - Transiciones suaves al cambiar tema
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="tupatrimonio-web-theme"
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}



