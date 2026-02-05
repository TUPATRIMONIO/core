# 📱 Páginas Frontend - Verificaciones de Identidad

## 🗺️ Rutas Disponibles

Has creado un sistema completo con páginas para ver y gestionar todas las verificaciones.

---

## 📄 Páginas Implementadas

### 1. `/dashboard/verifications` 📊

**Página de Listado Principal**

**Qué muestra:**
- ✅ Tabla con TODAS las verificaciones de tu organización
- ✅ Filtros por estado, propósito, búsqueda
- ✅ Estadísticas rápidas (total, aprobadas, rechazadas)
- ✅ Botón "Sincronizar Veriff" para importar externas
- ✅ Indica cuáles fueron importadas vs. webhook

**Columnas de la tabla:**
- Fecha y hora
- Nombre del sujeto
- RUT/DNI
- Propósito (FES, KYC, etc.)
- Estado con badge colorido
- Score de riesgo
- Botón "Ver" para ir al detalle

**Características:**
```tsx
// Filtros disponibles
- Buscar por nombre, email, RUT
- Filtrar por estado (aprobado, rechazado, etc.)
- Filtrar por propósito (FES, FEA, KYC, etc.)

// Estadísticas en cards
- Total de verificaciones
- Aprobadas (verde)
- Rechazadas (rojo)
- Pendientes (azul)
- Importadas (púrpura)
```

---

### 2. `/dashboard/verifications/[id]` 🔍

**Página de Detalle Completo**

**Qué muestra:**

**Tab 1: Documentos** 📄
- Datos extraídos del documento de identidad
- Nombre, fecha de nacimiento, fecha de expiración
- Tipo de documento (cédula, pasaporte, etc.)
- País emisor
- Nivel de confianza de la extracción
- Si está expirado o no

**Tab 2: Media** 🖼️
- TODAS las fotos y videos capturados:
  - Foto del rostro
  - Documento (frente y reverso)
  - Selfie
  - Video de liveness
- **Botón para descargar cada archivo**
- **Botón "Descargar Todo"** para evidencia completa
- Checksum SHA-256 de cada archivo
- Tamaño de archivo

**Tab 3: Intentos** 🔄
- Historial de intentos
- Si hubo fallos, muestra la razón
- Timestamp de cada intento

**Tab 4: Timeline** ⏰
- Cronología visual de eventos:
  - Sesión creada
  - Usuario inició verificación
  - Usuario completó
  - Decisión recibida
  - Evidencia descargada

**Información General:**
- Estado con badge
- Score de riesgo (visualización colorida)
- Razón de la decisión
- Código de decisión
- Proveedor usado (Veriff)
- ID de sesión en Veriff
- Si fue importada por sync

---

### 3. `/dashboard/test-verification` 🧪

**Página de Prueba y Desarrollo**

**Qué permite:**
- ✅ Crear verificaciones de prueba
- ✅ Formulario pre-configurado
- ✅ Ver estado en tiempo real con auto-refresh
- ✅ Buscar verificaciones previas
- ✅ Botón "Sincronizar Veriff" integrado
- ✅ Instrucciones paso a paso

---

## 🎨 Navegación Visual

```
Dashboard
  └── Verificaciones
       ├── Ver todas (/verifications) 📊
       │    ├── Filtrar y buscar
       │    ├── Ver estadísticas
       │    ├── Sincronizar externas
       │    └── Click en fila → Ver detalle
       │
       ├── Ver detalle (/verifications/[id]) 🔍
       │    ├── Tab: Documentos extraídos
       │    ├── Tab: Media (fotos/videos)
       │    ├── Tab: Intentos
       │    ├── Tab: Timeline
       │    └── Descargar evidencia
       │
       └── Pruebas (/test-verification) 🧪
            ├── Crear verificación test
            ├── Ver estado en vivo
            └── Sincronizar
```

---

## 🔍 Cómo Ver los Respaldos

### Opción 1: Desde el Listado

1. Ve a: **`/dashboard/verifications`**
2. Busca la verificación que quieres ver
3. Click en el botón de ojo (👁️)
4. Serás llevado al detalle completo

### Opción 2: Desde el Detalle

1. En `/dashboard/verifications/[id]`
2. Ve al **Tab "Media"**
3. Verás TODAS las fotos y videos
4. Click **"Descargar"** en cada archivo
5. O click **"Descargar Todo"** para evidencia completa

### Opción 3: Ver en Storage Directamente

También puedes ver en Supabase Dashboard:
```
Supabase Dashboard 
  → Storage 
  → identity-verifications 
  → {org_id}
     → {session_id}
        → face_photo_*.jpg
        → document_front_*.jpg
        → document_back_*.jpg
        → selfie_*.jpg
```

---

## 📥 Descargar Evidencia para Auditorías

### Desde la Página de Detalle:

**Un archivo:**
```
1. Ve al Tab "Media"
2. Click "Descargar" en el archivo específico
3. Se descargará con URL firmada (válida por 1 hora)
```

**Toda la evidencia:**
```
1. Click "Descargar Toda la Evidencia" (arriba)
2. Descargará todos los archivos secuencialmente
3. Perfecto para auditorías judiciales
```

### Desde SQL (Backup masivo):

```sql
-- Ver todos los paths de archivos
SELECT 
  vs.subject_name,
  vs.subject_identifier,
  vm.media_type,
  vm.storage_path,
  vm.file_size,
  vm.checksum,
  vm.downloaded_at
FROM identity_verifications.verification_media vm
JOIN identity_verifications.verification_sessions vs ON vs.id = vm.session_id
WHERE vs.organization_id = 'your-org-id'
ORDER BY vs.created_at DESC;
```

---

## 🎯 Campos Disponibles en Cada Verificación

### Datos del Sujeto:
- ✅ Nombre completo
- ✅ Email
- ✅ RUT/DNI/Pasaporte
- ✅ Teléfono

### Estado de Verificación:
- ✅ Status (pending → approved)
- ✅ Código de decisión
- ✅ Razón de decisión
- ✅ Score de riesgo (0-100)
- ✅ Fecha de verificación
- ✅ Fecha de expiración

### Documento Extraído:
- ✅ Tipo (cédula, pasaporte, etc.)
- ✅ Número de documento
- ✅ País emisor
- ✅ Nombre y apellido
- ✅ Fecha de nacimiento
- ✅ Fecha de expiración
- ✅ Si está expirado
- ✅ Nivel de confianza

### Evidencia Multimedia:
- ✅ Foto del rostro
- ✅ Documento frente
- ✅ Documento reverso
- ✅ Selfie
- ✅ Video liveness
- ✅ Checksum SHA-256
- ✅ Tamaño de archivo

### Metadata:
- ✅ Si fue importada
- ✅ Fecha de importación
- ✅ Raw response de Veriff
- ✅ Metadata personalizada

---

## 💡 Tips de Uso

### Para Auditorías Judiciales:

1. **Busca la verificación** en `/dashboard/verifications`
2. **Filtra por fecha** o persona
3. **Entra al detalle** con el botón 👁️
4. **Descarga toda la evidencia** con un click
5. **Tendrás:**
   - Fotos del documento (frente y reverso)
   - Selfie del usuario
   - Video liveness (si aplica)
   - Datos extraídos del documento
   - Checksums para verificar integridad
   - Timeline completo de eventos

### Para Compliance:

```sql
-- Generar reporte de verificaciones para auditoría
SELECT 
  vs.created_at as fecha,
  vs.subject_name as nombre,
  vs.subject_identifier as documento,
  vs.status as estado,
  vs.risk_score as riesgo,
  vs.verified_at as fecha_aprobacion,
  p.name as proveedor,
  COUNT(vm.id) as archivos_evidencia
FROM identity_verifications.verification_sessions vs
LEFT JOIN identity_verifications.providers p ON p.id = vs.provider_id
LEFT JOIN identity_verifications.verification_media vm ON vm.session_id = vs.id
WHERE vs.organization_id = 'your-org-id'
  AND vs.created_at >= '2026-01-01'
GROUP BY vs.id, p.name
ORDER BY vs.created_at DESC;
```

---

## ✅ Checklist de Funcionalidades

**Visualización:**
- [x] Listado completo de verificaciones
- [x] Detalle individual con tabs
- [x] Filtros y búsqueda
- [x] Estadísticas rápidas
- [x] Timeline de eventos

**Evidencia:**
- [x] Ver todos los archivos multimedia
- [x] Descargar archivos individuales
- [x] Descargar toda la evidencia de una vez
- [x] Ver checksums SHA-256
- [x] Ver tamaños de archivos

**Datos:**
- [x] Información del sujeto
- [x] Documentos extraídos
- [x] Score de riesgo
- [x] Decisión del proveedor
- [x] Intentos de verificación

**Sincronización:**
- [x] Botón para sync manual
- [x] Indicador de verificaciones importadas
- [x] Estadísticas de sync

---

## 🚀 Accede Ahora

```bash
npm run dev
```

**Luego ve a:**
```
http://localhost:3000/dashboard/verifications
```

Ahí verás:
- ✅ Todas tus verificaciones
- ✅ Filtros completos
- ✅ Click en cualquiera para ver detalle
- ✅ Descargar evidencia para auditorías

---

**¡El sistema de visualización está 100% completo!** Ahora puedes ver todos los respaldos desde el frontend. 🎉
