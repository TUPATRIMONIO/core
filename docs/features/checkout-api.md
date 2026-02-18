# API de Checkout

## Descripción General

La API de checkout maneja la creación de órdenes de pago para diversos productos (firmas, créditos, notarías).

## Endpoints

### POST /api/checkout/create

Crea una nueva orden de pago.

**Parámetros del Body:**

- `productType`: Tipo de producto (ej: 'electronic_signature', 'credits').
- `productId`: ID del producto (opcional para algunos tipos).
- `metadata`: Objeto con información adicional.
- `organizationId`: ID de la organización (opcional, por defecto usa la activa).

**Determinación de Moneda:**

La moneda de la orden se determina con la siguiente prioridad:

1. `metadata.country_code`: Si se proporciona en el metadata (ej: desde el wizard de firma), se usa este país para determinar la moneda.
2. `organization.country`: Si no hay metadata, se usa el país configurado en la organización.
3. `US`: Si no hay país en la organización, se usa 'US' (USD) por defecto.

Esto asegura que si un usuario selecciona un país específico en el flujo de compra (wizard), la orden se genere en la moneda correspondiente a ese país, independientemente de la configuración base de su organización.

**Ejemplo de Request:**

```json
{
  "productType": "electronic_signature",
  "metadata": {
    "country_code": "CL",
    "amount": 5000
  }
}
```

En este caso, la orden se creará en `CLP` (Pesos Chilenos) porque `metadata.country_code` es "CL".
