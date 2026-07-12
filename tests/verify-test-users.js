/**
 * Verify Test Users Exist in Supabase
 */

require('dotenv').config({ path: '.env.test' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifyTestUsers() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('🔍 Checking test users in Supabase Auth...\n');

  const testEmails = [
    process.env.TEST_ADMIN_EMAIL || 'test.admin@policyai.test',
    process.env.TEST_EMPLOYEE_EMAIL || 'test.employee@policyai.test',
  ];

  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error listing users:', error.message);
    return;
  }

  console.log(`Found ${users.length} total users in Auth\n`);

  for (const email of testEmails) {
    const user = users.find(u => u.email === email);
    if (user) {
      console.log(`✅ ${email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      
      // Try to get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log(`   Profile: ❌ ${profileError.message}`);
      } else if (profile) {
        console.log(`   Profile: ✅ Role = ${profile.role}`);
      } else {
        console.log(`   Profile: ⚠️  Not found`);
      }
      console.log('');
    } else {
      console.log(`❌ ${email} - NOT FOUND\n`);
    }
  }

  // Test login
  console.log('🔐 Testing employee login...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: testEmails[1],
    password: process.env.TEST_EMPLOYEE_PASSWORD || 'TestEmployee123!@#Secure',
  });

  if (loginError) {
    console.log(`❌ Login failed: ${loginError.message}`);
  } else {
    console.log(`✅ Login successful! User ID: ${loginData.user.id}`);
  }
}

verifyTestUsers().catch(console.error);
