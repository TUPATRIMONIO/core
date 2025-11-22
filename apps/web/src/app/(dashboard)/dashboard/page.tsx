import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  CreditCard, 
  Contact, 
  TrendingUp, 
  Wallet,
  ArrowRight,
  Building2,
  Ticket,
  Package,
} from 'lucide-react'

async function getDashboardData() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  // Obtener organización del usuario
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!orgUser) {
    return null
  }

  // Obtener cuenta de créditos
  const { data: creditAccount } = await supabase
    .from('credit_accounts')
    .select('balance, reserved_balance')
    .eq('organization_id', orgUser.organization_id)
    .single()

  // Obtener estadísticas básicas del CRM (si existe función)
  let crmStats = {
    contacts: 0,
    companies: 0,
    deals: 0,
    tickets: 0,
  }

  try {
    const { data: stats } = await supabase.rpc('crm.get_stats', {
      org_id_param: orgUser.organization_id,
    })
    if (stats) {
      crmStats = {
        contacts: stats.total_contacts || 0,
        companies: stats.total_companies || 0,
        deals: stats.total_deals || 0,
        tickets: stats.total_tickets || 0,
      }
    }
  } catch (error) {
    // Si no existe la función, usar valores por defecto
  }

  return {
    creditAccount,
    crmStats,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p>No se encontró organización. Por favor, contacta al administrador.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const availableBalance = (data.creditAccount?.balance || 0) - (data.creditAccount?.reserved_balance || 0)

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 px-4 pb-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Bienvenido a TuPatrimonio
          </p>
        </div>

        {/* Créditos */}
        <Card>
          <CardHeader>
            <CardTitle>Créditos</CardTitle>
            <CardDescription>Balance de créditos disponible</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{availableBalance.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">
                  Total: {(data.creditAccount?.balance || 0).toFixed(2)} créditos
                </div>
              </div>
              <Button asChild>
                <Link href="/billing/purchase-credits">
                  Comprar Créditos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CRM Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contactos</CardTitle>
              <Contact className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.crmStats.contacts}</div>
              <Button variant="link" className="p-0 h-auto" asChild>
                <Link href="/dashboard/crm/contacts">Ver todos</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.crmStats.companies}</div>
              <Button variant="link" className="p-0 h-auto" asChild>
                <Link href="/dashboard/crm/companies">Ver todas</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.crmStats.deals}</div>
              <Button variant="link" className="p-0 h-auto" asChild>
                <Link href="/dashboard/crm/deals">Ver todos</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.crmStats.tickets}</div>
              <Button variant="link" className="p-0 h-auto" asChild>
                <Link href="/dashboard/crm/tickets">Ver todos</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Accesos rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
            <CardDescription>Navega rápidamente a las secciones principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Button variant="outline" className="h-auto flex-col p-4" asChild>
                <Link href="/billing">
                  <CreditCard className="mb-2 h-6 w-6" />
                  <span>Facturación</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col p-4" asChild>
                <Link href="/dashboard/crm">
                  <Contact className="mb-2 h-6 w-6" />
                  <span>CRM</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col p-4" asChild>
                <Link href="/billing/purchase-credits">
                  <Wallet className="mb-2 h-6 w-6" />
                  <span>Comprar Créditos</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col p-4" asChild>
                <Link href="/billing/invoices">
                  <CreditCard className="mb-2 h-6 w-6" />
                  <span>Facturas</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col p-4" asChild>
                <Link href="/billing/usage">
                  <TrendingUp className="mb-2 h-6 w-6" />
                  <span>Uso de Créditos</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col p-4" asChild>
                <Link href="/dashboard/blog">
                  <Package className="mb-2 h-6 w-6" />
                  <span>Blog</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

