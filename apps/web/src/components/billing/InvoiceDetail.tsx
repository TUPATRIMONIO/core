'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  type: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  line_items?: LineItem[];
}

interface InvoiceDetailProps {
  invoice: Invoice;
}

export function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Detalle de la Factura
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tabla de line items */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-semibold">Descripción</th>
                  <th className="text-center p-3 font-semibold">Cantidad</th>
                  <th className="text-right p-3 font-semibold">Precio Unitario</th>
                  <th className="text-right p-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items && invoice.line_items.length > 0 ? (
                  invoice.line_items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">
                        {new Intl.NumberFormat('es-CL', {
                          style: 'currency',
                          currency: invoice.currency,
                        }).format(item.unit_price)}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {new Intl.NumberFormat('es-CL', {
                          style: 'currency',
                          currency: invoice.currency,
                        }).format(item.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-muted-foreground">
                      No hay items en esta factura
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: invoice.currency,
                  }).format(invoice.subtotal)}
                </span>
              </div>
              {invoice.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Impuestos</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: invoice.currency,
                    }).format(invoice.tax)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t text-lg font-bold">
                <span>Total</span>
                <span className="text-[var(--tp-buttons)]">
                  {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: invoice.currency,
                  }).format(invoice.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

