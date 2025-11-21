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
import { Checkbox } from '@/components/ui/checkbox'
import { createApiKey } from '@/lib/admin/actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Copy, Check } from 'lucide-react'

interface ApiKeyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultOrganizationId?: string
}

const AVAILABLE_SCOPES = [
  'read:contacts',
  'write:contacts',
  'read:companies',
  'write:companies',
  'read:deals',
  'write:deals',
  'read:tickets',
  'write:tickets',
  'read:signatures',
  'write:signatures',
  'read:verifications',
  'write:verifications',
]

export function ApiKeyFormDialog({
  open,
  onOpenChange,
  defaultOrganizationId,
}: ApiKeyFormDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  
  const [name, setName] = useState('')
  const [organizationId, setOrganizationId] = useState(defaultOrganizationId || '')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [expiresAt, setExpiresAt] = useState('')
  
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])

  // Cargar organizaciones
  useEffect(() => {
    if (open) {
      const loadOrganizations = async () => {
        const supabase = createClient()
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .order('name')
        
        if (orgs) {
          setOrganizations(orgs)
          if (defaultOrganizationId) {
            setOrganizationId(defaultOrganizationId)
          }
        }
      }
      loadOrganizations()
    } else {
      // Reset al cerrar
      setName('')
      setOrganizationId(defaultOrganizationId || '')
      setSelectedScopes([])
      setExpiresAt('')
      setError('')
      setGeneratedKey(null)
      setCopied(false)
    }
  }, [open, defaultOrganizationId])

  const handleScopeToggle = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !organizationId) {
      setError('Nombre y organización son campos requeridos')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('organization_id', organizationId)
    formData.append('scopes', JSON.stringify(selectedScopes))
    if (expiresAt) {
      formData.append('expires_at', expiresAt)
    }

    try {
      const result = await createApiKey(formData)

      if (result.error) {
        setError(result.error)
      } else {
        // Mostrar la key generada
        if (result.data?.api_key) {
          setGeneratedKey(result.data.api_key)
        } else {
          onOpenChange(false)
          router.refresh()
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setGeneratedKey(null)
    onOpenChange(false)
    router.refresh()
  }

  // Si se generó la key, mostrar solo la key
  if (generatedKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Generada</DialogTitle>
            <DialogDescription>
              Guarda esta key ahora. No se mostrará nuevamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono break-all">{generatedKey}</code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyKey}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md">
              ⚠️ Esta es la única vez que verás esta key. Asegúrate de guardarla en un lugar seguro.
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear API Key</DialogTitle>
          <DialogDescription>
            Genera una nueva API key para una organización
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              placeholder="Mi API Key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organización *</Label>
            <Select
              value={organizationId}
              onValueChange={setOrganizationId}
              disabled={loading || !!defaultOrganizationId}
            >
              <SelectTrigger id="organization">
                <SelectValue placeholder="Selecciona una organización" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Scopes (Permisos)</Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
              {AVAILABLE_SCOPES.map((scope) => (
                <div key={scope} className="flex items-center space-x-2">
                  <Checkbox
                    id={scope}
                    checked={selectedScopes.includes(scope)}
                    onCheckedChange={() => handleScopeToggle(scope)}
                  />
                  <Label
                    htmlFor={scope}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {scope}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires_at">Fecha de Expiración (opcional)</Label>
            <Input
              id="expires_at"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={loading}
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
            <Button
              type="submit"
              disabled={loading || !name || !organizationId}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              {loading ? 'Generando...' : 'Generar API Key'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

