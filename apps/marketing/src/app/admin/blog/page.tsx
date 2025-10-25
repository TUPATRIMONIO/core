import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import BlogPostsTable from '@/components/admin/BlogPostsTable'
import { createClient } from '@/lib/supabase/server'

export default async function BlogPostsPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .schema('marketing')
    .from('blog_posts')
    .select(`
      *,
      blog_categories (
        id,
        name,
        slug
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Posts del Blog</h1>
          <p className="text-gray-600 mt-2">
            Gestiona todos los artículos del blog
          </p>
        </div>
        <Link href="/admin/blog/new">
          <Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Post
          </Button>
        </Link>
      </div>

      <BlogPostsTable posts={posts || []} />
    </div>
  )
}

