import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Mail } from 'lucide-react'
import { EmptyState } from '@/components/admin/empty-state'
import { CreateInvitationButton } from '@/components/admin/create-invitation-button'
import { CancelInvitationButton } from '@/components/admin/cancel-invitation-button'

async function getInvitations() {
  const supabase = createServiceRoleClient()

  const { data: invitations, error } = await supabase
    .from('invitations')
    .select(`
      *,
      organizations(name),
      roles(name),
      invited_by_user:users!invited_by(full_name)
    `)
    .order('invited_at', { ascending: false })

  if (error) {
    console.error('Error fetching invitations:', error)
    return []
  }

  return invitations || []
}

export default async function InvitationsPage() {
  const invitations = await getInvitations()

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Invitaciones"
        description="Gestiona todas las invitaciones del sistema"
        actions={<CreateInvitationButton />}
      />

      <div className="flex-1 px-4 pb-6">
        {invitations.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Mail}
                title="No hay invitaciones"
                description="Aún no se han enviado invitaciones en el sistema"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Organización</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Invitado por</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Expira</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation: any) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>{invitation.organizations.name}</TableCell>
                      <TableCell>{invitation.roles.name}</TableCell>
                      <TableCell>
                        {invitation.invited_by_user?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={invitation.status} />
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.expires_at).toLocaleDateString('es-CL')}
                      </TableCell>
                      <TableCell className="text-right">
                        {invitation.status === 'pending' && (
                          <CancelInvitationButton
                            invitationId={invitation.id}
                            invitationEmail={invitation.email}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

