# 🔗 Configuración de Webhooks de Stripe

Esta guía te ayudará a configurar los webhooks de Stripe para recibir eventos de pago y suscripción en tiempo real.

## 📋 Índice

- [Configuración para Desarrollo Local](#configuración-para-desarrollo-local)
- [Configuración para Producción](#configuración-para-producción)
- [Eventos Soportados](#eventos-soportados)
- [Verificación](#verificación)
- [Troubleshooting](#troubleshooting)

---

## 🛠️ Configuración para Desarrollo Local

### Opción 1: Usar Stripe CLI (Recomendado)

La forma más fácil de probar webhooks localmente es usando Stripe CLI.

#### 1. Instalar Stripe CLI

**Windows (con Chocolatey):**
```bash
choco install stripe
```

**Windows (con Scoop):**
```bash
scoop install stripe
```

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
# Descargar desde https://github.com/stripe/stripe-cli/releases
# O usar el instalador automático
```

#### 2. Autenticar Stripe CLI

```bash
stripe login
```

Esto abrirá tu navegador para autenticarte con tu cuenta de Stripe.

#### 3. Iniciar el servidor de desarrollo

En una terminal, inicia tu servidor Next.js:

```bash
cd apps/web
npm run dev
```

#### 4. Reenviar eventos a tu servidor local

En otra terminal, ejecuta:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Esto iniciará un listener que reenviará todos los eventos de Stripe a tu servidor local.

#### 5. Obtener el Webhook Secret

Cuando ejecutes `stripe listen`, verás algo como:

```
> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

**IMPORTANTE**: Copia este secret y agrégalo a tu `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### 6. Probar un evento

En otra terminal, puedes disparar eventos de prueba:

```bash
# Simular un pago exitoso
stripe trigger payment_intent.succeeded

# Simular una suscripción creada
stripe trigger customer.subscription.created

# Simular una factura pagada
stripe trigger invoice.paid
```

### Opción 2: Usar ngrok (Alternativa)

Si prefieres usar ngrok para exponer tu servidor local:

#### 1. Instalar ngrok

Descarga desde https://ngrok.com/download

#### 2. Iniciar ngrok

```bash
ngrok http 3000
```

Esto te dará una URL pública como: `https://abc123.ngrok.io`

#### 3. Configurar webhook en Stripe Dashboard

1. Ve a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click en "Add endpoint"
3. URL del endpoint: `https://abc123.ngrok.io/api/stripe/webhook`
4. Selecciona los eventos (ver sección de eventos)
5. Copia el "Signing secret" y agrégalo a `.env.local`

---

## 🚀 Configuración para Producción

### 1. Configurar Webhook en Stripe Dashboard

1. Ve a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click en **"Add endpoint"**
3. Ingresa la URL de tu endpoint:
   ```
   https://app.tupatrimonio.app/api/stripe/webhook
   ```
   (Ajusta según tu dominio de producción)

### 2. Seleccionar Eventos

Selecciona los siguientes eventos que tu aplicación necesita:

#### Eventos de Pago:
- ✅ `payment_intent.succeeded` - Pago completado exitosamente
- ✅ `payment_intent.payment_failed` - Pago fallido

#### Eventos de Suscripción:
- ✅ `customer.subscription.created` - Suscripción creada
- ✅ `customer.subscription.updated` - Suscripción actualizada
- ✅ `customer.subscription.deleted` - Suscripción cancelada

#### Eventos de Facturación:
- ✅ `invoice.paid` - Factura pagada (para créditos mensuales)
- ✅ `invoice.payment_failed` - Pago de factura fallido

#### Eventos de Métodos de Pago:
- ✅ `setup_intent.succeeded` - Método de pago guardado exitosamente

### 3. Obtener el Webhook Secret

1. Después de crear el endpoint, click en el endpoint creado
2. En la sección **"Signing secret"**, click en **"Reveal"**
3. Copia el secret (comienza con `whsec_`)
4. Agrega a tus variables de entorno de producción:

```bash
STRIPE_WEBHOOK_SECRET=whsec_tu_secret_aqui
```

### 4. Configurar en Vercel/Netlify

Agrega la variable de entorno en tu plataforma de deploy:

**Vercel:**
1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega `STRIPE_WEBHOOK_SECRET` con el valor del secret

**Netlify:**
1. Ve a tu sitio en Netlify
2. Site settings > Environment variables
3. Agrega `STRIPE_WEBHOOK_SECRET` con el valor del secret

---

## 📡 Eventos Soportados

Tu aplicación maneja los siguientes eventos de Stripe:

| Evento | Descripción | Acción |
|--------|-------------|--------|
| `payment_intent.succeeded` | Pago completado | Actualiza estado del pago, factura y agrega créditos |
| `customer.subscription.created` | Suscripción creada | Crea/actualiza registro de suscripción |
| `customer.subscription.updated` | Suscripción actualizada | Actualiza estado y período de suscripción |
| `customer.subscription.deleted` | Suscripción cancelada | Marca suscripción como cancelada |
| `invoice.paid` | Factura pagada | Agrega créditos mensuales incluidos en plan |
| `invoice.payment_failed` | Pago fallido | Actualiza estado de factura para reintentar |
| `setup_intent.succeeded` | Método de pago guardado | Registra evento (manejado principalmente en frontend) |

---

## ✅ Verificación

### Verificar que el webhook funciona

1. **Realiza una compra de prueba** usando la tarjeta `4242 4242 4242 4242`
2. **Revisa los logs** del servidor para ver si el webhook se procesó
3. **Verifica en Stripe Dashboard**:
   - Ve a Webhooks > Tu endpoint
   - Click en "Recent events"
   - Deberías ver eventos con estado "Succeeded" (verde)

### Verificar créditos agregados

1. Ve a `/billing` en tu aplicación
2. Deberías ver los créditos agregados en el balance
3. Ve a `/billing/invoices` para ver la factura marcada como "paid"

---

## 🔍 Troubleshooting

### Error: "Webhook secret not configured"

**Solución**: Asegúrate de tener `STRIPE_WEBHOOK_SECRET` en tu `.env.local` o variables de entorno.

### Error: "Webhook signature verification failed"

**Causas posibles**:
1. El webhook secret no coincide con el del endpoint
2. El body del request fue modificado antes de verificar
3. Estás usando el secret incorrecto (test vs live)

**Solución**:
- Verifica que el secret en `.env.local` coincida con el del endpoint en Stripe Dashboard
- Si usas Stripe CLI, usa el secret que muestra `stripe listen`
- Asegúrate de usar el secret correcto según el modo (test/live)

### Los créditos no se agregan después del pago

**Verificaciones**:
1. ¿El webhook se está recibiendo? Revisa los logs del servidor
2. ¿El evento `payment_intent.succeeded` se está procesando?
3. ¿El Payment Intent tiene los metadatos correctos?
   - `organization_id`
   - `type: credit_purchase`
   - `credits_amount`

**Debug**:
- Revisa los logs del servidor cuando procesas el webhook
- Verifica en Stripe Dashboard que el Payment Intent tenga los metadatos correctos
- Revisa la consola del navegador para errores

### Webhook funciona en local pero no en producción

**Causas comunes**:
1. La URL del webhook en producción no es correcta
2. El servidor de producción no puede acceder a Supabase
3. Variables de entorno no configuradas en producción

**Solución**:
- Verifica la URL del webhook en Stripe Dashboard
- Asegúrate de que todas las variables de entorno estén configuradas
- Revisa los logs de producción (Vercel/Netlify)

---

## 📝 Notas Importantes

1. **Siempre verifica la firma del webhook**: Tu código ya lo hace automáticamente usando `stripe.webhooks.constructEvent()`

2. **Usa diferentes secrets para test y producción**: 
   - Test: Secret del endpoint de test en Stripe Dashboard
   - Producción: Secret del endpoint de producción

3. **Los webhooks pueden llegar fuera de orden**: Asegúrate de manejar eventos duplicados o fuera de orden si es necesario

4. **Idempotencia**: Stripe puede reenviar eventos. Tu código debe ser idempotente (no agregar créditos dos veces)

5. **Timeout**: Los webhooks deben responder en menos de 10 segundos. Si necesitas procesar algo largo, usa un job en background

---

## 🔗 Enlaces Útiles

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe Dashboard - Webhooks](https://dashboard.stripe.com/webhooks)

