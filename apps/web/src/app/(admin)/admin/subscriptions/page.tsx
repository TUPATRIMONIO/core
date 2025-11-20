import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/admin/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CreditCard, DollarSign, Star } from 'lucide-react'

async function getPlans() {
  const supabase = await createClient()

  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching plans:', error)
    return []
  }

  return plans || []
}

async function getSubscriptions() {
  const supabase = await createClient()

  const { data: subscriptions, error } = await supabase
    .from('organization_subscriptions')
    .select(`
      *,
      organizations(name),
      subscription_plans(name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching subscriptions:', error)
    return []
  }

  return subscriptions || []
}

export default async function SubscriptionsPage() {
  const plans = await getPlans()
  const subscriptions = await getSubscriptions()

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Suscripciones"
        description="Gestiona planes y suscripciones activas"
      />

      <div className="flex-1 p-6">
        <Tabs defaultValue="plans" className="space-y-4">
          <TabsList>
            <TabsTrigger value="plans">Planes</TabsTrigger>
            <TabsTrigger value="subscriptions">Suscripciones Activas</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan: any) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {plan.name}
                      </CardTitle>
                      {plan.is_popular && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Star className="mr-1 h-3 w-3" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{plan.slug}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        <DollarSign className="inline h-5 w-5" />
                        {plan.price_monthly}
                      </span>
                      <span className="text-sm text-muted-foreground">/mes</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <DollarSign className="inline h-4 w-4" />
                      {plan.price_yearly}/año
                    </div>

                    {plan.is_active ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                        Inactivo
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organización</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Inicio</TableHead>
                      <TableHead>Fin</TableHead>
                      <TableHead>Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub: any) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">
                          {sub.organizations.name}
                        </TableCell>
                        <TableCell>{sub.subscription_plans.name}</TableCell>
                        <TableCell>
                          <StatusBadge status={sub.status} />
                        </TableCell>
                        <TableCell>
                          {new Date(sub.current_period_start).toLocaleDateString('es-CL')}
                        </TableCell>
                        <TableCell>
                          {new Date(sub.current_period_end).toLocaleDateString('es-CL')}
                        </TableCell>
                        <TableCell>
                          ${sub.price_monthly}/{sub.currency}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

