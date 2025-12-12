'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Loader2, 
  Link2, 
  Unlink,
  Users,
  Settings
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface GmailConfigClientProps {
  organizationId: string
  gmailAccount: {
    id: string
    email_address: string
    display_name: string | null
    is_active: boolean
    connected_at: string
    gmail_email_address: string | null
  } | null
  usersWithPermissions: Array<{
    id: string
    user_id: string
    can_send: boolean
    can_receive: boolean
    is_default: boolean
    user: {
      id: string
      email: string
      first_name: string | null
      last_name: string | null
    }
  }>
}

export function CrmGmailConfigClient({ 
  organizationId, 
  gmailAccount, 
  usersWithPermissions 
}: GmailConfigClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // Verificar mensajes de éxito/error en URL
  const success = searchParams.get('success')
  const error = searchParams.get('error')

  useEffect(() => {
    // Limpiar parámetros de URL después de mostrar el mensaje
    if (success || error) {
      const timer = setTimeout(() => {
        router.replace('/dashboard/crm/settings/gmail')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error, router])

  const handleConnect = () => {
    setLoading(true)
    window.location.href = '/api/crm/gmail/connect'
  }

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de que quieres desconectar la cuenta Gmail? Esto impedirá que los usuarios envíen emails desde esta cuenta.')) {
      return
    }

    setDisconnecting(true)
    try {
      const response = await fetch('/api/crm/gmail/disconnect', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al desconectar')
      }

      router.refresh()
    } catch (error: any) {
      alert('Error al desconectar: ' + error.message)
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mensajes de éxito/error */}
      {success === 'connected' && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Cuenta Gmail conectada exitosamente. Ahora puedes configurar permisos y firmas personales.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {error === 'missing_params' && 'Faltan parámetros en la respuesta de Google'}
            {error === 'invalid_state' && 'Estado inválido en la respuesta de Google'}
            {error === 'unauthorized' && 'No autorizado para conectar esta cuenta'}
            {error === 'forbidden_org' && 'No tienes permisos en esta organización'}
            {error === 'update_failed' && 'Error al actualizar la cuenta existente'}
            {error === 'create_failed' && 'Error al crear la cuenta'}
            {!['missing_params', 'invalid_state', 'unauthorized', 'forbidden_org', 'update_failed', 'create_failed'].includes(error) && 
              `Error: ${error}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Estado de Conexión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Estado de Conexión
          </CardTitle>
          <CardDescription>
            Cuenta compartida para comunicación 1:1 con clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {gmailAccount ? (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Conectado</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Activo
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground ml-7">
                    {gmailAccount.gmail_email_address || gmailAccount.email_address}
                  </p>
                  {gmailAccount.display_name && (
                    <p className="text-sm text-muted-foreground ml-7">
                      {gmailAccount.display_name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground ml-7">
                    Conectado el {new Date(gmailAccount.connected_at).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Desconectando...
                    </>
                  ) : (
                    <>
                      <Unlink className="mr-2 h-4 w-4" />
                      Desconectar
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="font-semibold">No conectado</span>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  No hay cuenta Gmail compartida configurada
                </p>
              </div>
              <Button
                onClick={handleConnect}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Conectar Gmail
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usuarios con Permisos */}
      {gmailAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios con Acceso
            </CardTitle>
            <CardDescription>
              Usuarios que pueden enviar emails desde esta cuenta compartida
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersWithPermissions.length > 0 ? (
              <div className="space-y-2">
                {usersWithPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {permission.user.first_name || ''} {permission.user.last_name || ''}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {permission.user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {permission.can_send && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Puede enviar
                        </Badge>
                      )}
                      {permission.is_default && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          Por defecto
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay usuarios con permisos configurados. Todos los miembros de la organización pueden usar esta cuenta por defecto.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Acciones Rápidas */}
      {gmailAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/crm/settings/gmail/signature">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Configurar mi firma personal
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

