"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * FloatingActions - Botón flotante para cambiar tema
 * 
 * Características:
 * - Botón de cambio de tema (Light, Dark, System)
 * - Posición fixed en esquina inferior derecha
 * - Responsive: más pequeño en mobile
 * - Animaciones suaves de hover y transiciones
 * - z-index alto para estar sobre todo contenido
 */
export function FloatingActions() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Evitar hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-3">
      {/* Botón de Tema */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full bg-card border-border shadow-tp-lg hover:shadow-tp-xl hover:scale-105 transition-all duration-200"
            aria-label="Cambiar tema"
          >
            {theme === "light" && <Sun className="h-5 w-5 text-[var(--tp-brand)]" />}
            {theme === "dark" && <Moon className="h-5 w-5 text-[var(--tp-brand)]" />}
            {theme === "system" && <Monitor className="h-5 w-5 text-[var(--tp-brand)]" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="bg-popover border-border"
        >
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            className="cursor-pointer"
          >
            <Sun className="mr-2 h-4 w-4" />
            <span>Claro</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("dark")}
            className="cursor-pointer"
          >
            <Moon className="mr-2 h-4 w-4" />
            <span>Oscuro</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("system")}
            className="cursor-pointer"
          >
            <Monitor className="mr-2 h-4 w-4" />
            <span>Sistema</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Botón de WhatsApp */}
      <a
        href="https://wa.me/56949166719?text=Hola,%20quiero%20información"
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-tp-lg hover:shadow-tp-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
        aria-label="Contactar por WhatsApp"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  );
}

