'use client';

import { useState, useEffect } from 'react';
import { Cookie, Settings, BarChart, Megaphone, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { IconContainer } from '@tupatrimonio/ui';

interface CookiePreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookiePreferencesDialog({ open, onOpenChange }: CookiePreferencesDialogProps) {
  const { consent, savePreferences } = useCookieConsent();
  
  // Estado local para los switches
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Sincronizar con el consentimiento actual cuando se abre el diálogo
  useEffect(() => {
    if (open && consent) {
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
    }
  }, [open, consent]);

  const handleSave = () => {
    savePreferences({
      essential: true, // Siempre true
      analytics,
      marketing,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <IconContainer 
              icon={Cookie} 
              variant="solid-brand" 
              shape="rounded" 
              size="md"
            />
            <DialogTitle>Preferencias de Cookies</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Configura qué tipo de cookies quieres permitir. Las cookies esenciales son 
            necesarias para el funcionamiento del sitio y no se pueden desactivar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cookies Esenciales */}
          <div className="flex items-start justify-between gap-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-[var(--tp-buttons)]" />
                <Label className="text-base font-semibold text-foreground cursor-default">
                  Cookies Esenciales
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Necesarias para el funcionamiento básico del sitio. Incluyen autenticación, 
                seguridad y preferencias de navegación.
              </p>
            </div>
            <Switch 
              checked={true} 
              disabled 
              className="mt-1"
              aria-label="Cookies esenciales (siempre activas)"
            />
          </div>

          {/* Cookies de Analytics */}
          <div className="flex items-start justify-between gap-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-800">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BarChart className="w-4 h-4 text-[var(--tp-buttons)]" />
                <Label 
                  htmlFor="analytics-switch" 
                  className="text-base font-semibold text-foreground cursor-pointer"
                >
                  Cookies de Analytics
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Nos ayudan a entender cómo usas el sitio para mejorarlo. 
                Usamos Google Analytics con datos anónimos.
              </p>
            </div>
            <Switch 
              id="analytics-switch"
              checked={analytics}
              onCheckedChange={setAnalytics}
              className="mt-1"
              aria-label="Activar cookies de analytics"
            />
          </div>

          {/* Cookies de Marketing (Futuro) */}
          <div className="flex items-start justify-between gap-4 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border-2 border-purple-200 dark:border-purple-800 opacity-60">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="w-4 h-4 text-[var(--tp-buttons)]" />
                <Label 
                  htmlFor="marketing-switch" 
                  className="text-base font-semibold text-foreground cursor-pointer"
                >
                  Cookies de Marketing
                </Label>
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded">
                  Próximamente
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Para mostrarte contenido y anuncios relevantes. 
                Actualmente no usamos este tipo de cookies.
              </p>
            </div>
            <Switch 
              id="marketing-switch"
              checked={marketing}
              onCheckedChange={setMarketing}
              disabled
              className="mt-1"
              aria-label="Cookies de marketing (próximamente)"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
          >
            <Shield className="w-4 h-4 mr-2" />
            Guardar Preferencias
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

