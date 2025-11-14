/**
 * Configuración de Gmail CRM
 * Conectar cuenta de Gmail para envío de emails
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GmailSettingsPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkGmailConnection();
    
    // Mostrar toast según resultado del callback
    const gmailStatus = searchParams.get('gmail');
    const email = searchParams.get('email');
    
    if (gmailStatus === 'connected' && email) {
      // Actualizar estado inmediatamente
      setIsConnected(true);
      setConnectedEmail(email);
      
      toast({
        title: 'Gmail conectado',
        description: `Tu cuenta ${email} ha sido vinculada exitosamente`,
      });
      
      // Limpiar URL params
      window.history.replaceState({}, '', '/dashboard/crm/settings/gmail');
    } else if (gmailStatus === 'error') {
      toast({
        title: 'Error',
        description: 'No se pudo conectar Gmail. Intenta nuevamente.',
        variant: 'destructive',
      });
      
      // Limpiar URL params
      window.history.replaceState({}, '', '/dashboard/crm/settings/gmail');
    }
  }, [searchParams, toast]);

  async function checkGmailConnection() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/crm/settings/gmail/status');
      
      if (!response.ok) {
        throw new Error('Failed to check Gmail status');
      }

      const { isConnected: connected, email } = await response.json();
      
      setIsConnected(connected);
      setConnectedEmail(email);
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
      setIsConnected(false);
      setConnectedEmail(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function connectGmail() {
    try {
      // Obtener organization_id del usuario actual
      const response = await fetch('/api/crm/settings/gmail/authorize');
      
      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }

      const { auth_url } = await response.json();
      
      // Redirigir a Google OAuth
      window.location.href = auth_url;
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la conexión con Gmail',
        variant: 'destructive',
      });
    }
  }

  async function disconnectGmail() {
    try {
      const response = await fetch('/api/crm/settings/gmail/disconnect', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect Gmail');
      }

      setIsConnected(false);
      setConnectedEmail(null);

      toast({
        title: 'Gmail desconectado',
        description: 'Tu cuenta de Gmail ha sido desvinculada',
      });
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast({
        title: 'Error',
        description: 'No se pudo desconectar Gmail',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Configuración de Gmail
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Conecta tu cuenta de Gmail para enviar emails desde el CRM
        </p>
      </div>

      {/* Instrucciones */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Antes de conectar Gmail:</strong> Asegúrate de haber configurado las credenciales OAuth 2.0 en Google Cloud Console y agregado las variables de entorno GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.
        </AlertDescription>
      </Alert>

      {/* Estado de Conexión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Estado de Conexión
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-500">Verificando conexión...</p>
          ) : isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Gmail Conectado
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Cuenta: {connectedEmail}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={disconnectGmail}
                className="w-full"
              >
                Desconectar Gmail
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <XCircle className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Gmail No Conectado
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Conecta tu cuenta para enviar emails desde el CRM
                  </p>
                </div>
              </div>

              <Button
                onClick={connectGmail}
                className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
              >
                <Mail className="w-4 h-4 mr-2" />
                Conectar con Gmail
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permisos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permisos Solicitados</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Enviar emails en tu nombre</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Leer emails del inbox</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Modificar labels y estado de emails</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Notas de Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seguridad y Privacidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p>
            ✅ Los tokens de Gmail se almacenan de forma segura en tu base de datos.
          </p>
          <p>
            ✅ Solo tu organización tiene acceso a tus emails.
          </p>
          <p>
            ✅ Puedes desconectar Gmail en cualquier momento.
          </p>
          <p className="text-orange-600 dark:text-orange-400 pt-2">
            ⚠️ Recomendación: En producción, encripta los tokens antes de almacenarlos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}







