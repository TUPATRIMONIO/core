/**
 * Email Connection Wizard
 * Wizard inteligente que detecta si usar OAuth o IMAP/SMTP según el email
 * @tupatrimonio.* → OAuth
 * Otros dominios → IMAP/SMTP con App Password
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Loader2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { detectProvider, getProviderConfig } from '@/lib/email/providers';

interface WizardProps {
  accountType: 'shared' | 'personal';
  onSuccess: () => void;
  onCancel: () => void;
}

type Step = 'email' | 'credentials' | 'validating';

export function EmailConnectionWizard({ accountType, onSuccess, onCancel }: WizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [connectionMethod, setConnectionMethod] = useState<'oauth' | 'imap'>('oauth');
  const [provider, setProvider] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleEmailSubmit = () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Ingresa un email válido',
        variant: 'destructive'
      });
      return;
    }

    // Detectar si es cuenta @tupatrimonio
    const domain = email.split('@')[1]?.toLowerCase();
    const isTuPatrimonio = domain === 'tupatrimonio.cl' || 
                          domain === 'tupatrimonio.app' || 
                          domain === 'tupatrimonio.io';

    if (isTuPatrimonio) {
      // Usar OAuth
      setConnectionMethod('oauth');
      initiateOAuth();
    } else {
      // Usar IMAP/SMTP
      setConnectionMethod('imap');
      const detectedProvider = detectProvider(email);
      setProvider(detectedProvider);
      setStep('credentials');
    }
  };

  const initiateOAuth = async () => {
    try {
      const response = await fetch(
        `/api/crm/email-accounts/connect?account_type=${accountType}&display_name=${encodeURIComponent(displayName || email)}`
      );
      
      if (!response.ok) throw new Error('Failed to get auth URL');

      const { auth_url } = await response.json();
      window.location.href = auth_url;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo iniciar OAuth',
        variant: 'destructive'
      });
    }
  };

  const handleIMAPSubmit = async () => {
    if (!password) {
      toast({
        title: 'Contraseña requerida',
        description: 'Ingresa la contraseña de aplicación',
        variant: 'destructive'
      });
      return;
    }

    setIsValidating(true);
    setStep('validating');

    try {
      const response = await fetch('/api/crm/email-accounts/connect-imap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          account_type: accountType,
          display_name: displayName || email,
          provider
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Connection failed');
      }

      toast({
        title: 'Cuenta conectada',
        description: `${email} se conectó exitosamente vía IMAP/SMTP`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error connecting IMAP:', error);
      toast({
        title: 'Error al conectar',
        description: error instanceof Error ? error.message : 'Verifica tus credenciales',
        variant: 'destructive'
      });
      setStep('credentials');
    } finally {
      setIsValidating(false);
    }
  };

  const providerConfig = provider ? getProviderConfig(provider) : null;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Conectar Cuenta de Email
          {accountType === 'shared' ? ' Compartida' : ' Personal'}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Paso 1: Email */}
        {step === 'email' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Dirección de Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@tupatrimonio.app"
                autoFocus
              />
            </div>

            {accountType === 'shared' && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre para Mostrar (opcional)</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej: Soporte TuPatrimonio"
                />
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Cuentas @tupatrimonio.*</strong> usan OAuth (más seguro).
                <br />
                <strong>Otras cuentas</strong> usan IMAP/SMTP con App Password.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Paso 2: Credenciales IMAP */}
        {step === 'credentials' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {email}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {providerConfig?.name || 'Email personalizado'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('email')}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Cambiar
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña de Aplicación *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                autoFocus
              />
            </div>

            {providerConfig?.appPasswordUrl && (
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription className="flex flex-col gap-2">
                  <p>{providerConfig.instructions}</p>
                  <a
                    href={providerConfig.appPasswordUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Generar contraseña de aplicación
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Paso 3: Validando */}
        {step === 'validating' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
            <div>
              <p className="font-medium text-lg">Validando conexión...</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Probando IMAP y SMTP
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isValidating}>
          Cancelar
        </Button>

        {step === 'email' && (
          <Button onClick={handleEmailSubmit}>
            Continuar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {step === 'credentials' && (
          <Button onClick={handleIMAPSubmit} disabled={!password}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Conectar Cuenta
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

