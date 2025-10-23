/**
 * Script para generar íconos PWA en múltiples tamaños
 * Requiere: npm install sharp --save-dev
 * 
 * Uso: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_ICON = path.join(__dirname, '../public/icons/icon-base.png');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Tamaños necesarios para PWA
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' }, // Apple
];

// Tamaños para favicon
const FAVICON_SIZES = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
];

async function generateIcons() {
  // Crear directorio si no existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🎨 Generando íconos PWA...\n');

  try {
    // Generar íconos PWA
    for (const { size, name } of ICON_SIZES) {
      const outputPath = path.join(OUTPUT_DIR, name);
      await sharp(INPUT_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 128, g: 0, b: 57, alpha: 1 } // #800039
        })
        .png()
        .toFile(outputPath);
      console.log(`✅ Generado: ${name} (${size}x${size})`);
    }

    // Generar favicons
    for (const { size, name } of FAVICON_SIZES) {
      const outputPath = path.join(OUTPUT_DIR, name);
      await sharp(INPUT_ICON)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✅ Generado: ${name} (${size}x${size})`);
    }

    // Copiar favicon-32x32.png como favicon.ico (simplificado)
    const favicon32Path = path.join(OUTPUT_DIR, 'favicon-32x32.png');
    const faviconPath = path.join(__dirname, '../public/favicon.ico');
    fs.copyFileSync(favicon32Path, faviconPath);
    console.log('✅ Generado: favicon.ico');

    console.log('\n🎉 ¡Todos los íconos generados exitosamente!');
    console.log(`📁 Ubicación: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('❌ Error generando íconos:', error);
    process.exit(1);
  }
}

// Verificar que existe el ícono base
if (!fs.existsSync(INPUT_ICON)) {
  console.error('❌ Error: No se encontró el ícono base en:', INPUT_ICON);
  console.log('📝 Por favor, coloca tu ícono base como: public/icons/icon-base.png');
  process.exit(1);
}

generateIcons();

