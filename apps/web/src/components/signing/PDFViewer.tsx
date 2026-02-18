'use client'

import { useSignedUrl } from '@/hooks/useSignedUrl'
import { Button } from '@/components/ui/button'
import { Loader2, ExternalLink, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PDFCanvasViewer } from '@/components/shared/PDFCanvasViewer'

interface PDFViewerProps {
  bucket: string | string[]
  filePath: string | null | undefined
  documentTitle?: string
  className?: string
}

/**
 * Componente para visualizar PDFs desde Supabase Storage usando URLs firmadas
 * Utiliza PDFCanvasViewer para renderizado compatible con todos los dispositivos (incluido mobile)
 */
export function PDFViewer({ 
  bucket, 
  filePath, 
  documentTitle = 'Documento',
  className = ''
}: PDFViewerProps) {
  const { signedUrl, isLoading, error } = useSignedUrl(bucket, filePath, 3600)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[300px] md:min-h-[500px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Cargando documento...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !signedUrl) {
    return (
      <Card className={className}>
        <CardContent className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[300px] md:min-h-[500px] bg-gray-100">
          <FileText className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4 text-center">
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
        <PDFCanvasViewer 
          url={signedUrl} 
          title={documentTitle}
          className="h-full border-0 rounded-none"
        />
      </CardContent>
    </Card>
  )
}
