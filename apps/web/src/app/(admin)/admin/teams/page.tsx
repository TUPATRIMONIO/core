import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Eye, Users } from 'lucide-react'
import { EmptyState } from '@/components/admin/empty-state'
import { CreateTeamButton } from '@/components/admin/create-team-button'
import { Badge } from '@/components/ui/badge'

async function getTeams() {
  const supabase = createServiceRoleClient()

  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      *,
      organizations(name),
      team_members(count),
      lead_user:users!teams_lead_user_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching teams:', error)
    return []
  }

  return teams || []
}

export default async function TeamsPage() {
  const teams = await getTeams()

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Teams"
        description="Gestiona todos los teams del sistema"
        actions={<CreateTeamButton />}
      />

      <div className="flex-1 px-4 pb-6">
        {teams.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Users}
                title="No hay teams"
                description="Aún no se han creado teams en el sistema"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Organización</TableHead>
                    <TableHead>Líder</TableHead>
                    <TableHead>Miembros</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team: any) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {team.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: team.color }}
                            />
                          )}
                          <div>
                            <div className="font-medium">{team.name}</div>
                            {team.description && (
                              <div className="text-sm text-muted-foreground">
                                {team.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{team.organizations.name}</Badge>
                      </TableCell>
                      <TableCell>
                        {team.lead_user?.full_name || 'Sin líder'}
                      </TableCell>
                      <TableCell>
                        {team.team_members?.[0]?.count || 0}
                      </TableCell>
                      <TableCell>
                        {new Date(team.created_at).toLocaleDateString('es-CL')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/teams/${team.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
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

