'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText, CheckCircle2, Users, FileCheck, FileSignature, FileArchive } from 'lucide-react'
import { cn } from '@/lib/utils'

type DocumentVersion = {
  name: string
  bucket: string
  path: string
  url: string | null
  type: 'original' | 'signed' | 'notarized'
}

type Signer = {
  id: string
  name: string
  email: string
  status: string
  signing_order: number
}

type DocumentViewerProps = {
  documentTitle: string
  documentId: string
  status: string
  orderNumber: string | null
  signers: Signer[]
  versions: DocumentVersion[]
  defaultVersion: DocumentVersion | undefined
}

const versionIcons = {
  notarized: FileCheck,
  signed: FileSignature,
  original: FileArchive
}

const versionColors = {
  notarized: 'text-green-600 bg-green-50 border-green-200',
  signed: 'text-blue-600 bg-blue-50 border-blue-200',
  original: 'text-gray-600 bg-gray-50 border-gray-200'
}

const statusTranslations: Record<string, string> = {
  draft: 'Borrador',
  ready: 'Listo',
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
  signed: 'Firmado',
  rejected: 'Rechazado'
}

const signerStatusTranslations: Record<string, string> = {
  pending: 'Pendiente',
  signed: 'Firmado',
  rejected: 'Rechazado',
  removed: 'Removido'
}

export function DocumentViewer({
  documentTitle,
  documentId,
  status,
  orderNumber,
  signers,
  versions,
  defaultVersion
}: DocumentViewerProps) {
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | undefined>(defaultVersion)

  const statusLabel = statusTranslations[status] || status

  return (
    <div className="min-h-screen bg-[var(--tp-background-light)] py-4 px-4 md:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        {/* Header con info del documento */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-full bg-[var(--tp-buttons-20)] p-2 mt-1">
                <FileText className="h-5 w-5 text-[var(--tp-buttons)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-xl font-quicksand font-semibold mb-2">
                  {documentTitle || 'Documento'}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                  <span className="font-mono break-all">{documentId}</span>
                  <span>•</span>
                  <span className="capitalize px-2 py-0.5 bg-gray-100 rounded-full">
                    {statusLabel}
                  </span>
                  {orderNumber && (
                    <>
                      <span>•</span>
                      <span>Pedido #{orderNumber}</span>
                    </>
                  )}
                </div>

                {/* Firmantes */}
                {signers && signers.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-[var(--tp-buttons)]" />
                      <h3 className="text-sm font-medium">
                        Firmantes ({signers.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {signers.map((signer) => (
                        <div
                          key={signer.id}
                          className="flex items-center justify-between gap-3 text-sm bg-gray-50 p-2 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{signer.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {signer.email}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {signer.status === 'signed' && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              signer.status === 'signed' 
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            )}>
                              {signerStatusTranslations[signer.status] || signer.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selector de versiones */}
            {versions.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium mb-3">Versiones del Documento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {versions.map((version) => {
                    const Icon = versionIcons[version.type]
                    const isSelected = selectedVersion?.type === version.type
                    return (
                      <button
                        key={version.type}
                        onClick={() => setSelectedVersion(version)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left",
                          isSelected
                            ? 'border-[var(--tp-buttons)] bg-[var(--tp-buttons-10)] shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isSelected ? 'text-[var(--tp-buttons)]' : 'text-gray-400'
                        )} />
                        <span className={cn(
                          "text-sm font-medium",
                          isSelected ? 'text-[var(--tp-buttons)]' : 'text-gray-700'
                        )}>
                          {version.name}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Botón de descarga */}
                {selectedVersion?.url && (
                  <div className="mt-4">
                    <a 
                      href={selectedVersion.url} 
                      download={`${documentTitle || 'documento'}-${selectedVersion.type}.pdf`}
                      className="inline-block w-full sm:w-auto"
                    >
                      <Button className="w-full sm:w-auto bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                        <Download className="h-4 w-4 mr-2" />
                        Descargar {selectedVersion.name}
                      </Button>
                    </a>
                    <p className="text-xs text-muted-foreground mt-2">
                      El enlace de descarga expira en 60 minutos
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Previsualizador del PDF */}
        {selectedVersion?.url ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative w-full bg-gray-100" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
                <iframe
                  src={`${selectedVersion.url}#view=FitH`}
                  className="w-full h-full border-0"
                  title={`Previsualización - ${selectedVersion.name}`}
                  loading="lazy"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                No hay documentos disponibles para visualización.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer info */}
        <div className="text-xs text-center text-muted-foreground pb-4">
          Este repositorio es público y se valida por el identificador del documento
        </div>
      </div>
    </div>
  )
}
