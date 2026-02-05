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

interface BatchResult {
  filename: string
  success: boolean
  documentId?: string
  error?: string
}

interface BatchDetails {
  status: string
  total_files: number
  processed_files: number
  successful_files: number
  failed_files: number
  results: BatchResult[] | null
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
  const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null)
  const [processingLogs, setProcessingLogs] = useState<string[]>([])

  const supabase = createClient()
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('es-CL')
    setProcessingLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

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
      setProcessingLogs([])
      setBatchDetails(null)

      addLog(`📤 Subiendo ${files.length} archivo(s)...`)

      // Crear FormData con todos los archivos
      const formData = new FormData()
      files.forEach((fileStatus, index) => {
        formData.append(`file_${index}`, fileStatus.file)
        addLog(`  - ${fileStatus.file.name} (${(fileStatus.file.size / 1024).toFixed(0)} KB)`)
      })

      // Subir archivos
      addLog('🔄 Enviando archivos al servidor...')
      const response = await fetch('/api/notary/bulk-upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        addLog(`❌ Error del servidor: ${result.error || 'Error desconocido'}`)
        throw new Error(result.error || 'Error en la subida')
      }

      setUploadProgress(100)
      setBatchId(result.batch_id)
      setProcessingStatus('processing')

      addLog(`✅ Archivos subidos correctamente`)
      addLog(`📋 Lote creado: ${result.batch_id.substring(0, 8)}...`)
      addLog(`📊 Subidos: ${result.uploaded_successfully}/${result.total_files}`)
      
      if (result.upload_failures > 0) {
        addLog(`⚠️ Fallos en subida: ${result.upload_failures}`)
      }

      addLog('🔍 Iniciando procesamiento de QR...')
      toast.success(result.message || 'Archivos subidos. Procesando...')

      // Polling del estado del batch
      pollBatchStatus(result.batch_id)
    } catch (error: any) {
      console.error('[BulkUpload] Error:', error)
      addLog(`❌ Error: ${error.message}`)
      toast.error(error.message || 'Error en la subida masiva')
      setIsUploading(false)
    }
  }

  const pollBatchStatus = async (batchId: string) => {
    const maxAttempts = 20 // Máximo 1 minuto (cada 3 segundos)
    let attempts = 0
    let lastStatus = ''

    addLog(`Iniciando monitoreo del lote: ${batchId.substring(0, 8)}...`)

    const poll = async () => {
      attempts++
      
      try {
        const { data: batch, error } = await supabase
          .from('signing_notary_upload_batches')
          .select('status, processed_files, total_files, successful_files, failed_files, results')
          .eq('id', batchId)
          .single()

        if (error) {
          console.error('[pollBatchStatus] Error:', error)
          addLog(`❌ Error consultando estado: ${error.message}`)
          setIsUploading(false)
          setProcessingStatus('error')
          return
        }

        // Actualizar detalles del batch
        setBatchDetails({
          status: batch.status,
          total_files: batch.total_files,
          processed_files: batch.processed_files,
          successful_files: batch.successful_files,
          failed_files: batch.failed_files,
          results: batch.results as BatchResult[] | null
        })

        // Solo loguear si cambió el estado
        const currentStatus = `${batch.status}|${batch.processed_files}`
        if (currentStatus !== lastStatus) {
          addLog(`Estado: ${batch.status} | Procesados: ${batch.processed_files}/${batch.total_files}`)
          lastStatus = currentStatus
        }

        if (batch.status === 'completed' || batch.status === 'failed') {
          setProcessingStatus('completed')
          setIsUploading(false)

          // Mostrar detalles de cada archivo
          if (batch.results && Array.isArray(batch.results)) {
            for (const result of batch.results as BatchResult[]) {
              if (result.success) {
                addLog(`✅ ${result.filename}: Documento asociado (${result.documentId?.substring(0, 8)}...)`)
              } else {
                addLog(`❌ ${result.filename}: ${result.error || 'Error desconocido'}`)
              }
            }
          }

          if (batch.successful_files > 0) {
            toast.success(`${batch.successful_files} documento(s) procesado(s) exitosamente`)
            addLog(`🎉 ${batch.successful_files} documento(s) procesado(s) exitosamente`)
          }

          if (batch.failed_files > 0) {
            toast.warning(`${batch.failed_files} documento(s) con error. Revisa los detalles.`)
            addLog(`⚠️ ${batch.failed_files} documento(s) con error`)
          }

          if (onComplete) {
            onComplete()
          }

          return
        }

        // Verificar timeout
        if (attempts >= maxAttempts) {
          setProcessingStatus('timeout')
          setIsUploading(false)
          addLog('⏱️ Tiempo de espera agotado (1 min). La función puede estar fallando.')
          addLog('💡 Revisa los logs con: npx supabase functions logs process-notarized-documents')
          toast.warning('El procesamiento está tomando mucho tiempo. Revisa los logs de la función.')
          return
        }

        // Continuar polling
        setTimeout(poll, 3000)
      } catch (error) {
        console.error('[pollBatchStatus] Exception:', error)
        addLog(`❌ Error inesperado: ${error}`)
        setIsUploading(false)
        setProcessingStatus('error')
      }
    }

    setTimeout(poll, 2000) // Primera consulta después de 2 segundos
  }

  const handleClose = () => {
    if (!isUploading) {
      setFiles([])
      setBatchId(null)
      setProcessingStatus(null)
      setUploadProgress(0)
      setBatchDetails(null)
      setProcessingLogs([])
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
                  
                  {/* Detalles del batch */}
                  {batchDetails && (
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      <div className="flex justify-between">
                        <span>Estado:</span>
                        <Badge variant="outline" className="text-xs h-5">
                          {batchDetails.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Procesados:</span>
                        <span>{batchDetails.processed_files}/{batchDetails.total_files}</span>
                      </div>
                      {batchDetails.successful_files > 0 && (
                        <div className="flex justify-between mt-1 text-green-600">
                          <span>Exitosos:</span>
                          <span>{batchDetails.successful_files}</span>
                        </div>
                      )}
                      {batchDetails.failed_files > 0 && (
                        <div className="flex justify-between mt-1 text-red-600">
                          <span>Con error:</span>
                          <span>{batchDetails.failed_files}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Logs de procesamiento */}
              {processingLogs.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Registro de actividad:
                  </div>
                  <div className="h-32 overflow-y-auto rounded border bg-black/5 dark:bg-white/5 p-2">
                    <div className="space-y-1 font-mono text-xs">
                      {processingLogs.map((log, i) => (
                        <div key={i} className="text-muted-foreground whitespace-pre-wrap">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Resultados detallados */}
              {processingStatus === 'completed' && batchDetails?.results && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold">Resultados por archivo:</div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {batchDetails.results.map((result, i) => (
                      <div 
                        key={i} 
                        className={`text-xs p-2 rounded border ${
                          result.success 
                            ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                            : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                          )}
                          <span className="font-medium truncate">{result.filename}</span>
                        </div>
                        {result.success && result.documentId && (
                          <div className="mt-1 text-green-700 dark:text-green-400 pl-6">
                            Documento: {result.documentId.substring(0, 8)}...
                          </div>
                        )}
                        {!result.success && result.error && (
                          <div className="mt-1 text-red-700 dark:text-red-400 pl-6 break-words">
                            {result.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estado de procesamiento */}
              {processingStatus === 'completed' && (
                <Alert className={
                  batchDetails?.successful_files && batchDetails.successful_files > 0
                    ? "bg-green-50 border-green-200"
                    : "bg-amber-50 border-amber-200"
                }>
                  {batchDetails?.successful_files && batchDetails.successful_files > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <AlertDescription className={
                    batchDetails?.successful_files && batchDetails.successful_files > 0
                      ? "text-green-800"
                      : "text-amber-800"
                  }>
                    {batchDetails?.successful_files && batchDetails.successful_files > 0
                      ? `Procesamiento completado. ${batchDetails.successful_files} documento(s) asociado(s).`
                      : 'Procesamiento completado pero ningún documento pudo ser asociado. Revisa los errores arriba.'}
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
