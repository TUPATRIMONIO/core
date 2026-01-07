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
import { Eye, ShoppingCart, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { EmptyState } from '@/components/admin/empty-state'
import { Badge } from '@/components/ui/badge'
import { OrdersDateFilter } from '@/components/admin/orders-date-filter'
import { OrderRestartAdminAction } from '@/components/admin/OrderRestartAdminAction'

interface Order {
    id: string
    order_number: string
    status: string
    product_type: string
    amount: number
    currency: string
    organization_id: string
    created_at: string
    organization?: {
        name: string
        slug: string
    }
    signing_documents?: {
        id: string
        status: string
        signers_count: number
        signed_count: number
    }[]
}

interface PageProps {
    searchParams: Promise<{
        page?: string
        status?: string
        from?: string
        to?: string
        organization?: string
    }>
}

const ITEMS_PER_PAGE = 20

const ORDER_STATUSES = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending_payment', label: 'Pendiente de Pago' },
    { value: 'paid', label: 'Pagado' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'refunded', label: 'Reembolsado' },
]

async function getOrders(params: {
    page: number
    status?: string
    from?: string
    to?: string
    organization?: string
}): Promise<{ orders: Order[], total: number }> {
    const supabase = createServiceRoleClient()

    const offset = (params.page - 1) * ITEMS_PER_PAGE

    // Build query
    let query = supabase
        .from('orders')
        .select('*, signing_documents!order_id(id, status, signers_count, signed_count)', { count: 'exact' })

    // Apply filters
    if (params.status) {
        query = query.eq('status', params.status)
    }

    if (params.from) {
        query = query.gte('created_at', params.from)
    }

    if (params.to) {
        // Add one day to include the entire "to" day
        const toDate = new Date(params.to)
        toDate.setDate(toDate.getDate() + 1)
        query = query.lt('created_at', toDate.toISOString().split('T')[0])
    }

    if (params.organization) {
        query = query.eq('organization_id', params.organization)
    }

    // Order and paginate
    const { data: orders, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1)

    if (error) {
        console.error('Error fetching orders:', error)
        return { orders: [], total: 0 }
    }

    // Get organization names for each order
    const orgIds = [...new Set(orders?.map(o => o.organization_id) || [])]

    if (orgIds.length > 0) {
        const { data: orgs } = await supabase
            .from('organizations')
            .select('id, name, slug')
            .in('id', orgIds)

        const orgMap = new Map(
            orgs?.map(o => [o.id, { name: o.name, slug: o.slug }]) || []
        )

        return {
            orders: (orders || []).map(order => ({
                ...order,
                organization: orgMap.get(order.organization_id)
            })),
            total: count || 0
        }
    }

    return { orders: orders || [], total: count || 0 }
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

function buildFilterUrl(baseParams: Record<string, string | undefined>, changes: Record<string, string | undefined>): string {
    const params = new URLSearchParams()
    const merged = { ...baseParams, ...changes }

    Object.entries(merged).forEach(([key, value]) => {
        if (value && value !== '') {
            params.set(key, value)
        }
    })

    const queryString = params.toString()
    return queryString ? `/admin/orders?${queryString}` : '/admin/orders'
}

export default async function OrdersPage({ searchParams }: PageProps) {
    const params = await searchParams
    const page = parseInt(params.page || '1', 10)
    const { orders, total } = await getOrders({
        page,
        status: params.status,
        from: params.from,
        to: params.to,
        organization: params.organization,
    })

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
    const hasFilters = params.status || params.from || params.to || params.organization

    // Stats (from current filtered results context)
    const pendingOrders = orders.filter(o => o.status === 'pending_payment').length
    const completedOrders = orders.filter(o => o.status === 'completed').length
    const paidOrders = orders.filter(o => o.status === 'paid').length

    const currentParams = {
        status: params.status,
        from: params.from,
        to: params.to,
        organization: params.organization,
    }

    return (
        <div className="flex flex-1 flex-col">
            <PageHeader
                title="Pedidos"
                description={`Gestiona todos los pedidos del sistema${total > 0 ? ` · ${total} resultados` : ''}`}
            />

            <div className="flex-1 px-4 pb-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">{total}</div>
                            <div className="text-sm text-muted-foreground">Total Pedidos</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
                            <div className="text-sm text-muted-foreground">Pendientes (página)</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-blue-600">{paidOrders}</div>
                            <div className="text-sm text-muted-foreground">Pagados (página)</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
                            <div className="text-sm text-muted-foreground">Completados (página)</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Filtros:</span>
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-muted-foreground">Estado:</label>
                                <div className="flex gap-1 flex-wrap">
                                    {ORDER_STATUSES.map((statusOption) => (
                                        <Link
                                            key={statusOption.value}
                                            href={buildFilterUrl(currentParams, { status: statusOption.value, page: '1' })}
                                        >
                                            <Button
                                                size="sm"
                                                variant={params.status === statusOption.value || (!params.status && statusOption.value === '') ? 'default' : 'outline'}
                                                className="text-xs h-7"
                                            >
                                                {statusOption.label}
                                            </Button>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Date Filters */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-muted-foreground">Desde:</label>
                                <OrdersDateFilter
                                    name="from"
                                    value={params.from}
                                    currentParams={currentParams}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-sm text-muted-foreground">Hasta:</label>
                                <OrdersDateFilter
                                    name="to"
                                    value={params.to}
                                    currentParams={currentParams}
                                />
                            </div>

                            {/* Clear Filters */}
                            {hasFilters && (
                                <Link href="/admin/orders">
                                    <Button variant="ghost" size="sm" className="text-xs h-7">
                                        Limpiar filtros
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="p-0">
                            <EmptyState
                                icon={ShoppingCart}
                                title="No hay pedidos"
                                description={hasFilters ? "No se encontraron pedidos con los filtros seleccionados" : "Aún no se han creado pedidos en el sistema"}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Número</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-sm">
                                                {order.order_number}
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/admin/organizations/${order.organization_id}`}
                                                    className="hover:underline"
                                                >
                                                    {order.organization?.name || 'N/A'}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{order.product_type}</Badge>
                                            </TableCell>
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
                                                <div className="flex items-center justify-end gap-2">
                                                    <OrderRestartAdminAction order={{
                                                        ...order,
                                                        signing_document: order.signing_documents?.[0] || null
                                                    }} />
                                                    <Link href={`/admin/orders/${order.id}`}>
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Página {page} de {totalPages} · Mostrando {orders.length} de {total} pedidos
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href={page > 1 ? buildFilterUrl(currentParams, { page: String(page - 1) }) : '#'}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Anterior
                                </Button>
                            </Link>

                            {/* Page numbers */}
                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum: number
                                    if (totalPages <= 5) {
                                        pageNum = i + 1
                                    } else if (page <= 3) {
                                        pageNum = i + 1
                                    } else if (page >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i
                                    } else {
                                        pageNum = page - 2 + i
                                    }

                                    return (
                                        <Link key={pageNum} href={buildFilterUrl(currentParams, { page: String(pageNum) })}>
                                            <Button
                                                variant={page === pageNum ? 'default' : 'outline'}
                                                size="sm"
                                                className="w-8 h-8 p-0"
                                            >
                                                {pageNum}
                                            </Button>
                                        </Link>
                                    )
                                })}
                            </div>

                            <Link
                                href={page < totalPages ? buildFilterUrl(currentParams, { page: String(page + 1) }) : '#'}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                >
                                    Siguiente
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
