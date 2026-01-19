"use client"

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface NotaryServiceProduct {
  id: string
  name: string
  country_code: string
  notary_service: string | null
  display_order?: number | null
}

interface NotaryServiceConfig {
  id: string
  notary_office_id: string
  product_id: string
  weight: number
  max_daily_documents: number | null
  is_active: boolean
}

interface NotaryServicesManagerProps {
  notaryId: string
  products: NotaryServiceProduct[]
  notaryServices: NotaryServiceConfig[]
  totalWeightByProduct: Record<string, number>
}

interface EditableService {
  productId: string
  isActive: boolean
  weight: number
  maxDailyDocuments: string
  originalWeight: number
}

export function NotaryServicesManager({
  notaryId,
  products,
  notaryServices,
  totalWeightByProduct,
}: NotaryServicesManagerProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [items, setItems] = useState<EditableService[]>(() => {
    return products.map((product) => {
      const existing = notaryServices.find((service) => service.product_id === product.id)
      return {
        productId: product.id,
        isActive: existing?.is_active ?? false,
        weight: existing?.weight ?? 1,
        maxDailyDocuments: existing?.max_daily_documents?.toString() ?? '',
        originalWeight: existing?.is_active ? existing.weight : 0,
      }
    })
  })

  const totalsByProduct = useMemo(() => {
    const totals: Record<string, number> = { ...totalWeightByProduct }
    for (const item of items) {
      const base = totalWeightByProduct[item.productId] || 0
      const adjusted = base - item.originalWeight + (item.isActive ? item.weight : 0)
      totals[item.productId] = Math.max(adjusted, 0)
    }
    return totals
  }, [items, totalWeightByProduct])

  const handleToggle = (productId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, isActive: !item.isActive }
          : item
      )
    )
  }

  const handleWeightChange = (productId: string, value: string) => {
    const nextWeight = Number(value)
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, weight: Number.isNaN(nextWeight) ? 1 : Math.max(1, nextWeight) }
          : item
      )
    )
  }

  const handleMaxDailyChange = (productId: string, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, maxDailyDocuments: value } : item
      )
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/notaries/${notaryId}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: items.map((item) => ({
            product_id: item.productId,
            is_active: item.isActive,
            weight: item.weight,
            max_daily_documents: item.maxDailyDocuments ? Number(item.maxDailyDocuments) : null,
          })),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron guardar los cambios')
      }

      toast.success('Servicios actualizados')
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          originalWeight: item.isActive ? item.weight : 0,
        }))
      )
    } catch (error: any) {
      toast.error(error.message || 'Error guardando servicios')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Activa los servicios y define el peso para ajustar la distribución.
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white"
        >
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Servicio</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead>Peso</TableHead>
            <TableHead>Límite diario</TableHead>
            <TableHead>Proporción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const item = items.find((entry) => entry.productId === product.id)
            const totalWeight = totalsByProduct[product.id] || 0
            const weight = item?.isActive ? item?.weight || 0 : 0
            const ratio = totalWeight > 0 ? Math.round((weight / totalWeight) * 1000) / 10 : 0

            return (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-muted-foreground">{product.country_code}</div>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleToggle(product.id)}
                    className="text-sm"
                  >
                    {item?.isActive ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                  </button>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    value={item?.weight ?? 1}
                    onChange={(event) => handleWeightChange(product.id, event.target.value)}
                    className="w-24"
                    disabled={!item?.isActive}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    value={item?.maxDailyDocuments ?? ''}
                    onChange={(event) => handleMaxDailyChange(product.id, event.target.value)}
                    className="w-28"
                    placeholder="Sin límite"
                    disabled={!item?.isActive}
                  />
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {item?.isActive ? `${ratio}%` : '—'}
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
