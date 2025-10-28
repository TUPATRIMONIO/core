# 🐛 Guía de Debugging: Sistema de Notificaciones de Actualización

## Verificación Paso a Paso

### Paso 1: Verificar que version.json se genera en el build

#### En Vercel Build Logs:

Después de hacer deploy, ve a **Vercel Dashboard → Deployments → [tu deployment] → Logs**

Busca estas líneas durante el build:

```
🔧 [Web App] Generando version.json...
📍 __dirname: /vercel/path0/apps/web
📍 process.cwd(): /vercel/path0
✅ [ESM __dirname] version.json generado exitosamente
📂 Ubicación: /vercel/path0/apps/web/public/version.json
📄 Contenido: { version: '1730076543210', buildId: 'abc123...', deployedAt: '2024-10-28...' }
```

✅ **Si ves esto** → El archivo se generó correctamente
❌ **Si NO lo ves** → El archivo no se generó, revisar errores

#### En Producción:

Abre en el navegador (reemplaza con tu dominio):
```
https://app.tupatrimonio.app/version.json
```

Deberías ver:
```json
{
  "version": "1730076543210",
  "buildId": "abc123def456",
  "deployedAt": "2024-10-28T20:15:43.210Z"
}
```

✅ **Si ves el JSON** → Archivo accesible
❌ **Si ves 404** → El archivo no se generó o no se copió al output

---

### Paso 2: Verificar que el componente UpdateNotification está montado

Abre la app en producción → DevTools → Console

Busca:
```
ℹ️ Service Worker not supported or not in production
```

O si estás en producción:
```
✅ PWA Service Worker registered: https://app.tupatrimonio.app/
```

Luego ejecuta en la consola:
```javascript
// Verificar que el componente existe en el DOM
document.querySelector('.tp-animate-slide-in')
// Debería retornar null si no hay actualización, o el elemento si hay

// Verificar versión almacenada
localStorage.getItem('tp-app-version')
// Debería retornar algo como: {"version":"1730076543210","buildId":"abc123...","deployedAt":"..."}
```

✅ **Si hay versión almacenada** → El hook se ejecutó
❌ **Si es null** → El hook no se ejecutó o falló

---

### Paso 3: Verificar detección de actualizaciones

En la consola del navegador, ejecuta:

```javascript
// Ver versión actual almacenada
const current = localStorage.getItem('tp-app-version');
console.log('📱 Versión actual:', current);

// Consultar versión del servidor
fetch('/version.json?t=' + Date.now(), { cache: 'no-cache' })
  .then(r => r.json())
  .then(latest => {
    console.log('🌐 Versión del servidor:', latest);
    console.log('🔄 ¿Son diferentes?', current !== JSON.stringify(latest));
  });
```

✅ **Si son diferentes** → Debería mostrar popup
❌ **Si son iguales** → No hay actualización real

---

### Paso 4: Forzar el popup para testing

#### Test Rápido (Sin deploy):

```javascript
// 1. Limpiar todo
localStorage.clear();

// 2. Establecer versión antigua
localStorage.setItem('tp-app-version', JSON.stringify({
  version: '1000000000000',
  buildId: 'oldversion',
  deployedAt: '2024-01-01T00:00:00.000Z'
}));

// 3. Recargar
location.reload();

// RESULTADO ESPERADO: El popup debería aparecer en 2-3 segundos
```

#### Logs de Debugging:

Después de recargar, revisa la consola. Deberías ver:
```
📊 Analytics Event (dev): ... (si estás en dev)
Error checking for updates: ... (si hay problemas)
```

---

### Paso 5: Verificar el hook useUpdateDetection

Agrega logs temporales en DevTools Console:

```javascript
// Verificar que el fetch funciona
fetch('/version.json?t=' + Date.now(), {
  cache: 'no-cache',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  }
})
.then(r => {
  console.log('📡 Response status:', r.status);
  console.log('📡 Response headers:', [...r.headers.entries()]);
  return r.json();
})
.then(data => console.log('📄 Version data:', data))
.catch(err => console.error('❌ Fetch error:', err));
```

---

## 🔍 Checklist de Diagnóstico

Marca cada item que verificaste:

- [ ] **Build logs de Vercel muestran** `✅ version.json generado exitosamente`
- [ ] **Archivo accesible** en `https://app.tupatrimonio.app/version.json`
- [ ] **Componente UpdateNotification** está en el layout.tsx
- [ ] **Headers de no-cache** configurados en next.config.ts
- [ ] **localStorage tiene** `tp-app-version` después de cargar la app
- [ ] **Fetch a /version.json** funciona sin errores
- [ ] **Test forzado** con versión antigua muestra el popup

---

## 🚨 Problemas Comunes y Soluciones

### Problema: "404 Not Found" en /version.json

**Causa posible:**
- El archivo no se generó durante el build
- El archivo no se copió al output de Next.js

**Solución:**
1. Revisar build logs en Vercel
2. Verificar que el directorio `public/` existe en `apps/web/`
3. Hacer un nuevo deploy completo (no redeploy)

### Problema: El popup nunca aparece pero /version.json existe

**Causa posible:**
- Cache del navegador
- Headers de cache incorrectos
- localStorage key incorrecto

**Solución:**
```javascript
// 1. Limpiar cache
localStorage.clear();
sessionStorage.clear();

// 2. Hard reload
location.reload(true);

// 3. Verificar headers
fetch('/version.json').then(r => 
  console.log('Headers:', [...r.headers.entries()])
);
```

### Problema: "Error checking for updates" en consola

**Causa posible:**
- CORS issues
- Network error
- JSON malformado

**Solución:**
```javascript
// Test manual del fetch
fetch('/version.json?t=' + Date.now())
  .then(r => r.text())
  .then(text => {
    console.log('Raw response:', text);
    try {
      JSON.parse(text);
      console.log('✅ JSON válido');
    } catch (e) {
      console.error('❌ JSON inválido:', e);
    }
  });
```

### Problema: El popup aparece pero desaparece inmediatamente

**Causa posible:**
- Error en el componente React
- Estado no se mantiene
- CSS incorrecto

**Solución:**
```javascript
// Verificar errores de React en consola
// Verificar que las variables CSS existen
getComputedStyle(document.body).getPropertyValue('--tp-brand')
```

---

## 🎯 Test Completo de Extremo a Extremo

### Procedimiento:

1. **Deploy inicial:**
   ```bash
   git commit -am "Fix: Sistema de notificaciones con ESM"
   git push origin main
   ```

2. **Verificar build logs** en Vercel (3-5 minutos)
   - Buscar: `✅ version.json generado exitosamente`
   - Anotar la ruta donde se guardó

3. **Abrir la app en producción:**
   ```
   https://app.tupatrimonio.app
   ```

4. **En DevTools Console:**
   ```javascript
   // Ver versión inicial
   console.log('Versión inicial:', localStorage.getItem('tp-app-version'));
   ```

5. **Hacer un cambio trivial y push:**
   ```bash
   # Hacer cualquier cambio pequeño
   echo "# Update test" >> README.md
   git commit -am "test: Trigger update notification"
   git push origin main
   ```

6. **Esperar deploy (3-5 min) → NO cerrar la tab de la app**

7. **Después del deploy:**
   - Esperar 5 minutos sin recargar
   - O cambiar de tab y regresar
   - O hacer focus en otra ventana y regresar

8. **Resultado esperado:**
   - 🎉 Popup aparece en esquina superior derecha
   - ⏱️ Countdown de 10 segundos
   - 🔄 Botones "Actualizar ahora" y "Posponer"

---

## 📊 Métricas de Éxito

### Build Time:
- ✅ Logs muestran archivo generado
- ✅ Exactamente UNA estrategia exitosa (no las 3)
- ✅ Path correcto en logs

### Runtime (Producción):
- ✅ `/version.json` accesible (200 OK)
- ✅ Headers `Cache-Control: no-cache, no-store`
- ✅ localStorage guarda versión inicial
- ✅ Fetch periódico cada 5 min (verificar en Network tab)

### Actualización:
- ✅ Detecta nueva versión en <5 min
- ✅ Popup visible y funcional
- ✅ Countdown funciona
- ✅ Botones responden
- ✅ Actualización limpia cache y recarga

---

## 🔧 Debugging Avanzado

### Activar Modo Verbose:

Agrega temporalmente en `packages/update-notifier/src/hooks/useUpdateDetection.ts`:

```typescript
const checkForUpdate = useCallback(async () => {
  console.log('🔍 [DEBUG] Verificando actualizaciones...');
  
  if (checkingRef.current) {
    console.log('⏭️ [DEBUG] Ya hay un check en progreso, skip');
    return;
  }
  
  checkingRef.current = true;
  console.log('🚀 [DEBUG] Iniciando verificación...');
  
  try {
    const latest = await fetchLatestVersion();
    console.log('📥 [DEBUG] Versión del servidor:', latest);
    
    if (!latest) {
      console.warn('⚠️ [DEBUG] No se pudo obtener versión del servidor');
      return;
    }

    const current = getCurrentVersion();
    console.log('💾 [DEBUG] Versión local:', current);
    
    if (!current) {
      console.log('🆕 [DEBUG] Primera carga, guardando versión:', latest);
      setCurrentVersion(latest);
      return;
    }

    const changed = hasVersionChanged(current, latest);
    console.log('🔄 [DEBUG] ¿Versión cambió?', changed);
    
    if (changed) {
      const dismissed = isUpdateDismissed(latest.version);
      console.log('🚫 [DEBUG] ¿Update descartado?', dismissed);
      
      if (!dismissed) {
        console.log('🎉 [DEBUG] MOSTRANDO POPUP!');
        setNewVersion(latest);
        setHasUpdate(true);
      }
    }
  } catch (error) {
    console.error('❌ [DEBUG] Error:', error);
  } finally {
    checkingRef.current = false;
  }
}, []);
```

---

## 📝 Storage Keys Usados

**IMPORTANTE:** El sistema usa el prefijo `tp-` (TuPatrimonio):

- `tp-app-version` - Versión actual almacenada
- `tp-update-dismissed` - Versión descartada por el usuario

**NO usar:**
- ❌ `app-version` (sin prefijo)
- ❌ Otros nombres

---

**Última actualización:** 28 Octubre 2024 - 5:00 PM
**Estado:** ✅ Fix ESM implementado con estrategias múltiples + logs verbose

