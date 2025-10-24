/**
 * Image Helpers for Supabase Storage
 * Utilidades para gestión de imágenes del blog en Supabase Storage
 */

// =====================================================
// Types and Interfaces
// =====================================================

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'full';

export type BlogImageType = 'featured' | 'content' | 'category' | 'author' | 'meta' | 'thumbnail';

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  resize?: 'contain' | 'cover' | 'fill';
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

// =====================================================
// Constants
// =====================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const STORAGE_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public`;

// Tamaños predefinidos para imágenes
const IMAGE_SIZES: Record<ImageSize, number> = {
  thumbnail: 150,
  small: 300,
  medium: 600,
  large: 1200,
  full: 0, // Sin límite, imagen original
};

// Buckets de storage para el blog
const BLOG_BUCKETS: Record<BlogImageType, string> = {
  featured: 'blog-featured',
  content: 'blog-content',
  category: 'blog-categories',
  author: 'blog-authors',
  meta: 'blog-meta',
  thumbnail: 'blog-thumbnails',
};

// MIME types permitidos
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

// Tamaños máximos por tipo (en bytes)
const MAX_FILE_SIZES: Record<BlogImageType, number> = {
  featured: 5242880, // 5MB
  content: 3145728, // 3MB
  category: 1048576, // 1MB
  author: 1048576, // 1MB
  meta: 2097152, // 2MB
  thumbnail: 2097152, // 2MB
};

// =====================================================
// Core Functions
// =====================================================

/**
 * Obtiene la URL pública de una imagen en Supabase Storage
 * @param bucket - Nombre del bucket
 * @param path - Ruta del archivo dentro del bucket
 * @returns URL pública de la imagen
 */
export function getPublicImageUrl(bucket: string, path: string): string {
  if (!SUPABASE_URL) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL no está configurada');
    return '';
  }

  // Limpiar path de barras iniciales
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${STORAGE_BASE_URL}/${bucket}/${cleanPath}`;
}

/**
 * Genera una URL con transformaciones de imagen usando Supabase Transform
 * @param bucket - Nombre del bucket
 * @param path - Ruta del archivo
 * @param options - Opciones de transformación
 * @returns URL con parámetros de transformación
 */
export function getOptimizedImageUrl(
  bucket: string,
  path: string,
  options: ImageTransformOptions = {}
): string {
  if (!SUPABASE_URL) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL no está configurada');
    return '';
  }

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const baseUrl = `${SUPABASE_URL}/storage/v1/render/image/public/${bucket}/${cleanPath}`;
  
  const params = new URLSearchParams();

  if (options.width) {
    params.append('width', options.width.toString());
  }

  if (options.height) {
    params.append('height', options.height.toString());
  }

  if (options.quality) {
    params.append('quality', options.quality.toString());
  }

  if (options.format) {
    params.append('format', options.format);
  }

  if (options.resize) {
    params.append('resize', options.resize);
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Helper específico para obtener URLs de imágenes del blog
 * @param type - Tipo de imagen del blog
 * @param filename - Nombre del archivo
 * @param size - Tamaño predefinido (opcional)
 * @param quality - Calidad de la imagen (1-100, default 80)
 * @returns URL optimizada de la imagen
 */
export function getBlogImageUrl(
  type: BlogImageType,
  filename: string,
  size?: ImageSize,
  quality: number = 80
): string {
  const bucket = BLOG_BUCKETS[type];
  
  if (!size || size === 'full') {
    return getPublicImageUrl(bucket, filename);
  }

  const width = IMAGE_SIZES[size];
  
  return getOptimizedImageUrl(bucket, filename, {
    width,
    quality,
    format: 'webp',
    resize: 'cover',
  });
}

/**
 * Obtiene múltiples tamaños de una imagen para srcset responsivo
 * @param type - Tipo de imagen del blog
 * @param filename - Nombre del archivo
 * @param sizes - Array de tamaños a generar
 * @param quality - Calidad de la imagen
 * @returns Objeto con URLs para cada tamaño
 */
export function getBlogImageSrcSet(
  type: BlogImageType,
  filename: string,
  sizes: ImageSize[] = ['small', 'medium', 'large'],
  quality: number = 80
): Record<ImageSize, string> {
  const srcSet: Partial<Record<ImageSize, string>> = {};

  sizes.forEach((size) => {
    srcSet[size] = getBlogImageUrl(type, filename, size, quality);
  });

  return srcSet as Record<ImageSize, string>;
}

/**
 * Valida un archivo de imagen antes de subirlo
 * @param file - Archivo a validar
 * @param type - Tipo de imagen (para verificar límite de tamaño)
 * @returns Resultado de la validación
 */
export function validateImageFile(
  file: File,
  type: BlogImageType
): ImageValidationResult {
  // Verificar que sea un archivo
  if (!file) {
    return { valid: false, error: 'No se proporcionó ningún archivo' };
  }

  // Verificar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Solo se aceptan: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  // Verificar tamaño
  const maxSize = MAX_FILE_SIZES[type];
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1048576).toFixed(2);
    return {
      valid: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Genera un nombre de archivo único basado en timestamp
 * @param originalName - Nombre original del archivo
 * @param prefix - Prefijo opcional (ej: slug del post)
 * @returns Nombre de archivo único
 */
export function generateUniqueFilename(
  originalName: string,
  prefix?: string
): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const sanitizedName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);

  if (prefix) {
    return `${prefix}-${sanitizedName}-${timestamp}.${extension}`;
  }

  return `${sanitizedName}-${timestamp}.${extension}`;
}

/**
 * Construye la ruta completa de un archivo en el bucket según convenciones
 * @param type - Tipo de imagen
 * @param slug - Slug del artículo/categoría/autor
 * @param suffix - Sufijo adicional (ej: 'featured', '1', '2')
 * @param extension - Extensión del archivo (default: 'webp')
 * @returns Ruta del archivo
 */
export function buildImagePath(
  type: BlogImageType,
  slug: string,
  suffix?: string,
  extension: string = 'webp'
): string {
  const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  
  if (suffix) {
    return `${sanitizedSlug}-${suffix}.${extension}`;
  }

  return `${sanitizedSlug}.${extension}`;
}

// =====================================================
// Convenience Functions
// =====================================================

/**
 * Obtiene URL de imagen destacada de un post
 */
export function getFeaturedImageUrl(
  slug: string,
  size?: ImageSize,
  extension: string = 'webp'
): string {
  const filename = buildImagePath('featured', slug, 'featured', extension);
  return getBlogImageUrl('featured', filename, size);
}

/**
 * Obtiene URL de imagen de contenido de un post
 */
export function getContentImageUrl(
  slug: string,
  index: number,
  size?: ImageSize,
  extension: string = 'webp'
): string {
  const filename = buildImagePath('content', slug, `content-${index}`, extension);
  return getBlogImageUrl('content', filename, size);
}

/**
 * Obtiene URL de icono de categoría
 */
export function getCategoryIconUrl(
  categorySlug: string,
  extension: string = 'webp'
): string {
  const filename = buildImagePath('category', categorySlug, 'icon', extension);
  return getBlogImageUrl('category', filename);
}

/**
 * Obtiene URL de avatar de autor
 */
export function getAuthorAvatarUrl(
  authorSlug: string,
  size?: ImageSize,
  extension: string = 'webp'
): string {
  const filename = buildImagePath('author', authorSlug, 'avatar', extension);
  return getBlogImageUrl('author', filename, size);
}

/**
 * Obtiene URL de imagen meta (og:image)
 */
export function getMetaImageUrl(
  slug: string,
  extension: string = 'webp'
): string {
  const filename = buildImagePath('meta', slug, 'og', extension);
  return getBlogImageUrl('meta', filename);
}

// =====================================================
// Exports
// =====================================================

export default {
  getPublicImageUrl,
  getOptimizedImageUrl,
  getBlogImageUrl,
  getBlogImageSrcSet,
  validateImageFile,
  generateUniqueFilename,
  buildImagePath,
  getFeaturedImageUrl,
  getContentImageUrl,
  getCategoryIconUrl,
  getAuthorAvatarUrl,
  getMetaImageUrl,
};

