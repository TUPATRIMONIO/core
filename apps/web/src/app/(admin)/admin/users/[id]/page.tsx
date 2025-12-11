
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Building2, Ticket, Package, ShoppingCart } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { CreateTicketButtonForUser } from '@/components/admin/create-ticket-buttons'
import { DetailPageLayout } from '@/components/shared/DetailPageLayout'
import { UserAssociationsClient } from '@/components/admin/UserAssociationsClient'

async function getUser(id: string) {
  const supabase = createServiceRoleClient()

  const { data: user, error } = await supabase
    .from('users')
    .select(`
      *,
      organization_users!user_id(
        id,
        role_id,
        status,
        joined_at,
        organizations(
            id,
            name,
            slug,
            org_type
        ),
        roles(
          name
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !user) {
    console.error('Error fetching user:', error)
    return null
  }

  // Get email from auth
  const { data: authUser } = await supabase.auth.admin.getUserById(id)
  
  return {
    ...user,
    email: authUser?.user?.email || 'N/A'
  }
}



export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceRoleClient()
  const user = await getUser(id)
  
  if (!user) {
    notFound()
  }

  // Get associations for this user
  const { data: associations } = await supabase.rpc('get_user_associations', { p_user_id: id })

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={user.full_name || 'Usuario'}
        description={`Detalles del usuario`}
        actions={
          <div className="flex items-center gap-2">
            <CreateTicketButtonForUser
              userId={user.id}
              userName={user.full_name || 'Usuario'}
              userEmail={user.email}
            />
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
          </div>
        }
      />

      <DetailPageLayout
        sidePanel={
          <UserAssociationsClient
            userId={user.id}
            initialOrganizations={(associations?.organizations || []).map((o: any) => ({
              id: o.id,
              name: o.name,
              subtext: o.subtext,
            }))}
            initialOrders={(associations?.orders || []).map((o: any) => ({
              id: o.id,
              name: o.name,
              subtext: o.subtext,
            }))}
            initialTickets={(associations?.tickets || []).map((t: any) => ({
              id: t.id,
              name: t.name,
              subtext: t.subtext,
            }))}
          />
        }
      >
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
                <p className="text-sm mt-1">{user.full_name || 'Sin nombre'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID</label>
                <p className="text-sm mt-1 font-mono">{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm mt-1">{user.email}</p>
              </div>
               <div>
                <label className="text-sm font-medium text-muted-foreground">Estado</label>
                <div className="mt-1">
                  <StatusBadge status={user.status} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Última actividad</label>
                <p className="text-sm mt-1">
                  {user.last_seen_at 
                    ? new Date(user.last_seen_at).toLocaleString('es-CL')
                    : 'Nunca'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Registrado</label>
                <p className="text-sm mt-1">
                  {new Date(user.created_at).toLocaleString('es-CL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DetailPageLayout>
    </div>
  )
}
