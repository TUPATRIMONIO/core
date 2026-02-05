'use client';

// =====================================================
// Page: Test Identity Verification
// Description: Página de prueba para verificación de identidad
// =====================================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VerifyIdentityButton } from '@/components/signing/VerifyIdentityButton';
import { VerificationStatusCard } from '@/components/signing/VerificationStatusCard';
import { useOrganization } from '@/hooks/useOrganization';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import type { VerificationPurpose } from '@/types/identity-verification';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { SyncVerificationsButton } from '@/components/admin/SyncVerificationsButton';

export default function TestVerificationPage() {
  const { activeOrganization, isLoading: orgLoading } = useOrganization();
  const { findPreviousVerifications, loading } = useIdentityVerification();

  // Formulario (hooks SIEMPRE al inicio)
  const [rut, setRut] = useState('12345678-9');
  const [email, setEmail] = useState('usuario@ejemplo.com');
  const [name, setName] = useState('Juan Pérez');
  const [phone, setPhone] = useState('+56912345678');
  const [purpose, setPurpose] = useState<VerificationPurpose>('fes_signing');

  // Estado
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [previousVerifications, setPreviousVerifications] = useState<any[]>([]);

  // Esperar a que cargue la organización
  if (orgLoading || !activeOrganization) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando organización...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleVerificationStarted = (sessionId: string, verificationUrl: string) => {
    console.log('Sesión creada:', sessionId);
    console.log('URL:', verificationUrl);
    setSessionId(sessionId);
    toast.success('Sesión creada. Serás redirigido...');
  };

  const handleFindPrevious = async () => {
    const results = await findPreviousVerifications(
      activeOrganization.id,
      rut,
      email,
      true
    );
    setPreviousVerifications(results);
    toast.success(`Encontradas ${results.length} verificaciones`);
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prueba de Verificación de Identidad</h1>
          <p className="text-muted-foreground">
            Esta página te permite probar el sistema de verificación con Veriff
          </p>
        </div>
        <SyncVerificationsButton />
      </div>

      <Separator />

      {/* Formulario de Prueba */}
      <Card>
        <CardHeader>
          <CardTitle>Crear Nueva Verificación</CardTitle>
          <CardDescription>
            Completa los datos y presiona el botón para iniciar una verificación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rut">RUT / DNI</Label>
              <Input
                id="rut"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="12345678-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56912345678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Propósito</Label>
            <Select value={purpose} onValueChange={(v) => setPurpose(v as VerificationPurpose)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fes_signing">FES - Firma Electrónica Simple</SelectItem>
                <SelectItem value="fea_signing">FEA - Firma Electrónica Avanzada</SelectItem>
                <SelectItem value="kyc_onboarding">KYC - Onboarding</SelectItem>
                <SelectItem value="document_notary">Servicios Notariales</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex gap-4">
            <VerifyIdentityButton
              params={{
                organizationId: activeOrganization.id,
                purpose,
                subjectIdentifier: rut,
                subjectEmail: email,
                subjectName: name,
                subjectPhone: phone,
                metadata: {
                  test: true,
                  source: 'test_page',
                },
              }}
              onVerificationStarted={handleVerificationStarted}
              variant="default"
              size="lg"
              className="flex-1"
            />

            <Button variant="outline" onClick={handleFindPrevious} disabled={loading}>
              Buscar Previas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estado de Verificación Actual */}
      {sessionId && (
        <VerificationStatusCard
          sessionId={sessionId}
          autoRefresh={true}
          refreshInterval={5000}
          onStatusChange={(status) => {
            console.log('Estado cambió a:', status);
            if (status === 'approved') {
              toast.success('¡Verificación aprobada!');
            } else if (status === 'declined') {
              toast.error('Verificación rechazada');
            }
          }}
        />
      )}

      {/* Verificaciones Previas */}
      {previousVerifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verificaciones Previas</CardTitle>
            <CardDescription>
              Encontramos {previousVerifications.length} verificación(es) anterior(es)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {previousVerifications.map((prev) => (
                <div
                  key={prev.session_id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{prev.provider_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(prev.verified_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {prev.purpose.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">{prev.status}</p>
                    {prev.risk_score && (
                      <p className="text-xs text-muted-foreground">
                        Riesgo: {prev.risk_score.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle>Cómo funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-2">
            <li>Completa los datos del formulario arriba</li>
            <li>Presiona "Verificar Identidad"</li>
            <li>Serás redirigido a Veriff para completar la verificación</li>
            <li>Sigue las instrucciones en Veriff (foto del documento + selfie)</li>
            <li>Una vez completado, regresa a esta página</li>
            <li>El sistema procesará automáticamente los resultados via webhook</li>
          </ol>

          <Separator className="my-4" />

          <div className="rounded-md bg-blue-50 p-4">
            <p className="font-medium text-blue-900 mb-2">💡 Nota para desarrollo:</p>
            <ul className="text-blue-800 space-y-1 text-xs">
              <li>• Los webhooks procesarán los resultados automáticamente</li>
              <li>• Toda la evidencia se guarda en Storage para auditorías</li>
              <li>• Las verificaciones se pueden reutilizar para múltiples firmas</li>
              <li>• El sistema detecta verificaciones previas automáticamente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
