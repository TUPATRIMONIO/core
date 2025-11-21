'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createOrganization, updateOrganization } from '@/lib/admin/actions'
import { useRouter } from 'next/navigation'

interface OrganizationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization?: {
    id: string
    name: string
    slug: string
    org_type: string
    email?: string | null
    phone?: string | null
    country?: string | null
    status: string
  } | null
}

export function OrganizationFormDialog({
  open,
  onOpenChange,
  organization,
}: OrganizationFormDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [orgType, setOrgType] = useState('personal')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [status, setStatus] = useState('trial')

  // Pre-llenar formulario si es edición
  useEffect(() => {
    if (organization) {
      setName(organization.name)
      setSlug(organization.slug)
      setOrgType(organization.org_type)
      setEmail(organization.email || '')
      setPhone(organization.phone || '')
      setCountry(organization.country || '')
      setStatus(organization.status)
    } else {
      // Reset para crear nuevo
      setName('')
      setSlug('')
      setOrgType('personal')
      setEmail('')
      setPhone('')
      setCountry('')
      setStatus('trial')
    }
    setError('')
  }, [organization, open])

  // Generar slug automáticamente desde el nombre
  useEffect(() => {
    if (!organization && name) {
      const generatedSlug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(generatedSlug)
    }
  }, [name, organization])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('slug', slug)
    formData.append('org_type', orgType)
    formData.append('email', email)
    formData.append('phone', phone)
    formData.append('country', country)
    formData.append('status', status)

    try {
      const result = organization
        ? await updateOrganization(organization.id, formData)
        : await createOrganization(formData)

      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {organization ? 'Editar Organización' : 'Crear Organización'}
          </DialogTitle>
          <DialogDescription>
            {organization
              ? 'Modifica la información de la organización'
              : 'Completa los datos para crear una nueva organización'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                placeholder="Mi Organización"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                disabled={loading || !!organization}
                placeholder="mi-organizacion"
                pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
              />
              {!organization && (
                <p className="text-xs text-muted-foreground">
                  Se genera automáticamente desde el nombre
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org_type">Tipo *</Label>
              <Select value={orgType} onValueChange={setOrgType} disabled={loading}>
                <SelectTrigger id="org_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal (B2C)</SelectItem>
                  <SelectItem value="business">Business (B2B)</SelectItem>
                  <SelectItem value="platform">Platform</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select value={status} onValueChange={setStatus} disabled={loading}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="inactive">Inactiva</SelectItem>
                  <SelectItem value="suspended">Suspendida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="contacto@organizacion.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={loading}
              placeholder="Chile"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
              {loading ? 'Guardando...' : organization ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

