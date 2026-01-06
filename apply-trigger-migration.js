const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic .env.local parser
function loadEnv() {
  try {
    const envPath = path.join(__dirname, 'apps/web/.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length === 2) {
          process.env[parts[0].trim()] = parts[1].trim();
        }
      });
    }
  } catch (e) {
    console.error('Error loading env:', e);
  }
}

async function applyMigration() {
  loadEnv();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const migrationPath = path.join(__dirname, 'supabase/migrations/20260106000013_update_ai_review_trigger_logic.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying migration: update_ai_review_trigger_logic...');
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error applying migration:', error);
  } else {
    console.log('Migration applied successfully!');
  }
}

applyMigration();
