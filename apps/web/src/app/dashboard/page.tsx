'use client'

import Link from 'next/link'
import { PenTool, Stamp, Users, CreditCard, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { useAuthStore } from '@/stores/auth-store'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useCredits } from '@/hooks/use-credits'

export default function DashboardPage() {
  const { profile, currentOrganization } = useAuthStore()
  const { hasPermission } = usePermissionsStore()
  const { balance, transactions } = useCredits()

  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}
        </h1>
        <p className="text-muted-foreground">
          Bienvenido a {currentOrganization?.name || 'TuPatrimonio'}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos disponibles</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balance.toLocaleString()}</div>
            <Link href="/dashboard/credits/buy" className="text-xs text-primary hover:underline">
              Comprar más créditos
            </Link>
          </CardContent>
        </Card>

        {hasPermission('signatures', 'view') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos firmados</CardTitle>
              <PenTool className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>
        )}

        {hasPermission('notary', 'view') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitudes notariales</CardTitle>
              <Stamp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">En proceso</p>
            </CardContent>
          </Card>
        )}

        {hasPermission('crm', 'view') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contactos CRM</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hasPermission('signatures', 'create') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Firma Electrónica
              </CardTitle>
              <CardDescription>
                Envía documentos para firma electrónica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/dashboard/signatures/new">
                  Nuevo documento
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {hasPermission('notary', 'create') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stamp className="h-5 w-5" />
                Servicios Notariales
              </CardTitle>
              <CardDescription>
                Solicita servicios notariales en línea
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/notary/new">
                  Nueva solicitud
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Créditos
            </CardTitle>
            <CardDescription>
              Compra créditos para usar los servicios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/credits/buy">
                Comprar créditos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
          <CardDescription>
            Últimos movimientos de créditos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay actividad reciente
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
