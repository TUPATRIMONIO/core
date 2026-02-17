'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DocumentActionsProps {
  originalFilePath?: string | null
  signedFilePath?: string | null
  notarizedFilePath?: string | null
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
}

export function DocumentActions({
  originalFilePath,
  signedFilePath,
  notarizedFilePath,
  className = '',
  size = 'default',
  variant = 'outline',
}: DocumentActionsProps) {
  const [loadingDoc, setLoadingDoc] = useState<'original' | 'signed' | 'notarized' | null>(null)
  const handleViewDocument = async (
    bucket: string,
    path: string,
    type: 'original' | 'signed' | 'notarized'
  ) => {
    setLoadingDoc(type)
    try {
      const response = await fetch('/api/storage/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket, path, expiresIn: 3600 })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al generar la URL del documento')
      }

      const data = await response.json()

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer,nofollow')
      } else {
        throw new Error('No se pudo generar la URL del documento')
      }
    } catch (error: any) {
      console.error('Error viewing document:', error)
      toast.error(error.message || 'Error al abrir el documento')
    } finally {
      setLoadingDoc(null)
    }
  }

  const hasAnyDocument = originalFilePath || signedFilePath || notarizedFilePath

  if (!hasAnyDocument) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {originalFilePath && (
        <Button
          variant={variant}
          size={size}
          onClick={() => handleViewDocument('docs-originals', originalFilePath, 'original')}
          disabled={loadingDoc === 'original'}
        >
          {loadingDoc === 'original' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          Ver Original
        </Button>
      )}

      {signedFilePath && (
        <Button
          variant={variant}
          size={size}
          onClick={() => handleViewDocument('docs-signed', signedFilePath, 'signed')}
          disabled={loadingDoc === 'signed'}
        >
          {loadingDoc === 'signed' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Ver Firmado
        </Button>
      )}

      {notarizedFilePath && (
        <Button
          variant={variant}
          size={size}
          onClick={() => handleViewDocument('docs-notarized', notarizedFilePath, 'notarized')}
          disabled={loadingDoc === 'notarized'}
        >
          {loadingDoc === 'notarized' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Ver Notariado
        </Button>
      )}
    </div>
  )
}
