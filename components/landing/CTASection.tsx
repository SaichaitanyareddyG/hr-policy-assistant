/**
 * CTA Section Component
 * 
 * Final call-to-action before footer
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Ready to give your employees instant policy answers?
        </h2>
        <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
          Get started in minutes. Upload your first policy document and see how PolicyPal AI can help your team.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            asChild
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8"
          >
            <Link href="/register">
              Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8"
          >
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        <p className="text-sm text-blue-200 mt-6">
          No credit card required • Self-hosted • Zero-cost start
        </p>
      </div>
    </section>
  );
}
