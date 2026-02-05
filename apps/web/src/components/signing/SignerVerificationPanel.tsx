'use client';

// =====================================================
// Component: SignerVerificationPanel
// Description: Panel para gestionar verificación de identidad de un firmante
// =====================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { VerifyIdentityButton } from './VerifyIdentityButton';
import { VerificationStatusCard } from './VerificationStatusCard';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import type { VerificationPurpose } from '@/types/identity-verification';

interface Signer {
  id: string;
  email: string;
  full_name: string;
  rut?: string;
  phone?: string;
  identity_verification_id?: string;
  identity_verified_at?: string;
  identity_verification_score?: number;
}

interface SignerVerificationPanelProps {
  signer: Signer;
  organizationId: string;
  documentId: string;
  purpose: VerificationPurpose;
  requireVerification?: boolean;
  onVerificationComplete?: (sessionId: string) => void;
}

export function SignerVerificationPanel({
  signer,
  organizationId,
  documentId,
  purpose,
  requireVerification = false,
  onVerificationComplete,
}: SignerVerificationPanelProps) {
  const { isSessionValid, findPreviousVerifications } = useIdentityVerification();
  const [hasValidVerification, setHasValidVerification] = useState(false);
  const [previousVerifications, setPreviousVerifications] = useState<any[]>([]);
  const [showVerification, setShowVerification] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    signer.identity_verification_id || null
  );

  useEffect(() => {
    checkVerification();
    loadPreviousVerifications();
  }, [signer.id]);

  const checkVerification = async () => {
    if (signer.identity_verification_id) {
      const isValid = await isSessionValid(signer.identity_verification_id);
      setHasValidVerification(isValid);
    }
  };

  const loadPreviousVerifications = async () => {
    const previous = await findPreviousVerifications(
      organizationId,
      signer.rut,
      signer.email,
      true
    );
    setPreviousVerifications(previous);
  };

  const handleVerificationStarted = (sessionId: string, verificationUrl: string) => {
    setCurrentSessionId(sessionId);
    setShowVerification(true);
  };

  const handleStatusChange = async (status: string) => {
    if (status === 'approved') {
      setHasValidVerification(true);
      if (onVerificationComplete && currentSessionId) {
        onVerificationComplete(currentSessionId);
      }
    }
  };

  // Si ya tiene verificación válida
  if (hasValidVerification && signer.identity_verification_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verificación de Identidad</CardTitle>
          <CardDescription>
            Este firmante ya tiene su identidad verificada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VerifyIdentityButton
            params={{
              organizationId,
              purpose,
              subjectIdentifier: signer.rut || '',
              subjectEmail: signer.email,
              subjectName: signer.full_name,
              subjectPhone: signer.phone,
              referenceType: 'signing_document',
              referenceId: documentId,
            }}
            isVerified={true}
            verifiedAt={signer.identity_verified_at}
          />

          {signer.identity_verification_score !== null && (
            <div className="mt-4 text-sm text-muted-foreground">
              Score de riesgo: {signer.identity_verification_score.toFixed(1)}%
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Si hay verificaciones previas aprobadas
  if (previousVerifications.length > 0 && !showVerification) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verificación de Identidad</CardTitle>
          <CardDescription>
            Encontramos verificaciones previas de este usuario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Este usuario tiene {previousVerifications.length} verificación(es) previa(s) aprobada(s).
              Puedes usar una existente o crear una nueva.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            {previousVerifications.slice(0, 3).map((prev) => (
              <div
                key={prev.session_id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{prev.provider_name}</p>
                  <p className="text-muted-foreground">
                    {new Date(prev.verified_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className="text-primary hover:underline"
                  onClick={() => {
                    setCurrentSessionId(prev.session_id);
                    setShowVerification(true);
                  }}
                >
                  Ver detalles
                </button>
              </div>
            ))}
          </div>

          <VerifyIdentityButton
            params={{
              organizationId,
              purpose,
              subjectIdentifier: signer.rut || '',
              subjectEmail: signer.email,
              subjectName: signer.full_name,
              subjectPhone: signer.phone,
              referenceType: 'signing_document',
              referenceId: documentId,
            }}
            onVerificationStarted={handleVerificationStarted}
            variant="outline"
          />
        </CardContent>
      </Card>
    );
  }

  // Si está mostrando el estado de verificación actual
  if (showVerification && currentSessionId) {
    return (
      <VerificationStatusCard
        sessionId={currentSessionId}
        autoRefresh={true}
        refreshInterval={5000}
        onStatusChange={handleStatusChange}
      />
    );
  }

  // Caso por defecto: iniciar nueva verificación
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Verificación de Identidad</CardTitle>
        <CardDescription>
          {requireVerification
            ? 'Este documento requiere verificación de identidad para firmar'
            : 'Verifica tu identidad para mayor seguridad'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requireVerification && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Para firmar este documento necesitas verificar tu identidad con biometría facial.
              El proceso toma menos de 2 minutos.
            </AlertDescription>
          </Alert>
        )}

        <VerifyIdentityButton
          params={{
            organizationId,
            purpose,
            subjectIdentifier: signer.rut || '',
            subjectEmail: signer.email,
            subjectName: signer.full_name,
            subjectPhone: signer.phone,
            referenceType: 'signing_document',
            referenceId: documentId,
          }}
          onVerificationStarted={handleVerificationStarted}
        />

        <p className="text-xs text-muted-foreground">
          Al verificar tu identidad, aceptas compartir tu información con el proveedor de
          verificación (Veriff). Toda la información se maneja de forma segura y confidencial.
        </p>
      </CardContent>
    </Card>
  );
}
