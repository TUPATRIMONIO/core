import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import MediaGallery from '@/components/admin/MediaGallery'

export default async function MediaPage() {
  const supabase = await createClient()

  // Obtener lista de archivos del bucket marketing-images
  const { data: files } = await supabase
    .storage
    .from('marketing-images')
    .list('blog/featured', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Galería de Medios</h1>
          <p className="text-gray-600 mt-2">
            Gestiona las imágenes del blog
          </p>
        </div>
        <Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
          <Upload className="w-4 h-4 mr-2" />
          Subir Imagen
        </Button>
      </div>

      <MediaGallery files={files || []} bucket="marketing-images" />
    </div>
  )
}

