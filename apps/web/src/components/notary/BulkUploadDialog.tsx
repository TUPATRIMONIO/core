'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface BulkUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

interface FileWithStatus {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const MAX_FILES = 50
const MAX_SIZE_MB = 500

export function BulkUploadDialog({ open, onOpenChange, onComplete }: BulkUploadDialogProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<string | null>(null)

  const supabase = createClient()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }, [])

  const addFiles = (newFiles: File[]) => {
    // Filtrar solo PDFs
    const pdfFiles = newFiles.filter((f) => f.type === 'application/pdf')

    if (pdfFiles.length < newFiles.length) {
      toast.warning(`Solo se aceptan archivos PDF. ${newFiles.length - pdfFiles.length} archivo(s) ignorado(s).`)
    }

    // Validar límites
    const currentCount = files.length
    const availableSlots = MAX_FILES - currentCount

    if (availableSlots <= 0) {
      toast.error(`Máximo ${MAX_FILES} archivos por lote`)
      return
    }

    const filesToAdd = pdfFiles.slice(0, availableSlots)

    if (filesToAdd.length < pdfFiles.length) {
      toast.warning(`Solo se agregaron ${filesToAdd.length} de ${pdfFiles.length} archivos (máximo ${MAX_FILES})`)
    }

    // Validar tamaño total
    const currentSize = files.reduce((sum, f) => sum + f.file.size, 0)
    const newSize = filesToAdd.reduce((sum, f) => sum + f.size, 0)
    const totalSize = currentSize + newSize

    if (totalSize > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Tamaño total máximo: ${MAX_SIZE_MB}MB`)
      return
    }

    const newFileStatuses: FileWithStatus[] = filesToAdd.map((f) => ({
      file: f,
      status: 'pending',
    }))

    setFiles((prev) => [...prev, ...newFileStatuses])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Debes agregar al menos un archivo')
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Crear FormData con todos los archivos
      const formData = new FormData()
      files.forEach((fileStatus, index) => {
        formData.append(`file_${index}`, fileStatus.file)
      })

      // Subir archivos
      const response = await fetch('/api/notary/bulk-upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error en la subida')
      }

      setUploadProgress(100)
      setBatchId(result.batch_id)
      setProcessingStatus('processing')

      toast.success(result.message || 'Archivos subidos. Procesando...')

      // Polling del estado del batch
      pollBatchStatus(result.batch_id)
    } catch (error: any) {
      console.error('[BulkUpload] Error:', error)
      toast.error(error.message || 'Error en la subida masiva')
      setIsUploading(false)
    }
  }

  const pollBatchStatus = async (batchId: string) => {
    const maxAttempts = 60 // 5 minutos (cada 5 segundos)
    let attempts = 0

    const poll = async () => {
      try {
        const { data: batch, error } = await supabase
          .from('signing_notary_upload_batches')
          .select('status, processed_files, total_files, successful_files, failed_files')
          .eq('id', batchId)
          .single()

        if (error) {
          console.error('[pollBatchStatus] Error:', error)
          return
        }

        if (batch.status === 'completed' || batch.status === 'failed') {
          setProcessingStatus('completed')
          setIsUploading(false)

          if (batch.successful_files > 0) {
            toast.success(`${batch.successful_files} documento(s) procesado(s) exitosamente`)
          }

          if (batch.failed_files > 0) {
            toast.warning(`${batch.failed_files} documento(s) con error. Revisa los detalles.`)
          }

          if (onComplete) {
            onComplete()
          }

          return
        }

        // Continuar polling
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000) // Cada 5 segundos
        } else {
          setProcessingStatus('timeout')
          setIsUploading(false)
          toast.warning('El procesamiento está tomando más tiempo de lo esperado. Revisa el estado después.')
        }
      } catch (error) {
        console.error('[pollBatchStatus] Exception:', error)
        setIsUploading(false)
      }
    }

    setTimeout(poll, 3000) // Primera consulta después de 3 segundos
  }

  const handleClose = () => {
    if (!isUploading) {
      setFiles([])
      setBatchId(null)
      setProcessingStatus(null)
      setUploadProgress(0)
      onOpenChange(false)
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0)
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Subir Documentos Notarizados</DialogTitle>
          <DialogDescription>
            Sube múltiples documentos notarizados. El sistema detectará automáticamente el QR de cada documento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {!isUploading && files.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={[
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                isDragging
                  ? 'border-[var(--tp-buttons)] bg-[var(--tp-buttons-10)]'
                  : 'border-[var(--tp-lines-30)] hover:border-[var(--tp-buttons-20)] hover:bg-[var(--tp-buttons-10)]',
              ].join(' ')}
              onClick={() => document.getElementById('bulk-file-input')?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-[var(--tp-buttons)]" />
              <p className="text-sm font-semibold mb-2">
                Arrastra archivos PDF aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground">
                Máximo {MAX_FILES} archivos • Hasta {MAX_SIZE_MB}MB total
              </p>
              <input
                id="bulk-file-input"
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Lista de archivos */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      Archivos seleccionados ({files.length})
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {totalSizeMB} MB
                    </Badge>
                  </div>

                  <ScrollArea className="h-64 rounded-md border p-4">
                    <div className="space-y-2">
                      {files.map((fileStatus, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                        >
                          <FileText className="h-5 w-5 text-red-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {fileStatus.file.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(fileStatus.file.size / 1024).toFixed(0)} KB
                            </div>
                          </div>
                          <div className="shrink-0">
                            {fileStatus.status === 'pending' && !isUploading && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            {fileStatus.status === 'success' && (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                            {fileStatus.status === 'error' && (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {!isUploading && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => document.getElementById('bulk-file-input')?.click()}
                    >
                      Agregar más archivos
                    </Button>
                  )}

                  <input
                    id="bulk-file-input"
                    type="file"
                    accept="application/pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              )}

              {/* Progreso de subida */}
              {isUploading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--tp-buttons)]" />
                    <span className="text-sm font-semibold">
                      {processingStatus === 'processing' ? 'Procesando documentos...' : 'Subiendo archivos...'}
                    </span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {processingStatus === 'processing'
                      ? 'El sistema está leyendo los códigos QR y asociando cada documento. Esto puede tardar unos minutos.'
                      : 'Subiendo archivos al servidor...'}
                  </p>
                </div>
              )}

              {/* Estado de procesamiento */}
              {processingStatus === 'completed' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Procesamiento completado. Revisa los resultados en tu dashboard.
                  </AlertDescription>
                </Alert>
              )}

              {processingStatus === 'timeout' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    El procesamiento está en curso. Actualiza tu dashboard en unos minutos para ver los resultados.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {processingStatus === 'completed' ? 'Cerrar' : 'Cancelar'}
          </Button>
          
          {files.length > 0 && !isUploading && !processingStatus && (
            <Button
              onClick={handleUpload}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir {files.length} documento(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
