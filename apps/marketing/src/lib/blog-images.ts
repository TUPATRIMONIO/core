/**
 * Blog Image Helpers for Marketing App
 * Re-exports y utilidades específicas para imágenes del blog
 */

import {
  getBlogImageUrl,
  getBlogImageSrcSet,
  getFeaturedImageUrl,
  getContentImageUrl,
  getCategoryIconUrl,
  getAuthorAvatarUrl,
  getMetaImageUrl,
  type BlogImageType,
  type ImageSize,
} from '@tupatrimonio/utils/image-helpers';

// Re-export functions
export {
  getBlogImageUrl,
  getBlogImageSrcSet,
  getFeaturedImageUrl,
  getContentImageUrl,
  getCategoryIconUrl,
  getAuthorAvatarUrl,
  getMetaImageUrl,
};

// Re-export types
export type { BlogImageType, ImageSize };

/**
 * Verifica si una URL es de Supabase Storage
 * @param url - URL a verificar
 * @returns true si la URL es de Supabase Storage
 */
export function isSupabaseStorageUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('/storage/v1/object/public/') || url.includes('/storage/v1/render/image/');
}

/**
 * Obtiene la URL de la imagen o retorna una imagen de fallback
 * @param url - URL de la imagen (puede ser null o undefined)
 * @param fallbackType - Tipo de fallback ('featured', 'avatar', 'icon')
 * @returns URL válida de imagen
 */
export function getImageUrlWithFallback(
  url: string | null | undefined,
  fallbackType: 'featured' | 'avatar' | 'icon' = 'featured'
): string {
  if (url && url.trim()) {
    return url;
  }

  // Fallback images - puedes personalizarlos según tu diseño
  const fallbacks = {
    featured: '/images/blog-placeholder.svg',
    avatar: '/images/avatar-placeholder.svg',
    icon: '/images/icon-placeholder.svg',
  };

  return fallbacks[fallbackType];
}

/**
 * Construye props para el componente Next.js Image con imágenes del blog
 * @param url - URL de la imagen
 * @param alt - Texto alternativo
 * @param size - Tamaño predefinido (afecta width/height)
 * @returns Props para Next.js Image component
 */
export function getBlogImageProps(
  url: string | null | undefined,
  alt: string,
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'full' = 'medium'
) {
  const finalUrl = getImageUrlWithFallback(url, 'featured');

  const dimensions = {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 200 },
    medium: { width: 600, height: 400 },
    large: { width: 1200, height: 800 },
    full: { width: 1920, height: 1080 },
  };

  return {
    src: finalUrl,
    alt: alt || 'Imagen del blog',
    ...dimensions[size],
    className: 'object-cover',
  };
}

/**
 * Extrae el slug de una URL de imagen de Supabase Storage
 * @param url - URL de Supabase Storage
 * @returns Slug extraído o null
 */
export function extractSlugFromImageUrl(url: string): string | null {
  if (!isSupabaseStorageUrl(url)) return null;

  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  
  // Remover extensión y sufijos comunes (-featured, -content-1, etc)
  const slug = filename
    .replace(/\.[^/.]+$/, '') // Remover extensión
    .replace(/-featured$/, '')
    .replace(/-content-\d+$/, '')
    .replace(/-og$/, '')
    .replace(/-\d+$/, ''); // Remover timestamps

  return slug || null;
}

/**
 * Genera el path de imagen según las convenciones del proyecto
 * Útil para documentar o verificar la estructura correcta
 */
export const IMAGE_PATH_CONVENTIONS = {
  featured: '{slug}-featured.{ext}',
  content: '{slug}-content-{n}.{ext}',
  category: '{category-slug}-icon.{ext}',
  author: '{author-slug}-avatar.{ext}',
  meta: '{slug}-og.{ext}',
} as const;

/**
 * Tamaños recomendados para cada tipo de imagen del blog
 */
export const RECOMMENDED_IMAGE_SIZES = {
  featured: { width: 1200, height: 630, format: 'webp' as const },
  content: { width: 800, height: 600, format: 'webp' as const },
  category: { width: 256, height: 256, format: 'webp' as const },
  author: { width: 200, height: 200, format: 'webp' as const },
  meta: { width: 1200, height: 630, format: 'webp' as const },
  thumbnail: { width: 300, height: 200, format: 'webp' as const },
} as const;

export default {
  getBlogImageUrl,
  getBlogImageSrcSet,
  getFeaturedImageUrl,
  getContentImageUrl,
  getCategoryIconUrl,
  getAuthorAvatarUrl,
  getMetaImageUrl,
  getImageUrlWithFallback,
  getBlogImageProps,
  isSupabaseStorageUrl,
  extractSlugFromImageUrl,
  IMAGE_PATH_CONVENTIONS,
  RECOMMENDED_IMAGE_SIZES,
};

