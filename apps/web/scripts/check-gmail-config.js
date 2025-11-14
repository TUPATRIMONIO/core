/**
 * Script de verificación de configuración de Gmail
 * Verifica que las variables de entorno necesarias estén configuradas
 */

console.log('🔍 Verificando configuración de Gmail OAuth...\n');

const requiredVars = {
  'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
  'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL
};

let allConfigured = true;

Object.entries(requiredVars).forEach(([key, value]) => {
  if (!value) {
    console.log(`❌ ${key}: NO CONFIGURADO`);
    allConfigured = false;
  } else {
    const displayValue = key.includes('SECRET') 
      ? `${value.substring(0, 15)}...` 
      : value;
    console.log(`✅ ${key}: ${displayValue}`);
  }
});

console.log('\n' + '='.repeat(50));

if (allConfigured) {
  console.log('✅ ¡Todas las variables están configuradas!');
  console.log('\n📧 Callback URL esperado:');
  console.log(`   ${process.env.NEXT_PUBLIC_APP_URL}/api/crm/settings/gmail/callback`);
  console.log('\n⚠️  Asegúrate de que esta URL esté registrada en Google Cloud Console');
} else {
  console.log('❌ Faltan variables de entorno');
  console.log('\n📝 Agrega las siguientes variables a apps/web/.env.local:');
  console.log('\nGOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com');
  console.log('GOOGLE_CLIENT_SECRET=GOCSPX-tu-client-secret');
  console.log('NEXT_PUBLIC_APP_URL=http://localhost:3000');
}

console.log('='.repeat(50));

process.exit(allConfigured ? 0 : 1);

