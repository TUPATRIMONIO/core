# API de Reembolsos

Endpoints para consultar y gestionar reembolsos procesados en el sistema.

## Endpoints Disponibles

### 1. Listar Reembolsos

**GET** `/api/admin/refunds`

Obtiene una lista paginada de reembolsos con filtros opcionales.

#### Parámetros de Query

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `order_id` | UUID | Filtrar por ID de orden | `?order_id=6a5d1518-6664-462e-b1c0-721b1300a83b` |
| `organization_id` | UUID | Filtrar por ID de organización | `?organization_id=daf669a6-098f-4453-9e11-ac72b3203601` |
| `provider_refund_id` | string | Buscar por ID del reembolso en el proveedor | `?provider_refund_id=003447` |
| `status` | string | Filtrar por estado | `?status=completed` |
| `provider` | string | Filtrar por proveedor | `?provider=stripe` |
| `refund_destination` | string | Filtrar por destino | `?refund_destination=payment_method` |
| `from_date` | ISO string | Fecha desde | `?from_date=2025-12-01T00:00:00Z` |
| `to_date` | ISO string | Fecha hasta | `?to_date=2025-12-31T23:59:59Z` |
| `page` | number | Número de página (default: 1) | `?page=2` |
| `limit` | number | Resultados por página (default: 20, max: 100) | `?limit=50` |

#### Valores Válidos

- **status**: `pending`, `approved`, `processing`, `completed`, `rejected`
- **provider**: `stripe`, `transbank_webpay`, `transbank_oneclick`
- **refund_destination**: `payment_method`, `wallet`

#### Ejemplo de Respuesta

```json
{
  "refunds": [
    {
      "id": "a7003fe7-2c57-4dc4-be02-4d89caf4d5e5",
      "order_id": "6a5d1518-6664-462e-b1c0-721b1300a83b",
      "organization_id": "daf669a6-098f-4453-9e11-ac72b3203601",
      "amount": 100,
      "currency": "CLP",
      "refund_destination": "payment_method",
      "status": "completed",
      "provider": "transbank",
      "provider_refund_id": "003447",
      "reason": "requested_by_customer",
      "processed_at": "2025-12-09T00:00:35.168+00:00",
      "created_at": "2025-12-09T00:00:32.367785+00:00",
      "order_number": "200043",
      "order_status": "refunded",
      "organization_name": "felipe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 17,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

#### Ejemplos de Uso

```bash
# Listar todos los reembolsos
GET /api/admin/refunds

# Filtrar por orden específica
GET /api/admin/refunds?order_id=6a5d1518-6664-462e-b1c0-721b1300a83b

# Filtrar por proveedor y estado
GET /api/admin/refunds?provider=stripe&status=completed

# Filtrar por rango de fechas
GET /api/admin/refunds?from_date=2025-12-01T00:00:00Z&to_date=2025-12-31T23:59:59Z

# Paginación
GET /api/admin/refunds?page=2&limit=50
```

---

### 2. Obtener Reembolso por ID

**GET** `/api/admin/refunds/[id]`

Obtiene los detalles de un reembolso específico.

#### Ejemplo

```bash
GET /api/admin/refunds/a7003fe7-2c57-4dc4-be02-4d89caf4d5e5
```

#### Respuesta

```json
{
  "refund": {
    "id": "a7003fe7-2c57-4dc4-be02-4d89caf4d5e5",
    "order_id": "6a5d1518-6664-462e-b1c0-721b1300a83b",
    "organization_id": "daf669a6-098f-4453-9e11-ac72b3203601",
    "amount": 100,
    "currency": "CLP",
    "refund_destination": "payment_method",
    "status": "completed",
    "provider": "transbank",
    "provider_refund_id": "003447",
    "reason": "requested_by_customer",
    "processed_at": "2025-12-09T00:00:35.168+00:00",
    "created_at": "2025-12-09T00:00:32.367785+00:00",
    "order_number": "200043",
    "order_status": "refunded",
    "organization_name": "felipe"
  }
}
```

---

### 3. Buscar por Provider Refund ID

**GET** `/api/admin/refunds/by-provider-id`

Busca un reembolso por su ID en el proveedor (Stripe/Transbank). Útil cuando solo tienes el ID del proveedor (ej: desde el portal de Transbank).

#### Parámetros de Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `provider_refund_id` | string | Sí | ID del reembolso en el proveedor |
| `provider` | string | No | Proveedor (recomendado para mejor precisión) |

#### Ejemplo

```bash
# Buscar por ID de Transbank
GET /api/admin/refunds/by-provider-id?provider_refund_id=003447&provider=transbank

# Buscar por ID de Stripe
GET /api/admin/refunds/by-provider-id?provider_refund_id=re_1234567890&provider=stripe
```

#### Respuesta

```json
{
  "refund": {
    "id": "a7003fe7-2c57-4dc4-be02-4d89caf4d5e5",
    "order_id": "6a5d1518-6664-462e-b1c0-721b1300a83b",
    "provider_refund_id": "003447",
    "provider": "transbank",
    "status": "completed",
    ...
  },
  "count": 1
}
```

---

### 4. Sincronizar Estado desde Proveedor

**POST** `/api/admin/refunds/[id]`

Sincroniza el estado del reembolso desde el proveedor (Stripe/Transbank). Solo funciona para reembolsos con `provider_refund_id`.

#### Ejemplo

```bash
POST /api/admin/refunds/a7003fe7-2c57-4dc4-be02-4d89caf4d5e5
```

#### Respuesta

```json
{
  "refund": {
    "id": "a7003fe7-2c57-4dc4-be02-4d89caf4d5e5",
    "status": "completed",
    ...
  },
  "providerStatus": {
    "id": "re_1234567890",
    "status": "succeeded",
    "amount": 1000,
    "currency": "clp",
    ...
  },
  "synced": true
}
```

#### Notas

- **Stripe**: Consulta el estado actual desde la API de Stripe y actualiza el estado local si es necesario.
- **Transbank**: No proporciona API para consultar estado de reembolsos. Los reembolsos se procesan inmediatamente.

---

## Casos de Uso Comunes

### Buscar reembolsos de una orden específica

```bash
GET /api/admin/refunds?order_id=6a5d1518-6664-462e-b1c0-721b1300a83b
```

### Buscar reembolsos exitosos de Stripe

```bash
GET /api/admin/refunds?provider=stripe&status=completed
```

### Buscar reembolsos recientes

```bash
GET /api/admin/refunds?from_date=2025-12-01T00:00:00Z&limit=10
```

### Buscar reembolso desde portal de Transbank

Si tienes el código de autorización del reembolso desde el portal de Transbank (ej: `003447`):

```bash
GET /api/admin/refunds/by-provider-id?provider_refund_id=003447&provider=transbank
```

---

## Campos del Reembolso

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único del reembolso |
| `order_id` | UUID | ID de la orden reembolsada |
| `organization_id` | UUID | ID de la organización |
| `amount` | decimal | Monto reembolsado |
| `currency` | string | Moneda (CLP, USD, etc.) |
| `refund_destination` | string | Destino: `payment_method` o `wallet` |
| `status` | string | Estado: `pending`, `approved`, `processing`, `completed`, `rejected` |
| `provider` | string | Proveedor: `stripe`, `transbank_webpay`, `transbank_oneclick` |
| `provider_refund_id` | string | ID del reembolso en el proveedor |
| `reason` | string | Razón del reembolso |
| `notes` | string | Notas adicionales |
| `processed_at` | timestamp | Fecha de procesamiento |
| `created_at` | timestamp | Fecha de creación |
| `order_number` | string | Número de orden (desde vista) |
| `organization_name` | string | Nombre de la organización (desde vista) |








