// Database Connection Test Script
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Database Connection Test\n');
console.log('=' .repeat(50));

// Check environment variables
console.log('\n1. Environment Variables Check:');
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Missing required environment variables!');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test database connection
async function testConnection() {
  try {
    console.log('\n2. Testing Database Connection...');
    
    // Test 1: Check organizations table
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, created_at')
      .limit(5);

    if (orgError) {
      console.log('   ❌ Organizations table:', orgError.message);
      return false;
    }
    console.log(`   ✅ Organizations: ${orgs?.length || 0} records found`);

    // Test 2: Check profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(5);

    if (profileError) {
      console.log('   ❌ Profiles table:', profileError.message);
      return false;
    }
    console.log(`   ✅ Profiles: ${profiles?.length || 0} records found`);

    // Test 3: Check auth users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('   ❌ Auth users:', authError.message);
      return false;
    }
    console.log(`   ✅ Auth Users: ${users?.length || 0} users found`);

    // Test 4: Check if test users exist
    console.log('\n3. Checking Test Users:');
    const testEmails = ['test.admin@policyai.test', 'test.employee@policyai.test'];
    
    for (const email of testEmails) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, role, full_name')
        .eq('email', email)
        .single();

      if (profile) {
        console.log(`   ✅ ${email}: ${profile.role} (${profile.full_name})`);
      } else {
        console.log(`   ⚠️  ${email}: Not found`);
      }
    }

    // Test 5: Check storage bucket
    console.log('\n4. Checking Storage:');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('   ❌ Storage:', bucketError.message);
    } else {
      const policyBucket = buckets?.find(b => b.name === 'policy-documents');
      if (policyBucket) {
        console.log(`   ✅ policy-documents bucket: ${policyBucket.public ? 'PUBLIC ⚠️' : 'PRIVATE ✅'}`);
      } else {
        console.log('   ⚠️  policy-documents bucket not found');
      }
    }

    // Test 6: Check policy_documents table
    console.log('\n5. Checking Policy Documents:');
    const { data: docs, error: docsError } = await supabase
      .from('policy_documents')
      .select('id, title, org_id')
      .limit(5);

    if (docsError) {
      console.log('   ❌ Policy documents:', docsError.message);
    } else {
      console.log(`   ✅ Policy Documents: ${docs?.length || 0} records found`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Database connection successful!\n');
    return true;

  } catch (error) {
    console.log('\n❌ Connection test failed:', error);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
