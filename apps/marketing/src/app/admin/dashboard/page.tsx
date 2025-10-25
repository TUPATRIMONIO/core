import { Card } from '@/components/ui/card'
import { FileText, Check, Clock, FolderOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Obtener métricas
  const [
    { count: totalPosts },
    { count: publishedPosts },
    { count: draftPosts },
    { count: totalCategories },
  ] = await Promise.all([
    supabase.schema('marketing').from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.schema('marketing').from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.schema('marketing').from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', false),
    supabase.schema('marketing').from('blog_categories').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    {
      title: 'Total Posts',
      value: totalPosts || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Publicados',
      value: publishedPosts || 0,
      icon: Check,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Borradores',
      value: draftPosts || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Categorías',
      value: totalCategories || 0,
      icon: FolderOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Resumen del contenido del blog
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

