import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmployeeVisiblePolicies } from '@/lib/documents/queries';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch visible policies
    const policies = await getEmployeeVisiblePolicies(profile);

    return NextResponse.json({ policies });
  } catch (error) {
    console.error('Error in /api/employee/policies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
