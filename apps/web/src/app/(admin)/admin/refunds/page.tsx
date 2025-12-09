'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CreditCard, Wallet, Search, Filter, X } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Refund {
    id: string
    order_id: string
    order_number: string
    organization_id: string
    organization_name: string
    amount: number
    currency: string
    refund_destination: 'payment_method' | 'wallet'
    status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected'
    provider: string | null
    provider_refund_id: string | null
    reason: string | null
    notes: string | null
    processed_at: string | null
    created_at: string
}

interface RefundsResponse {
    refunds: Refund[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNextPage: boolean
        hasPreviousPage: boolean
    }
}

const REFUNDS_PER_PAGE = 20

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

function formatDateTime(dateString: string): string {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: es })
}

function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
        completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    }

    const labels: Record<string, string> = {
        completed: 'Completado',
        rejected: 'Rechazado',
        processing: 'Procesando',
        approved: 'Aprobado',
        pending: 'Pendiente',
    }

    return (
        <Badge className={styles[status] || styles.pending}>
            {labels[status] || status}
        </Badge>
    )
}

function getProviderLabel(provider: string | null): string {
    if (!provider) return '-'
    const labels: Record<string, string> = {
        stripe: 'Stripe',
        transbank_webpay: 'Transbank Webpay',
        transbank_oneclick: 'Transbank OneClick',
        transbank: 'Transbank',
    }
    return labels[provider] || provider
}

export default function RefundsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [refunds, setRefunds] = useState<Refund[]>([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState<RefundsResponse['pagination'] | null>(null)
    
    // Filters
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
    const [providerFilter, setProviderFilter] = useState(searchParams.get('provider') || 'all')
    const [destinationFilter, setDestinationFilter] = useState(searchParams.get('destination') || 'all')
    const [orderIdFilter, setOrderIdFilter] = useState(searchParams.get('order_id') || '')
    
    // Convertir fechas ISO a formato YYYY-MM-DD para inputs
    const fromDateParam = searchParams.get('from_date')
    const toDateParam = searchParams.get('to_date')
    const [fromDate, setFromDate] = useState(
        fromDateParam ? new Date(fromDateParam).toISOString().split('T')[0] : ''
    )
    const [toDate, setToDate] = useState(
        toDateParam ? new Date(toDateParam).toISOString().split('T')[0] : ''
    )
    
    const [minAmount, setMinAmount] = useState(searchParams.get('min_amount') || '')
    const [maxAmount, setMaxAmount] = useState(searchParams.get('max_amount') || '')
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))

    const fetchRefunds = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            
            if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
            if (providerFilter && providerFilter !== 'all') params.set('provider', providerFilter)
            if (destinationFilter && destinationFilter !== 'all') params.set('refund_destination', destinationFilter)
            if (orderIdFilter) params.set('order_id', orderIdFilter)
            if (fromDate) {
                // Convertir fecha a ISO string con hora 00:00:00
                const fromDateISO = new Date(fromDate + 'T00:00:00Z').toISOString()
                params.set('from_date', fromDateISO)
            }
            if (toDate) {
                // Convertir fecha a ISO string con hora 23:59:59
                const toDateISO = new Date(toDate + 'T23:59:59Z').toISOString()
                params.set('to_date', toDateISO)
            }
            if (minAmount) params.set('min_amount', minAmount)
            if (maxAmount) params.set('max_amount', maxAmount)
            params.set('page', page.toString())
            params.set('limit', REFUNDS_PER_PAGE.toString())

            const response = await fetch(`/api/admin/refunds?${params.toString()}`)
            if (!response.ok) {
                throw new Error('Error al cargar reembolsos')
            }

            const data: RefundsResponse = await response.json()
            setRefunds(data.refunds)
            setPagination(data.pagination)
            
            // Update URL without reload
            router.replace(`/admin/refunds?${params.toString()}`, { scroll: false })
        } catch (error) {
            console.error('Error fetching refunds:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRefunds()
    }, [page, statusFilter, providerFilter, destinationFilter, orderIdFilter, fromDate, toDate, minAmount, maxAmount])

    const clearFilters = () => {
        setStatusFilter('all')
        setProviderFilter('all')
        setDestinationFilter('all')
        setOrderIdFilter('')
        setFromDate('')
        setToDate('')
        setMinAmount('')
        setMaxAmount('')
        setPage(1)
    }

    const hasActiveFilters = (statusFilter && statusFilter !== 'all') || (providerFilter && providerFilter !== 'all') || (destinationFilter && destinationFilter !== 'all') || orderIdFilter || fromDate || toDate || minAmount || maxAmount

    return (
        <div className="flex flex-1 flex-col">
            <PageHeader
                title="Reembolsos"
                description="Gestión y consulta de reembolsos procesados"
            />

            <div className="flex-1 px-4 pb-6 space-y-6">
                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="ml-auto"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Limpiar
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Estado</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="approved">Aprobado</SelectItem>
                                        <SelectItem value="processing">Procesando</SelectItem>
                                        <SelectItem value="completed">Completado</SelectItem>
                                        <SelectItem value="rejected">Rechazado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="provider">Proveedor</Label>
                                <Select value={providerFilter} onValueChange={setProviderFilter}>
                                    <SelectTrigger id="provider">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="stripe">Stripe</SelectItem>
                                        <SelectItem value="transbank_webpay">Transbank Webpay</SelectItem>
                                        <SelectItem value="transbank_oneclick">Transbank OneClick</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="destination">Destino</Label>
                                <Select value={destinationFilter} onValueChange={setDestinationFilter}>
                                    <SelectTrigger id="destination">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="payment_method">Tarjeta Original</SelectItem>
                                        <SelectItem value="wallet">Monedero Digital</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="from_date">Desde</Label>
                                <Input
                                    id="from_date"
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="to_date">Hasta</Label>
                                <Input
                                    id="to_date"
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="min_amount">Monto Mínimo</Label>
                                <Input
                                    id="min_amount"
                                    type="number"
                                    placeholder="0"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="max_amount">Monto Máximo</Label>
                                <Input
                                    id="max_amount"
                                    type="number"
                                    placeholder="0"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Refunds Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                                Reembolsos ({pagination?.total || 0})
                            </CardTitle>
                            {orderIdFilter && (
                                <Link href={`/admin/orders/${orderIdFilter}`}>
                                    <Button variant="outline" size="sm">
                                        Ver pedido
                                    </Button>
                                </Link>
                            )}
                        </div>
                        {orderIdFilter && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Mostrando reembolsos del pedido específico
                            </p>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                Cargando reembolsos...
                            </div>
                        ) : refunds.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No se encontraron reembolsos
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Pedido</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Monto</TableHead>
                                            <TableHead>Destino</TableHead>
                                            <TableHead>Proveedor</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>ID Proveedor</TableHead>
                                            <TableHead>Razón</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {refunds.map((refund) => (
                                            <TableRow key={refund.id}>
                                                <TableCell className="text-sm">
                                                    {formatDateTime(refund.created_at)}
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={`/admin/orders/${refund.order_id}`}
                                                        className="font-mono text-sm hover:underline"
                                                    >
                                                        {refund.order_number}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={`/admin/organizations/${refund.organization_id}`}
                                                        className="text-sm hover:underline"
                                                    >
                                                        {refund.organization_name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {refund.currency} {formatCurrency(refund.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={refund.refund_destination === 'wallet' ? 'default' : 'outline'}>
                                                        {refund.refund_destination === 'wallet' ? (
                                                            <>
                                                                <Wallet className="h-3 w-3 mr-1" />
                                                                Monedero
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CreditCard className="h-3 w-3 mr-1" />
                                                                Tarjeta
                                                            </>
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {refund.provider ? (
                                                        <Badge variant="outline">
                                                            {getProviderLabel(refund.provider)}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(refund.status)}
                                                </TableCell>
                                                <TableCell>
                                                    {refund.provider_refund_id ? (
                                                        <div className="font-mono text-xs max-w-[120px] truncate" title={refund.provider_refund_id}>
                                                            {refund.provider_refund_id}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm max-w-[150px] truncate" title={refund.reason || ''}>
                                                    {refund.reason || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {pagination && pagination.totalPages > 1 && (
                                    <div className="p-4 border-t flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            Mostrando página {pagination.page} de {pagination.totalPages} ({pagination.total} total)
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={!pagination.hasPreviousPage}
                                            >
                                                Anterior
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => p + 1)}
                                                disabled={!pagination.hasNextPage}
                                            >
                                                Siguiente
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

