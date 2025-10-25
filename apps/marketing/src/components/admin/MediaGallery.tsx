'use client'

import Image from 'next/image'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Copy, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface MediaFile {
  name: string
  id: string
  created_at: string
}

interface MediaGalleryProps {
  files: MediaFile[]
  bucket: string
}

export default function MediaGallery({ files, bucket }: MediaGalleryProps) {
  const supabase = createClient()

  const handleCopyUrl = (fileName: string) => {
    const { data } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(`blog/featured/${fileName}`)
    
    navigator.clipboard.writeText(data.publicUrl)
    alert('URL copiada al portapapeles')
  }

  const handleDelete = async (fileName: string) => {
    const { error } = await supabase
      .storage
      .from(bucket)
      .remove([`blog/featured/${fileName}`])

    if (!error) {
      window.location.reload()
    } else {
      alert('Error al eliminar: ' + error.message)
    }
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500">No hay imágenes todavía</p>
        <p className="text-sm text-gray-400 mt-2">
          Sube imágenes desde el editor de posts
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((file) => {
        const { data } = supabase
          .storage
          .from(bucket)
          .getPublicUrl(`blog/featured/${file.name}`)

        return (
          <div key={file.id} className="bg-white rounded-lg border overflow-hidden group">
            <div className="relative aspect-video">
              <Image
                src={data.publicUrl}
                alt={file.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-3 space-y-2">
              <p className="text-xs text-gray-600 truncate">{file.name}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleCopyUrl(file.name)}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar URL
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. La imagen será eliminada permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(file.name)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

