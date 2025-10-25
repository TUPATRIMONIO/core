import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import CategoriesTable from '@/components/admin/CategoriesTable'

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .schema('marketing')
    .from('blog_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categorías del Blog</h1>
          <p className="text-gray-600 mt-2">
            Organiza tus artículos por categorías
          </p>
        </div>
        <Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      <CategoriesTable categories={categories || []} />
    </div>
  )
}

