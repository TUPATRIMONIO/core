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
import { Loader2, RefreshCcw, Wallet, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

interface ClientRefundModalProps {
    orderId: string
    orderAmount: number
    orderCurrency: string
    orderStatus: string
    hasPayment: boolean
}

export function ClientRefundModal({
    orderId,
    orderAmount,
    orderCurrency,
    orderStatus,
    hasPayment,
}: ClientRefundModalProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [refundDestination, setRefundDestination] = useState<'payment_method' | 'wallet'>('payment_method')
    const [amount, setAmount] = useState<string>(orderAmount.toString())
    const [reason, setReason] = useState('')
    const [notes, setNotes] = useState('')

    // Resetear el monto cuando se abre el modal
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (newOpen) {
            // Resetear al monto completo cuando se abre el modal
            setAmount(orderAmount.toString())
            setRefundDestination('payment_method')
            setReason('')
            setNotes('')
        }
    }

    const canRefund = orderStatus === 'completed' && hasPayment && orderStatus !== 'refunded'

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
            const refundAmount = parseFloat(amount)

            const response = await fetch(`/api/checkout/${orderId}/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: refundAmount,
                    currency: orderCurrency,
                    refund_destination: refundDestination,
                    reason: reason || undefined,
                    notes: notes || undefined,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Error al solicitar el reembolso')
            }

            const data = await response.json()
            toast.success('Solicitud de reembolso enviada exitosamente. Te notificaremos cuando sea procesada.')
            setOpen(false)
            router.refresh()
        } catch (error: any) {
            console.error('Error solicitando reembolso:', error)
            toast.error(error.message || 'Error al solicitar el reembolso')
        } finally {
            setIsLoading(false)
        }
    }

    if (!canRefund) {
        return null
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm"
                >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Solicitar Reembolso
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Solicitar Reembolso</DialogTitle>
                    <DialogDescription>
                        Solicita un reembolso para esta orden. El monto máximo es {orderCurrency} {orderAmount.toLocaleString('es-CL')}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="destination">¿Dónde quieres recibir el reembolso?</Label>
                        <Select
                            value={refundDestination}
                            onValueChange={(value: 'payment_method' | 'wallet') => setRefundDestination(value)}
                        >
                            <SelectTrigger id="destination">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="payment_method">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        <span>Tarjeta Original</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="wallet">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="h-4 w-4" />
                                        <span>Monedero Digital (Créditos)</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {refundDestination === 'payment_method' 
                                ? 'El reembolso se realizará a la tarjeta o método de pago original. Puede tardar entre 5-10 días hábiles.'
                                : 'El reembolso se agregará inmediatamente como créditos a tu monedero digital para usar en futuras compras.'}
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
                        <Select
                            value={reason || 'none'}
                            onValueChange={(value) => setReason(value === 'none' ? '' : value)}
                        >
                            <SelectTrigger id="reason">
                                <SelectValue placeholder="Selecciona una razón" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    Sin razón específica
                                </SelectItem>
                                <SelectItem value="requested_by_customer">
                                    Cambio de opinión
                                </SelectItem>
                                <SelectItem value="duplicate">
                                    Pago duplicado
                                </SelectItem>
                                <SelectItem value="product_not_as_described">
                                    El producto no es como se describió
                                </SelectItem>
                                <SelectItem value="other">
                                    Otra razón
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Comentarios Adicionales (Opcional)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Cuéntanos más sobre tu solicitud de reembolso..."
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
                        className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                    >
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Solicitar Reembolso
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

