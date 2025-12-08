'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface WithdrawFormProps {
    organizationId: string
    availableCredits: number
}

export function WithdrawForm({ organizationId, availableCredits }: WithdrawFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [creditsAmount, setCreditsAmount] = useState('')
    const [currency, setCurrency] = useState('CLP')
    const [exchangeRate, setExchangeRate] = useState('1')
    const [bankName, setBankName] = useState('')
    const [bankCountry, setBankCountry] = useState('CL')
    const [accountNumber, setAccountNumber] = useState('')
    const [accountHolder, setAccountHolder] = useState('')
    const [notes, setNotes] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!creditsAmount || parseFloat(creditsAmount) <= 0) {
            toast.error('La cantidad de créditos debe ser mayor a 0')
            return
        }

        if (parseFloat(creditsAmount) > availableCredits) {
            toast.error('No tienes suficientes créditos disponibles')
            return
        }

        if (!bankName || !accountNumber || !accountHolder) {
            toast.error('Completa todos los campos bancarios requeridos')
            return
        }

        setIsLoading(true)
        try {
            const finalAmount = parseFloat(creditsAmount) * parseFloat(exchangeRate || '1')

            const response = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    organization_id: organizationId,
                    credits_amount: parseInt(creditsAmount),
                    currency,
                    exchange_rate: parseFloat(exchangeRate || '1'),
                    final_amount: finalAmount,
                    bank_name: bankName,
                    bank_country: bankCountry,
                    account_number: accountNumber,
                    account_holder: accountHolder,
                    notes: notes || undefined,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Error al crear la solicitud de retiro')
            }

            toast.success('Solicitud de retiro creada exitosamente')
            router.push('/wallet')
        } catch (error: any) {
            console.error('Error creando solicitud de retiro:', error)
            toast.error(error.message || 'Error al crear la solicitud de retiro')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="credits_amount">Cantidad de Créditos</Label>
                <Input
                    id="credits_amount"
                    type="number"
                    min="1"
                    max={availableCredits}
                    value={creditsAmount}
                    onChange={(e) => setCreditsAmount(e.target.value)}
                    placeholder="0"
                    required
                />
                <p className="text-xs text-muted-foreground">
                    Disponible: {availableCredits.toLocaleString('es-CL')} créditos
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger id="currency">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="CLP">CLP (Peso Chileno)</SelectItem>
                            <SelectItem value="USD">USD (Dólar)</SelectItem>
                            <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="exchange_rate">Tasa de Cambio</Label>
                    <Input
                        id="exchange_rate"
                        type="number"
                        step="0.000001"
                        min="0"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        placeholder="1"
                    />
                    <p className="text-xs text-muted-foreground">
                        Créditos por {currency}
                    </p>
                </div>
            </div>

            {exchangeRate && creditsAmount && (
                <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Monto estimado</div>
                    <div className="text-lg font-bold">
                        {currency} {(parseFloat(creditsAmount) * parseFloat(exchangeRate)).toLocaleString('es-CL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="bank_name">Nombre del Banco</Label>
                <Input
                    id="bank_name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ej: Banco de Chile"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="bank_country">País del Banco</Label>
                <Select value={bankCountry} onValueChange={setBankCountry}>
                    <SelectTrigger id="bank_country">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CL">Chile</SelectItem>
                        <SelectItem value="US">Estados Unidos</SelectItem>
                        <SelectItem value="ES">España</SelectItem>
                        <SelectItem value="AR">Argentina</SelectItem>
                        <SelectItem value="CO">Colombia</SelectItem>
                        <SelectItem value="PE">Perú</SelectItem>
                        <SelectItem value="MX">México</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="account_holder">Titular de la Cuenta</Label>
                <Input
                    id="account_holder"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Nombre completo del titular"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="account_number">Número de Cuenta</Label>
                <Input
                    id="account_number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Número de cuenta bancaria"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Información adicional sobre el retiro"
                    rows={3}
                />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Solicitar Retiro
            </Button>
        </form>
    )
}

