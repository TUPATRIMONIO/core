'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Building2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useCredits } from '@/hooks/use-credits'
import { useToast } from '@/hooks/use-toast'
import type { Organization } from '@/types/database'

export default function TransferCreditsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrganization, memberships } = useAuthStore()
  const { balance, credits, reload } = useCredits()

  const [targetOrgId, setTargetOrgId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const canTransfer = credits?.allow_transfers ?? false
  const availableOrgs = memberships
    .filter(m => m.organization_id !== currentOrganization?.id)
    .map(m => m.organization)

  if (!canTransfer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/credits">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Transferir créditos</h1>
            <p className="text-muted-foreground">
              Transfiere créditos a otra organización
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Transferencias no habilitadas</h3>
            <p className="text-muted-foreground mb-4">
              Esta organización no tiene habilitadas las transferencias de créditos
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/credits">Volver a créditos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization) return

    const transferAmount = parseInt(amount)

    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Ingresa un monto válido',
        variant: 'destructive',
      })
      return
    }

    if (transferAmount > balance) {
      toast({
        title: 'Saldo insuficiente',
        description: 'No tienes suficientes créditos para transferir',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('transfer_credits', {
        p_from_org_id: currentOrganization.id,
        p_to_org_id: targetOrgId,
        p_amount: transferAmount,
        p_description: description || `Transferencia de créditos`,
      })

      if (error) throw error

      if (!data) {
        throw new Error('Error al transferir créditos')
      }

      toast({
        title: 'Transferencia exitosa',
        description: `Se han transferido ${transferAmount} créditos`,
      })

      reload()
      router.push('/dashboard/credits')
    } catch (error) {
      console.error('Error transferring credits:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al transferir créditos',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/credits">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transferir créditos</h1>
          <p className="text-muted-foreground">
            Transfiere créditos a otra de tus organizaciones
          </p>
        </div>
      </div>

      {/* Balance info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Balance disponible</p>
              <p className="text-2xl font-bold">{balance.toLocaleString()} créditos</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Desde</p>
              <p className="font-medium">{currentOrganization?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {availableOrgs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay organizaciones disponibles</h3>
            <p className="text-muted-foreground mb-4">
              Necesitas pertenecer a al menos otra organización para transferir créditos
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/organization/new">Crear organización</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la transferencia</CardTitle>
            <CardDescription>
              Completa la información para transferir créditos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="targetOrg" className="text-sm font-medium">
                  Organización destino *
                </label>
                <select
                  id="targetOrg"
                  value={targetOrgId}
                  onChange={(e) => setTargetOrgId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecciona una organización</option>
                  {availableOrgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">
                  Cantidad de créditos *
                </label>
                <input
                  id="amount"
                  type="number"
                  min="1"
                  max={balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Máximo: {balance.toLocaleString()} créditos
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Descripción (opcional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Motivo de la transferencia..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/credits">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isLoading || !targetOrgId || !amount}>
                  {isLoading ? 'Transfiriendo...' : (
                    <>
                      Transferir
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

