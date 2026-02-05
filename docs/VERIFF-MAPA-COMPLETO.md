# 🗺️ Mapa Completo del Sistema de Verificaciones

## 📍 Dónde Ver los Respaldos

```
Frontend (Tu Navegador)
│
├── 📊 LISTADO COMPLETO
│   └── /dashboard/verifications
│       ├── Ver TODAS las verificaciones
│       ├── Filtrar por estado/propósito
│       ├── Buscar por nombre/RUT/email
│       ├── Ver estadísticas
│       └── Botón "Sincronizar Veriff"
│
├── 🔍 DETALLE CON EVIDENCIA
│   └── /dashboard/verifications/[id]
│       │
│       ├── Tab: Documentos 📄
│       │   └── Datos extraídos del documento de identidad
│       │
│       ├── Tab: Media 🖼️ ⭐ RESPALDOS AQUÍ
│       │   ├── Foto del rostro
│       │   ├── Documento (frente y reverso)
│       │   ├── Selfie
│       │   ├── Video liveness
│       │   ├── Botón "Descargar" en cada uno
│       │   └── Botón "Descargar Todo"
│       │
│       ├── Tab: Intentos 🔄
│       │   └── Historial de intentos
│       │
│       └── Tab: Timeline ⏰
│           └── Cronología de eventos
│
└── 🧪 PRUEBAS
    └── /dashboard/test-verification
        └── Crear y probar verificaciones

Backend (Supabase)
│
├── 💾 STORAGE (Archivos)
│   └── Bucket: identity-verifications
│       └── {org_id}/{session_id}/
│           ├── face_photo_*.jpg
│           ├── document_front_*.jpg
│           ├── document_back_*.jpg
│           ├── selfie_*.jpg
│           └── liveness_video_*.mp4
│
└── 🗄️ DATABASE (Metadata)
    └── Schema: identity_verifications
        ├── verification_sessions (info general)
        ├── verification_documents (datos extraídos)
        ├── verification_media (referencias a archivos)
        └── audit_log (eventos para auditoría)
```

---

## 🎯 Flujo para Ver Respaldos

### Caso 1: Ver Verificación Específica

```
1. Ve a: /dashboard/verifications
2. Busca por nombre o RUT en el filtro
3. Click en el botón 👁️ de la fila
4. Ve al Tab "Media"
5. Click "Descargar" en cada archivo
```

### Caso 2: Descargar Toda la Evidencia

```
1. Ve a: /dashboard/verifications
2. Click en la verificación
3. Ve al Tab "Media"
4. Click "Descargar Toda la Evidencia"
5. Se descargarán todos los archivos
```

### Caso 3: Auditoría Judicial

```
1. Ve a: /dashboard/verifications
2. Filtra por fecha y persona
3. Click en la verificación
4. Descarga toda la evidencia
5. Incluye:
   ✅ Fotos originales
   ✅ Videos
   ✅ Checksums SHA-256 (integridad)
   ✅ Datos extraídos
   ✅ Timeline de eventos
   ✅ Decisión del proveedor
```

---

## 📦 Estructura de lo que Verás

### En el Listado (`/verifications`):

```
┌─────────────────────────────────────────────────────────┐
│ Verificaciones de Identidad           [Sincronizar]     │
├─────────────────────────────────────────────────────────┤
│ Filtros: [Buscar] [Estado] [Propósito]                  │
│                                                           │
│ ┌─────┬─────┬─────┬─────┬─────┐                        │
│ │ 150 │ 142 │  5  │  3  │  8  │                        │
│ │Total│Aprob│Rech │Pend │Impo │                        │
│ └─────┴─────┴─────┴─────┴─────┘                        │
│                                                           │
│ Tabla:                                                   │
│ ┌────────┬───────────┬──────────┬────────┬────────┬─┐ │
│ │ Fecha  │ Nombre    │ RUT      │ Estado │ Score  │👁│ │
│ ├────────┼───────────┼──────────┼────────┼────────┼─┤ │
│ │ 05 Feb │ Juan P    │12345678-9│✅Aprob │ 12.3%  │👁│ │
│ │ 04 Feb │ María G   │98765432-1│❌Rech  │ 87.5%  │👁│ │
│ │ 03 Feb │ Pedro S   │11223344-5│🔵Pend  │   -    │👁│ │
│ └────────┴───────────┴──────────┴────────┴────────┴─┘ │
└─────────────────────────────────────────────────────────┘
```

### En el Detalle (`/verifications/[id]`):

```
┌─────────────────────────────────────────────────────────┐
│ ← Verificación de Identidad              ✅ Aprobado    │
│   Juan Pérez                                             │
├─────────────────────────────────────────────────────────┤
│ Información General                                      │
│ ┌───────────────┬───────────────┐                       │
│ │ Nombre: Juan  │ Email: juan@  │                       │
│ │ RUT: 12345-9  │ Tel: +569...  │                       │
│ │ Score: 12.3%  │ Proveedor:    │                       │
│ │   🟢 Bajo     │   Veriff      │                       │
│ └───────────────┴───────────────┘                       │
├─────────────────────────────────────────────────────────┤
│ [Documentos] [Media] [Intentos] [Timeline]              │
│                                                           │
│ Tab Media: ⭐ RESPALDOS AQUÍ                             │
│ ┌─────────────────────────┐  [Descargar Todo]          │
│ │ 📷 Foto del Rostro      │                             │
│ │ JPG • 2.3 MB            │  [Descargar]                │
│ │ SHA: a1b2c3d4...        │                             │
│ ├─────────────────────────┤                             │
│ │ 📄 Documento (Frente)   │                             │
│ │ JPG • 1.8 MB            │  [Descargar]                │
│ │ SHA: e5f6g7h8...        │                             │
│ ├─────────────────────────┤                             │
│ │ 📄 Documento (Reverso)  │                             │
│ │ JPG • 1.7 MB            │  [Descargar]                │
│ │ SHA: i9j0k1l2...        │                             │
│ ├─────────────────────────┤                             │
│ │ 🤳 Selfie               │                             │
│ │ JPG • 2.1 MB            │  [Descargar]                │
│ │ SHA: m3n4o5p6...        │                             │
│ └─────────────────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Accesos Rápidos

| Quiero... | Ir a... |
|-----------|---------|
| **Ver todas mis verificaciones** | `/dashboard/verifications` |
| **Ver evidencia de una específica** | `/dashboard/verifications/[id]` → Tab "Media" |
| **Descargar fotos/videos** | Detalle → Tab "Media" → Click "Descargar" |
| **Crear verificación de prueba** | `/dashboard/test-verification` |
| **Sincronizar externas** | Cualquier página → Click "Sincronizar Veriff" |
| **Ver estadísticas** | `/dashboard/verifications` (cards superiores) |
| **Buscar por persona** | `/dashboard/verifications` → Campo "Buscar" |
| **Filtrar por estado** | `/dashboard/verifications` → Selector "Estado" |

---

## 📁 Archivos que se Guardan

Por cada verificación aprobada, se guardan típicamente:

```
Verificación de Juan Pérez (12345678-9)
├── face_photo_1738779284.jpg ......... 2.3 MB ✅
├── document_front_1738779285.jpg ..... 1.8 MB ✅
├── document_back_1738779286.jpg ...... 1.7 MB ✅
├── selfie_1738779287.jpg ............. 2.1 MB ✅
└── liveness_video_1738779288.mp4 ..... 8.5 MB ✅

Total: ~16 MB de evidencia
Checksums: SHA-256 de cada archivo
Ubicación: identity-verifications bucket
Retención: Indefinida (para auditorías)
```

---

## 🔐 Seguridad de Acceso

**Quién puede ver qué:**

| Usuario | Puede Ver |
|---------|-----------|
| **Usuario normal** | Solo verificaciones de su organización |
| **Org admin** | Todas las verificaciones de su organización |
| **Platform admin** | TODAS las verificaciones (auditorías) |
| **Service role** | Todo (para webhooks y sync) |

**Storage:**
- ❌ NO público
- ✅ URLs firmadas con expiración (1 hora)
- ✅ Solo usuarios con acceso pueden descargar
- ✅ Platform admins acceso total

---

## 🚀 ¡Listo para Usar!

**Para ver tus respaldos AHORA:**

```bash
npm run dev
```

**Luego abre:**
```
http://localhost:3000/dashboard/verifications
```

**Verás:**
- ✅ Lista completa de verificaciones
- ✅ Click en cualquiera → Ver detalle
- ✅ Tab "Media" → Todos los archivos
- ✅ Descargar con un click

---

**🎊 Sistema 100% completo con visualización de respaldos incluida!**
