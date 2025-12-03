'use client'

import { useState, useTransition } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { CountryMultiSelect } from '@/components/admin/applications/CountryMultiSelect'

interface ApplicationVisibilityFormProps {
  initialData: {
    id: string
    name?: string
    description?: string
    is_active?: boolean
    is_beta?: boolean
    visibility_level?: string
    allowed_countries?: string[]
    required_subscription_tiers?: string[]
  }
  onSubmit?: (data: any) => Promise<void>
}

const visibilityLevels = [
  { value: 'public', label: 'Público - Disponible para todos' },
  { value: 'platform_only', label: 'Solo Platform Admin - Solo admins pueden ver' },
  { value: 'beta', label: 'Beta - Solo beta testers y admins' },
  { value: 'restricted', label: 'Restringido - Solo con override explícito' },
]

const subscriptionTiers = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
]

export function ApplicationVisibilityForm({ initialData, onSubmit }: ApplicationVisibilityFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    is_active: initialData?.is_active ?? true,
    is_beta: initialData?.is_beta ?? false,
    visibility_level: initialData?.visibility_level || 'public',
    allowed_countries: initialData?.allowed_countries || [],
    required_subscription_tiers: initialData?.required_subscription_tiers || [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        // Preparar datos para enviar - solo campos básicos
        const dataToSubmit: any = {
          is_active: formData.is_active,
          is_beta: formData.is_beta,
        }
        
        // Solo agregar campos nuevos si tienen valores definidos
        if (formData.visibility_level !== undefined && formData.visibility_level !== null) {
          dataToSubmit.visibility_level = formData.visibility_level
        }
        if (formData.allowed_countries !== undefined && formData.allowed_countries !== null && formData.allowed_countries.length > 0) {
          dataToSubmit.allowed_countries = formData.allowed_countries
        }
        if (formData.required_subscription_tiers !== undefined && formData.required_subscription_tiers !== null && formData.required_subscription_tiers.length > 0) {
          dataToSubmit.required_subscription_tiers = formData.required_subscription_tiers
        }
        
        // Usar API route directamente para evitar problemas de autenticación en server actions
        const response = await fetch(`/api/admin/applications/${initialData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSubmit),
        })
        
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Error al actualizar aplicación')
        }
        
        // Invalidar cache del sidebar antes de recargar
        sessionStorage.removeItem('enabled_apps_cache')
        sessionStorage.removeItem('enabled_apps_cache_timestamp')
        
        // Disparar evento personalizado para que otros componentes sepan que se actualizó
        window.dispatchEvent(new CustomEvent('applications-updated'))
        
        // Recargar la página para reflejar los cambios
        window.location.reload()
      } catch (error) {
        console.error('Error submitting form:', error)
        alert('Error al guardar: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled
          />
          <p className="text-xs text-muted-foreground">
            El nombre no se puede modificar
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility_level">Nivel de Visibilidad *</Label>
          <Select
            value={formData.visibility_level}
            onValueChange={(value) => setFormData({ ...formData, visibility_level: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibilityLevels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción de la aplicación..."
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active" className="cursor-pointer">
            Aplicación Activa
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_beta"
            checked={formData.is_beta}
            onCheckedChange={(checked) => setFormData({ ...formData, is_beta: checked })}
          />
          <Label htmlFor="is_beta" className="cursor-pointer">
            Marcar como Beta
          </Label>
        </div>
      </div>

      <CountryMultiSelect
        selectedCountries={formData.allowed_countries}
        onChange={(countries) => setFormData({ ...formData, allowed_countries: countries })}
      />

      <div className="space-y-2">
        <Label>Tiers de Suscripción Requeridos</Label>
        <div className="grid grid-cols-3 gap-3 p-4 border rounded-lg">
          {subscriptionTiers.map((tier) => (
            <div key={tier.value} className="flex items-center space-x-2">
              <Checkbox
                id={`tier-${tier.value}`}
                checked={formData.required_subscription_tiers.includes(tier.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({
                      ...formData,
                      required_subscription_tiers: [...formData.required_subscription_tiers, tier.value],
                    })
                  } else {
                    setFormData({
                      ...formData,
                      required_subscription_tiers: formData.required_subscription_tiers.filter(
                        (t) => t !== tier.value
                      ),
                    })
                  }
                }}
              />
              <Label htmlFor={`tier-${tier.value}`} className="text-sm font-normal cursor-pointer">
                {tier.label}
              </Label>
            </div>
          ))}
        </div>
        {formData.required_subscription_tiers.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Si no seleccionas ningún tier, la aplicación estará disponible para todos los planes.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  )
}

