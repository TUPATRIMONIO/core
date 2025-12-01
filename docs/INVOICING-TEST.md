# Pruebas del Servicio de Facturación Externa

## Opción 1: Usar la Página de Prueba (Recomendado)

1. Inicia sesión en la aplicación: `http://localhost:3000/login`
2. Navega a: `http://localhost:3000/test-invoicing`
3. Haz clic en los botones para probar:
   - **Probar Factura Haulmer (Chile)**: Crea una factura electrónica usando Haulmer
   - **Probar Invoice Stripe (US)**: Crea un invoice usando Stripe

## Opción 2: Usar la Consola del Navegador

Una vez autenticado, abre la consola del navegador (F12) y ejecuta:

### Probar Factura Haulmer (Chile)

```javascript
(async () => {
  try {
    const response = await fetch('/api/invoicing/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        customer: {
          tax_id: '12345678-9',
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
            description: 'Servicio de prueba - Factura Haulmer',
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
    console.log('✅ Resultado:', data);
    
    if (data.document) {
      console.log('📄 Número:', data.document.document_number);
      console.log('📊 Estado:', data.document.status);
      console.log('🔗 Proveedor:', data.document.provider);
      if (data.document.pdf_url) console.log('📎 PDF:', data.document.pdf_url);
      if (data.document.xml_url) console.log('📎 XML:', data.document.xml_url);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

### Probar Stripe Invoice (Internacional)

```javascript
(async () => {
  try {
    const response = await fetch('/api/invoicing/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
            description: 'Consulting Services - Stripe Invoice',
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
    console.log('✅ Resultado:', data);
    
    if (data.document) {
      console.log('📄 Número:', data.document.document_number);
      console.log('📊 Estado:', data.document.status);
      console.log('🔗 Proveedor:', data.document.provider);
      if (data.document.pdf_url) console.log('📎 PDF:', data.document.pdf_url);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

## Opción 3: Usar cURL (Terminal)

Primero necesitas obtener un token de autenticación. Puedes usar el script `scripts/test-invoicing.js`:

```bash
node scripts/test-invoicing.js tu@email.com tu-password
```

O usar cURL directamente (necesitas obtener el token de Supabase primero):

```bash
# 1. Obtener token de Supabase
TOKEN=$(curl -X POST "https://tu-proyecto.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tu-password"}' | jq -r '.access_token')

# 2. Crear factura Haulmer
curl -X POST "http://localhost:3000/api/invoicing/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer": {
      "tax_id": "12345678-9",
      "name": "Cliente Test SPA",
      "email": "test@cliente.com",
      "address": "Av. Test 123",
      "city": "Santiago",
      "country": "CL",
      "customer_type": "empresa",
      "giro": "SERVICIOS"
    },
    "document_type": "factura_electronica",
    "items": [{
      "description": "Servicio de prueba",
      "quantity": 1,
      "unit_price": 10000,
      "total": 10000,
      "tax_exempt": false
    }],
    "currency": "CLP",
    "send_email": false
  }'
```

## Verificar Resultados

Después de crear un documento, puedes verificar en la base de datos:

```sql
-- Ver documentos creados
SELECT * FROM invoicing.documents ORDER BY created_at DESC LIMIT 5;

-- Ver items de documentos
SELECT * FROM invoicing.document_items ORDER BY created_at DESC LIMIT 10;

-- Ver clientes creados
SELECT * FROM invoicing.customers ORDER BY created_at DESC LIMIT 5;
```

O usar la API para listar documentos:

```javascript
// En la consola del navegador (autenticado)
fetch('/api/invoicing/documents', { credentials: 'include' })
  .then(r => r.json())
  .then(data => console.log('Documentos:', data));
```

