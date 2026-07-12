/**
 * Direct Profile Creation - Bypass issues
 */

require('dotenv').config({ path: '.env.test' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const profiles = [
  {
    id: '8050157d-e8e0-4ab3-a71d-64aaf64b1a3f',
    email: 'test.admin@policyai.test',
    role: 'ORG_ADMIN',
    full_name: 'Test Admin',
    org_id: null,
  },
  {
    id: 'dce3b201-721a-4bf4-804c-45714247997c',
    email: 'test.employee@policyai.test',
    role: 'EMPLOYEE',
    full_name: 'Test Employee',
    org_id: null,
  },
];

async function insertProfiles() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('📝 Inserting profiles directly...\n');

  for (const profile of profiles) {
    console.log(`Inserting: ${profile.email}`);
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select();

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log(`   Details: ${JSON.stringify(error)}`);
    } else {
      console.log(`✅ Success!`);
      if (data) console.log(`   Data: ${JSON.stringify(data)}`);
    }
    console.log('');
  }

  // Verify
  console.log('\n🔍 Verifying profiles...\n');
  for (const profile of profiles) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.id)
      .single();

    if (error) {
      console.log(`❌ ${profile.email}: ${error.message}`);
    } else {
      console.log(`✅ ${profile.email}`);
      console.log(`   Role: ${data.role}`);
      console.log(`   Name: ${data.full_name}`);
    }
  }
}

insertProfiles().catch(console.error);
