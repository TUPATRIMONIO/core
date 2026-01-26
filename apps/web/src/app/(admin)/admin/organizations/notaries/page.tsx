import Link from 'next/link'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/admin/empty-state'
import { Building2, Eye } from 'lucide-react'

type NotaryStatus = 'pending' | 'approved' | 'rejected'

const statusConfig: Record<NotaryStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  approved: {
    label: 'Aprobada',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  rejected: {
    label: 'Rechazada',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
}

const statusFilters: { label: string; value: 'all' | NotaryStatus }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Aprobadas', value: 'approved' },
  { label: 'Rechazadas', value: 'rejected' },
]

async function getNotaries(status?: 'all' | NotaryStatus) {
  const supabase = createServiceRoleClient()
  let query = supabase
    .from('signing_notary_offices')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('approval_status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching notaries:', error)
    return []
  }

  return data || []
}

export default async function NotariesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const normalizedStatus = (status || 'all') as 'all' | NotaryStatus
  const notaries = await getNotaries(normalizedStatus)

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Notarías"
        description="Gestiona las notarías registradas en la plataforma"
        actions={
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                asChild
                variant={normalizedStatus === filter.value ? 'default' : 'outline'}
                className={
                  normalizedStatus === filter.value
                    ? 'bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white'
                    : ''
                }
              >
                <Link
                  href={
                    filter.value === 'all'
                      ? '/admin/organizations/notaries'
                      : `/admin/organizations/notaries?status=${filter.value}`
                  }
                >
                  {filter.label}
                </Link>
              </Button>
            ))}
            <Button asChild variant="outline">
              <Link href="/admin/organizations/notaries/distribution">
                Ver distribución
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex-1 px-4 pb-6">
        {notaries.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Building2}
                title="No hay notarías"
                description="Aún no se han registrado notarías en el sistema"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Notaría</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notaries.map((notary: any) => {
                    const statusInfo = statusConfig[notary.approval_status as NotaryStatus]

                    return (
                      <TableRow key={notary.id}>
                        <TableCell>
                          <div className="font-medium">{notary.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {notary.organization_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{notary.city || '—'}</div>
                          <div className="text-xs text-muted-foreground">
                            {notary.country_code || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{notary.email || '—'}</div>
                          <div className="text-xs text-muted-foreground">
                            {notary.phone || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {statusInfo ? (
                            <Badge variant="outline" className={statusInfo.className}>
                              {statusInfo.label}
                            </Badge>
                          ) : (
                            <Badge variant="outline">{notary.approval_status}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(notary.created_at).toLocaleDateString('es-CL')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/organizations/notaries/${notary.id}`}>
                            <Button variant="ghost" size="sm" title="Ver Detalles">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

