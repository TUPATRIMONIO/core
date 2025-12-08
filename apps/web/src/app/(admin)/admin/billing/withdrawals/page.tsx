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
import { Eye, Wallet, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { EmptyState } from '@/components/admin/empty-state'
import { Badge } from '@/components/ui/badge'

interface WithdrawalRequest {
    id: string
    organization_id: string
    requested_by: string | null
    credits_amount: number
    currency: string
    final_amount: number | null
    status: string
    created_at: string
    organization_name?: string
    requested_by_email?: string
    requested_by_name?: string
}

interface PageProps {
    searchParams: Promise<{
        page?: string
        status?: string
    }>
}

const ITEMS_PER_PAGE = 20

const WITHDRAWAL_STATUSES = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'processing', label: 'En Proceso' },
    { value: 'completed', label: 'Completado' },
    { value: 'rejected', label: 'Rechazado' },
]

async function getWithdrawalRequests(params: {
    page: number
    status?: string
}): Promise<{ requests: WithdrawalRequest[], total: number }> {
    const supabase = createServiceRoleClient()

    const offset = (params.page - 1) * ITEMS_PER_PAGE

    // Build query
    let query = supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact' })

    // Apply filters
    if (params.status) {
        query = query.eq('status', params.status)
    }

    // Order and paginate
    const { data: requests, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1)

    if (error) {
        console.error('Error fetching withdrawal requests:', error)
        return { requests: [], total: 0 }
    }

    return { requests: requests || [], total: count || 0 }
}

function formatCurrency(amount: number | null, currency: string): string {
    if (amount === null) return 'N/A'
    return new Intl.NumberFormat('es-CL', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

function getWithdrawalStatusColor(status: string): string {
    const colors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        processing: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
}

function getWithdrawalStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        pending: 'Pendiente',
        approved: 'Aprobado',
        processing: 'En Proceso',
        completed: 'Completado',
        rejected: 'Rechazado',
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
    return queryString ? `/admin/billing/withdrawals?${queryString}` : '/admin/billing/withdrawals'
}

export default async function WithdrawalsPage({ searchParams }: PageProps) {
    const params = await searchParams
    const page = parseInt(params.page || '1', 10)
    const { requests, total } = await getWithdrawalRequests({
        page,
        status: params.status,
    })

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
    const hasFilters = params.status

    const currentParams = {
        status: params.status,
    }

    return (
        <div className="flex flex-1 flex-col">
            <PageHeader
                title="Retiros de Monedero"
                description={`Gestiona solicitudes de retiro de créditos${total > 0 ? ` · ${total} resultados` : ''}`}
            />

            <div className="flex-1 px-4 pb-6 space-y-6">
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
                                    {WITHDRAWAL_STATUSES.map((statusOption) => (
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

                            {/* Clear Filters */}
                            {hasFilters && (
                                <Link href="/admin/billing/withdrawals">
                                    <Button variant="ghost" size="sm" className="text-xs h-7">
                                        Limpiar filtros
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                {requests.length === 0 ? (
                    <Card>
                        <CardContent className="p-0">
                            <EmptyState
                                icon={Wallet}
                                title="No hay solicitudes de retiro"
                                description={hasFilters ? "No se encontraron solicitudes con los filtros seleccionados" : "Aún no se han creado solicitudes de retiro"}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Organización</TableHead>
                                        <TableHead>Solicitado por</TableHead>
                                        <TableHead>Créditos</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/admin/organizations/${request.organization_id}`}
                                                    className="hover:underline"
                                                >
                                                    {request.organization_name || 'N/A'}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                {request.requested_by_name || request.requested_by_email || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono">
                                                    {request.credits_amount.toLocaleString('es-CL')} créditos
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono">
                                                    {request.currency} {formatCurrency(request.final_amount, request.currency)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getWithdrawalStatusColor(request.status)}>
                                                    {getWithdrawalStatusLabel(request.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(request.created_at).toLocaleDateString('es-CL')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/billing/withdrawals/${request.id}`}>
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Página {page} de {totalPages} · Mostrando {requests.length} de {total} solicitudes
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

