import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Calendar, Wallet, User, Building2, Check, X } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { WithdrawalActions } from '@/components/admin/withdrawal-actions'

interface PageProps {
    params: Promise<{ id: string }>
}

async function getWithdrawalDetails(requestId: string) {
    const supabase = createServiceRoleClient()

    const { data: request, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (error || !request) {
        return null
    }

    // Get organization
    const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('id', request.organization_id)
        .single()

    // Get requester if exists
    let requester = null
    if (request.requested_by) {
        const { data: user } = await supabase
            .from('users')
            .select('id, email, full_name')
            .eq('id', request.requested_by)
            .single()
        requester = user
    }

    return {
        ...request,
        organization: org,
        requester,
    }
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

function formatDateTime(dateString: string | null): string {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('es-CL', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

export default async function WithdrawalDetailPage({ params }: PageProps) {
    const { id } = await params
    const request = await getWithdrawalDetails(id)

    if (!request) {
        notFound()
    }

    return (
        <div className="flex flex-1 flex-col">
            <PageHeader
                title={`Solicitud de Retiro #${request.id.substring(0, 8)}`}
                description={`Detalle de la solicitud de retiro`}
                actions={
                    <div className="flex items-center gap-2">
                        <WithdrawalActions
                            requestId={request.id}
                            currentStatus={request.status}
                        />
                        <Link href="/admin/billing/withdrawals">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver
                            </Button>
                        </Link>
                    </div>
                }
            />

            <div className="flex-1 px-4 pb-6 space-y-6">
                {/* Status and Quick Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Wallet className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <Badge className={`${getWithdrawalStatusColor(request.status)} text-sm`}>
                                    {getWithdrawalStatusLabel(request.status)}
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
                                    {request.credits_amount.toLocaleString('es-CL')}
                                </div>
                                <div className="text-sm text-muted-foreground">Créditos</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Building2 className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <Link
                                    href={`/admin/organizations/${request.organization_id}`}
                                    className="font-medium hover:underline"
                                >
                                    {request.organization?.name || 'N/A'}
                                </Link>
                                <div className="text-sm text-muted-foreground">Organización</div>
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
                                    {formatDateTime(request.created_at)}
                                </div>
                                <div className="text-sm text-muted-foreground">Creado</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Request Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Información de la Solicitud</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">Créditos</div>
                                    <div className="font-mono font-bold">{request.credits_amount.toLocaleString('es-CL')}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Moneda</div>
                                    <div className="font-medium">{request.currency}</div>
                                </div>
                                {request.exchange_rate && (
                                    <div>
                                        <div className="text-sm text-muted-foreground">Tasa de Cambio</div>
                                        <div className="font-medium">{request.exchange_rate}</div>
                                    </div>
                                )}
                                <div>
                                    <div className="text-sm text-muted-foreground">Monto Final</div>
                                    <div className="font-mono font-bold">
                                        {request.currency} {formatCurrency(request.final_amount, request.currency)}
                                    </div>
                                </div>
                            </div>

                            {request.notes && (
                                <div className="pt-4 border-t">
                                    <div className="text-sm font-medium mb-2">Notas</div>
                                    <div className="text-sm text-muted-foreground">{request.notes}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bank Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Información Bancaria</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {request.bank_name ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Banco</div>
                                            <div className="font-medium">{request.bank_name}</div>
                                        </div>
                                        {request.bank_country && (
                                            <div>
                                                <div className="text-sm text-muted-foreground">País</div>
                                                <div className="font-medium">{request.bank_country}</div>
                                            </div>
                                        )}
                                        {request.account_holder && (
                                            <div className="col-span-2">
                                                <div className="text-sm text-muted-foreground">Titular</div>
                                                <div className="font-medium">{request.account_holder}</div>
                                            </div>
                                        )}
                                        {request.account_number && (
                                            <div className="col-span-2">
                                                <div className="text-sm text-muted-foreground">Número de Cuenta</div>
                                                <div className="font-mono text-sm">{request.account_number}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    No hay información bancaria disponible
                                </div>
                            )}

                            {request.requester && (
                                <div className="pt-4 border-t">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium">Solicitado por</span>
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-medium">{request.requester.full_name || 'N/A'}</div>
                                        <div className="text-muted-foreground">{request.requester.email}</div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

