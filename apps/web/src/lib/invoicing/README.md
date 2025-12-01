# Servicio de Facturación Externa (invoicing)

Servicio independiente para emisión de documentos tributarios externos via Haulmer (Chile) y Stripe (Internacional).

## Endpoints API

### Emitir Documento

```bash
POST /api/invoicing/documents
Authorization: Bearer <token> o X-API-Key: <api_key>
Content-Type: application/json

{
  "customer": {
    "tax_id": "12345678-9",
    "name": "Empresa Cliente SPA",
    "email": "cliente@empresa.com",
    "address": "Av. Principal 123",
    "city": "Santiago",
    "country": "CL",
    "customer_type": "empresa",
    "giro": "SERVICIOS"
  },
  "document_type": "factura_electronica", // Opcional, se determina por país
  "items": [
    {
      "description": "Servicio de asesoría legal",
      "quantity": 1,
      "unit_price": 100000,
      "total": 100000,
      "tax_exempt": false
    }
  ],
  "currency": "CLP",
  "send_email": true,
  "order_id": "uuid-opcional" // Si viene de una orden
}
```

### Listar Documentos

```bash
GET /api/invoicing/documents?limit=50&offset=0
Authorization: Bearer <token> o X-API-Key: <api_key>
```

### Obtener Documento

```bash
GET /api/invoicing/documents/:id
Authorization: Bearer <token> o X-API-Key: <api_key>
```

### Anular Documento

```bash
POST /api/invoicing/documents/:id/void
Authorization: Bearer <token> o X-API-Key: <api_key>
```

### Crear Customer

```bash
POST /api/invoicing/customers
Authorization: Bearer <token> o X-API-Key: <api_key>

{
  "tax_id": "12345678-9",
  "name": "Empresa Cliente SPA",
  "email": "cliente@empresa.com",
  "address": "Av. Principal 123",
  "city": "Santiago",
  "country": "CL",
  "customer_type": "empresa",
  "giro": "SERVICIOS"
}
```

### Crear API Key

```bash
POST /api/invoicing/api-keys
Authorization: Bearer <user_token>

{
  "name": "Mi Sistema Externo",
  "permissions": {
    "documents": ["create", "read"],
    "customers": ["create", "read"]
  },
  "expires_at": "2025-12-31T23:59:59Z" // Opcional
}
```

## Autenticación

### Usuarios Autenticados
Usa el token de Supabase Auth en el header `Authorization: Bearer <token>`

### API Keys
Usa la API key en el header `X-API-Key: <key>` o `Authorization: Bearer <key>`

## Tipos de Documentos

- `factura_electronica` - Factura electrónica (Haulmer, Chile)
- `boleta_electronica` - Boleta electrónica (Haulmer, Chile)
- `stripe_invoice` - Invoice de Stripe (Internacional)

Si no especificas `document_type`, se determina automáticamente según el país del customer:
- Chile (`CL`) → `factura_electronica`
- Otros países → `stripe_invoice`

## Respuesta Exitosa

```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "document_number": "INV-2025-00001",
    "status": "issued",
    "external_id": "12345",
    "pdf_url": "https://...",
    "xml_url": "https://...", // Solo Haulmer
    ...
  }
}
```

