/**
 * Image Helpers for Supabase Storage
 * Utilidades para gestión de imágenes del blog en Supabase Storage
 */
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
/**
 * Obtiene la URL pública de una imagen en Supabase Storage
 * @param bucket - Nombre del bucket
 * @param path - Ruta del archivo dentro del bucket
 * @returns URL pública de la imagen
 */
export declare function getPublicImageUrl(bucket: string, path: string): string;
/**
 * Genera una URL con transformaciones de imagen usando Supabase Transform
 * @param bucket - Nombre del bucket
 * @param path - Ruta del archivo
 * @param options - Opciones de transformación
 * @returns URL con parámetros de transformación
 */
export declare function getOptimizedImageUrl(bucket: string, path: string, options?: ImageTransformOptions): string;
/**
 * Helper específico para obtener URLs de imágenes del blog
 * @param type - Tipo de imagen del blog
 * @param filename - Nombre del archivo
 * @param size - Tamaño predefinido (opcional)
 * @param quality - Calidad de la imagen (1-100, default 80)
 * @returns URL optimizada de la imagen
 */
export declare function getBlogImageUrl(type: BlogImageType, filename: string, size?: ImageSize, quality?: number): string;
/**
 * Obtiene múltiples tamaños de una imagen para srcset responsivo
 * @param type - Tipo de imagen del blog
 * @param filename - Nombre del archivo
 * @param sizes - Array de tamaños a generar
 * @param quality - Calidad de la imagen
 * @returns Objeto con URLs para cada tamaño
 */
export declare function getBlogImageSrcSet(type: BlogImageType, filename: string, sizes?: ImageSize[], quality?: number): Record<ImageSize, string>;
/**
 * Valida un archivo de imagen antes de subirlo
 * @param file - Archivo a validar
 * @param type - Tipo de imagen (para verificar límite de tamaño)
 * @returns Resultado de la validación
 */
export declare function validateImageFile(file: File, type: BlogImageType): ImageValidationResult;
/**
 * Genera un nombre de archivo único basado en timestamp
 * @param originalName - Nombre original del archivo
 * @param prefix - Prefijo opcional (ej: slug del post)
 * @returns Nombre de archivo único
 */
export declare function generateUniqueFilename(originalName: string, prefix?: string): string;
/**
 * Construye la ruta completa de un archivo en el bucket según convenciones
 * @param type - Tipo de imagen
 * @param slug - Slug del artículo/categoría/autor
 * @param suffix - Sufijo adicional (ej: 'featured', '1', '2')
 * @param extension - Extensión del archivo (default: 'webp')
 * @returns Ruta del archivo
 */
export declare function buildImagePath(type: BlogImageType, slug: string, suffix?: string, extension?: string): string;
/**
 * Obtiene URL de imagen destacada de un post
 */
export declare function getFeaturedImageUrl(slug: string, size?: ImageSize, extension?: string): string;
/**
 * Obtiene URL de imagen de contenido de un post
 */
export declare function getContentImageUrl(slug: string, index: number, size?: ImageSize, extension?: string): string;
/**
 * Obtiene URL de icono de categoría
 */
export declare function getCategoryIconUrl(categorySlug: string, extension?: string): string;
/**
 * Obtiene URL de avatar de autor
 */
export declare function getAuthorAvatarUrl(authorSlug: string, size?: ImageSize, extension?: string): string;
/**
 * Obtiene URL de imagen meta (og:image)
 */
export declare function getMetaImageUrl(slug: string, extension?: string): string;
declare const _default: {
    getPublicImageUrl: typeof getPublicImageUrl;
    getOptimizedImageUrl: typeof getOptimizedImageUrl;
    getBlogImageUrl: typeof getBlogImageUrl;
    getBlogImageSrcSet: typeof getBlogImageSrcSet;
    validateImageFile: typeof validateImageFile;
    generateUniqueFilename: typeof generateUniqueFilename;
    buildImagePath: typeof buildImagePath;
    getFeaturedImageUrl: typeof getFeaturedImageUrl;
    getContentImageUrl: typeof getContentImageUrl;
    getCategoryIconUrl: typeof getCategoryIconUrl;
    getAuthorAvatarUrl: typeof getAuthorAvatarUrl;
    getMetaImageUrl: typeof getMetaImageUrl;
};
export default _default;
//# sourceMappingURL=image-helpers.d.ts.map