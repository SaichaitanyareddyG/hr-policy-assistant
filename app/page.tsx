/**
 * Landing Page
 * 
 * Public-facing homepage for PolicyPal AI
 * Redirects authenticated users to their dashboard
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { CTASection } from '@/components/landing/CTASection';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users to their dashboard
  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // If profile query succeeds, redirect based on role
    const p = profile as any;
    if (!error && profile) {
      if (p.role === 'ORG_ADMIN' || p.role === 'DEPARTMENT_ADMIN') {
        redirect('/admin');
      } else {
        redirect('/employee');
      }
    }
    // If profile query fails, just show landing page (no redirect)
  }

  // Show landing page to non-authenticated users
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <ProductPreview />
        <SecuritySection />
        <CTASection />
      </main>
      <PublicFooter />
    </div>
  );
}
