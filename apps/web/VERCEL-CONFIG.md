# Configuración Vercel - App Web (app.tupatrimonio.app)

## Variables de Entorno

Configurar en Vercel Dashboard → Settings → Environment Variables:

### Google Analytics
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-HKK7H001DB
```
**Environments:** Production, Preview, Development

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=tu-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key
```

## Configuración en next.config.ts

### Headers Implementados

#### Headers de Seguridad (Todas las rutas)
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

#### Headers para Dashboard (`/dashboard/*`)
- `X-Robots-Tag: noindex, nofollow` - Evita indexación
- `Cache-Control: private, no-cache, no-store` - Sin caché

#### Headers para PWA
- **Service Workers** (`/sw.js`, `/sw-update.js`):
  - `Cache-Control: public, max-age=0, must-revalidate`
  - `Service-Worker-Allowed: /`
  - `Content-Type: application/javascript`

- **Manifest** (`/manifest.json`):
  - `Content-Type: application/manifest+json`
  - `Cache-Control: public, max-age=3600`

- **Version** (`/version.json`):
  - `Content-Type: application/json`
  - `Cache-Control: no-cache, no-store, must-revalidate`

- **Íconos** (`/icons/*`):
  - `Cache-Control: public, max-age=31536000, immutable`

#### Headers para Autenticación (`/login/*`, `/auth/*`)
- `Cache-Control: no-store, max-age=0`

### Redirects Implementados

```
/signin     → /login (301 Permanent)
/signup     → /login (301 Permanent)
/register   → /login (301 Permanent)
```

## Middleware de Autenticación

Archivo: `apps/web/src/lib/supabase/middleware.ts`

### Lógica Implementada:

1. **Raíz (`/`)**:
   - Usuario autenticado → Redirige a `/dashboard`
   - Usuario NO autenticado → Redirige a `/login`

2. **Dashboard (`/dashboard/*`)**:
   - Requiere autenticación
   - Sin autenticación → Redirige a `/login`

3. **Login (`/login`)**:
   - Usuario autenticado → Redirige a `/dashboard`
   - Usuario NO autenticado → Permite acceso

4. **Rutas Públicas**:
   - `/login`, `/auth`, `/404` - Acceso público

5. **Otras Rutas**:
   - Requieren autenticación por defecto

## Diferencias con Netlify

| Característica | Netlify | Vercel |
|----------------|---------|--------|
| Headers | `netlify.toml` | `next.config.ts` → `headers()` |
| Redirects | `netlify.toml` | `next.config.ts` → `redirects()` |
| Variables de entorno | `netlify.toml` o Dashboard | Solo Dashboard |
| Protección de rutas | Edge redirect con cookies | Middleware con Supabase |
| Edge Functions | Netlify Functions | Vercel Edge Functions / Middleware |

## Ventajas de Vercel

✅ **Integración nativa con Next.js** - Mejor rendimiento  
✅ **Middleware potente** - Lógica server-side más flexible  
✅ **Edge Runtime** - Ejecución en el borde (más rápido)  
✅ **Deploys automáticos** - Push a GitHub activa deploy  
✅ **Preview deployments** - Cada PR tiene su URL preview  
✅ **Analytics integrado** - Vercel Analytics disponible  

## Deploy

### Build Command:
```bash
npm run build:web
```

### Root Directory:
```
apps/web
```

### Output Directory:
```
.next
```

### Node.js Version:
```
20.x
```

## Verificación Post-Deploy

1. ✅ Google Analytics funcionando (solo en producción)
2. ✅ PWA instalable (service worker registrado)
3. ✅ Rutas protegidas (dashboard requiere login)
4. ✅ Redirects funcionando (/signin → /login)
5. ✅ Headers de seguridad aplicados
6. ✅ Notificación de actualizaciones funcionando

## Desarrollo Local

### Crear `.env.local`:
```bash
cp .env.local.example .env.local
```

### Agregar valores:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-HKK7H001DB
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### Ejecutar:
```bash
npm run dev
```

## Troubleshooting

### Google Analytics no aparece en desarrollo
✅ **Normal** - GA solo funciona en producción (`NODE_ENV=production`)  
En desarrollo verás logs en consola: `📊 Analytics Event (dev)`

### Popup de actualización no aparece
**Causa:** `version.json` no se genera correctamente en Vercel

**Solución aplicada:**
- ✅ Actualizado `next.config.ts` para usar `__dirname` en lugar de `process.cwd()`
- ✅ Incluye fallback automático para desarrollo
- ✅ Ver `VERCEL-UPDATE-NOTIFIER-FIX.md` para detalles completos

**Verificar en producción:**
```bash
curl https://app.tupatrimonio.app/version.json
```

**Test rápido del popup:**
```javascript
// En DevTools Console
localStorage.setItem('app-version', '1000000000000')
location.reload()
// Deberías ver el popup inmediatamente
```

### Service Worker no actualiza
- Verificar `/version.json` se genera en cada build
- Verificar headers de cache en `/version.json` (no-cache)
- Verificar componente `<UpdateNotification />` en layout

### Redirects de autenticación no funcionan
- Verificar variables de Supabase en Vercel
- Verificar cookies de sesión (sb-*)
- Revisar logs de middleware en Vercel Dashboard

### PWA no es instalable
- Verificar `/manifest.json` accesible
- Verificar `/sw.js` se carga correctamente
- Verificar HTTPS habilitado (requerido para PWA)

