/**
 * Signup Page - Redirect to Register
 * 
 * This page redirects to /register which uses the secure
 * invite-based registration system without role selection.
 */

import { redirect } from 'next/navigation';

export default function SignupPage() {
  // Redirect to /register for secure organization registration
  redirect('/register');
}
