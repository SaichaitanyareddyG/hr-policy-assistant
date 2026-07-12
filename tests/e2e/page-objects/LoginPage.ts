/**
 * Login Page Object Model
 * 
 * Encapsulates all interactions with the login page following
 * Playwright best practices for maintainable E2E tests.
 */

import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Using data-testid for reliable element selection
    this.emailInput = page.getByTestId('auth-email-input');
    this.passwordInput = page.getByTestId('auth-password-input');
    this.submitButton = page.getByTestId('auth-submit-button');
    this.errorMessage = page.getByTestId('auth-error-message');
    this.registerLink = page.getByRole('link', { name: /sign up|register/i });
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Login with provided credentials
   * @param email User email
   * @param password User password
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    
    // Use Promise.all to wait for navigation
    await Promise.all([
      this.page.waitForURL(/\/(employee|admin)/, { timeout: 15000 }),
      this.submitButton.click(),
    ]);
  }

  /**
   * Attempt login without waiting for navigation (for negative tests)
   */
  async attemptLogin(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Get the error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Check if error message is visible
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Navigate to register page
   */
  async goToRegister() {
    await this.registerLink.click();
    await this.page.waitForURL(/register/);
  }
}
