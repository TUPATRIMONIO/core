/**
 * Hooks para gestión de blog (posts, categorías, medios)
 * Solo para uso en dashboard administrativo
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useIsAdmin } from './usePageManagement';

// Types
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  category_id?: string;
  author_name: string;
  published: boolean;
  published_at?: string;
  seo_title?: string;
  seo_description?: string;
  reading_time?: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: BlogCategory;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Stats
  post_count?: number;
}

export interface MediaFile {
  name: string;
  url: string;
  size: number;
  created_at: string;
  bucket: string;
}

export interface BlogFilters {
  published?: boolean;
  category_id?: string;
  search?: string;
}

/**
 * Hook principal para gestión de blog
 */
export function useBlogManagement() {
  const { isAdmin } = useIsAdmin();
  const supabase = createClient();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Posts con filtros
  const fetchPosts = async (filters?: BlogFilters) => {
    if (!isAdmin) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.published !== undefined) {
        query = query.eq('published', filters.published);
      }

      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar posts');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Categories con contador de posts
  const fetchCategories = async () => {
    if (!isAdmin) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('blog_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      // Obtener contador de posts por categoría
      const categoriesWithCount = await Promise.all(
        (data || []).map(async (category) => {
          const { count } = await supabase
            .from('blog_posts')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', category.id);

          return {
            ...category,
            post_count: count || 0
          };
        })
      );

      setCategories(categoriesWithCount);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar categorías');
    } finally {
      setIsLoading(false);
    }
  };

  // Get Single Post
  const getPost = async (id: string): Promise<BlogPost | null> => {
    if (!isAdmin) return null;

    try {
      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      return data;
    } catch (err) {
      console.error('Error fetching post:', err);
      return null;
    }
  };

  // Create Post
  const createPost = async (post: Partial<BlogPost>) => {
    if (!isAdmin) return { success: false, error: 'No autorizado' };

    try {
      const { data, error: insertError } = await supabase
        .from('blog_posts')
        .insert([{
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          featured_image_url: post.featured_image_url,
          category_id: post.category_id,
          author_name: post.author_name || 'TuPatrimonio Team',
          published: post.published || false,
          published_at: post.published ? new Date().toISOString() : null,
          seo_title: post.seo_title,
          seo_description: post.seo_description,
          reading_time: post.reading_time || 5
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchPosts();
      return { success: true, data };
    } catch (err) {
      console.error('Error creating post:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al crear post'
      };
    }
  };

  // Update Post
  const updatePost = async (id: string, post: Partial<BlogPost>) => {
    if (!isAdmin) return { success: false, error: 'No autorizado' };

    try {
      const updateData: any = {
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        featured_image_url: post.featured_image_url,
        category_id: post.category_id,
        author_name: post.author_name,
        published: post.published,
        seo_title: post.seo_title,
        seo_description: post.seo_description,
        reading_time: post.reading_time
      };

      // Si se está publicando por primera vez, establecer published_at
      if (post.published) {
        const existingPost = await getPost(id);
        if (existingPost && !existingPost.published) {
          updateData.published_at = new Date().toISOString();
        }
      }

      const { data, error: updateError } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchPosts();
      return { success: true, data };
    } catch (err) {
      console.error('Error updating post:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al actualizar post'
      };
    }
  };

  // Delete Post
  const deletePost = async (id: string) => {
    if (!isAdmin) return { success: false, error: 'No autorizado' };

    try {
      const { error: deleteError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchPosts();
      return { success: true };
    } catch (err) {
      console.error('Error deleting post:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al eliminar post'
      };
    }
  };

  // Create Category
  const createCategory = async (category: Partial<BlogCategory>) => {
    if (!isAdmin) return { success: false, error: 'No autorizado' };

    try {
      const { data, error: insertError } = await supabase
        .from('blog_categories')
        .insert([{
          name: category.name,
          slug: category.slug,
          description: category.description,
          color: category.color || '#800039',
          sort_order: category.sort_order || 0,
          is_active: category.is_active !== undefined ? category.is_active : true
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchCategories();
      return { success: true, data };
    } catch (err) {
      console.error('Error creating category:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al crear categoría'
      };
    }
  };

  // Update Category
  const updateCategory = async (id: string, category: Partial<BlogCategory>) => {
    if (!isAdmin) return { success: false, error: 'No autorizado' };

    try {
      const { data, error: updateError } = await supabase
        .from('blog_categories')
        .update({
          name: category.name,
          slug: category.slug,
          description: category.description,
          color: category.color,
          sort_order: category.sort_order,
          is_active: category.is_active
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchCategories();
      return { success: true, data };
    } catch (err) {
      console.error('Error updating category:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al actualizar categoría'
      };
    }
  };

  // Delete Category
  const deleteCategory = async (id: string) => {
    if (!isAdmin) return { success: false, error: 'No autorizado' };

    try {
      // Verificar que no haya posts asociados
      const { count } = await supabase
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id);

      if (count && count > 0) {
        return {
          success: false,
          error: 'No se puede eliminar una categoría con posts asociados'
        };
      }

      const { error: deleteError } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchCategories();
      return { success: true };
    } catch (err) {
      console.error('Error deleting category:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al eliminar categoría'
      };
    }
  };

  // Upload Image to Supabase Storage
  const uploadImage = async (
    file: File,
    bucket: 'blog-featured' | 'blog-content' = 'blog-content'
  ) => {
    if (!isAdmin) return { success: false, error: 'No autorizado' };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        success: true,
        url: publicUrl,
        path: data.path
      };
    } catch (err) {
      console.error('Error uploading image:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al subir imagen'
      };
    }
  };

  // Fetch Gallery (list images from storage)
  const fetchGallery = async (
    bucket: 'blog-featured' | 'blog-content' = 'blog-content'
  ): Promise<MediaFile[]> => {
    if (!isAdmin) return [];

    try {
      const { data, error: listError } = await supabase.storage
        .from(bucket)
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) throw listError;

      const files: MediaFile[] = (data || []).map((file) => {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(file.name);

        return {
          name: file.name,
          url: publicUrl,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          bucket
        };
      });

      return files;
    } catch (err) {
      console.error('Error fetching gallery:', err);
      return [];
    }
  };

  // Delete Image from Storage
  const deleteImage = async (
    path: string,
    bucket: 'blog-featured' | 'blog-content' = 'blog-content'
  ) => {
    if (!isAdmin) return { success: false, error: 'No autorizado' };

    try {
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (err) {
      console.error('Error deleting image:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al eliminar imagen'
      };
    }
  };

  return {
    posts,
    categories,
    isLoading,
    error,
    isAdmin,
    fetchPosts,
    fetchCategories,
    getPost,
    createPost,
    updatePost,
    deletePost,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadImage,
    fetchGallery,
    deleteImage
  };
}

/**
 * Helper para generar slug desde título
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Helper para calcular tiempo de lectura aproximado
 * Basado en 200 palabras por minuto (estándar de lectura)
 * Limpia Markdown y cuenta solo palabras reales
 */
export function calculateReadingTime(content: string): number {
  if (!content || content.trim().length === 0) {
    return 1;
  }

  // Limpiar el contenido de Markdown
  let cleanContent = content;

  // 1. Eliminar bloques de código (```...```)
  cleanContent = cleanContent.replace(/```[\s\S]*?```/g, '');
  
  // 2. Eliminar código inline (`...`)
  cleanContent = cleanContent.replace(/`[^`]*`/g, '');
  
  // 3. Eliminar imágenes ![alt](url)
  cleanContent = cleanContent.replace(/!\[([^\]]*)\]\([^\)]*\)/g, '$1');
  
  // 4. Eliminar enlaces pero mantener el texto [texto](url)
  cleanContent = cleanContent.replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1');
  
  // 5. Eliminar encabezados # ## ### etc.
  cleanContent = cleanContent.replace(/^#{1,6}\s+/gm, '');
  
  // 6. Eliminar énfasis (**bold**, *italic*, __bold__, _italic_)
  cleanContent = cleanContent.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleanContent = cleanContent.replace(/(\*|_)(.*?)\1/g, '$2');
  
  // 7. Eliminar listas (-, *, +, números)
  cleanContent = cleanContent.replace(/^[\s]*[-*+]\s+/gm, '');
  cleanContent = cleanContent.replace(/^[\s]*\d+\.\s+/gm, '');
  
  // 8. Eliminar blockquotes (>)
  cleanContent = cleanContent.replace(/^>\s+/gm, '');
  
  // 9. Eliminar líneas horizontales (---, ***, ___)
  cleanContent = cleanContent.replace(/^[-*_]{3,}$/gm, '');
  
  // 10. Eliminar HTML tags si los hay
  cleanContent = cleanContent.replace(/<[^>]*>/g, '');
  
  // 11. Eliminar múltiples espacios, tabs y saltos de línea
  cleanContent = cleanContent.replace(/\s+/g, ' ').trim();

  // Contar palabras reales (separadas por espacios)
  const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;

  // Si no hay palabras, retornar 1 minuto
  if (wordCount === 0) {
    return 1;
  }

  // Cálculo: 200 palabras por minuto es el estándar
  // Para contenido técnico puedes ajustar a 180-200
  const wordsPerMinute = 200;
  const minutes = wordCount / wordsPerMinute;

  // Redondear al minuto más cercano, mínimo 1 minuto
  return Math.max(1, Math.round(minutes));
}

