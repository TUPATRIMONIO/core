# PWA - Progressive Web App

## Descripción

TuPatrimonio Web App está configurada como una Progressive Web App (PWA) completa, permitiendo a los usuarios instalarla en sus dispositivos móviles y de escritorio, además de funcionar offline.

## Características PWA

### ✅ Instalable
- Los usuarios pueden instalar la app desde el navegador
- Ícono en la pantalla de inicio del dispositivo
- Experiencia similar a una app nativa

### ✅ Funcionalidad Offline
- Caché inteligente de assets estáticos
- Página offline personalizada cuando no hay conexión
- Sincronización automática al reconectar

### ✅ Actualizaciones Automáticas
- Detección de nuevas versiones
- Notificación al usuario de actualizaciones disponibles
- Integración con el sistema de Update Notification

### ✅ Performance Optimizada
- Estrategias de caché múltiples (Network-first, Cache-first, Stale-while-revalidate)
- Precarga de assets críticos
- Carga rápida en visitas repetidas

## Archivos Principales

### Configuración
- `/public/manifest.json` - Configuración PWA (nombre, colores, íconos)
- `/public/sw.js` - Service Worker con estrategias de caché
- `/scripts/generate-icons.js` - Script para generar íconos en todos los tamaños

### Componentes
- `/src/components/ServiceWorkerRegistration.tsx` - Registra el SW
- `/src/app/offline/page.tsx` - Página mostrada cuando no hay conexión
- `/src/app/layout.tsx` - Metadata y meta tags PWA

### Íconos
- `/public/icons/` - Todos los íconos PWA en múltiples tamaños

## Setup de Íconos

### 1. Colocar Ícono Base
Guarda tu ícono base (PNG, 512x512px recomendado) en:
```
apps/web/public/icons/icon-base.png
```

### 2. Instalar Dependencias
```bash
cd apps/web
npm install sharp --save-dev
```

### 3. Generar Íconos
```bash
node scripts/generate-icons.js
```

Esto generará automáticamente todos los íconos en los tamaños necesarios.

## Estrategias de Caché

### Network-First
- `/version.json` - Para detectar actualizaciones
- Rutas `/api/*` - Datos siempre actualizados
- Rutas `/auth/*` - Autenticación siempre actualizada

### Cache-First
- `/_next/static/*` - Bundles de Next.js
- Archivos estáticos (JS, CSS, imágenes)
- Íconos y assets

### Stale-While-Revalidate
- Páginas HTML navegables
- Retorna caché inmediatamente
- Actualiza en background

### Offline Fallback
- Si no hay conexión y no hay caché, muestra `/offline`

## Desarrollo

### Probar PWA Localmente

1. **Build de producción:**
```bash
npm run build
npm run start
```

2. **Abrir Chrome DevTools:**
   - Application tab
   - Service Workers
   - Manifest

3. **Lighthouse:**
   - Ejecutar auditoría PWA
   - Verificar que pasa todos los checks

### Desregistrar Service Worker (Desarrollo)

Si necesitas limpiar el Service Worker durante desarrollo:

```javascript
// En la consola del navegador
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister()
  }
})
```

## Testing

### Verificar Instalabilidad

1. Abrir la app en Chrome/Edge
2. Buscar el ícono de instalación en la barra de direcciones
3. Instalar la app
4. Verificar que aparece en la lista de aplicaciones

### Verificar Offline

1. Abrir DevTools → Network
2. Seleccionar "Offline"
3. Navegar por la app
4. Verificar que muestra contenido cacheado o página offline

### Verificar Actualizaciones

1. Hacer un nuevo build
2. La app debe detectar la nueva versión
3. Debe mostrar notificación de actualización
4. Al actualizar, debe cargar la nueva versión

## Producción

### Netlify

La configuración ya está lista en `netlify.toml`. Al hacer deploy:

1. ✅ Service Worker se sirve correctamente
2. ✅ Manifest.json accesible
3. ✅ Headers correctos para caché
4. ✅ version.json se genera en cada build

### Verificación Post-Deploy

1. **PWA Install:**
   - Abrir sitio en móvil
   - Verificar prompt de instalación
   - Instalar y probar

2. **Lighthouse:**
   - Ejecutar en sitio de producción
   - Score PWA debe ser 90+

3. **Offline:**
   - Instalar app
   - Desconectar internet
   - Verificar funcionalidad

## Troubleshooting

### Service Worker no se registra

**Problema:** Console muestra "Service Worker not supported"

**Solución:**
- Verificar que estás en HTTPS (requerido para SW)
- Verificar que `NODE_ENV=production`
- En localhost, usar `https://` o `http://localhost`

### Íconos no aparecen

**Problema:** La app se instala pero sin íconos

**Solución:**
1. Verificar que existen todos los íconos en `/public/icons/`
2. Ejecutar `node scripts/generate-icons.js`
3. Hacer rebuild y redeploy
4. Limpiar caché del navegador

### App no funciona offline

**Problema:** Muestra error en vez de página offline

**Solución:**
1. Verificar que `/offline` existe y es accesible
2. Verificar que SW está registrado (DevTools → Application)
3. Limpiar caché y volver a visitar páginas
4. Verificar estrategias de caché en `sw.js`

### No detecta actualizaciones

**Problema:** Nueva versión no se notifica

**Solución:**
1. Verificar que `version.json` se genera en cada build
2. Verificar que UpdateNotification está en layout
3. Forzar actualización del SW en DevTools
4. Verificar consola para logs del SW

## Mantenimiento

### Actualizar Service Worker

Cuando modifiques `sw.js`:
1. Cambiar `CACHE_NAME` (ej: 'tupatrimonio-web-v2')
2. Hacer deploy
3. Los usuarios recibirán actualización automática

### Agregar nuevos assets precacheados

Editar `PRECACHE_ASSETS` en `sw.js`:
```javascript
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/dashboard',
  '/nueva-ruta', // Agregar aquí
];
```

### Cambiar estrategias de caché

Modificar lógica en el evento `fetch` de `sw.js` según necesites.

## Referencias

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Workbox](https://developers.google.com/web/tools/workbox)

## Soporte

Para problemas específicos de PWA, revisar:
1. Chrome DevTools → Application
2. Lighthouse report
3. Logs del Service Worker en consola

