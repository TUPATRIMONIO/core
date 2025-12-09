'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface TestEmailFormProps {
  organizationId: string
}

export function TestEmailForm({ organizationId }: TestEmailFormProps) {
  const [provider, setProvider] = useState<'gmail' | 'sendgrid'>('sendgrid')
  const [toEmail, setToEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [includeSignature, setIncludeSignature] = useState(true)
  const [loading, setLoading] = useState(false)
  const [hasSendGridAccount, setHasSendGridAccount] = useState<boolean | null>(null)
  const [hasGmailAccount, setHasGmailAccount] = useState<boolean | null>(null)
  const [checkingAccount, setCheckingAccount] = useState(true)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    emailId?: string
    messageId?: string
  } | null>(null)

  // Verificar si hay cuentas configuradas
  useEffect(() => {
    const checkAccounts = async () => {
      try {
        // Verificar SendGrid
        const sendGridResponse = await fetch('/api/communications/sendgrid/account')
        const sendGridData = await sendGridResponse.json()
        setHasSendGridAccount(!!sendGridData.data)

        // Verificar Gmail (buscar cuenta compartida)
        const gmailResponse = await fetch(`/api/admin/gmail/status?organizationId=${organizationId}`)
        if (gmailResponse.ok) {
          const gmailData = await gmailResponse.json()
          setHasGmailAccount(gmailData.connected)
        } else {
          setHasGmailAccount(false)
        }
      } catch (error) {
        console.error('Error verificando cuentas:', error)
        setHasSendGridAccount(false)
        setHasGmailAccount(false)
      } finally {
        setCheckingAccount(false)
      }
    }

    checkAccounts()
  }, [organizationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/communications/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          toEmail,
          subject,
          bodyHtml,
          bodyText: bodyHtml.replace(/<[^>]*>/g, ''), // Extraer texto plano del HTML
          provider,
          includeSignature,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el email')
      }

      setResult({
        success: true,
        message: 'Email enviado exitosamente',
        emailId: data.email_id,
        messageId: data.message_id,
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Error desconocido al enviar el email',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Formulario de Prueba
          </CardTitle>
          <CardDescription>
            Completa el formulario para probar el envío de emails. Puedes usar Gmail o SendGrid como proveedor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selector de Proveedor */}
            <div className="space-y-2">
              <Label htmlFor="provider">Proveedor de Email</Label>
              <Select value={provider} onValueChange={(value: 'gmail' | 'sendgrid') => setProvider(value)}>
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sendgrid">SendGrid (Templates Transaccionales)</SelectItem>
                  <SelectItem value="gmail">Gmail (Emails 1:1)</SelectItem>
                </SelectContent>
              </Select>
              {provider === 'sendgrid' && (
                <div className="space-y-2">
                  {checkingAccount ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Verificando cuenta SendGrid...
                    </p>
                  ) : hasSendGridAccount ? (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Cuenta SendGrid configurada correctamente
                    </p>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No tienes una cuenta SendGrid configurada. Por favor, configura una cuenta SendGrid antes de enviar emails.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              {provider === 'gmail' && (
                <div className="space-y-2">
                  {checkingAccount ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Verificando cuenta Gmail...
                    </p>
                  ) : hasGmailAccount ? (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Cuenta Gmail compartida configurada correctamente
                    </p>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No hay cuenta Gmail compartida configurada. 
                        <a href="/admin/communications/gmail" className="underline ml-1">
                          Configura la cuenta Gmail compartida
                        </a>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              {provider === 'gmail' && (
                <p className="text-sm text-muted-foreground">
                  Necesitas un access token de Gmail OAuth2. Puedes obtenerlo desde la configuración de Gmail.
                </p>
              )}
            </div>

            {/* Checkbox para incluir firma (solo si es Gmail) */}
            {provider === 'gmail' && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeSignature"
                    checked={includeSignature}
                    onChange={(e) => setIncludeSignature(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="includeSignature" className="cursor-pointer">
                    Incluir mi firma personal
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Si está marcado, se agregará automáticamente tu firma personal al final del email.
                </p>
              </div>
            )}

            {/* Email Destinatario */}
            <div className="space-y-2">
              <Label htmlFor="toEmail">Email Destinatario</Label>
              <Input
                id="toEmail"
                type="email"
                placeholder="destinatario@ejemplo.com"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                required
              />
            </div>

            {/* Asunto */}
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                type="text"
                placeholder="Asunto del email"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Cuerpo HTML */}
            <div className="space-y-2">
              <Label htmlFor="bodyHtml">Cuerpo del Email (HTML)</Label>
              <Textarea
                id="bodyHtml"
                placeholder="<h1>Hola</h1><p>Este es un email de prueba.</p>"
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={10}
                required
              />
              <p className="text-xs text-muted-foreground">
                Puedes usar HTML básico. El texto plano se generará automáticamente.
              </p>
            </div>

            {/* Botón de Envío */}
            <Button 
              type="submit" 
              disabled={loading || (provider === 'sendgrid' && !hasSendGridAccount) || (provider === 'gmail' && !hasGmailAccount)} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email de Prueba
                </>
              )}
            </Button>
            {provider === 'sendgrid' && !hasSendGridAccount && !checkingAccount && (
              <p className="text-sm text-muted-foreground text-center">
                Configura una cuenta SendGrid para habilitar el envío
              </p>
            )}
            {provider === 'gmail' && !hasGmailAccount && !checkingAccount && (
              <p className="text-sm text-muted-foreground text-center">
                <a href="/admin/communications/gmail" className="underline">
                  Configura la cuenta Gmail compartida
                </a> para habilitar el envío
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Resultado */}
      {result && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">{result.message}</p>
              {result.success && (
                <div className="text-sm space-y-1 mt-2">
                  {result.emailId && (
                    <p>
                      <strong>ID del Email:</strong> <code className="text-xs">{result.emailId}</code>
                    </p>
                  )}
                  {result.messageId && (
                    <p>
                      <strong>ID del Mensaje:</strong> <code className="text-xs">{result.messageId}</code>
                    </p>
                  )}
                  <p className="text-muted-foreground mt-2">
                    El email se ha registrado en el historial. Puedes verificar en la base de datos o en tu bandeja de entrada.
                  </p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Información Adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>SendGrid:</strong>
            <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-muted-foreground">
              <li>Requiere tener una cuenta SendGrid configurada para tu organización</li>
              <li>Ideal para emails transaccionales y templates</li>
              <li>El email se envía desde la cuenta configurada en SendGrid</li>
            </ul>
          </div>
          <div>
            <strong>Gmail:</strong>
            <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-muted-foreground">
              <li>Requiere un access token de OAuth2 válido</li>
              <li>Ideal para emails personales 1:1</li>
              <li>El email se envía desde tu cuenta de Gmail</li>
              <li>El token debe tener permisos de gmail.send</li>
            </ul>
          </div>
          <div className="pt-2 border-t">
            <strong>Historial:</strong>
            <p className="text-muted-foreground mt-1">
              Todos los emails enviados se registran en la tabla <code className="text-xs">communications.email_history</code> con su estado y metadata.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

