'use client'

import Link from 'next/link'
import { CreditCard, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { useCredits } from '@/hooks/use-credits'

export default function CreditsPage() {
  const { balance, transactions, isLoading } = useCredits()

  const getTransactionIcon = (type: string) => {
    if (['purchase', 'bonus', 'refund', 'transfer_in'].includes(type)) {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />
    }
    return <ArrowDownRight className="h-4 w-4 text-red-600" />
  }

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: 'Compra',
      spend: 'Consumo',
      refund: 'Reembolso',
      bonus: 'Bonificación',
      transfer_in: 'Transferencia recibida',
      transfer_out: 'Transferencia enviada',
      adjustment: 'Ajuste',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Créditos</h1>
          <p className="text-muted-foreground">
            Administra tus créditos y revisa el historial
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/credits/buy">
            <Plus className="mr-2 h-4 w-4" />
            Comprar créditos
          </Link>
        </Button>
      </div>

      {/* Balance card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance actual</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{balance.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">créditos disponibles</p>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de movimientos</CardTitle>
          <CardDescription>
            Todas las transacciones de créditos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando transacciones...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay transacciones
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {getTransactionLabel(tx.type)} •{' '}
                        {new Date(tx.created_at).toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Saldo: {tx.balance_after.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
