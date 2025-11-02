#!/usr/bin/env node

/**
 * Script para sincronizar reseñas de Google Places API
 * Uso: node scripts/sync-google-reviews.js [--force]
 */

const https = require('https');

const LOCALHOST_URL = 'http://localhost:3001';
const args = process.argv.slice(2);
const forceSync = args.includes('--force');

const url = `${LOCALHOST_URL}/api/reviews/sync${forceSync ? '?force=true' : ''}`;

console.log('🚀 Iniciando sincronización de reseñas de Google...');
console.log(`📍 URL: ${url}`);
console.log(`⚡ Force sync: ${forceSync ? 'Sí' : 'No'}`);
console.log('');

// Hacer POST request
const urlObj = new URL(url);
const options = {
  hostname: urlObj.hostname,
  port: urlObj.port || 80,
  path: urlObj.pathname + urlObj.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = require('http').request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`\n📊 Status: ${res.statusCode}`);
    
    try {
      const result = JSON.parse(data);
      
      if (result.success) {
        console.log('✅ Sincronización exitosa!\n');
        
        if (result.skipped) {
          console.log('ℹ️  Sincronización omitida (última sync hace <24h)');
          if (result.last_sync) {
            console.log(`   Última sync: ${result.last_sync.sync_completed_at}`);
            console.log(`   Reseñas obtenidas: ${result.last_sync.reviews_fetched}`);
          }
          console.log('\n💡 Usa --force para forzar la sincronización');
        } else {
          console.log('📈 Estadísticas:');
          console.log(`   • Reseñas obtenidas: ${result.stats.reviews_fetched}`);
          console.log(`   • Nuevas: ${result.stats.reviews_new}`);
          console.log(`   • Actualizadas: ${result.stats.reviews_updated}`);
          console.log(`   • Omitidas (duplicadas): ${result.stats.reviews_skipped}`);
          console.log(`   • Duración: ${result.stats.duration_seconds}s`);
          
          if (result.google_rating) {
            console.log(`\n⭐ Rating de Google: ${result.google_rating}/5`);
            console.log(`📝 Total reseñas en Google: ${result.google_total_reviews}`);
          }
        }
      } else {
        console.error('❌ Error en la sincronización:');
        console.error(`   ${result.error}`);
        if (result.details) {
          console.error(`\n📋 Detalles:\n${result.details}`);
        }
        process.exit(1);
      }
    } catch (e) {
      console.error('❌ Error parseando respuesta:');
      console.error(data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Error en la petición: ${e.message}`);
  console.error('\n💡 Asegúrate de que el servidor esté corriendo:');
  console.error('   npm run dev');
  process.exit(1);
});

req.end();

