import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Mail, Phone, ArrowLeft, Settings } from 'lucide-react'
import { NotaryApprovalActions } from '@/components/admin/notary-approval-actions'

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

async function getNotary(id: string) {
  const supabase = createServiceRoleClient()

  const { data: notary, error } = await supabase
    .from('signing_notary_offices')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !notary) {
    return null
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, slug, status')
    .eq('id', notary.organization_id)
    .single()

  return { notary, organization }
}

export default async function NotaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getNotary(id)

  if (!data) {
    notFound()
  }

  const { notary, organization } = data
  const statusInfo = statusConfig[notary.approval_status as NotaryStatus]

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={notary.name}
        description="Detalle y aprobación de notaría"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/organizations/notaries">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/admin/organizations/notaries/${notary.id}/services`}>
                <Settings className="mr-2 h-4 w-4" />
                Gestionar servicios
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex-1 space-y-6 px-4 pb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[var(--tp-buttons)]" />
              Información de la notaría
            </CardTitle>
            {statusInfo ? (
              <Badge variant="outline" className={statusInfo.className}>
                {statusInfo.label}
              </Badge>
            ) : (
              <Badge variant="outline">{notary.approval_status}</Badge>
            )}
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Organización:</span>
                <span className="text-muted-foreground">{organization?.name || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Ubicación:</span>
                <span className="text-muted-foreground">
                  {notary.city || '—'}, {notary.country_code || '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Dirección:</span>
                <span className="text-muted-foreground">{notary.address || '—'}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span className="text-muted-foreground">{notary.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Teléfono:</span>
                <span className="text-muted-foreground">{notary.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Registro:</span>
                <span className="text-muted-foreground">
                  {new Date(notary.created_at).toLocaleDateString('es-CL')}
                </span>
              </div>
              {notary.rejection_reason && (
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                  Motivo de rechazo: {notary.rejection_reason}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones de aprobación</CardTitle>
          </CardHeader>
          <CardContent>
            <NotaryApprovalActions
              notaryId={notary.id}
              currentStatus={notary.approval_status as NotaryStatus}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
