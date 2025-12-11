
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
import { AssociationsPanel } from '@/components/shared/AssociationsPanel'

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

async function getUserOrders(userId: string): Promise<any[]> {
  const supabase = createServiceRoleClient()
  
  // Get user's organizations first
  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')
  
  if (!orgUsers || orgUsers.length === 0) return []
  
  const orgIds = orgUsers.map(ou => ou.organization_id)
  
  // Get orders for those organizations
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, amount, currency, status, created_at')
    .in('organization_id', orgIds)
    .order('created_at', { ascending: false })
    .limit(5)
  
  return orders || []
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUser(id)
  const recentOrders = await getUserOrders(id)

  if (!user) {
    notFound()
  }

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
          <AssociationsPanel
            title="Asociaciones"
            sections={[
              {
                id: 'organizations',
                title: 'Organizaciones',
                type: 'organization',
                items: (user.organization_users || []).map((ou: any) => ({
                  id: ou.organizations.id,
                  name: ou.organizations.name,
                  subtext: `${ou.roles.name} · ${ou.organizations.org_type}`,
                  href: `/admin/organizations/${ou.organizations.id}`,
                })),
                canAdd: false,
                canRemove: false,
              },
              {
                id: 'orders',
                title: 'Pedidos Recientes',
                type: 'order',
                items: recentOrders.map((order: any) => ({
                  id: order.id,
                  name: `#${order.order_number}`,
                  subtext: `${order.currency} ${order.amount} · ${order.status}`,
                  href: `/admin/orders/${order.id}`,
                })),
                canAdd: false,
                canRemove: false,
              },
            ]}
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
