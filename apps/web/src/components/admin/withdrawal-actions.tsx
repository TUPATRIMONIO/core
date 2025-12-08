'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface WithdrawalActionsProps {
    requestId: string
    currentStatus: string
}

export function WithdrawalActions({
    requestId,
    currentStatus,
}: WithdrawalActionsProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleStatusChange = async (newStatus: string) => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/billing/withdrawals/${requestId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Error al cambiar el estado')
            }

            toast.success('Estado actualizado correctamente')
            router.refresh()
        } catch (error: any) {
            console.error('Error cambiando estado:', error)
            toast.error(error.message || 'Error al cambiar el estado')
        } finally {
            setIsLoading(false)
        }
    }

    if (currentStatus === 'completed' || currentStatus === 'rejected') {
        return null
    }

    return (
        <div className="flex items-center gap-2">
            {currentStatus === 'pending' && (
                <>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleStatusChange('approved')}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Check className="h-4 w-4 mr-2" />
                        )}
                        Aprobar
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleStatusChange('rejected')}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <X className="h-4 w-4 mr-2" />
                        )}
                        Rechazar
                    </Button>
                </>
            )}
            {currentStatus === 'approved' && (
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleStatusChange('processing')}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Check className="h-4 w-4 mr-2" />
                    )}
                    Marcar como Procesando
                </Button>
            )}
            {currentStatus === 'processing' && (
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleStatusChange('completed')}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Check className="h-4 w-4 mr-2" />
                    )}
                    Marcar como Completado
                </Button>
            )}
        </div>
    )
}

