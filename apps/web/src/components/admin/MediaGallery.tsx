/**
 * Galería de Medios para Blog
 * Gestión de imágenes con upload, selección y URLs externas
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useBlogManagement, type MediaFile } from '@/hooks/useBlogManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface MediaGalleryProps {
  onSelect?: (url: string) => void;
  bucket?: 'blog-featured' | 'blog-content';
  mode?: 'selector' | 'manager'; // selector para elegir imagen, manager para gestión completa
}

export function MediaGallery({
  onSelect,
  bucket = 'blog-content',
  mode = 'selector'
}: MediaGalleryProps) {
  const { uploadImage, fetchGallery, deleteImage, isAdmin } = useBlogManagement();

  const [gallery, setGallery] = useState<MediaFile[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGallery();
  }, [bucket]);

  const loadGallery = async () => {
    setIsLoadingGallery(true);
    const files = await fetchGallery(bucket);
    setGallery(files);
    setIsLoadingGallery(false);
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (5MB para featured, 3MB para content)
    const maxSize = bucket === 'blog-featured' ? 5 * 1024 * 1024 : 3 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(`La imagen es muy grande. Máximo ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const result = await uploadImage(file, bucket);

    if (result.success && result.url) {
      setUploadSuccess(true);
      setSelectedImage(result.url);
      await loadGallery();

      // Auto-seleccionar si estamos en modo selector
      if (mode === 'selector' && onSelect) {
        onSelect(result.url);
      }

      // Reset después de 3 segundos
      setTimeout(() => {
        setUploadSuccess(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);
    } else {
      setUploadError(result.error || 'Error al subir imagen');
    }

    setIsUploading(false);
  };

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
    if (mode === 'selector' && onSelect) {
      onSelect(url);
    }
  };

  const handleExternalUrlSubmit = () => {
    if (!externalUrl.trim()) return;

    // Validación básica de URL
    try {
      new URL(externalUrl);
      setSelectedImage(externalUrl);
      
      if (mode === 'selector' && onSelect) {
        onSelect(externalUrl);
      }
    } catch {
      setUploadError('URL inválida. Por favor ingresa una URL completa');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDeleteImage = async (file: MediaFile) => {
    if (!confirm(`¿Eliminar imagen ${file.name}?`)) return;

    const result = await deleteImage(file.name, bucket);
    if (result.success) {
      await loadGallery();
      if (selectedImage === file.url) {
        setSelectedImage(null);
      }
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-[var(--tp-buttons)]', 'bg-blue-50');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-[var(--tp-buttons)]', 'bg-blue-50');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-[var(--tp-buttons)]', 'bg-blue-50');
    }
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No tienes permisos para acceder a la galería de medios
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Galería de Medios
        </CardTitle>
        <CardDescription>
          {bucket === 'blog-featured' 
            ? 'Imágenes destacadas (máx 5MB)' 
            : 'Imágenes de contenido (máx 3MB)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery">Galería</TabsTrigger>
            <TabsTrigger value="upload">Subir Nueva</TabsTrigger>
            <TabsTrigger value="external">URL Externa</TabsTrigger>
          </TabsList>

          {/* Tab: Galería */}
          <TabsContent value="gallery" className="space-y-4">
            {isLoadingGallery ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--tp-buttons)]"></div>
              </div>
            ) : gallery.length === 0 ? (
              <Alert>
                <ImageIcon className="h-4 w-4" />
                <AlertDescription>
                  No hay imágenes en la galería. Sube tu primera imagen.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {gallery.map((file) => (
                  <div
                    key={file.url}
                    className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedImage === file.url
                        ? 'border-[var(--tp-buttons)] shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleImageClick(file.url)}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      {selectedImage === file.url && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="h-6 w-6 text-[var(--tp-buttons)] bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-between gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-white hover:text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyUrl(file.url);
                          }}
                        >
                          {copiedUrl === file.url ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        {mode === 'manager' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-white hover:text-red-500 hover:bg-white/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(file);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="p-2 bg-white border-t">
                      <p className="text-xs text-gray-500 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedImage && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium mb-2 block">URL Seleccionada:</Label>
                <div className="flex gap-2">
                  <Input
                    value={selectedImage}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyUrl(selectedImage)}
                  >
                    {copiedUrl === selectedImage ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab: Subir Nueva */}
          <TabsContent value="upload" className="space-y-4">
            <div
              ref={dropZoneRef}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Arrastra una imagen aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-500 mb-4">
                PNG, JPG, GIF, WEBP - Máx {bucket === 'blog-featured' ? '5MB' : '3MB'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar Imagen
                  </>
                )}
              </Button>
            </div>

            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {uploadSuccess && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ¡Imagen subida exitosamente!
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Tab: URL Externa */}
          <TabsContent value="external" className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="external-url">URL de Imagen Externa</Label>
              <div className="flex gap-2">
                <Input
                  id="external-url"
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleExternalUrlSubmit();
                    }
                  }}
                />
                <Button
                  onClick={handleExternalUrlSubmit}
                  className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Usar URL
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Ingresa la URL completa de una imagen externa (debe comenzar con https://)
              </p>
            </div>

            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {selectedImage && selectedImage === externalUrl && (
              <div className="space-y-3">
                <Label>Vista Previa:</Label>
                <div className="border rounded-lg p-4">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="max-w-full h-auto rounded"
                    onError={() => setUploadError('No se pudo cargar la imagen desde esta URL')}
                  />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

