# ✅ Verificación Rápida: Popup de Actualización

## 🎯 Verificación en 3 Pasos

### Paso 1: Verificar Build Logs en Vercel (Inmediatamente después del deploy)

1. Ve a **Vercel Dashboard**
2. Click en tu deployment más reciente
3. Click en **"View Build Logs"** o **"Logs"**
4. Busca (Ctrl+F) por: `version.json`

**Debes ver:**
```
🔧 [Web App] Generando version.json...
📍 __dirname: /vercel/path0/apps/web
📍 process.cwd(): /vercel/path0
✅ [ESM __dirname] version.json generado exitosamente
📂 Ubicación: /vercel/path0/apps/web/public/version.json
📄 Contenido: { version: '1730145678901', buildId: '...', deployedAt: '...' }
```

✅ **Si ves esto** → Archivo generado OK, continúa al Paso 2  
❌ **Si NO lo ves** → Revisar errores en los logs, contactar soporte

---

### Paso 2: Verificar Acceso al Archivo (2 minutos después del deploy)

Abre en tu navegador:
```
https://app.tupatrimonio.app/version.json
```

**Debes ver un JSON:**
```json
{
  "version": "1730145678901",
  "buildId": "abc123def456",
  "deployedAt": "2024-10-28T21:34:38.901Z"
}
```

✅ **Si ves el JSON** → Archivo accesible, continúa al Paso 3  
❌ **Si ves 404** → Problema en el output de Vercel, revisar configuración del proyecto

---

### Paso 3: Probar el Popup (Test Manual - 30 segundos)

1. **Abre** `https://app.tupatrimonio.app`

2. **Abre DevTools** (F12) → Console

3. **Ejecuta este código:**
   ```javascript
   // Forzar versión antigua
   localStorage.setItem('tp-app-version', JSON.stringify({
     version: '1000000000000',
     buildId: 'oldversion',
     deployedAt: '2024-01-01T00:00:00.000Z'
   }));
   
   // Recargar
   location.reload();
   ```

4. **Espera 2-3 segundos**

**Resultado esperado:**
- 🎉 Popup aparece en esquina superior derecha
- ⏱️ Countdown de 10 segundos
- 🎨 Diseño con colores TuPatrimonio
- 🔘 Botones "Actualizar ahora" y "Posponer" funcionan

✅ **Si aparece el popup** → ¡TODO FUNCIONA! 🎉  
❌ **Si NO aparece** → Ver sección de troubleshooting abajo

---

## 🐛 Troubleshooting Rápido

### El popup NO aparece después del test manual

**Verifica en Console:**

```javascript
// 1. Ver si hay errores
// Busca líneas rojas en la consola

// 2. Verificar versión guardada
console.log('Versión guardada:', localStorage.getItem('tp-app-version'));

// 3. Verificar fetch
fetch('/version.json?t=' + Date.now())
  .then(r => {
    console.log('Status:', r.status);
    return r.json();
  })
  .then(data => console.log('Datos:', data))
  .catch(err => console.error('Error fetch:', err));

// 4. Ver si el componente existe
console.log('Componente:', document.querySelector('.tp-animate-slide-in'));
```

**Posibles causas:**

1. **Error en el fetch** → Revisar Network tab, verificar que `/version.json` retorna 200
2. **Error de React** → Buscar errores rojos en Console
3. **CSS no carga** → Verificar que variables `--tp-brand` existen
4. **Componente no montado** → Verificar `layout.tsx` tiene `<UpdateNotification />`

---

## 📋 Checklist Final

Antes de cerrar el issue, verifica:

- [ ] ✅ Build logs muestran generación exitosa
- [ ] ✅ `/version.json` accesible en producción
- [ ] ✅ Test manual muestra el popup
- [ ] ✅ Countdown funciona (10, 9, 8...)
- [ ] ✅ Botón "Actualizar ahora" recarga la página
- [ ] ✅ Botón "Posponer" cierra el popup
- [ ] ✅ Hacer nuevo deploy real muestra popup después de 5 min

---

## 🎯 Test de Actualización Real

Una vez verificados los pasos anteriores:

1. **Deja la app abierta** en un tab
2. **Haz un cambio pequeño** en el código
3. **Push y deploy** a Vercel
4. **Espera 5 minutos** (o cambia de tab y regresa)
5. **El popup debe aparecer automáticamente** ✨

---

## 💡 Comandos Útiles para Debugging

```javascript
// Ver todo el localStorage
console.table(Object.keys(localStorage).map(k => ({
  key: k,
  value: localStorage.getItem(k)
})));

// Limpiar todo y empezar de cero
localStorage.clear();
location.reload();

// Simular actualización disponible manualmente
localStorage.setItem('tp-app-version', JSON.stringify({
  version: '1',
  buildId: 'old',
  deployedAt: new Date(0).toISOString()
}));
location.reload();
```

---

**Última actualización:** 28 Octubre 2024 - 5:15 PM  
**Estado:** ✅ Fix ESM implementado + Guía de verificación completa  
**Próximo paso:** Deploy a Vercel y seguir esta guía

