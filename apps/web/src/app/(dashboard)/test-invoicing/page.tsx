'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';

export default function TestInvoicingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testHaulmerInvoice = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Debes iniciar sesión primero');
        return;
      }

      const response = await fetch('/api/invoicing/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          customer: {
            tax_id: '12312312-3',
            name: 'Cliente Test SPA',
            email: 'test@cliente.com',
            address: 'Av. Test 123',
            city: 'Santiago',
            country: 'CL',
            customer_type: 'empresa',
            giro: 'SERVICIOS',
          },
          document_type: 'factura_electronica',
          items: [
            {
              description: 'Servicio de prueba',
              quantity: 1,
              unit_price: 10000,
              total: 10000,
              tax_exempt: false,
            },
          ],
          currency: 'CLP',
          send_email: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error desconocido');
        return;
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error al crear factura');
    } finally {
      setLoading(false);
    }
  };

  const testStripeInvoice = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Debes iniciar sesión primero');
        return;
      }

      const response = await fetch('/api/invoicing/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          customer: {
            tax_id: 'TAX123456',
            name: 'International Client Inc',
            email: 'client@international.com',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            postal_code: '10001',
            country: 'US',
            customer_type: 'empresa',
          },
          document_type: 'stripe_invoice',
          items: [
            {
              description: 'Consulting Services',
              quantity: 1,
              unit_price: 1000,
              total: 1000,
              tax_exempt: false,
            },
          ],
          currency: 'USD',
          send_email: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error desconocido');
        return;
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error al crear invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de Facturación Externa</CardTitle>
          <CardDescription>
            Prueba la creación de facturas con Haulmer (Chile) y Stripe (Internacional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={testHaulmerInvoice}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Procesando...' : 'Probar Factura Haulmer (Chile)'}
            </Button>
            <Button
              onClick={testStripeInvoice}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Procesando...' : 'Probar Invoice Stripe (US)'}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 font-semibold mb-2">❌ Error:</p>
              <pre className="text-red-600 text-sm whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 font-semibold mb-2">✅ Documento creado exitosamente</p>
                <div className="space-y-2 text-sm">
                  <p><strong>Número:</strong> {result.document?.document_number}</p>
                  <p><strong>Estado:</strong> {result.document?.status}</p>
                  <p><strong>Proveedor:</strong> {result.document?.provider}</p>
                  <p><strong>ID Externo:</strong> {result.document?.external_id}</p>
                  {result.document?.pdf_url && (
                    <p>
                      <strong>PDF:</strong>{' '}
                      <a href={result.document.pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        Ver PDF
                      </a>
                    </p>
                  )}
                  {result.document?.xml_url && (
                    <p>
                      <strong>XML:</strong>{' '}
                      <a href={result.document.xml_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        Ver XML
                      </a>
                    </p>
                  )}
                </div>
              </div>
              <details className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <summary className="cursor-pointer font-semibold">Ver respuesta completa</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

