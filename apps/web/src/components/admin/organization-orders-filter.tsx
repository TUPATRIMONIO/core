'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface OrganizationOrdersFilterProps {
    organizationId: string
    currentParams: {
        status?: string
        from?: string
        to?: string
        page?: string
    }
}

const ORDER_STATUSES = [
    { value: '', label: 'Todos' },
    { value: 'pending_payment', label: 'Pendiente' },
    { value: 'paid', label: 'Pagado' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'refunded', label: 'Reembolsado' },
]

function buildFilterUrl(
    organizationId: string,
    baseParams: Record<string, string | undefined>,
    changes: Record<string, string | undefined>
): string {
    const params = new URLSearchParams()
    const merged = { ...baseParams, ...changes }

    Object.entries(merged).forEach(([key, value]) => {
        if (value && value !== '') {
            params.set(key, value)
        }
    })

    const queryString = params.toString()
    return queryString
        ? `/admin/organizations/${organizationId}?${queryString}`
        : `/admin/organizations/${organizationId}`
}

export function OrganizationOrdersFilter({
    organizationId,
    currentParams,
}: OrganizationOrdersFilterProps) {
    const router = useRouter()

    const handleStatusChange = (status: string) => {
        const url = buildFilterUrl(organizationId, currentParams, { status, page: '1' })
        router.push(url)
    }

    const handleDateChange = (name: 'from' | 'to', value: string) => {
        const url = buildFilterUrl(organizationId, currentParams, { [name]: value || undefined, page: '1' })
        router.push(url)
    }

    const handleClearFilters = () => {
        router.push(`/admin/organizations/${organizationId}`)
    }

    const hasFilters = currentParams.status || currentParams.from || currentParams.to

    return (
        <div className="flex flex-wrap items-center gap-3 p-4 border-b">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Estado:</span>
                <div className="flex gap-1 flex-wrap">
                    {ORDER_STATUSES.map((statusOption) => (
                        <Button
                            key={statusOption.value}
                            size="sm"
                            variant={
                                currentParams.status === statusOption.value ||
                                    (!currentParams.status && statusOption.value === '')
                                    ? 'default'
                                    : 'outline'
                            }
                            className="text-xs h-7"
                            onClick={() => handleStatusChange(statusOption.value)}
                        >
                            {statusOption.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Desde:</span>
                <input
                    type="date"
                    defaultValue={currentParams.from || ''}
                    className="text-sm border rounded px-2 py-1 h-7 bg-background"
                    onChange={(e) => handleDateChange('from', e.target.value)}
                />
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Hasta:</span>
                <input
                    type="date"
                    defaultValue={currentParams.to || ''}
                    className="text-sm border rounded px-2 py-1 h-7 bg-background"
                    onChange={(e) => handleDateChange('to', e.target.value)}
                />
            </div>

            {/* Clear Filters */}
            {hasFilters && (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleClearFilters}>
                    Limpiar filtros
                </Button>
            )}
        </div>
    )
}

interface OrganizationOrdersPaginationProps {
    organizationId: string
    currentParams: {
        status?: string
        from?: string
        to?: string
        page?: string
    }
    currentPage: number
    totalPages: number
    totalOrders: number
    ordersCount: number
}

export function OrganizationOrdersPagination({
    organizationId,
    currentParams,
    currentPage,
    totalPages,
    totalOrders,
    ordersCount,
}: OrganizationOrdersPaginationProps) {
    const router = useRouter()

    if (totalPages <= 1) return null

    const handlePageChange = (page: number) => {
        const url = buildFilterUrl(organizationId, currentParams, { page: String(page) })
        router.push(url)
    }

    return (
        <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} · Mostrando {ordersCount} de {totalOrders} pedidos
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                >
                    Anterior
                </Button>

                {/* Page numbers */}
                <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number
                        if (totalPages <= 5) {
                            pageNum = i + 1
                        } else if (currentPage <= 3) {
                            pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                        } else {
                            pageNum = currentPage - 2 + i
                        }

                        return (
                            <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => handlePageChange(pageNum)}
                            >
                                {pageNum}
                            </Button>
                        )
                    })}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    )
}
