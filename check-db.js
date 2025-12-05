const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('=== Checking Emission Requests ===');
  const { data: requests, error: reqError } = await supabase
    .from('emission_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (reqError) {
    console.error('Error fetching emission_requests:', reqError);
  } else {
    console.log('Emission Requests:', JSON.stringify(requests, null, 2));
  }

  console.log('\n=== Checking Orders ===');
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .or('id.eq.3e96f36d-f727-4d1c-a66f-f30f9da247e7,order_number.ilike.%3e96f36d%')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (orderError) {
    console.error('Error fetching orders:', orderError);
  } else {
    console.log('Orders:', JSON.stringify(orders, null, 2));
  }

  console.log('\n=== Checking Documents ===');
  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (docError) {
    console.error('Error fetching documents:', docError);
  } else {
    console.log('Documents:', JSON.stringify(documents, null, 2));
  }

  console.log('\n=== Checking Invoicing Settings ===');
  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('*')
    .limit(5);
  
  if (settingsError) {
    console.error('Error fetching settings:', settingsError);
  } else {
    console.log('Settings:', JSON.stringify(settings, null, 2));
  }
}

checkDatabase().catch(console.error);

