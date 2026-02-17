"use client"

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info, Save } from 'lucide-react'

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
  isAdmin?: boolean
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
  isAdmin = false,
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

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return items.some((item) => {
      const originalService = notaryServices.find(s => s.product_id === item.productId)
      const originalIsActive = originalService?.is_active ?? false
      const originalWeight = originalService?.weight ?? 1
      const originalMaxDaily = originalService?.max_daily_documents?.toString() ?? ''

      return (
        item.isActive !== originalIsActive ||
        (item.isActive && item.weight !== originalWeight) ||
        (item.isActive && item.maxDailyDocuments !== originalMaxDaily)
      )
    })
  }, [items, notaryServices])

  const totalsByProduct = useMemo(() => {
    const totals: Record<string, number> = { ...totalWeightByProduct }
    for (const item of items) {
      const base = totalWeightByProduct[item.productId] || 0
      const adjusted = base - item.originalWeight + (item.isActive ? item.weight : 0)
      totals[item.productId] = Math.max(adjusted, 0)
    }
    return totals
  }, [items, totalWeightByProduct])

  const handleToggle = (productId: string, checked: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, isActive: checked }
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
    if (!hasChanges) return

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
      // Update original weights to current ones to reset calculation base
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          originalWeight: item.isActive ? item.weight : 0,
        }))
      )
      // Force refresh of the page to get latest data from server would be ideal, 
      // but for now we rely on local state update which is enough for the UI
    } catch (error: any) {
      toast.error(error.message || 'Error guardando servicios')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 relative pb-20">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isAdmin 
            ? 'Activa los servicios y define el peso para ajustar la distribución.'
            : 'Los servicios activos que tu notaría puede recibir.'
          }
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {products.map((product) => {
          const item = items.find((entry) => entry.productId === product.id)
          if (!item) return null

          const totalWeight = totalsByProduct[product.id] || 0
          const weight = item.isActive ? item.weight : 0
          const ratio = totalWeight > 0 ? Math.round((weight / totalWeight) * 1000) / 10 : 0

          return (
            <Card key={product.id} className={`transition-all duration-200 ${item.isActive ? 'border-[var(--tp-buttons)]/20 shadow-sm' : 'opacity-80'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium leading-none">
                    {product.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{product.country_code}</p>
                </div>
                {isAdmin ? (
                  <Switch
                    checked={item.isActive}
                    onCheckedChange={(checked) => handleToggle(product.id, checked)}
                  />
                ) : (
                  <Badge variant={item.isActive ? "default" : "outline"} className={item.isActive ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100" : ""}>
                    {item.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                )}
              </CardHeader>
              
              {item.isActive && (
                <CardContent className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Separator />
                  
                  {isAdmin ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`weight-${product.id}`} className="text-xs font-medium">
                            Peso
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Define la probabilidad de asignación frente a otras notarías.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          id={`weight-${product.id}`}
                          type="number"
                          min={1}
                          value={item.weight}
                          onChange={(e) => handleWeightChange(product.id, e.target.value)}
                          className="h-8"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`limit-${product.id}`} className="text-xs font-medium">
                            Límite diario
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Cantidad máxima de documentos por día. Vacío es sin límite.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          id={`limit-${product.id}`}
                          type="number"
                          min={1}
                          value={item.maxDailyDocuments}
                          onChange={(e) => handleMaxDailyChange(product.id, e.target.value)}
                          placeholder="∞"
                          className="h-8"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <span className="text-muted-foreground text-xs block">Límite diario</span>
                         <span className="font-medium">{item.maxDailyDocuments || 'Sin límite'}</span>
                       </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Proporción de asignación</span>
                      <span className="font-medium">{ratio}%</span>
                    </div>
                    <Progress value={ratio} className="h-2" />
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {isAdmin && hasChanges && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-background border shadow-lg rounded-full px-6 py-3 flex items-center gap-4 max-w-md w-full justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-sm font-medium">Cambios sin guardar</span>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              size="sm"
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white rounded-full px-6"
            >
              {isSaving ? (
                'Guardando...'
              ) : (
                <>
                  <Save className="mr-2 h-3 w-3" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
