const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicons(inputFile, outputDir, appName) {
  console.log(`Generating favicons for ${appName}...`);
  
  // Crear directorio si no existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Leer la imagen original
  const image = sharp(inputFile);
  
  // Generar icon.png (32x32)
  await image
    .resize(32, 32)
    .png()
    .toFile(path.join(outputDir, 'icon.png'));
  console.log(`✓ Generated icon.png (32x32)`);
  
  // Generar apple-icon.png (180x180)
  await image
    .resize(180, 180)
    .png()
    .toFile(path.join(outputDir, 'apple-icon.png'));
  console.log(`✓ Generated apple-icon.png (180x180)`);
  
  // Generar favicon.ico (múltiples tamaños: 16x16, 32x32, 48x48)
  // Sharp no soporta ICO directamente, así que generamos PNGs y luego los convertimos
  const sizes = [16, 32, 48];
  const icoBuffers = [];
  
  for (const size of sizes) {
    const buffer = await sharp(inputFile)
      .resize(size, size)
      .png()
      .toBuffer();
    icoBuffers.push(buffer);
  }
  
  // Para favicon.ico, vamos a usar el tamaño 32x32 como base
  await sharp(inputFile)
    .resize(32, 32)
    .toFormat('png')
    .toFile(path.join(outputDir, 'favicon.ico'));
  console.log(`✓ Generated favicon.ico (32x32 as ICO)`);
  
  console.log(`\n✓ All favicons generated for ${appName} in ${outputDir}\n`);
}

async function main() {
  try {
    // Generar favicons para marketing app
    await generateFavicons(
      'marketing-logo.png',
      'apps/marketing/src/app',
      'Marketing App'
    );
    
    // Generar favicons para web app
    await generateFavicons(
      'web-logo.png',
      'apps/web/src/app',
      'Web App'
    );
    
    console.log('✓ All favicons generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Clean Next.js cache: rm -rf apps/marketing/.next apps/web/.next');
    console.log('2. Rebuild: npm run dev');
    console.log('3. Check favicons in browser');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

main();

