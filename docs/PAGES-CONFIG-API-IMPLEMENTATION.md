# Implementación API de Configuración de Páginas

## 📋 Resumen

Se ha implementado una arquitectura híbrida para el sistema de gestión de páginas donde:
- **Fuente de verdad**: Código (`page-config.ts`)
- **Dashboard**: Lee desde API en modo solo lectura
- **Cero sincronización**: No hay duplicación de datos

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     Marketing App                            │
│                  (localhost:3001)                            │
│                                                              │
│  ┌────────────────┐         ┌──────────────────┐           │
│  │ page-config.ts │────────▶│ API Route        │◀──────┐   │
│  │ (Source of     │         │ /api/pages-config│       │   │
│  │  Truth)        │         └──────────────────┘       │   │
│  └────────────────┘                                    │   │
│                                                         │   │
└─────────────────────────────────────────────────────────┼───┘
                                                          │
                                                 HTTP GET │ (Server-to-Server)
                                                          │
┌─────────────────────────────────────────────────────────┼───┐
│                     Web Dashboard                       │   │
│                  (localhost:3000)                       │   │
│                                                         │   │
│  ┌────────────────────┐         ┌──────────────────┐   │   │
│  │ PageManagement     │────────▶│ API Proxy        │───┘   │
│  │ Component          │  Fetch  │ /api/pages-config│       │
│  │ (Display Only)     │         │ (No CORS issue)  │       │
│  └────────────────────┘         └──────────────────┘       │
│                        Same origin ✅                       │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Cambios Implementados

### 1. API Route en Marketing (`apps/marketing/src/app/api/pages-config/route.ts`)

**Propósito**: Exponer `PAGE_CONFIG` como API REST

**Características**:
- ✅ Lee configuración desde `page-config.ts`
- ✅ Transforma a formato compatible con dashboard
- ✅ Cache HTTP (60s + stale-while-revalidate)
- ✅ Manejo de errores robusto

**Endpoint**: `GET /api/pages-config` (Marketing App)

### 2. API Proxy en Web (`apps/web/src/app/api/pages-config/route.ts`)

**Propósito**: Proxy para evitar problemas de CORS

**Por qué es necesario**:
- ✅ El cliente (navegador) solo puede hacer fetch al mismo origen
- ✅ El servidor puede hacer fetch a cualquier origen
- ✅ Proxy = Cliente → Same origin → Servidor → Marketing API

**Flow**:
```
Dashboard → fetch('/api/pages-config') → Web API Proxy → fetch(Marketing) → Respuesta
   ✅ Same origin (no CORS)              ✅ Server-to-Server (sin restricciones)
```

**Endpoint**: `GET /api/pages-config` (Web App - Proxy)

**Respuesta**:
```json
[
  {
    "id": "/cl/precios",
    "route_path": "/cl/precios",
    "page_title": "Planes y precios Chile",
    "status": "public",
    "seo_index": true,
    "allowed_roles": ["public"],
    "country_code": "cl",
    "section": "precios",
    "notes": "Planes y precios Chile"
  }
]
```

### 3. Page Management Client (`apps/web/src/lib/page-management.ts`)

**Cambios**:
- ✅ `getAllPages()` ahora consulta API proxy local (sin CORS)
- ✅ `getStats()` calcula estadísticas desde API
- ✅ Soporte para status `coming-soon`
- ✅ Eliminada variable `MARKETING_API_URL` (usa proxy local)

**Migración**:
```diff
- const { data } = await supabase.from('page_management').select('*');
- const response = await fetch(`${MARKETING_API_URL}/api/pages-config`);
+ const response = await fetch('/api/pages-config');  // ← Llama a proxy local
+ const pages = await response.json();
```

### 4. Dashboard Component (`apps/web/src/components/admin/PageManagement.tsx`)

**Mejoras**:
- ✅ Soporte visual para status `coming-soon`
- ✅ Controles deshabilitados (read-only mode)
- ✅ Nueva tarjeta de estadística "Próximamente"
- ✅ Grid de 5 columnas en analytics

## 🚀 Configuración

### Variables de Entorno (Web App)

Crear archivo `.env.local` en `apps/web/`:

```bash
# URL de la app Marketing (para el API Proxy servidor)
# Desarrollo
NEXT_PUBLIC_MARKETING_URL=http://localhost:3001

# Producción (ajustar según tu dominio de marketing)
NEXT_PUBLIC_MARKETING_URL=https://marketing.tupatrimonio.com
```

**Nota**: Esta variable se usa solo en el **servidor** (API Proxy), no en el cliente.

### Desarrollo Local

1. **Iniciar Web App** (puerto 3000 - Dashboard):
```bash
cd apps/web
npm run dev
```

2. **Iniciar Marketing App** (puerto 3001):
```bash
cd apps/marketing
PORT=3001 npm run dev
```

3. **Verificar APIs**:
```bash
# API Marketing (fuente original)
curl http://localhost:3001/api/pages-config

# API Proxy en Web (la que usa el dashboard)
curl http://localhost:3000/api/pages-config
```

## ✅ Ventajas de Esta Arquitectura

### 1. Una Sola Fuente de Verdad
- ✅ Config en código (Git = auditoría)
- ✅ Cero posibilidad de desincronización
- ✅ Deploy automático actualiza todo

### 2. Sin Problemas CORS
- ✅ API Proxy en mismo origen (no CORS)
- ✅ Fetch servidor-a-servidor sin restricciones
- ✅ Cliente no necesita configuración especial

### 3. Performance
- ✅ Cache HTTP en ambas APIs (60s)
- ✅ Sin consultas a BD
- ✅ Cero latencia de escritura

### 4. Simplicidad
- ✅ No requiere jobs de sincronización
- ✅ No requiere scripts complejos
- ✅ Menos código que mantener

### 5. Consistencia
- ✅ Alineado con arquitectura documentada
- ✅ Páginas estáticas → Código
- ✅ Blog dinámico → Base de datos

## 📊 Comparativa: Antes vs Después

| Aspecto | Antes (BD) | Ahora (API) |
|---------|-----------|-------------|
| **Fuente de verdad** | BD desincronizada | Código (page-config.ts) |
| **Sincronización** | Manual/script | No necesaria |
| **Latencia lectura** | 50-100ms (BD) | 50ms (API + cache) |
| **Mantenimiento** | Alto (sync + BD) | Bajo (solo código) |
| **Posibilidad de bug** | Media (desync) | Baja (single source) |
| **Deploy impacto** | Requiere sync | Automático |

## 🔄 Workflow de Cambios

### Para Agregar/Modificar Página

```typescript
// 1. Editar page-config.ts
export const PAGE_CONFIG = {
  '/nueva-ruta': {
    seoIndex: true,
    status: 'public',
    section: 'nueva-seccion',
    notes: 'Nueva página'
  }
};

// 2. Commit + Push
git add apps/marketing/src/lib/page-config.ts
git commit -m "feat: agregar nueva página"
git push

// 3. Deploy automático
// ✅ API actualizada
// ✅ Dashboard refleja cambios
```

### Para Ver Cambios en Dashboard

1. Ir a `/dashboard/pages`
2. Los cambios se ven inmediatamente (con cache de 60s máximo)
3. Refrescar página si es necesario

## 🧪 Testing

### Verificar API Funciona

```bash
# Desde terminal
curl http://localhost:3000/api/pages-config | jq

# Esperar JSON con todas las páginas
```

### Verificar Dashboard

1. Login en dashboard (`/dashboard`)
2. Ir a "Páginas" (`/dashboard/pages`)
3. Verificar que se muestren todas las páginas de `page-config.ts`
4. Verificar estadísticas correctas

## 📝 Notas Importantes

### Status Soportados

- `public` - Página pública y accesible
- `draft` - En desarrollo, no pública
- `coming-soon` - Próximamente (ej: MX, CO)
- `private` - Solo admin

### Cache

La API tiene cache HTTP de 60 segundos:
- Primera petición: Genera respuesta
- Siguientes 60s: Sirve desde cache
- Stale-while-revalidate: 120s adicionales

Si necesitas invalidar cache inmediatamente, reinicia la app marketing.

### Tabla `marketing.page_management`

**Estado**: Ya no se usa para páginas estáticas

**Opciones**:
1. Mantenerla vacía (por si se necesita en futuro)
2. Eliminarla (migración opcional)

Recomendación: Mantenerla por ahora, eliminar en próximo release si confirmas que no se necesita.

## 🐛 Troubleshooting

### Dashboard no muestra páginas

**Causa**: API no responde o URL incorrecta

**Solución**:
1. Verificar que **ambas apps** estén corriendo:
   - Web app: `localhost:3000`
   - Marketing app: `localhost:3001`
2. Verificar `NEXT_PUBLIC_MARKETING_URL=http://localhost:3001` en `apps/web/.env.local`
3. Verificar proxy web: `curl http://localhost:3000/api/pages-config`
4. Verificar API marketing: `curl http://localhost:3001/api/pages-config`

### Error "Failed to fetch"

**Causa**: El API Proxy no puede conectar con Marketing

**Solución**:
1. Verificar que marketing app esté corriendo en puerto correcto
2. Revisar consola del servidor (no navegador) para ver errores del proxy
3. Verificar variable `NEXT_PUBLIC_MARKETING_URL` apunta al puerto correcto
4. Reiniciar ambas apps después de cambiar `.env.local`

### Errores CORS (Ya Solucionado)

**Nota**: Con el API Proxy, los errores CORS deberían estar resueltos.

Si aún ves errores CORS, verifica:
- ✅ El cliente llama a `/api/pages-config` (ruta relativa, no absoluta)
- ✅ No llama directamente a `http://localhost:3001`
- ✅ El código usa el proxy correctamente

### Cache no actualiza

**Causa**: Cache HTTP de 60s

**Solución**:
- Esperar 60 segundos
- O reiniciar app marketing
- O usar header `Cache-Control: no-cache` en petición

## 🎯 Próximos Pasos (Opcionales)

### Migración para Eliminar Tabla

Si confirmas que no necesitas la tabla BD:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_remove_page_management.sql
DROP TABLE IF EXISTS marketing.page_management CASCADE;
```

### Cache Más Agresivo

Para mejor performance en producción:

```typescript
// En route.ts
headers: {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
}
```

---

**Fecha**: Octubre 2025  
**Autor**: TuPatrimonio Development Team  
**Versión**: 1.0

