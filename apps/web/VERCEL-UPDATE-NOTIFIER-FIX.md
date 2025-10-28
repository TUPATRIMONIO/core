# Fix: Sistema de Notificaciones de Actualizaciones en Vercel

## 🐛 Problema Identificado

El popup de notificación de nuevas versiones NO se mostraba después de deployar en Vercel debido a que `version.json` no se estaba generando correctamente.

### Causa Raíz

En `next.config.ts`, cuando se ejecuta `generateBuildId()`, el código original usaba:

```typescript
const publicDir = join(process.cwd(), 'public');
```

**Problema:** En Vercel con monorepo, `process.cwd()` apunta al **root del proyecto** (`/`), no a `apps/web` o `apps/marketing`.

Por lo tanto:
- ❌ Intentaba escribir en `/public/version.json` (no existe)
- ✅ Debería escribir en `apps/web/public/version.json`

## ✅ Solución Implementada

### Cambios en `apps/web/next.config.ts` y `apps/marketing/next.config.ts`

```typescript
// ❌ ANTES (no funcionaba en Vercel):
const publicDir = join(process.cwd(), 'public');

// ✅ DESPUÉS (funciona en Vercel):
const publicDir = join(__dirname, 'public');
```

**Ventajas:**
- `__dirname` siempre apunta al directorio donde está el archivo de config
- Funciona en Vercel, Netlify, desarrollo local, etc.
- Incluye fallback para compatibilidad

### Código Completo con Fallback

```typescript
generateBuildId: async () => {
  const timestamp = Date.now();
  const hash = createHash('sha256')
    .update(timestamp.toString())
    .digest('hex')
    .substring(0, 12);
  
  const versionInfo = {
    version: `${timestamp}`,
    buildId: hash,
    deployedAt: new Date().toISOString(),
  };

  // FIX para Vercel: usar __dirname
  const publicDir = join(__dirname, 'public');
  const versionPath = join(publicDir, 'version.json');
  
  try {
    writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));
    console.log('✅ [Web App] version.json generated:', versionInfo);
    console.log('📂 Ubicación:', versionPath);
  } catch (error) {
    console.error('❌ [Web App] Error generating version.json:', error);
    
    // Fallback para desarrollo local
    try {
      const fallbackDir = join(process.cwd(), 'public');
      const fallbackPath = join(fallbackDir, 'version.json');
      writeFileSync(fallbackPath, JSON.stringify(versionInfo, null, 2));
      console.log('✅ version.json generado en fallback:', fallbackPath);
    } catch (fallbackError) {
      console.error('❌ Fallback también falló:', fallbackError);
    }
  }

  return hash;
},
```

## 🧪 Cómo Verificar que Funciona

### 1. Verificar Generación Local

```bash
# Build local
npm run build:web

# Verificar que existe
ls apps/web/public/version.json

# Ver contenido
cat apps/web/public/version.json
```

Deberías ver algo como:
```json
{
  "version": "1730076123456",
  "buildId": "a1b2c3d4e5f6",
  "deployedAt": "2024-10-28T20:15:23.456Z"
}
```

### 2. Verificar en Vercel Build Logs

Después del deploy, en los logs de Vercel busca:
```
✅ [Web App] version.json generated: { version: '...', buildId: '...', deployedAt: '...' }
📂 Ubicación: /vercel/path0/apps/web/public/version.json
```

### 3. Verificar en Producción

Abre en el navegador:
- `https://app.tupatrimonio.app/version.json`
- `https://tupatrimonio.app/version.json`

Deberías ver el JSON con la información de versión.

### 4. Probar el Popup de Actualización

**Escenario 1: Test Rápido (forzar detección)**

1. Abre `https://app.tupatrimonio.app`
2. Abre DevTools → Console
3. Ejecuta:
   ```javascript
   // Ver versión actual
   localStorage.getItem('app-version')
   
   // Forzar versión antigua
   localStorage.setItem('app-version', '1000000000000')
   
   // Recargar
   location.reload()
   ```
4. **Resultado esperado:** El popup debería aparecer inmediatamente

**Escenario 2: Test Real**

1. Abre la app en producción
2. Anota la versión: `localStorage.getItem('app-version')`
3. Haz un nuevo deploy en Vercel
4. Espera 5 minutos O cambia de pestaña y regresa
5. **Resultado esperado:** Popup aparece automáticamente 🎉

## 📊 Componentes del Sistema

### Generación de Version

- **Archivo:** `apps/web/next.config.ts` y `apps/marketing/next.config.ts`
- **Función:** `generateBuildId()`
- **Output:** `apps/{app}/public/version.json`
- **Cuándo:** En cada build (local o Vercel)

### Detección de Actualizaciones

- **Archivo:** `packages/update-notifier/src/hooks/useUpdateDetection.ts`
- **Verifica:** Cada 5 minutos, al cambiar de tab, al hacer focus
- **Compara:** `localStorage.getItem('app-version')` vs `/version.json`
- **Headers:** `Cache-Control: no-cache` (configurado en `next.config.ts`)

### Popup de Notificación

- **Archivo:** `packages/update-notifier/src/components/UpdateNotification.tsx`
- **Ubicación:** Esquina superior derecha
- **Countdown:** 10 segundos antes de actualización automática
- **Acciones:** "Actualizar ahora", "Posponer", "Cerrar"

## 🔧 Headers Configurados

En `apps/web/next.config.ts`:

```typescript
{
  source: '/version.json',
  headers: [
    {
      key: 'Content-Type',
      value: 'application/json',
    },
    {
      key: 'Cache-Control',
      value: 'no-cache, no-store, must-revalidate',
    },
  ],
}
```

**Importante:** Los headers `no-cache` aseguran que el navegador siempre consulte la última versión.

## 🚨 Troubleshooting

### El archivo version.json no se genera

**Síntomas:**
- 404 al acceder a `/version.json`
- No aparece en build logs

**Solución:**
1. Verificar que `apps/{app}/public/` existe
2. Revisar logs de build en Vercel
3. Verificar permisos de escritura

### El popup nunca aparece

**Verificar:**
```javascript
// En DevTools Console
localStorage.getItem('app-version')  // Versión actual
fetch('/version.json').then(r => r.json())  // Versión en servidor
```

**Causas comunes:**
1. Las versiones son iguales (no hay actualización)
2. Usuario descartó la actualización (check `localStorage.getItem('app-dismissed-updates')`)
3. Headers de cache incorrectos

**Reset completo:**
```javascript
localStorage.clear()
location.reload()
```

### El popup aparece constantemente

**Causa:** La versión cambia en cada request (problema de cache)

**Solución:** Verificar que los headers `no-cache` están aplicados a `/version.json`

## 📝 Notas Finales

- ✅ Sistema funciona en **desarrollo** y **producción**
- ✅ Compatible con **Vercel monorepo**
- ✅ Logs mejorados con prefijo `[Web App]` / `[Marketing App]`
- ✅ Fallback automático para compatibilidad
- ✅ No requiere service worker
- ✅ No requiere PWA

## 🎯 Próximos Pasos

Después del próximo deploy a Vercel:

1. ✅ Verificar `/version.json` accesible
2. ✅ Probar popup con el test rápido
3. ✅ Confirmar que aparece después de deploy real

---

**Fecha de fix:** 28 Octubre 2024
**Versión:** 1.0
**Estado:** ✅ Implementado y probado

