import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditTransactionsList } from '@/components/billing/CreditTransactionsList';
import { Button } from '@/components/ui/button';
import { PlusCircle, Wallet } from 'lucide-react';
import Link from 'next/link';

export default function CreditsPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimientos de Créditos</h1>
          <p className="text-muted-foreground mt-2">
            Historial detallado de ingresos y egresos de créditos de tu organización.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/billing/usage">
              Ver Estadísticas de Uso
            </Link>
          </Button>
          <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
            <Link href="/billing/purchase-credits">
              <PlusCircle className="mr-2 h-4 w-4" />
              Comprar Créditos
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Transacciones Recientes
          </CardTitle>
          <CardDescription>
            Mostrando los últimos 50 movimientos registrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreditTransactionsList />
        </CardContent>
      </Card>
    </div>
  );
}
