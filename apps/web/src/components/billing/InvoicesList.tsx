'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Invoice {
  id: string;
  invoice_number: string;
  status: 'open' | 'paid' | 'cancelled' | 'overdue';
  type: string;
  total: number;
  currency: string;
  created_at: string;
  due_date?: string;
  paid_at?: string;
}

interface InvoicesListProps {
  invoices: Invoice[];
  currentPage: number;
  totalPages: number;
}

export function InvoicesList({ invoices, currentPage, totalPages }: InvoicesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      open: 'secondary',
      cancelled: 'outline',
      overdue: 'destructive',
    };

    const labels: Record<string, string> = {
      paid: 'Pagada',
      open: 'Abierta',
      cancelled: 'Cancelada',
      overdue: 'Vencida',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      credit_purchase: 'Compra de Créditos',
      subscription: 'Suscripción',
      auto_recharge: 'Auto-Recarga',
    };
    return labels[type] || type;
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/billing/invoices?${params.toString()}`);
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">No se encontraron facturas</p>
        <p className="text-sm text-muted-foreground">
          Intenta ajustar los filtros de búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/billing/invoices/${invoice.id}`}
                        className="font-semibold hover:text-[var(--tp-buttons)] transition-colors"
                      >
                        {invoice.invoice_number}
                      </Link>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getTypeLabel(invoice.type)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(invoice.created_at).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {invoice.due_date && (
                        <span className="ml-2">
                          • Vence: {new Date(invoice.due_date).toLocaleDateString('es-CL')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {new Intl.NumberFormat('es-CL', {
                        style: 'currency',
                        currency: invoice.currency,
                      }).format(invoice.total)}
                    </p>
                    {invoice.paid_at && (
                      <p className="text-xs text-muted-foreground">
                        Pagada el {new Date(invoice.paid_at).toLocaleDateString('es-CL')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" asChild>
                      <Link href={`/billing/invoices/${invoice.id}`}>
                        <FileText className="h-4 w-4" />
                      </Link>
                    </Button>
                    {invoice.status === 'paid' && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={`/api/billing/invoices/${invoice.id}/pdf`} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

