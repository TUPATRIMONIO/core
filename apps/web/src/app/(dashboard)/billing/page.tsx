import { getBillingOverviewAction } from '@/lib/billing/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function BillingPage() {
  const overview = await getBillingOverviewAction();
  
  const availableBalance = (overview.account?.balance || 0) - (overview.account?.reserved_balance || 0);
  const reservedBalance = overview.account?.reserved_balance || 0;
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Facturación</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tus créditos, métodos de pago y suscripción
        </p>
      </div>
      
      {/* Balance de Créditos */}
      <Card>
        <CardHeader>
          <CardTitle>Balance de Créditos</CardTitle>
          <CardDescription>Créditos disponibles y reservados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Disponible</span>
            <span className="text-2xl font-bold">{availableBalance.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Reservado</span>
            <span className="text-lg">{reservedBalance.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-semibold">{(overview.account?.balance || 0).toFixed(2)}</span>
          </div>
          <div className="pt-4">
            <Button asChild>
              <Link href="/billing/purchase-credits">Comprar Créditos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Auto-Recarga */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Recarga</CardTitle>
          <CardDescription>Configura recarga automática cuando se agoten los créditos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {overview.account?.auto_recharge_enabled ? 'Habilitada' : 'Deshabilitada'}
              </p>
              {overview.account?.auto_recharge_enabled && (
                <p className="text-sm text-muted-foreground">
                  Se recargará {overview.account?.auto_recharge_amount} créditos cuando el balance baje de {overview.account?.auto_recharge_threshold}
                </p>
              )}
            </div>
            <Button variant="outline" asChild>
              <Link href="/billing/settings">Configurar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Suscripción */}
      {overview.subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Suscripción</CardTitle>
            <CardDescription>Plan actual y próxima factura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-medium">
                {overview.subscription.subscription_plans?.name || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <span className="font-medium capitalize">{overview.subscription.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Próxima factura</span>
              <span className="font-medium">
                {new Date(overview.subscription.current_period_end).toLocaleDateString()}
              </span>
            </div>
            <div className="pt-4">
              <Button variant="outline" asChild>
                <Link href="/billing/subscription">Gestionar Suscripción</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Métodos de Pago */}
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pago</CardTitle>
          <CardDescription>Tarjetas y métodos guardados</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.paymentMethods.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">No hay métodos de pago guardados</p>
              <Button asChild>
                <Link href="/billing/payment-methods">Agregar Método de Pago</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {overview.paymentMethods.map((method: any) => (
                <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {method.brand ? `${method.brand.toUpperCase()} •••• ${method.last4}` : 'Método de pago'}
                    </p>
                    {method.is_default && (
                      <p className="text-xs text-muted-foreground">Predeterminado</p>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" asChild className="w-full mt-4">
                <Link href="/billing/payment-methods">Gestionar Métodos</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Facturas Recientes */}
      {overview.recentInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Facturas Recientes</CardTitle>
            <CardDescription>Últimas facturas generadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overview.recentInvoices.map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {invoice.currency} {invoice.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">{invoice.status}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" asChild className="w-full mt-4">
              <Link href="/billing/invoices">Ver Todas las Facturas</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

