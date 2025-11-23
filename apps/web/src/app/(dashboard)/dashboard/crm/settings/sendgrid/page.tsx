'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react';

interface SendGridAccount {
  id: string;
  from_email: string;
  from_name: string;
  is_active: boolean;
  verified_at: string | null;
  has_api_key: boolean;
}

export default function SendGridSettingsPage() {
  const [account, setAccount] = useState<SendGridAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    api_key: '',
    from_email: '',
    from_name: '',
  });

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    try {
      const response = await fetch('/api/communications/sendgrid/account');
      const data = await response.json();

      if (data.data) {
        setAccount(data.data);
        setFormData({
          api_key: '', // No mostrar API key por seguridad
          from_email: data.data.from_email || '',
          from_name: data.data.from_name || '',
        });
      }
    } catch (err: any) {
      setError('Error al cargar cuenta SendGrid');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!formData.api_key) {
      setError('Ingresa una API key para verificar');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/communications/sendgrid/account/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: formData.api_key }),
      });

      const data = await response.json();

      if (data.valid) {
        setSuccess('API key válida');
      } else {
        setError(data.message || 'API key inválida');
      }
    } catch (err: any) {
      setError('Error al verificar API key');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/communications/sendgrid/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess('Cuenta SendGrid configurada exitosamente');
        await loadAccount();
        setFormData((prev) => ({ ...prev, api_key: '' })); // Limpiar API key del formulario
      }
    } catch (err: any) {
      setError('Error al guardar cuenta SendGrid');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración SendGrid</h1>
        <p className="text-muted-foreground mt-2">
          Configura tu cuenta SendGrid para enviar emails masivos desde campañas
        </p>
      </div>

      {account && account.has_api_key && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Cuenta SendGrid configurada correctamente. Verificada el{' '}
            {account.verified_at
              ? new Date(account.verified_at).toLocaleDateString('es-CL')
              : 'recientemente'}
            .
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Cuenta SendGrid
          </CardTitle>
          <CardDescription>
            Configura tu API key de SendGrid. Cada organización debe tener su propia cuenta para
            proteger la reputación de dominio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key de SendGrid</Label>
              <div className="flex gap-2">
                <Input
                  id="api_key"
                  type="password"
                  placeholder="SG.xxxxxxxxxxxxxxxxxxxxx"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  required={!account?.has_api_key}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVerify}
                  disabled={verifying || !formData.api_key}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                La API key se guardará encriptada de forma segura. Si ya tienes una cuenta
                configurada, déjala en blanco para mantener la actual.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_email">Email Remitente</Label>
              <Input
                id="from_email"
                type="email"
                placeholder="noreply@tudominio.com"
                value={formData.from_email}
                onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Email desde el cual se enviarán las campañas. Debe estar verificado en SendGrid.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_name">Nombre Remitente</Label>
              <Input
                id="from_name"
                type="text"
                placeholder="Tu Empresa"
                value={formData.from_name}
                onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Nombre que aparecerá como remitente en los emails.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Configuración'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Cada organización tiene su propia cuenta SendGrid independiente para proteger la
            reputación de dominio.
          </p>
          <p>
            • Tu API key se almacena encriptada de forma segura y nunca se expone al frontend.
          </p>
          <p>
            • Puedes obtener tu API key desde{' '}
            <a
              href="https://app.sendgrid.com/settings/api_keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--tp-buttons)] hover:underline"
            >
              SendGrid Settings
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

