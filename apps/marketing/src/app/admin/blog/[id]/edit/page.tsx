'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BlogPostEditor from '@/components/admin/BlogPostEditor'
import { createClient } from '@/lib/supabase/client'

export default function EditPostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadPost()
  }, [params.id])

  async function loadPost() {
    const { data, error } = await supabase
      .schema('marketing')
      .from('blog_posts')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error loading post:', error)
    } else {
      setPost(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Post no encontrado</h2>
          <p className="text-gray-600 mt-2">El post que buscas no existe o fue eliminado.</p>
          <button
            onClick={() => router.push('/admin/blog')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Volver a la lista de posts
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Editar Post</h1>
      <BlogPostEditor post={post} mode="edit" />
    </div>
  )
}

