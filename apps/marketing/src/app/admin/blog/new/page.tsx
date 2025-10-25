import BlogPostEditor from '@/components/admin/BlogPostEditor'

export default function NewPostPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Nuevo Post</h1>
      <BlogPostEditor mode="create" />
    </div>
  )
}

