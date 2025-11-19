'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Key, CreditCard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui/card'
import { Button } from '@tupatrimonio/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { usePermissionsStore } from '@/stores/permissions-store'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function OrganizationPage() {
  const { toast } = useToast()
  const { currentOrganization, setCurrentOrganization } = useAuthStore()
  const { hasPermission } = usePermissionsStore()
  const [isLoading, setIsLoading] = useState(false)

  const [name, setName] = useState(currentOrganization?.name || '')

  const canEdit = hasPermission('organization', 'edit')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization || !canEdit) return

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('organizations')
        .update({ name })
        .eq('id', currentOrganization.id)
        .select()
        .single()

      if (error) throw error

      setCurrentOrganization(data)
      toast({
        title: 'Organización actualizada',
        description: 'Los cambios se han guardado correctamente',
      })
    } catch (error) {
      console.error('Error updating organization:', error)
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la organización',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentOrganization) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay organización seleccionada
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organización</h1>
        <p className="text-muted-foreground">
          Administra la configuración de tu organización
        </p>
      </div>

      {/* Organization info */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información general</CardTitle>
            <CardDescription>
              Datos básicos de la organización
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nombre de la organización
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Identificador
              </label>
              <input
                type="text"
                value={currentOrganization.slug}
                disabled
                className="w-full px-3 py-2 border rounded-md bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                El identificador no puede ser modificado
              </p>
            </div>

            {canEdit && (
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-3">
        {hasPermission('organization', 'manage') && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Miembros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Gestiona los miembros y sus roles
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/organization/members">
                  Administrar
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {hasPermission('organization', 'manage') && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Claves para integraciones
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/organization/api-keys">
                  Administrar
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Facturación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Historial de pagos y facturas
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/organization/billing">
                Ver historial
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
