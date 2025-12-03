# Sistema de Facturación Independiente (invoicing)

> **Fecha de implementación:** Diciembre 2025  
> **Estado:** ✅ Completado y probado  
> **Schema:** `invoicing`

## Resumen Ejecutivo

Sistema de facturación completamente independiente que reemplaza el sistema anterior basado en `billing.invoices`. Este nuevo sistema es **API-first**, permitiendo que cualquier aplicación (interna o externa) pueda generar facturas, boletas e invoices mediante llamadas HTTP.

### Características Principales

- ✅ **API independiente**: Endpoints RESTful para crear y gestionar documentos
- ✅ **Multi-proveedor**: Integración con Haulmer (Chile) y Stripe (Internacional)
- ✅ **Multi-tenant**: Aislamiento completo por `organization_id`
- ✅ **Almacenamiento**: PDFs y XMLs guardados en Supabase Storage
- ✅ **Autenticación flexible**: Supabase Auth (usuarios internos) y API Keys (sistemas externos)

---

## Arquitectura

### Schema `invoicing`

El sistema utiliza un schema PostgreSQL dedicado con las siguientes tablas:

#### `invoicing.customers`
Almacena información de los receptores de documentos (clientes).

```sql
- id (UUID)
- organization_id (UUID) - Multi-tenant
- tax_id (TEXT) - RUT (Chile) o Tax ID (otros países)
- name, email, address, city, state, postal_code, country
- customer_type (persona_natural | empresa)
- giro (TEXT) - Giro comercial (Chile)
- metadata (JSONB)
```

#### `invoicing.documents`
Documentos tributarios emitidos (facturas, boletas, invoices).

```sql
- id (UUID)
- organization_id (UUID) - Multi-tenant
- customer_id (UUID) - Referencia a customers
- document_number (TEXT) - Número interno único (ej: FAC-20251201-123456789)
- document_type (factura_electronica | boleta_electronica | stripe_invoice)
- provider (haulmer | stripe)
- status (pending | processing | issued | failed | voided)
- subtotal, tax, total, currency
- external_id (TEXT) - ID del proveedor (Folio Haulmer o Invoice ID Stripe)
- pdf_url, xml_url (TEXT) - URLs públicas de documentos
- order_id (UUID) - Opcional: vinculación con billing.orders
- metadata, provider_response (JSONB)
```

#### `invoicing.document_items`
Líneas de detalle de cada documento.

```sql
- id (UUID)
- document_id (UUID)
- description, quantity, unit_price, total
- tax_exempt (BOOLEAN)
- metadata (JSONB)
```

#### `invoicing.api_keys`
API Keys para acceso externo (futuro).

```sql
- id (UUID)
- organization_id (UUID)
- key_hash (TEXT) - Hash de la API key (nunca en texto plano)
- name, permissions, rate_limit
- last_used_at, expires_at
```

#### `invoicing.emission_config`
Configuración de emisión por organización (futuro).

```sql
- organization_id (UUID)
- default_document_type (TEXT)
- default_provider (TEXT)
- settings (JSONB)
```

---

## Proveedores

### Haulmer (Chile)

**Uso:** Facturas y boletas electrónicas para clientes chilenos.

**Tipos de documento:**
- `factura_electronica` (TipoDTE: 33) - Para empresas
- `boleta_electronica` (TipoDTE: 39) - Para personas naturales

**Características:**
- Genera PDF y XML del DTE
- Folio asignado automáticamente por Haulmer
- Validación estricta de RUT (verificador matemático)
- Almacenamiento en `invoices/haulmer/{org_id}/{doc_id}-{folio}.pdf`

**⚠️ Diferencias entre Factura y Boleta (Haulmer):**

Las facturas (TipoDTE 33) y boletas (TipoDTE 39) tienen estructuras XML **muy diferentes**:

| Campo | Factura (33) | Boleta (39) |
|-------|--------------|-------------|
| `IdDoc.TpoTranCompra` | `'1'` | **No incluir** |
| `IdDoc.TpoTranVenta` | `'1'` | **No incluir** |
| `IdDoc.FmaPago` | Sí | **No incluir** |
| `IdDoc.IndServicio` | No | `'3'` (string) |
| `Emisor.RznSoc` | Sí | No |
| `Emisor.RznSocEmisor` | No | Sí |
| `Emisor.GiroEmis` | Sí | No |
| `Emisor.GiroEmisor` | No | Sí |
| `Emisor.Telefono` | Sí | **No incluir** |
| `Receptor.GiroRecep` | Sí | **No incluir** |
| `Receptor.CorreoRecep` | Sí | **No incluir** |
| `Totales.MontoPeriodo` | Sí | No |
| `Totales.TotalPeriodo` | No | Sí |

**Configuración:**
- API Key: `HAULMER_API_KEY`
- Ambiente: `HAULMER_ENVIRONMENT` (sandbox | production)
- Datos del emisor: Configurados en `apps/web/src/lib/haulmer/client.ts` o variables de entorno

### Stripe (Internacional)

**Uso:** Invoices para clientes internacionales o pagos con Stripe.

**Tipo de documento:**
- `stripe_invoice` - Invoice estándar de Stripe

**Características:**
- Genera PDF del invoice
- Invoice ID asignado por Stripe
- Almacenamiento en `invoices/stripe/{org_id}/{doc_id}-{invoice_id}.pdf`

**Configuración:**
- Secret Key: `STRIPE_SECRET_KEY`
- Usa información de tu cuenta de Stripe

---

## API Endpoints

### POST `/api/invoicing/documents`

Crea y emite un documento tributario.

**Autenticación:** Supabase Auth (cookie) o API Key (header `X-API-Key`)

**Request Body:**
```json
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
  "document_type": "factura_electronica", // Opcional: se determina por país
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
  "send_email": false,
  "order_id": "uuid-opcional",
  "metadata": {}
}
```

**Response (200):**
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "document_number": "FAC-20251201-123456789",
    "document_type": "factura_electronica",
    "provider": "haulmer",
    "status": "issued",
    "external_id": "177809",
    "pdf_url": "https://...supabase.co/storage/v1/object/public/invoices/haulmer/.../...pdf",
    "xml_url": "https://...supabase.co/storage/v1/object/public/invoices/haulmer/.../...xml",
    "subtotal": 84033,
    "tax": 15967,
    "total": 100000,
    "currency": "CLP",
    "issued_at": "2025-12-01T12:00:00Z"
  }
}
```

**Errores comunes:**
- `400`: Datos inválidos (customer o items faltantes)
- `401`: No autenticado
- `500`: Error en proveedor (RUT inválido, API Key incorrecta, etc.)

### GET `/api/invoicing/documents`

Lista documentos de la organización autenticada.

**Query Parameters:**
- `limit` (default: 50)
- `offset` (default: 0)
- `status` (opcional: pending, issued, failed, etc.)

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "document_number": "FAC-20251201-123456789",
      "document_type": "factura_electronica",
      "provider": "haulmer",
      "status": "issued",
      "total": 100000,
      "currency": "CLP",
      "created_at": "2025-12-01T12:00:00Z"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

### GET `/api/invoicing/documents/[id]`

Obtiene un documento específico por ID.

**Response:**
```json
{
  "document": {
    "id": "uuid",
    "document_number": "FAC-20251201-123456789",
    "document_type": "factura_electronica",
    "provider": "haulmer",
    "status": "issued",
    "external_id": "177809",
    "pdf_url": "...",
    "xml_url": "...",
    "customer": {
      "name": "Empresa Cliente SPA",
      "tax_id": "12345678-9"
    },
    "items": [
      {
        "description": "Servicio de asesoría legal",
        "quantity": 1,
        "unit_price": 100000,
        "total": 100000
      }
    ],
    "subtotal": 84033,
    "tax": 15967,
    "total": 100000,
    "currency": "CLP"
  }
}
```

### POST `/api/invoicing/documents/[id]/void`

Anula un documento emitido.

**Response:**
```json
{
  "success": true,
  "document": {
    "status": "voided",
    "voided_at": "2025-12-01T13:00:00Z"
  }
}
```

---

## Flujo de Emisión

```
1. Cliente llama POST /api/invoicing/documents
   ↓
2. Autenticación (Supabase Auth o API Key)
   ↓
3. Validación de datos (customer, items)
   ↓
4. Determinar tipo de documento (por país si no se especifica)
   ↓
5. Determinar proveedor (Haulmer para CL, Stripe para otros)
   ↓
6. Obtener o crear customer en invoicing.customers
   ↓
7. Calcular totales (subtotal, tax, total)
   ↓
8. Generar número de documento interno
   ↓
9. Crear registro en invoicing.documents (status: pending)
   ↓
10. Crear items en invoicing.document_items
    ↓
11. Llamar al proveedor externo (Haulmer o Stripe)
    ↓
12. Guardar PDF/XML en Supabase Storage
    ↓
13. Actualizar documento (status: issued, external_id, pdf_url, xml_url)
    ↓
14. Retornar documento completo
```

---

## Almacenamiento

### Bucket `invoices`

Estructura de carpetas:
```
invoices/
├── haulmer/
│   └── {organization_id}/
│       ├── {document_id}-{folio}.pdf
│       └── {document_id}-{folio}.xml
└── stripe/
    └── {organization_id}/
        └── {document_id}-{invoice_id}.pdf
```

**Políticas RLS:**
- Lectura pública de archivos (URLs públicas)
- Escritura solo con `service_role` (desde el servidor)

---

## Configuración para Producción

### Variables de Entorno (Vercel)

**Haulmer:**
```bash
HAULMER_API_KEY=tu_api_key_de_produccion
HAULMER_ENVIRONMENT=production
HAULMER_API_URL=https://api.haulmer.com  # Opcional, se usa por defecto
```

**Datos del Emisor (Opcional - sobrescribir valores por defecto):**
```bash
HAULMER_EMISOR_RUT=77028682-4
HAULMER_EMISOR_RAZON_SOCIAL=TU PATRIMONIO ASESORIAS SPA
HAULMER_EMISOR_GIRO=SERV DIGITALES, INMOBILIARIOS, FINANCIEROS, COMERCIALIZACION VEHICULO
HAULMER_EMISOR_ACTECO=620900
HAULMER_EMISOR_DIRECCION=AV. PROVIDENCIA 1208, OF 207
HAULMER_EMISOR_COMUNA=Providencia
HAULMER_EMISOR_SUCURSAL=83413793
HAULMER_EMISOR_TELEFONO=+56949166719
```

**Stripe:**
```bash
STRIPE_SECRET_KEY=sk_live_...  # Clave de producción
```

### Datos del Emisor

Los datos del emisor están configurados en `apps/web/src/lib/haulmer/client.ts` (líneas 24-33). Para cambiarlos:

1. **Opción A (Recomendada)**: Usar variables de entorno en Vercel (ver arriba)
2. **Opción B**: Modificar directamente las constantes en el archivo

**Datos actuales:**
- RUT: `77028682-4`
- Razón Social: `TU PATRIMONIO ASESORIAS SPA`
- Giro: `SERV DIGITALES, INMOBILIARIOS, FINANCIEROS, COMERCIALIZACION VEHICULO`
- Acteco: `620900`
- Dirección: `AV. PROVIDENCIA 1208, OF 207`
- Comuna: `Providencia`
- Sucursal: `83413793`
- Teléfono: `+56949166719`

### Bucket en Producción

Asegurar que el bucket `invoices` existe en Supabase producción:

1. Ir a Storage en el dashboard de Supabase
2. Crear bucket `invoices` si no existe
3. Configurar políticas RLS:
   - Lectura pública (para URLs públicas)
   - Escritura solo con `service_role`

---

## Ejemplos de Uso

### Ejemplo 1: Factura Electrónica (Haulmer)

```bash
curl -X POST https://tu-dominio.com/api/invoicing/documents \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
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
    "document_type": "factura_electronica",
    "items": [
      {
        "description": "Servicio de asesoría legal",
        "quantity": 1,
        "unit_price": 100000,
        "total": 100000,
        "tax_exempt": false
      }
    ],
    "currency": "CLP"
  }'
```

### Ejemplo 2: Invoice Stripe (Internacional)

```bash
curl -X POST https://tu-dominio.com/api/invoicing/documents \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "customer": {
      "tax_id": "US123456789",
      "name": "International Client Inc",
      "email": "client@international.com",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "US",
      "customer_type": "empresa"
    },
    "document_type": "stripe_invoice",
    "items": [
      {
        "description": "Consulting Services",
        "quantity": 10,
        "unit_price": 100,
        "total": 1000,
        "tax_exempt": false
      }
    ],
    "currency": "USD"
  }'
```

---

## Migraciones

Las siguientes migraciones crean el sistema completo:

1. `20251202120000_schema-invoicing-new.sql` - Schema base
2. `20251202130000_invoicing-functions.sql` - Funciones helper
3. `20251202140000_invoicing-rls.sql` - Políticas RLS
4. `20251202150000_invoicing-views.sql` - Vistas públicas
5. `20251202160000_invoicing-rpc-wrappers.sql` - Wrappers RPC
7. `20251202180000_invoicing-schema-permissions.sql` - Permisos
8. `20251202190000_invoicing-crud-functions.sql` - Funciones CRUD
9. `20251202200000_fix-generate-document-number.sql` - Fix generación números

---

## Archivos Clave

**Schema y Migraciones:**
- `supabase/migrations/20251202120000_schema-invoicing-new.sql` - Schema completo
- `supabase/migrations/20251202190000_invoicing-crud-functions.sql` - Funciones RPC

**Librerías:**
- `apps/web/src/lib/haulmer/client.ts` - Cliente Haulmer (datos emisor aquí)
- `apps/web/src/lib/stripe/client.ts` - Cliente Stripe
- `apps/web/src/lib/invoicing/emitter.ts` - Orquestador de emisión
- `apps/web/src/lib/invoicing/types.ts` - Tipos TypeScript
- `apps/web/src/lib/invoicing/auth.ts` - Autenticación

**API Endpoints:**
- `apps/web/src/app/api/invoicing/documents/route.ts` - POST/GET documentos
- `apps/web/src/app/api/invoicing/documents/[id]/route.ts` - GET/POST void documento
- `apps/web/src/app/api/invoicing/customers/route.ts` - POST/GET customers

---

## Checklist Pre-Producción

- [ ] Variables de entorno configuradas en Vercel (Haulmer API Key producción)
- [ ] `HAULMER_ENVIRONMENT=production` configurado
- [ ] Bucket `invoices` creado en Supabase producción con políticas RLS
- [ ] Datos del emisor verificados (RUT, razón social, dirección)
- [ ] API Key de Haulmer producción verificada
- [ ] `STRIPE_SECRET_KEY` de producción configurada
- [ ] Testing de emisión de factura real antes de lanzar
- [x] Página de testing protegida (`/test-invoicing`) - Solo accesible para platform admins

## ✅ Pruebas Completadas (Diciembre 2025)

| Tipo Documento | Proveedor | Estado | Archivos Generados |
|----------------|-----------|--------|-------------------|
| Factura Electrónica (TipoDTE 33) | Haulmer | ✅ Éxito | PDF + XML |
| Boleta Electrónica (TipoDTE 39) | Haulmer | ✅ Éxito | PDF + XML |
| Invoice Internacional | Stripe | ✅ Éxito | PDF |

**Notas de las pruebas:**
- Todos los documentos se emiten correctamente
- PDFs y XMLs se guardan en Supabase Storage
- URLs públicas funcionan correctamente
- Folio de Haulmer se asigna automáticamente
- Invoice ID de Stripe se guarda correctamente

---

## Troubleshooting

### Error: "Haulmer OF-02: Faltan campos obligatorios"
- Verificar que el RUT tenga formato correcto y dígito verificador válido
- Verificar que todos los campos requeridos estén presentes

### Error: "Haulmer OF-08: Validación de Esquema" (Boletas)
Este error ocurre cuando se envían campos incorrectos para boletas (TipoDTE 39):
- **`TpoTranCompra` no esperado**: No incluir este campo en boletas, usar `IndServicio: '3'`
- **`RznSoc` no esperado**: Usar `RznSocEmisor` en lugar de `RznSoc` para boletas
- **`GiroRecep` no esperado**: No incluir `GiroRecep` en el receptor para boletas
- **`MontoPeriodo` no esperado**: Usar `TotalPeriodo` en lugar de `MontoPeriodo` para boletas
- **`FmaPago` no esperado**: No incluir `FmaPago` en `IdDoc` para boletas
- **`Telefono` no esperado**: No incluir `Telefono` en el emisor para boletas
- **`CorreoRecep` no esperado**: No incluir `CorreoRecep` en el receptor para boletas

**Solución:** Ver tabla de diferencias en la sección "Haulmer (Chile)" arriba.

### Error: "The schema must be one of the following: public, graphql_public"
- Este error indica que se intentó acceder directamente al schema `invoicing` desde el cliente
- Usar siempre las funciones RPC (`create_invoicing_document`, etc.)

### Error: "Failed to generate unique document number"
- Verificar que la función `generate_document_number` esté correctamente implementada
- Revisar migración `20251202200000_fix-generate-document-number.sql`

### PDF/XML no se guardan en Storage
- Verificar que el bucket `invoices` existe
- Verificar permisos de `service_role` en el bucket
- Revisar logs del servidor para errores de upload

---

## Referencias

- [Documentación Haulmer API](https://docsapi-openfactura.haulmer.com/)
- [Documentación Stripe Invoices](https://stripe.com/docs/api/invoices)
- [Arquitectura de Schemas](docs/schemas/ARCHITECTURE-SCHEMAS.md)

