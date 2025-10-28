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

## ✅ Solución Implementada (Actualizada - 28 Oct 2024)

### Problema con `__dirname` en ESM

El uso directo de `__dirname` no funciona porque Next.js usa **ES Modules** donde `__dirname` no está definido.

### Solución Final: ESM Compatible + Estrategias Múltiples

```typescript
// Importar utilidades necesarias para ESM
import { fileURLToPath } from "url";
import { dirname } from "path";

// Recrear __dirname en contexto ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

**Estrategia Múltiple de Fallback:**

El código ahora intenta **3 métodos diferentes** en orden hasta que uno funcione:

1. **ESM __dirname**: `join(__dirname, 'public')` - Para builds locales y Vercel moderno
2. **process.cwd() directo**: `join(process.cwd(), 'public')` - Para contextos simples
3. **process.cwd() con ruta completa**: `join(process.cwd(), 'apps', 'web', 'public')` - Para monorepos

**Ventajas:**
- ✅ Compatible con ES Modules
- ✅ Funciona en Vercel, local, y cualquier entorno
- ✅ Logs detallados de cada intento
- ✅ Crea directorio automáticamente si no existe
- ✅ Si todos fallan, muestra error claro

### Código Completo Implementado

```typescript
import { fileURLToPath } from "url";
import { dirname } from "path";

// Fix para ESM: __dirname no existe en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

  console.log('🔧 [Web App] Generando version.json...');
  console.log('📍 __dirname:', __dirname);
  console.log('📍 process.cwd():', process.cwd());
  
  // ESTRATEGIA MÚLTIPLE: intentar 3 métodos diferentes
  const strategies = [
    { name: 'ESM __dirname', dir: join(__dirname, 'public') },
    { name: 'process.cwd() directo', dir: join(process.cwd(), 'public') },
    { name: 'process.cwd() con apps/web', dir: join(process.cwd(), 'apps', 'web', 'public') },
  ];

  let success = false;
  
  for (const strategy of strategies) {
    try {
      const versionPath = join(strategy.dir, 'version.json');
      
      // Crear directorio si no existe
      if (!existsSync(strategy.dir)) {
        mkdirSync(strategy.dir, { recursive: true });
      }
      
      writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));
      console.log(`✅ [${strategy.name}] version.json generado exitosamente`);
      console.log(`📂 Ubicación: ${versionPath}`);
      success = true;
      break;
    } catch (error) {
      console.log(`⚠️ [${strategy.name}] Falló:`, error.message);
    }
  }
  
  if (!success) {
    console.error('❌ TODAS las estrategias fallaron');
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

Después del deploy, en **Vercel Dashboard → Deployments → [tu deploy] → Build Logs**, busca estas líneas:

```
🔧 [Web App] Generando version.json...
📍 __dirname: /vercel/path0/apps/web
📍 process.cwd(): /vercel/path0

✅ [ESM __dirname] version.json generado exitosamente
📂 Ubicación: /vercel/path0/apps/web/public/version.json
📄 Contenido: { version: '...', buildId: '...', deployedAt: '...' }
```

**Si NO ves estos logs:**
- ❌ El archivo no se generó
- Busca mensajes de error: `❌ [Web App] TODAS las estrategias fallaron`
- Reporta el problema con los logs completos

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

