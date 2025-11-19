/**
 * Página: Gestión de Cuentas de Email
 * Permite conectar y gestionar múltiples cuentas de Gmail (compartidas y personales)
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmailConnectionWizard } from '@/components/crm/EmailConnectionWizard';
import { 
  Mail, 
  Users, 
  User, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EmailAccount } from '@/types/crm';

export default function EmailAccountsPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardAccountType, setWizardAccountType] = useState<'shared' | 'personal'>('shared');

  useEffect(() => {
    loadAccounts();
    
    // Manejar callbacks de OAuth
    const status = searchParams.get('status');
    const email = searchParams.get('email');
    const type = searchParams.get('type');
    
    if (status === 'connected' && email) {
      toast({
        title: 'Cuenta conectada',
        description: `${email} (${type === 'personal' ? 'Personal' : 'Compartida'}) se conectó exitosamente`,
      });
      
      // Limpiar URL
      window.history.replaceState({}, '', '/dashboard/crm/settings/email-accounts');
      
      // Recargar cuentas
      loadAccounts();
    } else if (status === 'error') {
      toast({
        title: 'Error',
        description: 'No se pudo conectar la cuenta. Verifica las credenciales.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  async function loadAccounts() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/crm/email-accounts');
      
      if (!response.ok) {
        throw new Error('Failed to load accounts');
      }

      const { data } = await response.json();
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las cuentas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function openWizard(type: 'shared' | 'personal') {
    setWizardAccountType(type);
    setShowWizard(true);
  }

  function closeWizard() {
    setShowWizard(false);
    loadAccounts(); // Recargar cuentas después de conectar
  }

  async function disconnectAccount(accountId: string) {
    if (!confirm('¿Estás seguro de desconectar esta cuenta?')) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/email-accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'No se pudo desconectar la cuenta');
      }

      toast({
        title: 'Cuenta desconectada',
        description: 'La cuenta ha sido desvinculada exitosamente',
      });

      loadAccounts();
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo desconectar la cuenta',
        variant: 'destructive',
      });
    }
  }

  async function syncAccount(accountId: string) {
    try {
      setIsSyncing(true);
      const response = await fetch(`/api/crm/emails/sync?account_id=${accountId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sync failed');
      }

      const result = await response.json();

      toast({
        title: 'Sincronización completada',
        description: `${result.summary?.new_emails || 0} emails nuevos, ${result.summary?.updated_threads || 0} threads actualizados`,
      });

      loadAccounts();
    } catch (error) {
      console.error('Error syncing:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo sincronizar la cuenta',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }

  const sharedAccounts = accounts.filter(a => a.account_type === 'shared');
  const personalAccounts = accounts.filter(a => a.account_type === 'personal');

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Cuentas de Email
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona las cuentas de Gmail conectadas al CRM
        </p>
      </div>

      {/* Instrucciones */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Cuentas Compartidas:</strong> Varios usuarios pueden enviar/recibir emails desde la misma dirección.
          <br />
          <strong>Cuentas Personales:</strong> Solo tú puedes usar tu cuenta personal.
        </AlertDescription>
      </Alert>

      {/* Wizard de Conexión */}
      {showWizard ? (
        <EmailConnectionWizard
          accountType={wizardAccountType}
          onSuccess={closeWizard}
          onCancel={closeWizard}
        />
      ) : (
        <>
          {/* Botones de acción */}
          <div className="flex gap-3">
            <Button
              onClick={() => openWizard('shared')}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              <Users className="w-4 h-4 mr-2" />
              Conectar Cuenta Compartida
            </Button>
            
            <Button
              onClick={() => openWizard('personal')}
              variant="outline"
            >
              <User className="w-4 h-4 mr-2" />
              Conectar Mi Cuenta Personal
            </Button>
          </div>
        </>
      )}

      {isLoading ? (
        <p className="text-gray-500">Cargando cuentas...</p>
      ) : (
        <>
          {/* Cuentas Compartidas */}
          {sharedAccounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Cuentas Compartidas ({sharedAccounts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sharedAccounts.map(account => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          account.is_active ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <Mail className={`w-6 h-6 ${
                            account.is_active ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {account.display_name || account.email_address}
                            </p>
                            {account.is_default && (
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                Por defecto
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {account.email_address}
                          </p>
                          {account.last_sync_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              Última sincronización: {new Date(account.last_sync_at).toLocaleString('es-CL')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncAccount(account.id)}
                          disabled={isSyncing || !account.is_active}
                        >
                          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => disconnectAccount(account.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cuentas Personales */}
          {personalAccounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Mis Cuentas Personales ({personalAccounts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {personalAccounts.map(account => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg bg-blue-50 dark:bg-blue-950"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {account.display_name || account.email_address}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {account.email_address}
                          </p>
                          {account.last_sync_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              Última sincronización: {new Date(account.last_sync_at).toLocaleString('es-CL')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncAccount(account.id)}
                          disabled={isSyncing}
                        >
                          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => disconnectAccount(account.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estado vacío */}
          {accounts.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No hay cuentas conectadas
                </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Conecta una cuenta de email para empezar a enviar y recibir mensajes desde el CRM
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => openWizard('shared')}>
                  <Users className="w-4 h-4 mr-2" />
                  Conectar Cuenta Compartida
                </Button>
                <Button onClick={() => openWizard('personal')} variant="outline">
                  <User className="w-4 h-4 mr-2" />
                  Conectar Mi Cuenta
                </Button>
              </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Información */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cómo Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex gap-2">
            <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Cuentas Compartidas:</strong> Varios miembros del equipo pueden enviar y recibir emails desde la misma dirección (ej: contacto@tupatrimonio.app). Ideal para soporte, ventas, etc.
            </div>
          </div>
          
          <div className="flex gap-2">
            <User className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong>Cuentas Personales:</strong> Conecta tu propio Gmail para enviar emails desde tu dirección personal. Solo tú puedes usarla.
            </div>
          </div>

          <div className="flex gap-2">
            <RefreshCw className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <strong>Sincronización:</strong> Los emails se sincronizan automáticamente cada 5 minutos. También puedes forzar sincronización manual.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

