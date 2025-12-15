import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function AiPromptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>No autorizado</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Prompts IA"
        description="Administra y versiona los prompts utilizados en el sistema."
        actions={
          <Link href="/admin/ai-prompts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Prompt
            </Button>
          </Link>
        }
      />

      <Suspense fallback={<Card><CardContent className="p-8 text-center text-muted-foreground">Cargando prompts...</CardContent></Card>}>
        <PromptsListWrapper />
      </Suspense>
    </div>
  )
}

async function PromptsListWrapper() {
  const supabase = await createClient()
  
  // Intentar obtener de la vista de estadísticas, fallback a tabla base
  const { data: prompts, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .order('is_active', { ascending: false })
    .order('version', { ascending: false })

  if (error) {
    console.error('Error fetching prompts:', error)
    return <Card><CardContent className="p-6 text-red-500">Error al cargar prompts: {error.message}</CardContent></Card>
  }

  if (!prompts || prompts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No hay prompts registrados.</p>
          <Link href="/admin/ai-prompts/new">
            <Button>Crear primer prompt</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre / Feature</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Versión</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.map((prompt) => (
              <TableRow key={prompt.id}>
                <TableCell>
                  <div className="font-medium">{prompt.name}</div>
                  <div className="text-xs text-muted-foreground">{prompt.feature_type}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{prompt.country_code}</Badge>
                </TableCell>
                <TableCell>v{prompt.version}</TableCell>
                <TableCell>
                  {prompt.is_active ? (
                    <Badge className="bg-green-500 hover:bg-green-600">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {prompt.ai_model?.split('-').slice(0, 2).join('-')}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {prompt.created_at ? format(new Date(prompt.created_at), "dd MMM yyyy", { locale: es }) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/ai-prompts/${prompt.id}`}>
                    <Button variant="ghost" size="sm">Editar</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
