# Íconos PWA - TuPatrimonio Web App

Este directorio contiene todos los íconos necesarios para la Progressive Web App.

## Generar Íconos

### Paso 1: Colocar Ícono Base
Coloca el ícono base de TuPatrimonio (el archivo PNG circular con el logo) en esta carpeta con el nombre:
```
icon-base.png
```

**Requisitos del ícono base:**
- Formato: PNG
- Dimensiones recomendadas: 512x512px o mayor
- Fondo transparente o con el color brand (#800039)

### Paso 2: Instalar Dependencias
Si aún no has instalado `sharp`, ejecuta:
```bash
npm install sharp --save-dev
```

### Paso 3: Ejecutar Script de Generación
Desde la raíz del proyecto web, ejecuta:
```bash
node scripts/generate-icons.js
```

Esto generará automáticamente todos los íconos en los siguientes tamaños:

## Íconos Generados

### PWA Icons
- `icon-72x72.png` - Splash screen (iOS)
- `icon-96x96.png` - Android
- `icon-128x128.png` - Android, Chrome
- `icon-144x144.png` - Windows tiles
- `icon-152x152.png` - iPad
- `icon-192x192.png` - Android home screen
- `icon-384x384.png` - Android splash
- `icon-512x512.png` - Splash screen

### Apple Touch Icon
- `apple-touch-icon.png` - 180x180px para iOS

### Favicons
- `favicon-16x16.png` - Pestaña del navegador
- `favicon-32x32.png` - Pestaña del navegador
- `favicon.ico` - Copiado desde favicon-32x32.png

## Verificación

Después de generar los íconos, verifica que este directorio contenga:
- [ ] icon-base.png (original)
- [ ] Todos los icon-*.png (8 archivos)
- [ ] apple-touch-icon.png
- [ ] favicon-16x16.png
- [ ] favicon-32x32.png
- [ ] Un favicon.ico en `apps/web/public/`

## Manifest.json

Los íconos están configurados en `/public/manifest.json`. No necesitas modificar el manifest después de generar los íconos.

## Troubleshooting

### Error: "Cannot find module 'sharp'"
```bash
cd apps/web
npm install sharp --save-dev
```

### Error: "icon-base.png not found"
Asegúrate de colocar tu ícono base en `apps/web/public/icons/icon-base.png`

### Íconos con fondo incorrecto
Edita el script `generate-icons.js` y modifica el color de background en la línea que dice:
```javascript
background: { r: 128, g: 0, b: 57, alpha: 1 } // #800039
```

