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

  const testHaulmerBoleta = async () => {
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
            tax_id: '12312312-3', // RUT válido de persona natural
            name: 'Juan Pérez González',
            email: 'juan.perez@example.com',
            address: 'Calle Los Rosales 456',
            city: 'Santiago',
            country: 'CL',
            customer_type: 'persona_natural',
            // Las boletas no requieren giro comercial
          },
          document_type: 'boleta_electronica',
          items: [
            {
              description: 'Servicio de consultoría',
              quantity: 1,
              unit_price: 50000,
              total: 50000,
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
      setError(err.message || 'Error al crear boleta');
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
            Prueba la creación de facturas y boletas con Haulmer (Chile) y Stripe (Internacional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={testHaulmerInvoice}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Procesando...' : 'Probar Factura Haulmer'}
            </Button>
            <Button
              onClick={testHaulmerBoleta}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? 'Procesando...' : 'Probar Boleta Haulmer'}
            </Button>
            <Button
              onClick={testStripeInvoice}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Procesando...' : 'Probar Invoice Stripe'}
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
              <div className="p-4 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
                <p className="text-green-800 dark:text-green-300 font-semibold mb-4 text-lg">✅ Documento creado exitosamente</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p><strong>Número interno:</strong> {result.document?.document_number || 'N/A'}</p>
                    <p><strong>Estado:</strong> <span className="px-2 py-0.5 bg-green-100 dark:bg-green-800 rounded text-green-800 dark:text-green-200">{result.document?.status || 'N/A'}</span></p>
                    <p><strong>Proveedor:</strong> {result.document?.provider || 'N/A'}</p>
                    <p><strong>Folio/ID Externo:</strong> <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{result.document?.external_id || 'N/A'}</span></p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>Total:</strong> ${result.document?.total?.toLocaleString('es-CL') || 'N/A'} {result.document?.currency}</p>
                    <p><strong>Subtotal:</strong> ${result.document?.subtotal?.toLocaleString('es-CL') || 'N/A'}</p>
                    <p><strong>IVA:</strong> ${result.document?.tax?.toLocaleString('es-CL') || 'N/A'}</p>
                  </div>
                </div>
                
                {/* Links a documentos */}
                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700 flex flex-wrap gap-3">
                  {result.document?.pdf_url ? (
                    <a 
                      href={result.document.pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      📄 Ver PDF
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm">PDF no disponible</span>
                  )}
                  {result.document?.xml_url && (
                    <a 
                      href={result.document.xml_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      📋 Ver XML
                    </a>
                  )}
                </div>
              </div>
              
              <details className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                <summary className="cursor-pointer font-semibold">Ver respuesta completa (JSON)</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-96 bg-gray-100 dark:bg-gray-900 p-3 rounded">
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

