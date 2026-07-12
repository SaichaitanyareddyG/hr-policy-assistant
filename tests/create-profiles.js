/**
 * Create User Profiles in users table
 * The auth users exist but profiles are missing
 */

require('dotenv').config({ path: '.env.test' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const profiles = [
  {
    id: '8050157d-e8e0-4ab3-a71d-64aaf64b1a3f', // admin
    email: 'test.admin@policyai.test',
    role: 'admin',
    full_name: 'Test Admin',
    onboarding_completed: true,
  },
  {
    id: 'dce3b201-721a-4bf4-804c-45714247997c', // employee
    email: 'test.employee@policyai.test',
    role: 'employee',
    full_name: 'Test Employee',
    onboarding_completed: true,
  },
];

async function createProfiles() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('📝 Creating user profiles...\n');

  // Try using RPC or direct SQL
  for (const profile of profiles) {
    console.log(`Creating profile for: ${profile.email}`);
    
    // Try upsert with service role
    const { data, error } = await supabase
      .from('users')
      .upsert(profile, { onConflict: 'id' })
      .select();

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Details: ${JSON.stringify(error.details)}`);
      
      // Try direct SQL as fallback
      console.log(`   Trying SQL insert...`);
      const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO users (id, email, role, full_name, onboarding_completed)
          VALUES (
            '${profile.id}',
            '${profile.email}',
            '${profile.role}',
            '${profile.full_name}',
            ${profile.onboarding_completed}
          )
          ON CONFLICT (id) DO UPDATE
          SET role = EXCLUDED.role, 
              full_name = EXCLUDED.full_name,
              onboarding_completed = EXCLUDED.onboarding_completed;
        `
      });
      
      if (sqlError) {
        console.log(`   ❌ SQL also failed: ${sqlError.message}`);
      } else {
        console.log(`   ✅ SQL insert successful`);
      }
    } else {
      console.log(`✅ Profile created successfully`);
      console.log(`   Data: ${JSON.stringify(data)}`);
    }
    console.log('');
  }

  // Verify
  console.log('🔍 Verifying profiles...\n');
  for (const profile of profiles) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', profile.id)
      .single();

    if (error) {
      console.log(`❌ ${profile.email}: ${error.message}`);
    } else {
      console.log(`✅ ${profile.email}: Role = ${data.role}`);
    }
  }
}

createProfiles().catch(console.error);
