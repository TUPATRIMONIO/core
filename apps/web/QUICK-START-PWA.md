# 🚀 Quick Start PWA

## Paso 1: Colocar Ícono Base

Guarda tu ícono (el que adjuntaste) en:
```
apps/web/public/icons/icon-base.png
```

El ícono debe ser:
- Formato: PNG
- Tamaño recomendado: 512x512px o mayor
- Transparente o con fondo #800039

## Paso 2: Instalar Dependencias

```bash
cd apps/web
npm install
```

Esto instalará `sharp` (para generar íconos) automáticamente desde package.json.

## Paso 3: Generar Íconos

```bash
npm run generate-icons
```

Esto creará automáticamente todos los íconos necesarios:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png
- apple-touch-icon.png
- favicon-16x16.png
- favicon-32x32.png
- favicon.ico

## Paso 4: Test Local

```bash
npm run pwa:test
```

Esto hará:
1. Build de producción
2. Start del servidor
3. Abrir http://localhost:3000

## Paso 5: Verificar PWA

### En Chrome/Edge:
1. Abre DevTools (F12)
2. Ve a la tab "Application"
3. Verifica:
   - ✅ Manifest: Debe mostrar "TuPatrimonio" con todos los íconos
   - ✅ Service Workers: Debe aparecer "sw.js" registrado
   - ✅ Offline: En "Network" selecciona "Offline" y recarga

### Instalar PWA:
1. Busca el ícono de instalación en la barra de direcciones (⊕)
2. Click en "Instalar"
3. La app aparecerá como aplicación nativa

## Paso 6: Deploy

### Netlify (Automático):
```bash
git add .
git commit -m "feat: implementar PWA completa"
git push
```

Netlify detectará automáticamente:
- manifest.json
- Service Worker (sw.js)
- Todos los íconos

### Verificar en Producción:
1. Visita tu sitio en móvil
2. Debe aparecer prompt de instalación
3. Instala y prueba offline

## 🎯 ¿Qué hace la PWA?

### ✅ Instalable
- Se puede instalar en cualquier dispositivo
- Aparece como app nativa en la pantalla de inicio
- Funciona en ventana propia (sin barra del navegador)

### ✅ Funciona Offline
- Caché inteligente de páginas visitadas
- Muestra página offline personalizada cuando no hay red
- Se sincroniza automáticamente al reconectar

### ✅ Actualizaciones Automáticas
- Detecta nuevas versiones automáticamente
- Notifica al usuario con countdown
- Se actualiza sin perder datos

### ✅ Performance
- Carga instantánea en visitas repetidas
- Caché de assets estáticos
- Optimizado para móviles

## 🔧 Troubleshooting

### "Cannot find module 'sharp'"
```bash
cd apps/web
npm install sharp --save-dev
```

### "icon-base.png not found"
Asegúrate de colocar tu ícono en:
```
apps/web/public/icons/icon-base.png
```

### Service Worker no se registra
- Solo funciona en producción (`npm run pwa:test`)
- En desarrollo normal (`npm run dev`) no se registra
- Debe ser HTTPS o localhost

### PWA no se puede instalar
1. Verifica que manifest.json sea accesible: http://localhost:3000/manifest.json
2. Verifica que los íconos existan: http://localhost:3000/icons/icon-192x192.png
3. Debe ser HTTPS en producción
4. Ejecuta Lighthouse audit en DevTools

## 📚 Más Información

- **Documentación completa**: `apps/web/README-PWA.md`
- **Setup desarrollo**: `docs/DEVELOPMENT.md`
- **Deployment**: `docs/DEPLOYMENT.md`

## ✨ Características Implementadas

- [x] manifest.json con configuración completa
- [x] Service Worker con estrategias de caché
- [x] Página offline personalizada
- [x] Sistema de actualización automática (UpdateNotification)
- [x] Íconos en todos los tamaños necesarios
- [x] Meta tags PWA en layout
- [x] Script de generación de íconos
- [x] Soporte para push notifications (opcional)
- [x] Precarga de assets críticos
- [x] Compatible con Netlify

## 🎨 Personalización

### Cambiar colores del tema:
Editar `apps/web/public/manifest.json`:
```json
{
  "theme_color": "#800039",
  "background_color": "#f7f7f7"
}
```

### Agregar shortcuts:
Editar `shortcuts` en `manifest.json`:
```json
{
  "name": "Nueva Función",
  "url": "/nueva-funcion",
  "icons": [...]
}
```

### Modificar estrategias de caché:
Editar `apps/web/public/sw.js` en la sección de fetch handlers.

---

**¡Listo!** Tu PWA está completamente configurada. Solo falta colocar el ícono y generar las versiones. 🎉

