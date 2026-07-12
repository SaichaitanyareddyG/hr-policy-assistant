/**
 * Home Page Object Model
 * 
 * Encapsulates interactions with the homepage/landing page
 */

import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly getStartedButton: Locator;
  readonly signInButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Using flexible selectors for landing page CTAs
    this.getStartedButton = page.getByRole('link', { name: /get started/i });
    this.signInButton = page.getByRole('link', { name: /sign in/i });
    this.loginLink = page.getByRole('link', { name: /login/i });
  }

  /**
   * Navigate to homepage
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click "Get Started" button
   */
  async clickGetStarted() {
    const button = await this.getStartedButton.first();
    await button.click();
  }

  /**
   * Click "Sign In" button
   */
  async clickSignIn() {
    const button = await this.signInButton.first();
    await button.click();
  }

  /**
   * Navigate to login page
   */
  async goToLogin() {
    // Try multiple selectors for login
    const loginButton = await this.page.getByRole('link', { name: /login|sign in/i }).first();
    await loginButton.click();
    await this.page.waitForURL(/login/);
  }

  /**
   * Check if on homepage
   */
  async isOnHomepage(): Promise<boolean> {
    return this.page.url() === new URL('/', this.page.url()).href || 
           this.page.url().endsWith('/');
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }
}
