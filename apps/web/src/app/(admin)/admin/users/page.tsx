import { createClient } from '@/lib/supabase/server'
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
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Eye, Users } from 'lucide-react'
import { EmptyState } from '@/components/admin/empty-state'
import { Badge } from '@/components/ui/badge'

async function getUsers() {
  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from('users')
    .select(`
      *,
      organization_users!inner(
        organization_id,
        organizations(name)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  // Obtener emails de auth
  const { data: authData } = await supabase.auth.admin.listUsers()
  
  const usersWithEmail = users?.map(user => ({
    ...user,
    email: authData?.users.find(au => au.id === user.id)?.email || 'N/A'
  })) || []

  return usersWithEmail
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Usuarios"
        description="Gestiona todos los usuarios del sistema"
      />

      <div className="flex-1 px-4 pb-6">
        {users.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Users}
                title="No hay usuarios"
                description="Aún no se han registrado usuarios en el sistema"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organizaciones</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última actividad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.full_name || 'Sin nombre'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        {user.organization_users?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {user.organization_users.slice(0, 2).map((ou: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {ou.organizations.name}
                              </Badge>
                            ))}
                            {user.organization_users.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{user.organization_users.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={user.status} />
                      </TableCell>
                      <TableCell>
                        {user.last_seen_at 
                          ? new Date(user.last_seen_at).toLocaleDateString('es-CL')
                          : 'Nunca'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/users/${user.id}`}>
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

