/**
 * Script de prueba para el servicio de facturación externa
 * 
 * Uso:
 *   node scripts/test-invoicing.js <email> <password>
 * 
 * O configura las variables de entorno:
 *   INVOICING_TEST_EMAIL=tu@email.com
 *   INVOICING_TEST_PASSWORD=tu-password
 *   INVOICING_BASE_URL=http://localhost:3000
 */

const BASE_URL = process.env.INVOICING_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.argv[2] || process.env.INVOICING_TEST_EMAIL;
const TEST_PASSWORD = process.argv[3] || process.env.INVOICING_TEST_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('❌ Error: Debes proporcionar email y password');
  console.log('\nUso:');
  console.log('  node scripts/test-invoicing.js <email> <password>');
  console.log('\nO configura variables de entorno:');
  console.log('  INVOICING_TEST_EMAIL=tu@email.com');
  console.log('  INVOICING_TEST_PASSWORD=tu-password');
  process.exit(1);
}

async function testInvoicing() {
  console.log('🧪 Iniciando pruebas de facturación...\n');

  try {
    // 1. Obtener token de autenticación
    console.log('1️⃣ Autenticando...');
    const authResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });

    if (!authResponse.ok) {
      // Intentar con Supabase directamente
      console.log('   Intentando autenticación directa con Supabase...');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Variables de entorno de Supabase no configuradas');
      }

      const supabaseAuthResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      });

      if (!supabaseAuthResponse.ok) {
        const error = await supabaseAuthResponse.json();
        throw new Error(`Error de autenticación: ${error.error_description || error.message}`);
      }

      const authData = await supabaseAuthResponse.json();
      const token = authData.access_token;
      console.log('   ✅ Autenticado\n');

      // 2. Probar Factura Haulmer (Chile)
      console.log('2️⃣ Probando Factura Electrónica (Haulmer - Chile)...');
      const haulmerResponse = await fetch(`${BASE_URL}/api/invoicing/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer: {
            tax_id: '12345678-9',
            name: 'Cliente Test SPA',
            email: 'test@cliente.com',
            address: 'Av. Test 123',
            city: 'Santiago',
            country: 'CL',
            customer_type: 'empresa',
            giro: 'SERVICIOS',
          },
          document_type: 'factura_electronica',
          items: [
            {
              description: 'Servicio de prueba - Factura Haulmer',
              quantity: 1,
              unit_price: 10000,
              total: 10000,
              tax_exempt: false,
            },
          ],
          currency: 'CLP',
          send_email: false,
        }),
      });

      const haulmerData = await haulmerResponse.json();

      if (!haulmerResponse.ok) {
        console.error('   ❌ Error:', haulmerData.error);
      } else {
        console.log('   ✅ Factura creada exitosamente');
        console.log(`   📄 Número: ${haulmerData.document?.document_number}`);
        console.log(`   📊 Estado: ${haulmerData.document?.status}`);
        console.log(`   🔗 Proveedor: ${haulmerData.document?.provider}`);
        console.log(`   🆔 ID Externo: ${haulmerData.document?.external_id}`);
        if (haulmerData.document?.pdf_url) {
          console.log(`   📎 PDF: ${haulmerData.document.pdf_url}`);
        }
        if (haulmerData.document?.xml_url) {
          console.log(`   📎 XML: ${haulmerData.document.xml_url}`);
        }
      }

      console.log('');

      // 3. Probar Stripe Invoice (Internacional)
      console.log('3️⃣ Probando Stripe Invoice (Internacional)...');
      const stripeResponse = await fetch(`${BASE_URL}/api/invoicing/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer: {
            tax_id: 'TAX123456',
            name: 'International Client Inc',
            email: 'client@international.com',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            postal_code: '10001',
            country: 'US',
            customer_type: 'empresa',
          },
          document_type: 'stripe_invoice',
          items: [
            {
              description: 'Consulting Services - Stripe Invoice',
              quantity: 1,
              unit_price: 1000,
              total: 1000,
              tax_exempt: false,
            },
          ],
          currency: 'USD',
          send_email: false,
        }),
      });

      const stripeData = await stripeResponse.json();

      if (!stripeResponse.ok) {
        console.error('   ❌ Error:', stripeData.error);
      } else {
        console.log('   ✅ Invoice creado exitosamente');
        console.log(`   📄 Número: ${stripeData.document?.document_number}`);
        console.log(`   📊 Estado: ${stripeData.document?.status}`);
        console.log(`   🔗 Proveedor: ${stripeData.document?.provider}`);
        console.log(`   🆔 ID Externo: ${stripeData.document?.external_id}`);
        if (stripeData.document?.pdf_url) {
          console.log(`   📎 PDF: ${stripeData.document.pdf_url}`);
        }
      }

      console.log('\n✅ Pruebas completadas');

    } catch (error) {
      console.error('\n❌ Error en las pruebas:', error.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testInvoicing();

