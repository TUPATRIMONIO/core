import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/status-badge'
import { OrgTypeBadge } from '@/components/admin/org-type-badge'
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
import { Eye } from 'lucide-react'
import { EmptyState } from '@/components/admin/empty-state'
import { Building2 } from 'lucide-react'
import { CreateOrganizationButton } from '@/components/admin/create-organization-button'

async function getOrganizations() {
  const supabase = createServiceRoleClient()

  const { data: organizations, error } = await supabase
    .from('organizations')
    .select(`
      *,
      organization_users(count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching organizations:', error)
    return []
  }

  return organizations || []
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizations()

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Organizaciones"
        description="Gestiona todas las organizaciones del sistema"
        actions={<CreateOrganizationButton />}
      />

      <div className="flex-1 px-4 pb-6">
        {organizations.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Building2}
                title="No hay organizaciones"
                description="Aún no se han creado organizaciones en el sistema"
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org: any) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">{org.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <OrgTypeBadge type={org.org_type} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={org.status} />
                      </TableCell>
                      <TableCell>
                        {org.organization_users?.[0]?.count || 0}
                      </TableCell>
                      <TableCell>
                        {new Date(org.created_at).toLocaleDateString('es-CL')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/organizations/${org.id}`}>
                            <Button variant="ghost" size="sm" title="Ver Detalles">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
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

