'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteBlogPost(postId: string) {
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .schema('marketing')
    .from('blog_posts')
    .delete()
    .eq('id', postId)

  if (error) {
    console.error('Error deleting blog post:', error)
    return { error: 'Error al eliminar el post' }
  }

  revalidatePath('/admin/blog')
  return { success: true }
}

export async function togglePublishBlogPost(postId: string) {
  const supabase = createServiceRoleClient()

  // Obtener el estado actual
  const { data: post } = await supabase
    .schema('marketing')
    .from('blog_posts')
    .select('published, published_at')
    .eq('id', postId)
    .single()

  if (!post) {
    return { error: 'Post no encontrado' }
  }

  const newPublishedState = !post.published

  const updateData: any = {
    published: newPublishedState,
  }

  // Si se está publicando por primera vez, establecer published_at
  if (newPublishedState && !post.published_at) {
    updateData.published_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('marketing.blog_posts')
    .update(updateData)
    .eq('id', postId)

  if (error) {
    console.error('Error updating blog post:', error)
    return { error: 'Error al actualizar el post' }
  }

  revalidatePath('/admin/blog')
  return { success: true }
}

export async function deleteBlogCategory(categoryId: string) {
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .schema('marketing')
    .from('blog_categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    console.error('Error deleting blog category:', error)
    return { error: 'Error al eliminar la categoría' }
  }

  revalidatePath('/admin/blog/categories')
  return { success: true }
}
