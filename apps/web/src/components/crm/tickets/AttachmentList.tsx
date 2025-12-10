"use client"

import { useState, useRef } from "react"
import { Paperclip, Plus, X, File, FileText, Image as ImageIcon, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const BUCKET_NAME = 'ticket-attachments'

// Helper to get icon by file type
const getFileIcon = (type: string | undefined) => {
    if (!type) return <File className="h-4 w-4" />
    if (type.includes('image')) return <ImageIcon className="h-4 w-4" />
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
}

// Helper to format file size
const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return 'Desconocido'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Helper to get public URL for attachment
const getPublicUrl = (filePath: string) => {
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`
}

export interface Attachment {
    id: string
    file_name: string
    file_path: string
    file_type?: string
    file_size?: number
    created_at: string
}

interface AttachmentListProps {
    items: Attachment[]
    ticketId: string
    onUpload: (formData: FormData) => Promise<{ success: boolean; error?: string }>
    onRemove: (id: string) => Promise<{ success: boolean; error?: string }>
    readOnly?: boolean
}

export function AttachmentList({ 
    items, 
    ticketId,
    onUpload,
    onRemove, 
    readOnly = false 
}: AttachmentListProps) {
    const [uploading, setUploading] = useState(false)
    const [removing, setRemoving] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleAddClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('El archivo excede el tamaño máximo de 10MB')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const result = await onUpload(formData)
            
            if (result.success) {
                toast.success(`Archivo "${file.name}" subido exitosamente`)
            } else {
                toast.error(result.error || 'Error al subir el archivo')
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al subir el archivo')
        } finally {
            setUploading(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleRemove = async (id: string, fileName: string) => {
        setRemoving(id)
        try {
            const result = await onRemove(id)
            
            if (result.success) {
                toast.success(`Archivo "${fileName}" eliminado`)
            } else {
                toast.error(result.error || 'Error al eliminar el archivo')
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar el archivo')
        } finally {
            setRemoving(null)
        }
    }

    const handleDownload = (item: Attachment) => {
        const url = getPublicUrl(item.file_path)
        window.open(url, '_blank')
    }

    return (
        <Card>
            <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                         <Paperclip className="h-4 w-4" />
                         Adjuntos ({items.length})
                    </CardTitle>
                    {!readOnly && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs" 
                            onClick={handleAddClick}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Subiendo...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-3 w-3 mr-1" />
                                    Agregar
                                </>
                            )}
                        </Button>
                    )}
                </div>
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="*/*"
                />
            </CardHeader>
            
            {items.length > 0 && <Separator />}
            
            <CardContent className="p-0">
                {items.length === 0 ? (
                     <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20">
                        No hay archivos adjuntos
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {items.map((item) => (
                            <div 
                                key={item.id} 
                                className="group flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/50 transition-colors"
                            >
                                <button 
                                    onClick={() => handleDownload(item)}
                                    className="flex items-center gap-3 overflow-hidden flex-1 text-left"
                                >
                                    <div className="flex-shrink-0 text-muted-foreground">
                                        {getFileIcon(item.file_type)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium truncate hover:underline">{item.file_name}</span>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                             {formatFileSize(item.file_size)}
                                        </div>
                                    </div>
                                </button>
                                
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                                        onClick={() => handleDownload(item)}
                                        title="Descargar archivo"
                                    >
                                        <Download className="h-3 w-3" />
                                    </Button>
                                    
                                    {!readOnly && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemove(item.id, item.file_name)}
                                            disabled={removing === item.id}
                                            title="Eliminar archivo"
                                        >
                                            {removing === item.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <X className="h-3 w-3" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
