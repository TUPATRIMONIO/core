# Sistema de Verificaciones de Identidad - Guía de Uso

## 🎉 Estado: COMPLETAMENTE IMPLEMENTADO Y ACTIVO

Fecha de actualización: 18 de Febrero 2026

---

## 📋 Resumen

Sistema completo de verificación de identidad con **Veriff** como proveedor, diseñado para:
- ✅ Firmas Electrónicas Simples (FES) con biometría
- ✅ KYC general para cualquier servicio
- ✅ Almacenamiento completo de evidencia para auditorías judiciales
- ✅ Arquitectura independiente del proveedor (fácil agregar Onfido, etc.)
- ✅ **Procesamiento inmediato de webhooks**

---

## 🏗️ Arquitectura Implementada

### Schema: `identity_verifications`

**7 Tablas:**
1. `providers` - Catálogo de proveedores (Veriff, etc.)
2. `provider_configs` - Configuración por organización
3. `verification_sessions` - Sesiones de verificación
4. `verification_attempts` - Intentos de verificación
5. `verification_documents` - Documentos extraídos
6. `verification_media` - Fotos, selfies, videos
7. `audit_log` - Log inmutable de auditoría

### Componentes de Backend

1. **Webhook Handler (Next.js)**: `/api/webhooks/veriff` - Recibe y procesa eventos inmediatamente.
2. **Cron Job**: `/api/cron/sync-veriff` - Ejecuta cada 10 minutos como respaldo para eventos fallidos.
3. **Queue**: Tabla `pending_veriff_syncs` para garantizar que ningún evento se pierda.

### Edge Functions (Supabase)

1. **`identity-verification`** - API interna para crear/consultar verificaciones
2. **`veriff-sync`** - Sincroniza sesiones creadas fuera de la app (backup completo)
3. **`veriff-webhook`** - ⚠️ **DEPRECADA** (Reemplazada por API Route de Next.js)

### Storage Bucket

- **Bucket:** `identity-verifications` (privado)
- **Límite:** 50MB por archivo
- **Estructura:** `/{org_id}/{session_id}/{media_type}_{timestamp}.{ext}`

---

## 🔧 Configuración Actual

### Proveedor: Veriff

```
Base URL: https://stationapi.veriff.com
Webhook URL: https://[tu-dominio]/api/webhooks/veriff
Modo: Producción / Test
```

### Modelo Centralizado

✅ **TuPatrimonio gestiona UNA sola cuenta de Veriff**
- Todas las organizaciones usan la configuración de Platform
- Respaldos centralizados
- Menor costo operativo

---

## 🚀 Cómo Usar el Sistema Desde el Frontend

### ⚡ Uso Rápido (Componentes Listos)

**Opción 1: Botón Simple**

```tsx
import { VerifyIdentityButton } from '@/components/signing/VerifyIdentityButton';
import { useOrganization } from '@/hooks/useOrganization';

export function MyComponent() {
  const { organization } = useOrganization();

  return (
    <VerifyIdentityButton
      params={{
        organizationId: organization.id,
        purpose: 'fes_signing',
        subjectIdentifier: '12345678-9',
        subjectEmail: 'usuario@ejemplo.com',
        subjectName: 'Juan Pérez',
      }}
      onVerificationStarted={(sessionId, url) => {
        console.log('Verificación iniciada:', sessionId);
        // Usuario será redirigido automáticamente
      }}
    />
  );
}
```

**Opción 2: Panel Completo para Firmantes**

```tsx
import { SignerVerificationPanel } from '@/components/signing/SignerVerificationPanel';

<SignerVerificationPanel
  signer={signer}
  organizationId={organization.id}
  documentId={documentId}
  purpose="fes_signing"
  requireVerification={true}
  onVerificationComplete={(sessionId) => {
    console.log('¡Verificación completada!');
  }}
/>
```

**Opción 3: Card de Estado (con auto-refresh)**

```tsx
import { VerificationStatusCard } from '@/components/signing/VerificationStatusCard';

<VerificationStatusCard
  sessionId={sessionId}
  autoRefresh={true}
  refreshInterval={5000}
  onStatusChange={(status) => {
    if (status === 'approved') {
      // Habilitar firma
    }
  }}
/>
```

### 🧪 Página de Prueba

Ya está creada en: **`/dashboard/test-verification`**

Puedes ir ahí para probar todo el sistema de manera interactiva.

📖 **Guía completa de frontend:** [`docs/FRONTEND-IDENTITY-VERIFICATION.md`](./FRONTEND-IDENTITY-VERIFICATION.md)

---

## 🔌 API de Activación Externa (M2M)

Si tienes un sistema externo que recibe el `sessionId` de Veriff y quieres activar el procesamiento en TuPatrimonio:

**Endpoint:** `POST /api/verifications/trigger`

```bash
curl -X POST https://app.tupatrimonio.app/api/verifications/trigger \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "c5f73e02-4f61-4f2c-a7fc-f1cebc64d7dc"}'
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "status": "approved",
  "isNew": true,
  "sessionId": "c5f73e02-4f61-4f2c-a7fc-f1cebc64d7dc",
  "message": "Verificación procesada exitosamente"
}
```

Este endpoint es público y no requiere autenticación, diseñado para integraciones servidor a servidor.

---

## 🔄 Flujo de Webhook y Sincronización

El sistema utiliza una estrategia de "Procesamiento Inmediato con Respaldo en Cola":

1. **Recepción**: Veriff envía el webhook a `/api/webhooks/veriff`.
2. **Encolado**: El evento se guarda en `pending_veriff_syncs` con estado `pending`.
3. **Procesamiento Inmediato**: El handler intenta procesar la verificación al instante:
   - Consulta API de Veriff (decision, person, attempts, media)
   - Actualiza la sesión en BD
   - Descarga y guarda archivos multimedia
4. **Resultado**:
   - Si tiene éxito: Marca el evento en cola como `processed`.
   - Si falla: Deja el evento como `pending` (o actualiza error).
5. **Respaldo (Cron)**: Cada 10 minutos, el cron `/api/cron/sync-veriff` busca eventos pendientes o fallidos y los reintenta.

---

## 📝 Configurar Webhook en Veriff Dashboard

Si necesitas actualizar el webhook en Veriff:

1. Ve a https://station.veriff.com
2. API Keys → Installation
3. Webhook URL: `https://[tu-dominio]/api/webhooks/veriff`
4. Eventos a suscribir: **Todos** (started, submitted, approved, declined, etc.)

---

## 🐛 Troubleshooting

### Error: "No hay configuración activa para el proveedor"

**Solución:** Verifica que la configuración esté activa:

```sql
SELECT * FROM identity_verifications.provider_configs
WHERE provider_id = (SELECT id FROM identity_verifications.providers WHERE slug = 'veriff')
  AND is_active = true;
```

### Webhook no está actualizando sesiones

**Solución:** Verifica los logs de Vercel para la ruta `/api/webhooks/veriff` o revisa la tabla `pending_veriff_syncs` para ver errores.

```sql
SELECT * FROM pending_veriff_syncs ORDER BY created_at DESC LIMIT 10;
```

### Media no se está descargando

**Solución:** Verifica que el bucket existe y tiene las políticas correctas:

```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'identity-verifications';
```

---

## 📚 Referencias

- **Documentación Veriff:** https://developers.veriff.com/
- **API Reference:** https://developers.veriff.com/docs/api-reference
- **Webhook Events:** https://developers.veriff.com/docs/webhook-events
- **Arquitectura del Schema:** [docs/schemas/ARCHITECTURE-SCHEMAS.md](./schemas/ARCHITECTURE-SCHEMAS.md)

---

**Implementado por:** Sistema TuPatrimonio  
**Fecha:** 18 de Febrero 2026  
**Versión:** 1.1.0
