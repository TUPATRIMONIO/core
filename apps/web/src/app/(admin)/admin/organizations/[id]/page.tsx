import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/status-badge'
import { OrgTypeBadge } from '@/components/admin/org-type-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Eye, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { notFound } from 'next/navigation'
import { EditOrganizationButton } from '@/components/admin/edit-organization-button'
import { UserRoleActions } from '@/components/admin/user-role-actions'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { OrganizationOrdersFilter, OrganizationOrdersPagination } from '@/components/admin/organization-orders-filter'

const ORDERS_PER_PAGE = 10

async function getOrganization(id: string) {
  const supabase = createServiceRoleClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select(`
      *,
      organization_users(
        id,
        role_id,
        status,
        joined_at,
        users!organization_users_user_id_fkey(
          id,
          full_name
        ),
        roles(
          id,
          name,
          slug
        )
      ),
      organization_applications(
        id,
        is_enabled,
        applications(
          name,
          slug
        )
      ),
      organization_subscriptions(
        id,
        status,
        current_period_start,
        current_period_end,
        subscription_plans(
          name,
          slug
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching organization:', error)
    return null
  }

  // Obtener emails de los usuarios usando Service Role Client
  if (org?.organization_users) {
    const userIds = org.organization_users.map((ou: any) => ou.users.id)
    const { data: authUsers } = await supabase.auth.admin.listUsers()

    org.organization_users = org.organization_users.map((ou: any) => ({
      ...ou,
      users: {
        ...ou.users,
        email: authUsers?.users.find((u: any) => u.id === ou.users.id)?.email || 'N/A'
      }
    }))
  }

  return org
}

async function getOrganizationOrders(
  organizationId: string,
  params: { page: number; status?: string; from?: string; to?: string }
): Promise<{ orders: any[]; total: number }> {
  const supabase = createServiceRoleClient()
  const offset = (params.page - 1) * ORDERS_PER_PAGE

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)

  if (params.status) {
    query = query.eq('status', params.status)
  }

  if (params.from) {
    query = query.gte('created_at', params.from)
  }

  if (params.to) {
    const toDate = new Date(params.to)
    toDate.setDate(toDate.getDate() + 1)
    query = query.lt('created_at', toDate.toISOString().split('T')[0])
  }

  const { data: orders, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + ORDERS_PER_PAGE - 1)

  if (error) {
    console.error('Error fetching organization orders:', error)
    return { orders: [], total: 0 }
  }

  return { orders: orders || [], total: count || 0 }
}

async function getCreditAccount(organizationId: string) {
  const supabase = createServiceRoleClient()

  const { data: account, error } = await supabase
    .from('credit_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    // Si no existe cuenta, retornar null (no es error crítico)
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching credit account:', error)
    return null
  }

  return account
}

async function getCreditTransactions(organizationId: string, limit: number = 20) {
  const supabase = createServiceRoleClient()

  const { data: transactions, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching credit transactions:', error)
    return []
  }

  return transactions || []
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    refunded: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_payment: 'Pendiente',
    paid: 'Pagado',
    completed: 'Completado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
  }
  return labels[status] || status
}

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    page?: string
    status?: string
    from?: string
    to?: string
  }>
}) {
  const { id } = await params
  const queryParams = await searchParams
  const org = await getOrganization(id)

  if (!org) {
    notFound()
  }

  const page = parseInt(queryParams.page || '1', 10)
  const { orders, total } = await getOrganizationOrders(id, {
    page,
    status: queryParams.status,
    from: queryParams.from,
    to: queryParams.to,
  })
  const totalPages = Math.ceil(total / ORDERS_PER_PAGE)

  // Obtener información de créditos
  const creditAccount = await getCreditAccount(id)
  const creditTransactions = await getCreditTransactions(id, 20)

  const currentOrderParams = {
    status: queryParams.status,
    from: queryParams.from,
    to: queryParams.to,
    page: queryParams.page,
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={org.name}
        description={`Detalles de la organización ${org.slug}`}
        actions={
          <div className="flex items-center gap-2">
            <EditOrganizationButton
              organization={{
                id: org.id,
                name: org.name,
                slug: org.slug,
                org_type: org.org_type,
                email: org.email,
                phone: org.phone,
                country: org.country,
                status: org.status,
              }}
            />
            <Link href="/admin/organizations">
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
                <p className="text-sm mt-1">{org.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Slug</label>
                <p className="text-sm mt-1">{org.slug}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <div className="mt-1">
                  <OrgTypeBadge type={org.org_type} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Estado</label>
                <div className="mt-1">
                  <StatusBadge status={org.status} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm mt-1">{org.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                <p className="text-sm mt-1">{org.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Creada</label>
                <p className="text-sm mt-1">
                  {new Date(org.created_at).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Miembros */}
        <Card>
          <CardHeader>
            <CardTitle>Miembros ({org.organization_users?.length || 0})</CardTitle>
            <CardDescription>Usuarios que pertenecen a esta organización</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {org.organization_users?.map((ou: any) => (
                <div key={ou.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{ou.users.full_name || 'Sin nombre'}</p>
                    <p className="text-sm text-muted-foreground">{ou.users.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{ou.roles.name}</span>
                    <StatusBadge status={ou.status} />
                    <UserRoleActions
                      userId={ou.users.id}
                      userName={ou.users.full_name || ou.users.email || 'Usuario'}
                      organizationId={org.id}
                      currentRoleId={ou.role_id}
                      currentRoleName={ou.roles.name}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Aplicaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Aplicaciones Habilitadas</CardTitle>
            <CardDescription>Apps activas para esta organización</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {org.organization_applications?.filter((oa: any) => oa.is_enabled).map((oa: any) => (
                <div key={oa.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{oa.applications.name}</span>
                  <span className="text-sm text-muted-foreground">{oa.applications.slug}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Suscripción */}
        {org.organization_subscriptions && org.organization_subscriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Suscripción</CardTitle>
            </CardHeader>
            <CardContent>
              {org.organization_subscriptions.map((sub: any) => (
                <div key={sub.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{sub.subscription_plans.name}</span>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-muted-foreground">Inicio</label>
                      <p>{new Date(sub.current_period_start).toLocaleDateString('es-CL')}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Fin</label>
                      <p>{new Date(sub.current_period_end).toLocaleDateString('es-CL')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Créditos y Movimientos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Créditos y Movimientos
              </CardTitle>
              <CardDescription>
                Balance y historial de transacciones de créditos
              </CardDescription>
            </div>
            <Link href={`/admin/billing/credits`}>
              <Button variant="outline" size="sm">Ver Todas las Cuentas</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-6">
            {creditAccount ? (
              <>
                {/* Balance */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">Balance Total</div>
                    <div className="text-2xl font-bold mt-1">
                      {formatCurrency(Number(creditAccount.balance || 0))}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">Disponible</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      {formatCurrency(Number(creditAccount.balance || 0) - Number(creditAccount.reserved_balance || 0))}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">Reservado</div>
                    <div className="text-2xl font-bold text-orange-600 mt-1">
                      {formatCurrency(Number(creditAccount.reserved_balance || 0))}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">Total Ganado</div>
                    <div className="text-2xl font-bold mt-1">
                      {formatCurrency(Number(creditAccount.total_earned || 0))}
                    </div>
                  </div>
                </div>

                {/* Movimientos Recientes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Movimientos Recientes</h3>
                  {creditTransactions.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center border rounded-lg">
                      No hay movimientos de créditos registrados
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {creditTransactions.map((transaction: any) => {
                        const isEarned = transaction.type === 'earned' || transaction.type === 'refund'
                        const isSpent = transaction.type === 'spent'
                        const amount = Number(transaction.amount || 0)

                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isEarned ? (
                                <ArrowUpCircle className="h-5 w-5 text-green-600" />
                              ) : isSpent ? (
                                <ArrowDownCircle className="h-5 w-5 text-red-600" />
                              ) : (
                                <Wallet className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-medium">
                                  {transaction.description || 'Transacción de créditos'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(transaction.created_at).toLocaleString('es-CL', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })}
                                </p>
                                {transaction.service_code && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {transaction.service_code}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-bold ${
                                  isEarned
                                    ? 'text-green-600'
                                    : isSpent
                                    ? 'text-red-600'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {isEarned ? '+' : isSpent ? '-' : ''}
                                {formatCurrency(amount)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Balance: {formatCurrency(Number(transaction.balance_after || 0))}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center border rounded-lg">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Esta organización no tiene una cuenta de créditos creada aún
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pedidos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Pedidos {total > 0 && `(${total})`}
              </CardTitle>
              <CardDescription>
                {queryParams.status || queryParams.from || queryParams.to
                  ? 'Pedidos filtrados'
                  : 'Todos los pedidos de esta organización'}
              </CardDescription>
            </div>
            <Link href={`/admin/orders?organization=${org.id}`}>
              <Button variant="outline" size="sm">Ver en Panel Global</Button>
            </Link>
          </CardHeader>

          {/* Filters */}
          <OrganizationOrdersFilter
            organizationId={org.id}
            currentParams={currentOrderParams}
          />

          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                {queryParams.status || queryParams.from || queryParams.to
                  ? 'No hay pedidos con los filtros seleccionados'
                  : 'No hay pedidos'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                      <TableCell>{order.product_type}</TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {order.currency} {formatCurrency(order.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getOrderStatusColor(order.status)}>
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString('es-CL')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {/* Pagination */}
          <OrganizationOrdersPagination
            organizationId={org.id}
            currentParams={currentOrderParams}
            currentPage={page}
            totalPages={totalPages}
            totalOrders={total}
            ordersCount={orders.length}
          />
        </Card>
      </div>
    </div>
  )
}
