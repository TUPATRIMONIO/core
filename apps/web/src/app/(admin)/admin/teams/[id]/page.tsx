import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { EditTeamButton } from '@/components/admin/edit-team-button'
import { AddTeamMemberDialog } from '@/components/admin/add-team-member-dialog'
import { RemoveTeamMemberButton } from '@/components/admin/remove-team-member-button'
import { Badge } from '@/components/ui/badge'

async function getTeam(id: string) {
  const supabase = await createClient()

  const { data: team, error } = await supabase
    .from('teams')
    .select(`
      *,
      organizations(id, name),
      lead_user:users!teams_lead_user_id_fkey(id, full_name),
      team_members(
        id,
        team_role,
        joined_at,
        users(id, full_name)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching team:', error)
    return null
  }

  // Obtener emails de los usuarios
  if (team?.team_members) {
    const userIds = team.team_members.map((tm: any) => tm.users.id)
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    
    team.team_members = team.team_members.map((tm: any) => ({
      ...tm,
      users: {
        ...tm.users,
        email: authUsers?.users.find((u: any) => u.id === tm.users.id)?.email || 'N/A'
      }
    }))
  }

  return team
}

export default async function TeamDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const team = await getTeam(params.id)

  if (!team) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={team.name}
        description={`Team de ${team.organizations.name}`}
        actions={
          <div className="flex items-center gap-2">
            <EditTeamButton
              team={{
                id: team.id,
                name: team.name,
                description: team.description,
                organization_id: team.organization_id,
                lead_user_id: team.lead_user_id,
                color: team.color,
              }}
            />
            <Link href="/admin/teams">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 px-4 pb-6 space-y-6">
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                <div className="flex items-center gap-2 mt-1">
                  {team.color && (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                  )}
                  <p className="text-sm">{team.name}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Organización</label>
                <p className="text-sm mt-1">{team.organizations.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Líder</label>
                <p className="text-sm mt-1">{team.lead_user?.full_name || 'Sin líder'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Creado</label>
                <p className="text-sm mt-1">
                  {new Date(team.created_at).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
            {team.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                <p className="text-sm mt-1">{team.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Miembros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Miembros ({team.team_members?.length || 0})</CardTitle>
                <CardDescription>Usuarios que pertenecen a este team</CardDescription>
              </div>
              <AddTeamMemberDialog teamId={team.id} organizationId={team.organization_id} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {team.team_members && team.team_members.length > 0 ? (
                team.team_members.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{member.users.full_name || 'Sin nombre'}</p>
                      <p className="text-sm text-muted-foreground">{member.users.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.team_role && (
                        <Badge variant="outline">{member.team_role}</Badge>
                      )}
                      <RemoveTeamMemberButton
                        teamId={team.id}
                        userId={member.users.id}
                        userName={member.users.full_name || member.users.email || 'Usuario'}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay miembros en este team
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

