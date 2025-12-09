'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, CheckCircle2, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SignatureEditorProps {
  organizationId: string
}

export function SignatureEditor({ organizationId }: SignatureEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signatureHtml, setSignatureHtml] = useState('')
  const [signatureText, setSignatureText] = useState('')
  const [success, setSuccess] = useState(false)

  // Cargar firma existente
  useEffect(() => {
    const loadSignature = async () => {
      try {
        const response = await fetch('/api/admin/gmail/signature')
        const data = await response.json()

        if (response.ok) {
          setSignatureHtml(data.signature_html || '')
          setSignatureText(data.signature_text || '')
        }
      } catch (error) {
        console.error('Error cargando firma:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSignature()
  }, [])

  // Generar texto plano automáticamente desde HTML
  useEffect(() => {
    if (signatureHtml) {
      // Convertir HTML a texto plano básico
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = signatureHtml
      const text = tempDiv.textContent || tempDiv.innerText || ''
      setSignatureText(text.trim())
    } else {
      setSignatureText('')
    }
  }, [signatureHtml])

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)

    try {
      const response = await fetch('/api/admin/gmail/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature_html: signatureHtml,
          signature_text: signatureText,
          is_default: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar la firma')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      alert('Error al guardar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mensaje de éxito */}
      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Firma guardada exitosamente. Se usará en todos los emails que envíes desde la cuenta compartida.
          </AlertDescription>
        </Alert>
      )}

      {/* Editor de Firma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Editor de Firma
          </CardTitle>
          <CardDescription>
            Tu firma se agregará automáticamente al final de cada email que envíes desde contacto@tupatrimonio.app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Editor HTML */}
          <div className="space-y-2">
            <Label htmlFor="signatureHtml">Firma HTML</Label>
            <Textarea
              id="signatureHtml"
              placeholder="<p>Saludos,<br><strong>Tu Nombre</strong><br>TuPatrimonio</p>"
              value={signatureHtml}
              onChange={(e) => setSignatureHtml(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Puedes usar HTML básico: &lt;p&gt;, &lt;br&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, etc.
            </p>
          </div>

          {/* Vista Previa */}
          <div className="space-y-2">
            <Label>Vista Previa</Label>
            <div className="border rounded-lg p-4 bg-muted/50 min-h-[100px]">
              {signatureHtml ? (
                <div
                  dangerouslySetInnerHTML={{ __html: signatureHtml }}
                  className="prose prose-sm max-w-none"
                />
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  Tu firma aparecerá aquí...
                </p>
              )}
            </div>
          </div>

          {/* Texto Plano (generado automáticamente) */}
          <div className="space-y-2">
            <Label htmlFor="signatureText">Texto Plano (generado automáticamente)</Label>
            <Textarea
              id="signatureText"
              value={signatureText}
              onChange={(e) => setSignatureText(e.target.value)}
              rows={4}
              className="font-mono text-sm"
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              Este texto se usa para emails sin formato HTML. Se genera automáticamente desde el HTML.
            </p>
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Firma
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ejemplo de Firma */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ejemplo de Firma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Ejemplo de una firma profesional:</p>
            <div className="border rounded-lg p-4 bg-muted/50">
              <div
                dangerouslySetInnerHTML={{
                  __html: `
                    <p>
                      Saludos cordiales,<br>
                      <strong>Tu Nombre</strong><br>
                      <em>Cargo o Departamento</em><br>
                      <a href="mailto:tu@tupatrimonio.app">tu@tupatrimonio.app</a> | 
                      <a href="tel:+56912345678">+56 9 1234 5678</a><br>
                      <a href="https://tupatrimonio.app">tupatrimonio.app</a>
                    </p>
                  `,
                }}
                className="prose prose-sm max-w-none"
              />
            </div>
            <p className="text-xs mt-2">
              Puedes copiar este ejemplo y modificarlo según tus necesidades.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

