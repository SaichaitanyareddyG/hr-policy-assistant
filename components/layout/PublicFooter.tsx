/**
 * Public Footer Component
 * 
 * Footer for landing page and public routes
 */

import Link from 'next/link';
import { Bot } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PolicyPal AI</span>
            </Link>
            <p className="text-sm text-gray-600 mb-4 max-w-md">
              Policy answers for employees, without bothering HR. Upload policies, let
              employees ask questions, and track what they need.
            </p>
            <p className="text-xs text-gray-500">
              Built for internal HR teams and their employees.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">
                  How it works
                </a>
              </li>
              <li>
                <a href="#security" className="text-sm text-gray-600 hover:text-gray-900">
                  Security
                </a>
              </li>
            </ul>
          </div>

          {/* Use Cases */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Use Cases</h3>
            <ul className="space-y-3">
              <li className="text-sm text-gray-600">HR Policy Management</li>
              <li className="text-sm text-gray-600">Employee Self-Service</li>
              <li className="text-sm text-gray-600">Policy Analytics</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              © 2026 PolicyPal AI. Built for internal use. Data stays in your Supabase instance.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-gray-500 hover:text-gray-900">
                Privacy
              </a>
              <a href="#" className="text-xs text-gray-500 hover:text-gray-900">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
