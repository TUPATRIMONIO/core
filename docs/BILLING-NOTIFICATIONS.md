# 🔔 Sistema de Notificaciones de Billing

Este documento describe el sistema de notificaciones implementado para eventos de billing y créditos.

## 📋 Características Implementadas

### ✅ Verificación Automática de Auto-Recarga

La función `reserveCredits()` ahora verifica automáticamente si necesita ejecutar auto-recarga antes de reservar créditos:

- **Ubicación**: `apps/web/src/lib/credits/core.ts`
- **Funcionamiento**:
  1. Verifica el balance disponible antes de reservar
  2. Si el balance es menor al threshold y auto-recarga está habilitada, ejecuta la recarga
  3. Espera brevemente para que el webhook procese el pago
  4. Intenta reservar los créditos

### ✅ Sistema de Notificaciones

#### Schema de Base de Datos

- **Tabla**: `core.notifications`
- **Tipos de notificaciones soportados**:
  - `credits_added` - Créditos agregados
  - `credits_low` - Créditos bajos
  - `payment_succeeded` - Pago exitoso
  - `payment_failed` - Pago fallido
  - `auto_recharge_executed` - Auto-recarga ejecutada
  - `auto_recharge_failed` - Auto-recarga fallida
  - `subscription_created` - Suscripción creada
  - `subscription_updated` - Suscripción actualizada
  - `subscription_cancelled` - Suscripción cancelada
  - `invoice_paid` - Factura pagada
  - `invoice_overdue` - Factura vencida
  - `general` - General

#### Funciones Disponibles

**Crear notificación**:
```typescript
import { createBillingNotification } from '@/lib/notifications/billing';

await createBillingNotification(
  orgId,
  'credits_added',
  'Título',
  'Mensaje',
  userId, // Opcional, null = para toda la organización
  '/billing', // URL de acción (opcional)
  'Ver facturación', // Label de acción (opcional)
  { amount: 500 } // Metadata adicional (opcional)
);
```

**Funciones helper específicas**:
- `notifyCreditsAdded()` - Notifica créditos agregados
- `notifyCreditsLow()` - Notifica créditos bajos
- `notifyPaymentSucceeded()` - Notifica pago exitoso
- `notifyPaymentFailed()` - Notifica pago fallido
- `notifyAutoRechargeExecuted()` - Notifica auto-recarga ejecutada
- `notifyAutoRechargeFailed()` - Notifica auto-recarga fallida
- `notifySubscriptionCancelled()` - Notifica cancelación de suscripción

#### Integración con Webhooks

Las notificaciones se envían automáticamente en los siguientes eventos:

**Stripe Webhooks**:
- ✅ `payment_intent.succeeded` → Notifica créditos agregados y pago exitoso
- ✅ `invoice.paid` → Notifica créditos mensuales agregados
- ✅ `invoice.payment_failed` → Notifica pago fallido
- ✅ `customer.subscription.deleted` → Notifica cancelación de suscripción

**dLocal Webhooks**:
- ✅ `payment.completed` → Notifica créditos agregados y pago exitoso
- ✅ `payment.failed` → Notifica pago fallido

**Auto-Recarga**:
- ✅ Ejecución exitosa → Notifica auto-recarga ejecutada
- ✅ Ejecución fallida → Notifica auto-recarga fallida

## 🎨 Componentes UI

### NotificationBell

Componente de campana de notificaciones con contador de no leídas:

```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';

<NotificationBell orgId={orgId} userId={userId} />
```

### NotificationsList

Componente para mostrar lista de notificaciones:

```tsx
import { NotificationsList } from '@/components/notifications/NotificationsList';

<NotificationsList orgId={orgId} userId={userId} limit={10} />
```

## 📊 Migraciones Creadas

1. **20251122000001_schema-notifications.sql** - Crea schema y tabla de notificaciones
2. **20251122000002_notifications-rls.sql** - Políticas RLS para notificaciones
3. **20251122000003_notifications-functions.sql** - Funciones SQL para crear y gestionar notificaciones
4. **20251122000004_expose-notifications-view.sql** - Vista pública para notificaciones

## 🚀 Próximos Pasos

1. **Aplicar migraciones**:
   ```bash
   npx supabase db push
   ```

2. **Agregar NotificationBell al layout**:
   - Agregar `<NotificationBell />` al header del dashboard

3. **Configurar notificaciones de créditos bajos**:
   - Implementar verificación periódica de balance
   - Enviar notificación cuando balance < threshold

4. **Notificaciones por email** (opcional):
   - Integrar con servicio de email (SendGrid, etc.)
   - Enviar notificaciones importantes por email además de in-app

## 📝 Notas

- Las notificaciones usan Supabase Realtime para actualizaciones en tiempo real
- Las notificaciones pueden ser para toda la organización (`user_id = NULL`) o para un usuario específico
- Las notificaciones incluyen metadata JSONB para datos adicionales
- Las notificaciones pueden tener acciones (botones con URLs) para navegar directamente

