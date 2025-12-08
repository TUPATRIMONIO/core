'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface RefundModalProps {
    orderId: string
    orderAmount: number
    orderCurrency: string
    orderStatus: string
    hasPayment: boolean
}

export function RefundModal({
    orderId,
    orderAmount,
    orderCurrency,
    orderStatus,
    hasPayment,
}: RefundModalProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [refundDestination, setRefundDestination] = useState<'payment_method' | 'wallet'>('payment_method')
    const [amount, setAmount] = useState<string>(orderAmount.toString())
    const [reason, setReason] = useState('')
    const [notes, setNotes] = useState('')

    const canRefund = orderStatus !== 'cancelled' && orderStatus !== 'refunded' && hasPayment

    const handleRefund = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast.error('El monto debe ser mayor a 0')
            return
        }

        if (parseFloat(amount) > orderAmount) {
            toast.error('El monto no puede ser mayor al monto del pedido')
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    currency: orderCurrency,
                    refund_destination: refundDestination,
                    reason: reason || undefined,
                    notes: notes || undefined,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Error al procesar el reembolso')
            }

            const data = await response.json()
            toast.success('Reembolso procesado exitosamente')
            setOpen(false)
            router.refresh()
        } catch (error: any) {
            console.error('Error procesando reembolso:', error)
            toast.error(error.message || 'Error al procesar el reembolso')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={!canRefund}
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reembolsar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Reembolsar Pedido</DialogTitle>
                    <DialogDescription>
                        Procesa un reembolso para este pedido. El monto máximo es {orderCurrency} {orderAmount.toLocaleString('es-CL')}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="destination">Destino del Reembolso</Label>
                        <Select
                            value={refundDestination}
                            onValueChange={(value: 'payment_method' | 'wallet') => setRefundDestination(value)}
                        >
                            <SelectTrigger id="destination">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="payment_method">
                                    Tarjeta Original
                                </SelectItem>
                                <SelectItem value="wallet">
                                    Monedero Digital (Créditos)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {refundDestination === 'payment_method' 
                                ? 'El reembolso se realizará a la tarjeta original del pago'
                                : 'El reembolso se agregará como créditos al monedero del cliente'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto a Reembolsar</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{orderCurrency}</span>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                max={orderAmount}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Máximo: {orderCurrency} {orderAmount.toLocaleString('es-CL')}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Razón del Reembolso (Opcional)</Label>
                        <Input
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ej: Cliente solicitó cancelación"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notas internas sobre el reembolso"
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleRefund}
                        disabled={isLoading || !amount || parseFloat(amount) <= 0}
                    >
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Procesar Reembolso
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

