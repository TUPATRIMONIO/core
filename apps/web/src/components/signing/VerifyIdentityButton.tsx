'use client';

// =====================================================
// Component: VerifyIdentityButton
// Description: Botón para iniciar verificación de identidad con Veriff
// =====================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import type { CreateVerificationSessionParams } from '@/types/identity-verification';
import { toast } from 'sonner';

interface VerifyIdentityButtonProps {
  params: Omit<CreateVerificationSessionParams, 'providerSlug'>;
  onVerificationStarted?: (sessionId: string, verificationUrl: string) => void;
  isVerified?: boolean;
  verifiedAt?: string | null;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function VerifyIdentityButton({
  params,
  onVerificationStarted,
  isVerified = false,
  verifiedAt,
  variant = 'default',
  size = 'default',
  disabled = false,
  className,
}: VerifyIdentityButtonProps) {
  const { createSession, loading } = useIdentityVerification();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleVerify = async () => {
    try {
      const response = await createSession({
        ...params,
        providerSlug: 'veriff',
      });

      if (!response) {
        toast.error('No se pudo crear la sesión de verificación');
        return;
      }

      // Callback opcional
      if (onVerificationStarted) {
        onVerificationStarted(response.sessionId, response.verificationUrl);
      }

      // Notificar al usuario
      toast.success('Redirigiendo a Veriff...');

      // Pequeña espera para que el usuario vea el mensaje
      setIsRedirecting(true);
      setTimeout(() => {
        // Redirigir a la URL de verificación
        window.location.href = response.verificationUrl;
      }, 500);
    } catch (error: any) {
      console.error('Error al iniciar verificación:', error);
      toast.error(error.message || 'Error al iniciar verificación');
      setIsRedirecting(false);
    }
  };

  // Si ya está verificado, mostrar badge
  if (isVerified) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Identidad Verificada
        {verifiedAt && (
          <span className="ml-1 text-xs opacity-75">
            {new Date(verifiedAt).toLocaleDateString()}
          </span>
        )}
      </Badge>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleVerify}
      disabled={disabled || loading || isRedirecting}
      className={className}
    >
      {loading || isRedirecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isRedirecting ? 'Redirigiendo...' : 'Creando sesión...'}
        </>
      ) : (
        <>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Verificar Identidad
        </>
      )}
    </Button>
  );
}
