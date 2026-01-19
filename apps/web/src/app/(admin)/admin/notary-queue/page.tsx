import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

async function checkAccess() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select(`
      role:roles(slug, level)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')

  const hasAccess = orgUsers?.some((ou: any) =>
    ou.role?.slug === 'document_reviewer' || ou.role?.level >= 9
  )

  if (!hasAccess) {
    redirect('/dashboard')
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'needs_correction':
      return <Badge variant="destructive">Requiere corrección</Badge>
    case 'needs_documents':
      return <Badge variant="destructive">Faltan documentos</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rechazado</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default async function NotaryQueuePage() {
  await checkAccess()

  const supabase = createServiceRoleClient()

  const { data: assignments, error } = await supabase
    .from('signing_notary_assignments')
    .select(`
      id,
      status,
      correction_request,
      rejection_reason,
      assigned_at,
      document:signing_documents(
        id,
        title,
        status,
        organization_id,
        organization:core.organizations(name)
      ),
      notary_office:signing_notary_offices(name)
    `)
    .in('status', ['needs_correction', 'needs_documents', 'rejected'])
    .order('assigned_at', { ascending: false })

  if (error) {
    console.error('Error loading notary queue:', error)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cola Notarial"
        description="Observaciones y rechazos que deben gestionar el equipo interno"
      />

      <Card>
        <CardHeader>
          <CardTitle>Documentos con observaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(assignments || []).length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No hay observaciones pendientes.
            </div>
          ) : (
            (assignments || []).map((a: any) => (
              <div key={a.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {a.document?.title || a.document?.id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Cliente: {a.document?.organization?.name || a.document?.organization_id || '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Notaría: {a.notary_office?.name || '—'}
                    </div>
                  </div>
                  <div className="shrink-0">{statusBadge(a.status)}</div>
                </div>

                {(a.correction_request || a.rejection_reason) && (
                  <div className="text-sm text-muted-foreground border-l-2 border-[var(--tp-lines-30)] pl-3">
                    {a.correction_request || a.rejection_reason}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/dashboard/signing/documents/${a.document?.id}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  >
                    <Button size="sm" variant="outline">
                      Ver documento
                    </Button>
                  </a>
                  <a
                    href="/admin/communications/tickets/new"
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  >
                    <Button size="sm" className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                      Crear ticket al cliente
                    </Button>
                  </a>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
