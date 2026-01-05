'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { AlertCircle, Upload, MessageSquare, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface CorrectionViewProps {
  documentId: string
  onCorrectionUploaded?: () => void
}

export function CorrectionView({ documentId, onCorrectionUploaded }: CorrectionViewProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)

  useEffect(() => {
    loadMessages()
  }, [documentId])

  const loadMessages = async () => {
    setIsLoadingMessages(true)
    const { data } = await supabase
      .from('signing_document_messages')
      .select(`
        *,
        user:users(id, email, full_name)
      `)
      .eq('document_id', documentId)
      .eq('is_internal', false) // Solo mostrar mensajes visibles para el cliente
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
    }
    setIsLoadingMessages(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Solo se permiten archivos PDF')
        return
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('El archivo no debe superar los 50MB')
        return
      }
      setFile(selectedFile)
    }
  }

  const handleUploadCorrection = async () => {
    if (!file) {
      toast.error('Debes seleccionar un archivo PDF')
      return
    }

    setIsUploading(true)

    try {
      // Obtener documento para obtener org_id
      const { data: doc } = await supabase
        .from('signing_documents')
        .select('organization_id, original_file_path')
        .eq('id', documentId)
        .single()

      if (!doc) throw new Error('Documento no encontrado')

      // Obtener próxima versión
      const { data: latestVersion } = await supabase
        .from('signing_document_versions')
        .select('version_number')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextVersion = (latestVersion?.version_number ? Number(latestVersion.version_number) : 0) + 1
      const orgId = doc.organization_id
      const path = `${orgId}/${documentId}/v${nextVersion}/original.pdf`

      // Subir nuevo archivo
      const { error: uploadError } = await supabase.storage
        .from('docs-originals')
        .upload(path, file, { contentType: 'application/pdf', upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Crear nueva versión
      await supabase.from('signing_document_versions').insert({
        document_id: documentId,
        version_number: nextVersion,
        version_type: 'original',
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        created_by: user.id,
      })

      // Actualizar documento con nuevo archivo y cambiar estado a manual_review
      const { error: updateError } = await supabase
        .from('signing_documents')
        .update({
          original_file_path: path,
          original_file_name: file.name,
          original_file_size: file.size,
          status: 'manual_review', // Volver a revisión manual
        })
        .eq('id', documentId)

      if (updateError) throw new Error(updateError.message)

      toast.success('Documento corregido subido. Será revisado nuevamente por nuestro equipo.')
      setFile(null)
      
      if (onCorrectionUploaded) {
        onCorrectionUploaded()
      }
    } catch (error: any) {
      console.error('Error uploading correction:', error)
      toast.error(error.message || 'Error al subir corrección')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Correcciones Requeridas</AlertTitle>
        <AlertDescription>
          Nuestro equipo ha solicitado correcciones en tu documento. Por favor, revisa los comentarios y sube una versión corregida.
        </AlertDescription>
      </Alert>

      {/* Mensajes del equipo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentarios del Equipo
          </CardTitle>
          <CardDescription>
            Revisa los comentarios sobre qué necesita corregirse en tu documento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMessages ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Cargando mensajes...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay comentarios aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 rounded-lg bg-muted border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {msg.user?.full_name || msg.user?.email || 'Equipo TuPatrimonio'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subir corrección */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Documento Corregido
          </CardTitle>
          <CardDescription>
            Sube una nueva versión del documento con las correcciones solicitadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="correction-file">Archivo PDF</Label>
            <div className="flex items-center gap-4">
              <input
                id="correction-file"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="correction-file">
                <Button variant="outline" asChild>
                  <span>
                    <FileText className="h-4 w-4 mr-2" />
                    {file ? file.name : 'Seleccionar archivo'}
                  </span>
                </Button>
              </label>
              {file && (
                <Badge variant="secondary">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Solo archivos PDF. Tamaño máximo: 50MB
            </p>
          </div>

          <Button
            onClick={handleUploadCorrection}
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir Corrección
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

