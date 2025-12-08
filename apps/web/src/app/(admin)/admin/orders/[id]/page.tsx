import { createServiceRoleClient } from '@/lib/supabase/server'
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
import Link from 'next/link'
import { ArrowLeft, Calendar, Package, Wallet, User, Clock, FileText } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface PageProps {
    params: Promise<{ id: string }>
}

async function getOrderDetails(orderId: string) {
    const supabase = createServiceRoleClient()

    // Get order details - use public view
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

    if (orderError || !order) {
        return null
    }

    // Get organization
    const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug, email, phone, org_type')
        .eq('id', order.organization_id)
        .single()

    // Get order history - use public view
    const { data: history } = await supabase
        .from('order_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

    // Get payment if exists - use public view
    let payment = null
    if (order.payment_id) {
        const { data: paymentData } = await supabase
            .from('payments')
            .select('*')
            .eq('id', order.payment_id)
            .single()
        payment = paymentData
    }

    // Get invoice if exists - use public view
    let invoice = null
    if (order.invoice_id) {
        const { data: invoiceData } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', order.invoice_id)
            .single()
        invoice = invoiceData
    }

    return {
        ...order,
        organization: org,
        history: history || [],
        payment,
        invoice,
    }
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
        pending_payment: 'Pendiente de Pago',
        paid: 'Pagado',
        completed: 'Completado',
        cancelled: 'Cancelado',
        refunded: 'Reembolsado',
    }
    return labels[status] || status
}

function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('es-CL', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

export default async function OrderDetailPage({ params }: PageProps) {
    const { id } = await params
    const order = await getOrderDetails(id)

    if (!order) {
        notFound()
    }

    const productData = order.product_data as Record<string, any> || {}

    return (
        <div className="flex flex-1 flex-col">
            <PageHeader
                title={`Pedido ${order.order_number}`}
                description={`Detalle del pedido · ${order.product_type}`}
                actions={
                    <Link href="/admin/orders">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                    </Link>
                }
            />

            <div className="flex-1 px-4 pb-6 space-y-6">
                {/* Status and Quick Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <Badge className={`${getOrderStatusColor(order.status)} text-sm`}>
                                    {getOrderStatusLabel(order.status)}
                                </Badge>
                                <div className="text-sm text-muted-foreground mt-1">Estado</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <Wallet className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <div className="text-xl font-bold">
                                    {order.currency} {formatCurrency(order.amount)}
                                </div>
                                <div className="text-sm text-muted-foreground">Monto</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <User className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <Link
                                    href={`/admin/organizations/${order.organization_id}`}
                                    className="font-medium hover:underline"
                                >
                                    {order.organization?.name || 'N/A'}
                                </Link>
                                <div className="text-sm text-muted-foreground">Cliente</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <Calendar className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <div className="font-medium">
                                    {formatDateTime(order.created_at)}
                                </div>
                                <div className="text-sm text-muted-foreground">Creado</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Información del Pedido</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">Número</div>
                                    <div className="font-mono">{order.order_number}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Tipo de Producto</div>
                                    <Badge variant="outline">{order.product_type}</Badge>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Moneda</div>
                                    <div className="font-medium">{order.currency}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Monto</div>
                                    <div className="font-mono font-bold">{formatCurrency(order.amount)}</div>
                                </div>
                                {order.expires_at && (
                                    <div className="col-span-2">
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Expira
                                        </div>
                                        <div className="font-medium">{formatDateTime(order.expires_at)}</div>
                                    </div>
                                )}
                            </div>

                            {/* Product Data */}
                            {Object.keys(productData).length > 0 && (
                                <div className="pt-4 border-t">
                                    <div className="text-sm font-medium mb-2">Datos del Producto</div>
                                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                                        {JSON.stringify(productData, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Información de Pago</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {order.payment ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Provider</div>
                                            <Badge variant="outline">{order.payment.provider}</Badge>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Estado</div>
                                            <Badge>{order.payment.status}</Badge>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">ID Proveedor</div>
                                            <div className="font-mono text-xs truncate">
                                                {order.payment.provider_payment_id}
                                            </div>
                                        </div>
                                        {order.payment.processed_at && (
                                            <div>
                                                <div className="text-sm text-muted-foreground">Procesado</div>
                                                <div className="text-sm">{formatDateTime(order.payment.processed_at)}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    No hay información de pago disponible
                                </div>
                            )}

                            {order.invoice && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="h-4 w-4" />
                                        <span className="font-medium">Factura</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-mono">{order.invoice.invoice_number}</span>
                                        <Badge className="ml-2">{order.invoice.status}</Badge>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Order History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Historial del Pedido</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {order.history?.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground">
                                No hay historial disponible
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Evento</TableHead>
                                        <TableHead>Descripción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.history?.map((event: any) => (
                                        <TableRow key={event.id}>
                                            <TableCell className="text-sm">
                                                {formatDateTime(event.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{event.event_type}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {event.event_description}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
