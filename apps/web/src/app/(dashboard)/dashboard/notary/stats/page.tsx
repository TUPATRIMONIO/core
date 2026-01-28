import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, CheckCircle, Clock, FileText } from 'lucide-react'

async function getNotaryStats(organizationId: string) {
  const supabase = await createClient()

  // 1) Obtener la oficina notarial
  const { data: notary } = await supabase
    .from('signing_notary_offices')
    .select('id, name')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (!notary) return null

  // 2) Obtener estadísticas de asignaciones
  const { data: assignments } = await supabase
    .from('signing_notary_assignments')
    .select('status, assigned_at, completed_at')
    .eq('notary_office_id', notary.id)

  const stats = {
    total: assignments?.length || 0,
    pending: assignments?.filter(a => a.status === 'pending' || a.status === 'received' || a.status === 'in_progress').length || 0,
    completed: assignments?.filter(a => a.status === 'completed').length || 0,
    rejected: assignments?.filter(a => a.status === 'rejected').length || 0,
  }

  return { notary, stats }
}

export default async function NotaryStatsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: activeOrg } = await supabase.rpc('get_user_active_organization', {
    user_id: user.id,
  })

  if (!activeOrg || activeOrg.length === 0) {
    redirect('/onboarding')
  }

  const data = await getNotaryStats(activeOrg[0].id)

  if (!data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estadísticas y Reportes"
        description={`Resumen de actividad para ${data.notary.name}`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asignados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
            <BarChart3 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente: Gráficos Detallados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
            Estamos preparando reportes visuales de tiempos de respuesta y volumen mensual.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
