/**
 * Página de Gestión de Medios
 */

import { Metadata } from 'next';
import { MediaGallery } from '@/components/admin/MediaGallery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Galería de Medios - Dashboard TuPatrimonio',
  description: 'Gestión de imágenes del blog',
};

export default function MediaPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Galería de Medios
        </h1>
        <p className="text-gray-600">
          Gestiona las imágenes del blog
        </p>
      </div>

      <Tabs defaultValue="featured" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="featured">Imágenes Destacadas</TabsTrigger>
          <TabsTrigger value="content">Imágenes de Contenido</TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="mt-6">
          <MediaGallery bucket="blog-featured" mode="manager" />
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <MediaGallery bucket="blog-content" mode="manager" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

