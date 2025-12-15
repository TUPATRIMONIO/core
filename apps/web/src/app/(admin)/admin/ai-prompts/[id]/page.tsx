import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { PromptEditor } from './prompt-editor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PromptDetailPage({ params }: PageProps) {
  const { id } = await params
  const isNew = id === 'new'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin')
  }

  let prompt = null
  if (!isNew) {
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      notFound()
    }
    prompt = data
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/ai-prompts">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={isNew ? 'Nuevo Prompt' : prompt?.name || 'Editar Prompt'}
          description={
            isNew 
              ? 'Crea un nuevo prompt para el sistema de revisión IA'
              : `${prompt?.feature_type} - ${prompt?.country_code} - v${prompt?.version}`
          }
        />
      </div>

      <PromptEditor initialData={prompt} isNew={isNew} />
    </div>
  )
}
