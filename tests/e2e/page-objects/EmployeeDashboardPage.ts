/**
 * Employee Dashboard Page Object Model
 * 
 * Encapsulates all interactions with the employee dashboard
 * following Playwright best practices.
 */

import { Page, Locator } from '@playwright/test';

export class EmployeeDashboardPage {
  readonly page: Page;
  readonly chatNav: Locator;
  readonly policiesNav: Locator;
  readonly clarificationsNav: Locator;
  readonly helpNav: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Using data-testid for navigation items
    this.chatNav = page.getByTestId('nav-ask-policy-ai');
    this.policiesNav = page.getByTestId('nav-browse-policies');
    this.clarificationsNav = page.getByTestId('nav-my-clarifications');
    this.helpNav = page.getByTestId('nav-help-contact');
  }

  /**
   * Navigate to employee dashboard
   */
  async goto() {
    await this.page.goto('/employee');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to chat page
   */
  async goToChat() {
    await this.chatNav.click();
    await this.page.waitForURL(/\/employee\/chat/);
  }

  /**
   * Navigate to policies page
   */
  async goToPolicies() {
    await this.policiesNav.click();
    await this.page.waitForURL(/\/employee\/policies/);
  }

  /**
   * Navigate to clarifications page
   */
  async goToClarifications() {
    await this.clarificationsNav.click();
    await this.page.waitForURL(/\/employee\/clarifications/);
  }

  /**
   * Navigate to help page
   */
  async goToHelp() {
    await this.helpNav.click();
    await this.page.waitForURL(/\/employee\/help/);
  }

  /**
   * Check if on employee dashboard
   */
  async isOnDashboard(): Promise<boolean> {
    return this.page.url().includes('/employee');
  }

  /**
   * Get current page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }
}
