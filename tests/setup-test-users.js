/**
 * Setup Test Users in Supabase
 * Run this script once to create test users for E2E testing
 * 
 * Usage: node tests/setup-test-users.js
 */

require('dotenv').config({ path: '.env.test' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const testUsers = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'test.admin@policyai.test',
    password: process.env.TEST_ADMIN_PASSWORD || 'TestAdmin123!@#Secure',
    role: 'ORG_ADMIN',
    full_name: 'Test Admin',
  },
  employee: {
    email: process.env.TEST_EMPLOYEE_EMAIL || 'test.employee@policyai.test',
    password: process.env.TEST_EMPLOYEE_PASSWORD || 'TestEmployee123!@#Secure',
    role: 'EMPLOYEE',
    full_name: 'Test Employee',
  },
};

async function setupTestUsers() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.test');
    process.exit(1);
  }

  console.log('🔧 Setting up test users in Supabase...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  for (const [userType, userData] of Object.entries(testUsers)) {
    console.log(`📝 Creating ${userType}: ${userData.email}`);

    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(u => u.email === userData.email);

      if (userExists) {
        console.log(`   ⚠️  User already exists, skipping...`);
        
        // Update user profile to ensure role is correct
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const user = users?.find(u => u.email === userData.email);
        
        if (user) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: userData.role, full_name: userData.full_name })
            .eq('id', user.id);

          if (updateError && updateError.code !== 'PGRST116') { // Ignore not found
            console.log(`   ⚠️  Could not update profile: ${updateError.message}`);
          } else {
            console.log(`   ✅ Profile role updated to: ${userData.role}`);
          }
        }
        continue;
      }

      // Create new user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email for test users
        user_metadata: {
          full_name: userData.full_name,
        },
      });

      if (authError) {
        console.error(`   ❌ Auth error: ${authError.message}`);
        continue;
      }

      console.log(`   ✅ Auth user created: ${authData.user.id}`);

      // Create or update user profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: userData.email,
          role: userData.role,
          full_name: userData.full_name,
          org_id: null, // Set to null for test users
        });

      if (profileError) {
        console.error(`   ⚠️  Profile error: ${profileError.message}`);
      } else {
        console.log(`   ✅ User profile created with role: ${userData.role}`);
      }

      console.log('');
    } catch (error) {
      console.error(`   ❌ Error creating ${userType}:`, error.message);
      console.log('');
    }
  }

  console.log('✨ Test user setup complete!\n');
  console.log('📋 Test Credentials:');
  console.log('─────────────────────────────────────────────');
  console.log('Admin:');
  console.log(`  Email:    ${testUsers.admin.email}`);
  console.log(`  Password: ${testUsers.admin.password}`);
  console.log(`  Role:     ${testUsers.admin.role}`);
  console.log('');
  console.log('Employee:');
  console.log(`  Email:    ${testUsers.employee.email}`);
  console.log(`  Password: ${testUsers.employee.password}`);
  console.log(`  Role:     ${testUsers.employee.role}`);
  console.log('─────────────────────────────────────────────\n');
  console.log('🚀 Ready to run tests: npm run test:e2e\n');
}

setupTestUsers().catch(console.error);
