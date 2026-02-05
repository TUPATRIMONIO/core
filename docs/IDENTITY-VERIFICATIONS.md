# Sistema de Verificaciones de Identidad - Guía de Uso

## 🎉 Estado: COMPLETAMENTE IMPLEMENTADO

Fecha de implementación: 5 de Febrero 2026

---

## 📋 Resumen

Sistema completo de verificación de identidad con **Veriff** como proveedor, diseñado para:
- ✅ Firmas Electrónicas Simples (FES) con biometría
- ✅ KYC general para cualquier servicio
- ✅ Almacenamiento completo de evidencia para auditorías judiciales
- ✅ Arquitectura independiente del proveedor (fácil agregar Onfido, etc.)

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

### Edge Functions Desplegadas

1. **`veriff-webhook`** - Procesa webhooks de Veriff automáticamente
2. **`identity-verification`** - API interna para crear/consultar verificaciones
3. **`veriff-sync`** - Sincroniza sesiones creadas fuera de la app (backup completo)

### Storage Bucket

- **Bucket:** `identity-verifications` (privado)
- **Límite:** 50MB por archivo
- **Estructura:** `/{org_id}/{session_id}/{media_type}_{timestamp}.{ext}`

---

## 🔧 Configuración Actual

### Proveedor: Veriff

```
Base URL: https://stationapi.veriff.com
API Key: e80366e4-def3-4e69-a221-e611c72ba6d8
Organización: TuPatrimonio Platform (6b11e191-b26d-4e9f-ba14-8dde0be8e437)
Webhook URL: https://tsefchkedlkwhiexqbrs.supabase.co/functions/v1/veriff-webhook
Modo: Producción
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

### 1. Crear Sesión de Verificación (API directa)

```typescript
import { supabase } from '@/lib/supabase';

// Crear sesión para un firmante
const { data, error } = await supabase.functions.invoke('identity-verification', {
  body: {
    organizationId: 'org-uuid',
    providerSlug: 'veriff',
    purpose: 'fes_signing',
    subjectIdentifier: '12345678-9', // RUT
    subjectEmail: 'usuario@ejemplo.com',
    subjectName: 'Juan Pérez',
    subjectPhone: '+56912345678',
    referenceType: 'signing_document', // Opcional
    referenceId: 'document-uuid', // Opcional
    metadata: {
      // Datos adicionales que quieras guardar
    }
  }
});

if (error) {
  console.error('Error creando sesión:', error);
} else {
  // Redirigir usuario a la URL de verificación
  window.location.href = data.verificationUrl;
}
```

### 2. Consultar Estado de Verificación

```typescript
// Obtener sesión completa con todos los datos
const { data: session } = await supabase.rpc(
  'identity_verifications.get_verification_session_full',
  { p_session_id: 'session-uuid' }
);

console.log('Estado:', session.session.status);
console.log('Documentos:', session.documents);
console.log('Media:', session.media);
```

### 3. Verificar si una Sesión es Válida

```typescript
const { data: isValid } = await supabase.rpc(
  'identity_verifications.is_verification_valid',
  { p_session_id: 'session-uuid' }
);

if (isValid) {
  // Permitir continuar con la firma
}
```

### 4. Buscar Verificaciones Previas

```typescript
// Buscar si este usuario ya tiene verificaciones aprobadas
const { data: previousVerifications } = await supabase.rpc(
  'identity_verifications.find_previous_verifications',
  {
    p_organization_id: 'org-uuid',
    p_subject_identifier: '12345678-9',
    p_only_approved: true,
    p_limit: 10
  }
);
```

---

## 🔗 Integración con Firmas Electrónicas

### Columnas Agregadas a `signing.signers`

```sql
identity_verification_id UUID          -- Referencia a la sesión
identity_verified_at TIMESTAMPTZ       -- Fecha de verificación
identity_verification_score DECIMAL    -- Score de riesgo
```

### Funciones Disponibles

```typescript
// Vincular verificación existente a un firmante
await supabase.rpc('signing.link_verification_to_signer', {
  p_signer_id: 'signer-uuid',
  p_verification_session_id: 'session-uuid'
});

// Verificar si firmante tiene verificación válida
const { data: hasValid } = await supabase.rpc(
  'signing.signer_has_valid_verification',
  { p_signer_id: 'signer-uuid' }
);

// Obtener o crear verificación para firmante
const { data: sessionId } = await supabase.rpc(
  'signing.get_or_create_verification_for_signer',
  {
    p_signer_id: 'signer-uuid',
    p_purpose: 'fes_signing'
  }
);
```

---

## 📊 Estados de Verificación

### Estados de Sesión (`session_status`)

```
pending                 → Usuario no ha iniciado
started                 → Usuario comenzó el proceso
submitted               → Usuario completó y envió
approved                → ✅ Verificación aprobada
declined                → ❌ Verificación rechazada
expired                 → Sesión expiró
abandoned               → Usuario abandonó
resubmission_requested  → Requiere reenvío
```

### Propósitos (`verification_purpose`)

```
fes_signing        → Firma Electrónica Simple
fea_signing        → Firma Electrónica Avanzada
kyc_onboarding     → Onboarding de usuario
document_notary    → Servicios notariales
general            → Propósito general
```

---

## 🔐 Seguridad y RLS

- ✅ RLS habilitado en todas las tablas
- ✅ Usuarios solo ven verificaciones de su organización
- ✅ Platform admins tienen acceso total (auditorías)
- ✅ Audit log inmutable (solo INSERT)
- ✅ Storage privado (solo service_role puede subir)
- ✅ Funciones con `SECURITY DEFINER` donde corresponde

---

## 📈 Obtener Estadísticas

```typescript
const { data: stats } = await supabase.rpc(
  'identity_verifications.get_verification_stats',
  {
    p_organization_id: 'org-uuid',
    p_start_date: '2026-01-01',
    p_end_date: '2026-02-05'
  }
);

console.log('Total sesiones:', stats.total_sessions);
console.log('Aprobadas:', stats.approved);
console.log('Rechazadas:', stats.declined);
console.log('Por propósito:', stats.by_purpose);
console.log('Score promedio:', stats.avg_risk_score);
```

---

## 🆘 Webhook de Veriff

El webhook está configurado automáticamente:

```
URL: https://tsefchkedlkwhiexqbrs.supabase.co/functions/v1/veriff-webhook
```

**Procesamiento Automático:**
1. ✅ Actualiza estado de sesiones
2. ✅ Descarga y almacena media en Storage
3. ✅ Extrae datos de documentos
4. ✅ Registra todo en audit log
5. ✅ Calcula checksums SHA-256 para integridad

**No requiere configuración adicional** - Todo está automatizado.

---

## 🔄 Sincronización de Sesiones Externas

Si se crean verificaciones directamente en Veriff (fuera de tu app), puedes sincronizarlas:

### Desde el Frontend (Admin)

```tsx
import { SyncVerificationsButton } from '@/components/admin/SyncVerificationsButton';

// En tu panel de admin
<SyncVerificationsButton />
```

El botón:
- ✅ Consulta la API de Veriff
- ✅ Importa sesiones que no están en tu DB
- ✅ Descarga toda la evidencia
- ✅ Guarda en Storage
- ✅ Registra en audit log

### Desde la Línea de Comandos

```bash
curl -X POST https://tsefchkedlkwhiexqbrs.supabase.co/functions/v1/veriff-sync \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"
```

### Programar Automáticamente (Cron)

Configura un cron job para sincronizar cada hora:

**Opción A: Supabase Cron (Recomendado)**
```sql
-- En Supabase SQL Editor
SELECT cron.schedule(
  'sync-veriff-hourly',
  '0 * * * *',  -- Cada hora
  $$
  SELECT net.http_post(
    url := 'https://tsefchkedlkwhiexqbrs.supabase.co/functions/v1/veriff-sync',
    headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

**Opción B: GitHub Actions**
```yaml
# .github/workflows/sync-veriff.yml
name: Sync Veriff
on:
  schedule:
    - cron: '0 * * * *'  # Cada hora
  workflow_dispatch:  # Manual también

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync Verifications
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/veriff-sync \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

### Resultado

**Ahora capturas:**
- ✅ Verificaciones creadas desde tu app (webhook)
- ✅ Verificaciones creadas en Veriff Dashboard (sync)
- ✅ Verificaciones de integraciones externas (sync)
- ✅ **TODO queda respaldado para auditorías**

---

## 📝 Configurar Webhook en Veriff Dashboard

Si necesitas actualizar el webhook en Veriff:

1. Ve a https://station.veriff.com
2. API Keys → Installation
3. Webhook URL: `https://tsefchkedlkwhiexqbrs.supabase.co/functions/v1/veriff-webhook`
4. Eventos a suscribir: **Todos** (started, submitted, approved, declined, etc.)

---

## 🎯 Próximos Pasos Recomendados

### Para Implementar en la UI

1. **Crear componente de verificación**
   - Botón "Verificar Identidad"
   - Redirección a Veriff
   - Callback para mostrar resultado

2. **Agregar en flujo de firma FES**
   - Antes de firmar, verificar identidad
   - Mostrar badge si ya está verificado
   - Reutilizar verificaciones previas

3. **Dashboard de verificaciones**
   - Listar sesiones por organización
   - Filtros por estado, fecha, propósito
   - Descargar evidencia multimedia

4. **Panel de auditoría**
   - Para compliance officers
   - Ver audit log completo
   - Exportar para auditorías judiciales

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

**Solución:** Verifica los logs de la Edge Function:

```bash
supabase functions logs veriff-webhook
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
**Fecha:** 5 de Febrero 2026  
**Versión:** 1.0.0
