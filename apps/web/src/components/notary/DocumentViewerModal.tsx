'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Download, ExternalLink, FileText, AlertCircle } from 'lucide-react'
import { PDFCanvasViewer } from '@/components/shared/PDFCanvasViewer'

interface DocumentViewerModalProps {
  documentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DocumentInfo {
  documentId: string
  title: string
  bucket: string
  path: string
  signedUrl: string
}

/**
 * Modal para visualizar documentos PDF del dashboard notarial
 * Muestra el PDF usando PDFCanvasViewer para compatibilidad mobile
 */
export function DocumentViewerModal({
  documentId,
  open,
  onOpenChange,
}: DocumentViewerModalProps) {
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar información del documento cuando se abre el modal
  useEffect(() => {
    if (!open || !documentId) {
      setDocumentInfo(null)
      setError(null)
      return
    }

    const fetchDocumentInfo = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/notary/document-info?documentId=${documentId}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Error ${response.status}`)
        }

        const data = await response.json()
        setDocumentInfo(data)
      } catch (error: any) {
        console.error('Error fetching document info:', error)
        setError(error.message || 'Error al cargar información del documento')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocumentInfo()
  }, [documentId, open])

  const handleDownload = async () => {
    if (!documentInfo?.signedUrl) return

    try {
      // Descargar archivo como blob para forzar descarga (no abrir en navegador)
      const response = await fetch(documentInfo.signedUrl)
      if (!response.ok) {
        throw new Error('No se pudo descargar el archivo')
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${documentInfo.title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Liberar el objeto URL después de un momento
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const handleOpenNewTab = () => {
    if (documentInfo?.signedUrl) {
      window.open(documentInfo.signedUrl, '_blank', 'noopener,noreferrer,nofollow')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-[95vw] sm:!w-[85vw] sm:!max-w-[85vw] md:!w-[80vw] md:!max-w-[80vw] lg:!max-w-[1600px] h-[85vh] sm:h-[90vh] flex flex-col p-0">
        {/* Header compacto con botones integrados */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b">
          <div className="min-w-0 flex-1 mr-4">
            <DialogTitle className="truncate text-base">
              {documentInfo?.title || 'Visualizar Documento'}
            </DialogTitle>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isLoading || !!error}
              className="h-8 px-2 sm:px-3"
            >
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Descargar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenNewTab}
              disabled={isLoading || !!error}
              className="h-8 px-2 sm:px-3"
            >
              <ExternalLink className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Abrir en nueva pestaña</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Cargando documento...</p>
              </div>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : documentInfo?.signedUrl ? (
            /* Visor PDF */
            <div className="flex-1 overflow-hidden bg-muted/20">
              <PDFCanvasViewer 
                url={documentInfo.signedUrl} 
                title={documentInfo.title}
                className="h-full border-0 rounded-none"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
              <div className="text-center space-y-3">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  No hay documento disponible para visualizar
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
