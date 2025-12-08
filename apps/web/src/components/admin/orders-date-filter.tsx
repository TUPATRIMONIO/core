'use client'

import { useRouter } from 'next/navigation'

interface OrdersDateFilterProps {
    name: 'from' | 'to'
    value?: string
    currentParams: {
        status?: string
        from?: string
        to?: string
        organization?: string
    }
}

function buildFilterUrl(
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
    return queryString ? `/admin/orders?${queryString}` : '/admin/orders'
}

export function OrdersDateFilter({ name, value, currentParams }: OrdersDateFilterProps) {
    const router = useRouter()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        const url = buildFilterUrl(currentParams, { [name]: newValue || undefined, page: '1' })
        router.push(url)
    }

    return (
        <input
            type="date"
            name={name}
            defaultValue={value || ''}
            className="text-sm border rounded px-2 py-1 h-7 bg-background"
            onChange={handleChange}
        />
    )
}
