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
import { ArrowLeft, Calendar, Package, Wallet, User, Clock, FileText, RefreshCw, CreditCard, ExternalLink, ChevronDown, ChevronRight, Ticket, Building2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { OrderStatusSelector } from '@/components/admin/order-status-selector'
import { RefundModal } from '@/components/admin/refund-modal'
import { OrderRestartAdminAction } from '@/components/admin/OrderRestartAdminAction'
import { CreateTicketButtonForOrder } from '@/components/admin/create-ticket-buttons'
import { DetailPageLayout } from '@/components/shared/DetailPageLayout'
import { OrderTicketsPanel } from '@/components/admin/OrderTicketsPanel'

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

    // Get refunds for this order - use public view
    const { data: refunds } = await supabase
        .from('refund_requests')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

    // Calculate total refunded amount
    const totalRefunded = refunds?.reduce((sum, refund) => {
        if (refund.status === 'completed') {
            return sum + parseFloat(refund.amount.toString())
        }
        return sum
    }, 0) || 0

    // Get associations for this order
    const { data: associations } = await supabase.rpc('get_order_associations', { p_order_id: orderId })

    // Get signing document
    const { data: signingDoc } = await supabase
        .from('signing_documents')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle()

    // Get creator user if exists (using created_by_user_id)
    let creatorUser = null;
    if (order.created_by_user_id) {
        // Get core user data
        const { data: userData } = await supabase
            .schema('core')
            .from('users')
            .select('id, first_name, last_name, avatar_url')
            .eq('id', order.created_by_user_id)
            .single();
        
        // Also get email from auth.users via admin API
        const { data: authData } = await supabase.auth.admin.getUserById(order.created_by_user_id);
        
        if (userData) {
            creatorUser = { ...userData, email: authData?.user?.email };
        }
    }

    return {
        ...order,
        organization: org,
        history: history || [],
        payment,
        invoice,
        refunds: refunds || [],
        totalRefunded,
        associations: associations || { contacts: [], tickets: [], organizations: [] },
        creatorUser,
        signing_document: signingDoc,
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
                    <div className="flex items-center gap-2">
                        <OrderStatusSelector
                            orderId={order.id}
                            currentStatus={order.status}
                        />
                        {(order.status === 'paid' || order.status === 'completed') && order.payment && (
                            <RefundModal
                                orderId={order.id}
                                orderAmount={order.amount}
                                orderCurrency={order.currency}
                                orderStatus={order.status}
                                hasPayment={!!order.payment}
                            />
                        )}
                        <OrderRestartAdminAction order={order} />
                        <CreateTicketButtonForOrder
                            orderId={order.id}
                            orderNumber={order.order_number}
                            organizationName={order.organization?.name}
                        />
                        <Link href="/admin/orders">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver
                            </Button>
                        </Link>
                    </div>
                }
            />

            <DetailPageLayout
                sidePanel={
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumen</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Estado</label>
                                    <div className="mt-1">
                                        <Badge className={getOrderStatusColor(order.status)}>
                                            {getOrderStatusLabel(order.status)}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Monto</label>
                                    <div className="text-xl font-bold mt-1">
                                        {order.currency} {formatCurrency(order.amount)}
                                    </div>
                                    {order.totalRefunded > 0 && (
                                        <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                                            Reembolsado: {order.currency} {formatCurrency(order.totalRefunded)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Fecha</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{formatDateTime(order.created_at)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Información del Usuario Creador (Solo Lectura) */}
                        {order.creatorUser ? (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        Solicitante
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        {order.creatorUser.avatar_url ? (
                                            <img 
                                                src={order.creatorUser.avatar_url} 
                                                alt="" 
                                                className="h-10 w-10 rounded-full object-cover" 
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <User className="h-5 w-5" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">
                                                {order.creatorUser.first_name} {order.creatorUser.last_name}
                                            </div>
                                            <div className="text-sm text-muted-foreground truncate">
                                                {order.creatorUser.email}
                                            </div>
                                            <Link href={`/admin/contacts/${order.creatorUser.id}`} className="text-xs text-blue-500 hover:underline mt-1 block">
                                                Ver perfil
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            // Si no hay created_by_user_id, intentamos mostrar contactos asociados como fallback informativo
                             order.associations?.contacts?.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            Contactos Asociados
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {order.associations.contacts.map((contact: any) => (
                                                <div key={contact.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium truncate">{contact.name}</div>
                                                        <div className="text-xs text-muted-foreground truncate">{contact.subtext}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        )}

                        {/* Información de la Organización (Solo Lectura) */}
                        {order.organization && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        Organización
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{order.organization.name}</div>
                                            <div className="text-sm text-muted-foreground truncate">
                                                {order.organization.email || order.organization.slug}
                                            </div>
                                            <Link href={`/admin/organizations/${order.organization.id}`} className="text-xs text-blue-500 hover:underline mt-1 block">
                                                Ver organización
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Tickets (Editable) */}
                        <OrderTicketsPanel
                            orderId={order.id}
                            initialTickets={(order.associations?.tickets || []).map((t: any) => ({
                                id: t.id,
                                name: t.name,
                                subtext: t.subtext,
                            }))}
                        />
                    </div>
                }
            >
                <div className="space-y-6">
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

                    {/* Refunds Section */}
                    {order.refunds && order.refunds.length > 0 && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <RefreshCw className="h-5 w-5" />
                                        Reembolsos ({order.refunds.length})
                                    </CardTitle>
                                    <Link href={`/admin/refunds?order_id=${order.id}`}>
                                        <Button variant="outline" size="sm">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Ver todos los reembolsos
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {order.refunds.map((refund: any) => (
                                        <div key={refund.id} className="p-4 hover:bg-muted/50 transition-colors">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {/* Información Principal */}
                                                <div className="space-y-2">
                                                    <div className="text-xs text-muted-foreground">Fecha de Solicitud</div>
                                                    <div className="text-sm font-medium">
                                                        {formatDateTime(refund.created_at)}
                                                    </div>
                                                    {refund.processed_at && (
                                                        <>
                                                            <div className="text-xs text-muted-foreground mt-2">Fecha de Procesamiento</div>
                                                            <div className="text-sm">
                                                                {formatDateTime(refund.processed_at)}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Monto y Destino */}
                                                <div className="space-y-2">
                                                    <div className="text-xs text-muted-foreground">Monto Reembolsado</div>
                                                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                                        {refund.currency} {formatCurrency(parseFloat(refund.amount.toString()))}
                                                    </div>
                                                    <div>
                                                        <Badge variant={refund.refund_destination === 'wallet' ? 'default' : 'outline'}>
                                                            {refund.refund_destination === 'wallet' ? (
                                                                <>
                                                                    <Wallet className="h-3 w-3 mr-1" />
                                                                    Monedero Digital
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CreditCard className="h-3 w-3 mr-1" />
                                                                    Tarjeta Original
                                                                </>
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* Proveedor y Estado */}
                                                <div className="space-y-2">
                                                    <div className="text-xs text-muted-foreground">Proveedor</div>
                                                    <div>
                                                        {refund.provider ? (
                                                            <Badge variant="outline">
                                                                {refund.provider === 'stripe' ? 'Stripe' : 
                                                                    refund.provider === 'transbank_webpay' ? 'Transbank Webpay' :
                                                                    refund.provider === 'transbank_oneclick' ? 'Transbank OneClick' :
                                                                    refund.provider}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">-</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-2">Estado</div>
                                                    <div>
                                                        <Badge 
                                                            className={
                                                                refund.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                                refund.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                                refund.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                                refund.status === 'approved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                            }
                                                        >
                                                            {refund.status === 'completed' ? 'Completado' :
                                                                refund.status === 'rejected' ? 'Rechazado' :
                                                                refund.status === 'processing' ? 'Procesando' :
                                                                refund.status === 'approved' ? 'Aprobado' :
                                                                'Pendiente'}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* ID Proveedor y Razón */}
                                                <div className="space-y-2">
                                                    {refund.provider_refund_id && (
                                                        <>
                                                            <div className="text-xs text-muted-foreground">ID Proveedor</div>
                                                            <div className="font-mono text-xs break-all bg-muted p-2 rounded">
                                                                {refund.provider_refund_id}
                                                            </div>
                                                        </>
                                                    )}
                                                    {refund.reason && (
                                                        <>
                                                            <div className="text-xs text-muted-foreground mt-2">Razón</div>
                                                            <div className="text-sm">{refund.reason}</div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Notas Adicionales (si existen) */}
                                            {refund.notes && (
                                                <div className="mt-4 pt-4 border-t">
                                                    <div className="text-xs text-muted-foreground mb-1">Notas Adicionales</div>
                                                    <div className="text-sm bg-muted/50 p-3 rounded-lg">
                                                        {refund.notes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Resumen Total */}
                                {order.totalRefunded > 0 && (
                                    <div className="p-4 border-t bg-muted/50">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Total Reembolsado:</span>
                                            <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                                {order.currency} {formatCurrency(order.totalRefunded)}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            {order.refunds.filter((r: any) => r.status === 'completed').length} de {order.refunds.length} reembolsos completados
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

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
            </DetailPageLayout>
        </div>
    )
}
