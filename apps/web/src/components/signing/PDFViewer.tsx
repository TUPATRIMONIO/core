'use client'

import { useState } from 'react'
import { useSignedUrl } from '@/hooks/useSignedUrl'
import { Button } from '@/components/ui/button'
import { Loader2, Download, ExternalLink, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface PDFViewerProps {
  bucket: string | string[]
  filePath: string | null | undefined
  documentTitle?: string
  className?: string
}

/**
 * Componente para visualizar PDFs desde Supabase Storage usando URLs firmadas
 * Implementa fallbacks: iframe nativo -> object tag -> botón de descarga
 */
export function PDFViewer({ 
  bucket, 
  filePath, 
  documentTitle = 'Documento',
  className = ''
}: PDFViewerProps) {
  const { signedUrl, isLoading, error } = useSignedUrl(bucket, filePath, 3600)
  const [iframeError, setIframeError] = useState(false)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[500px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Cargando documento...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !signedUrl) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[500px] bg-gray-100">
          <FileText className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">
            {error ? 'Error al cargar el documento' : 'No hay documento disponible'}
          </p>
          {signedUrl && (
            <Button 
              variant="outline" 
              onClick={() => window.open(signedUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir en nueva pestaña
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-0 overflow-hidden flex flex-col h-full bg-gray-100">
        {/* Barra de herramientas superior */}
        <div className="flex items-center justify-end gap-2 px-3 py-2 bg-background border-b shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(signedUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Abrir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const link = document.createElement('a')
              link.href = signedUrl
              link.download = `${documentTitle}.pdf`
              link.click()
            }}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Descargar
          </Button>
        </div>

        {/* Visor PDF - Intentar iframe primero */}
        <div className="flex-1 min-h-0">
          {!iframeError ? (
            <iframe
              src={signedUrl}
              className="w-full h-full border-0"
              style={{ minHeight: '500px' }}
              title={documentTitle}
              onError={() => setIframeError(true)}
            />
          ) : (
            // Fallback: object tag
            <object
              data={signedUrl}
              type="application/pdf"
              className="w-full h-full"
              style={{ minHeight: '500px' }}
              aria-label={documentTitle}
            >
              {/* Fallback final: botón de descarga */}
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">
                  Tu navegador no puede mostrar el PDF directamente.
                </p>
                <Button onClick={() => window.open(signedUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir en nueva pestaña
                </Button>
              </div>
            </object>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

