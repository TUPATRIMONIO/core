'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PipelineStage {
    id: string
    name: string
    slug: string
    position: number
    color: string
    is_final: boolean
}

interface OrderStatusSelectorProps {
    orderId: string
    currentStatus: string
    onStatusChange?: (newStatus: string) => void
}

export function OrderStatusSelector({
    orderId,
    currentStatus,
    onStatusChange,
}: OrderStatusSelectorProps) {
    const router = useRouter()
    const [stages, setStages] = useState<PipelineStage[]>([])
    const [selectedStatus, setSelectedStatus] = useState(currentStatus)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingStages, setIsLoadingStages] = useState(true)

    useEffect(() => {
        async function fetchStages() {
            try {
                const response = await fetch('/api/admin/orders/pipeline-stages')
                if (response.ok) {
                    const data = await response.json()
                    setStages(data.stages || [])
                }
            } catch (error) {
                console.error('Error cargando stages:', error)
            } finally {
                setIsLoadingStages(false)
            }
        }
        fetchStages()
    }, [])

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === currentStatus) {
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/status`, {
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

            const data = await response.json()
            setSelectedStatus(newStatus)
            toast.success('Estado actualizado correctamente')
            
            if (onStatusChange) {
                onStatusChange(newStatus)
            }
            
            // Refrescar la página para mostrar cambios
            router.refresh()
        } catch (error: any) {
            console.error('Error cambiando estado:', error)
            toast.error(error.message || 'Error al cambiar el estado')
            setSelectedStatus(currentStatus) // Revertir selección
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusColor = (slug: string): string => {
        const stage = stages.find((s) => s.slug === slug)
        if (!stage) return 'bg-gray-100 text-gray-800'
        
        const colorMap: Record<string, string> = {
            yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
            red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        }
        return colorMap[stage.color] || 'bg-gray-100 text-gray-800'
    }

    if (isLoadingStages) {
        return (
            <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Cargando estados...</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Select
                value={selectedStatus}
                onValueChange={handleStatusChange}
                disabled={isLoading}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                    {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.slug}>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        stage.color === 'yellow'
                                            ? 'bg-yellow-500'
                                            : stage.color === 'blue'
                                            ? 'bg-blue-500'
                                            : stage.color === 'orange'
                                            ? 'bg-orange-500'
                                            : stage.color === 'green'
                                            ? 'bg-green-500'
                                            : stage.color === 'gray'
                                            ? 'bg-gray-500'
                                            : stage.color === 'red'
                                            ? 'bg-red-500'
                                            : 'bg-gray-500'
                                    }`}
                                />
                                <span>{stage.name}</span>
                                {stage.is_final && (
                                    <span className="text-xs text-muted-foreground">
                                        (Final)
                                    </span>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
    )
}

