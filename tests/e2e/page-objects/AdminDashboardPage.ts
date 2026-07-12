/**
 * Admin Dashboard Page Object Model
 * 
 * Encapsulates all interactions with the admin dashboard
 * following Playwright best practices.
 */

import { Page, Locator } from '@playwright/test';

export class AdminDashboardPage {
  readonly page: Page;
  readonly dashboardNav: Locator;
  readonly documentsNav: Locator;
  readonly usersNav: Locator;
  readonly employeesNav: Locator;
  readonly approvedFaqsNav: Locator;
  readonly analyticsNav: Locator;
  readonly clarificationsNav: Locator;
  readonly auditLogsNav: Locator;
  readonly securityNav: Locator;
  readonly settingsNav: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Using data-testid for navigation items
    this.dashboardNav = page.getByTestId('nav-dashboard');
    this.documentsNav = page.getByTestId('nav-documents');
    this.usersNav = page.getByTestId('nav-users');
    this.employeesNav = page.getByTestId('nav-employees');
    this.approvedFaqsNav = page.getByTestId('nav-approved-faqs');
    this.analyticsNav = page.getByTestId('nav-analytics');
    this.clarificationsNav = page.getByTestId('nav-clarifications');
    this.auditLogsNav = page.getByTestId('nav-audit-logs');
    this.securityNav = page.getByTestId('nav-security');
    this.settingsNav = page.getByTestId('nav-settings');
  }

  /**
   * Navigate to admin dashboard
   */
  async goto() {
    await this.page.goto('/admin');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to documents page
   */
  async goToDocuments() {
    await this.documentsNav.click();
    await this.page.waitForURL(/\/admin\/documents/);
  }

  /**
   * Navigate to users page
   */
  async goToUsers() {
    await this.usersNav.click();
    await this.page.waitForURL(/\/admin\/users/);
  }

  /**
   * Navigate to employees page
   */
  async goToEmployees() {
    await this.employeesNav.click();
    await this.page.waitForURL(/\/admin\/employees/);
  }

  /**
   * Navigate to approved FAQs page
   */
  async goToApprovedFaqs() {
    await this.approvedFaqsNav.click();
    await this.page.waitForURL(/\/admin\/approved-faqs/);
  }

  /**
   * Navigate to analytics page
   */
  async goToAnalytics() {
    await this.analyticsNav.click();
    await this.page.waitForURL(/\/admin\/analytics/);
  }

  /**
   * Navigate to clarifications page
   */
  async goToClarifications() {
    await this.clarificationsNav.click();
    await this.page.waitForURL(/\/admin\/clarifications/);
  }

  /**
   * Navigate to audit logs page
   */
  async goToAuditLogs() {
    await this.auditLogsNav.click();
    await this.page.waitForURL(/\/admin\/audit-logs/);
  }

  /**
   * Navigate to security page
   */
  async goToSecurity() {
    await this.securityNav.click();
    await this.page.waitForURL(/\/admin\/security/);
  }

  /**
   * Navigate to settings page
   */
  async goToSettings() {
    await this.settingsNav.click();
    await this.page.waitForURL(/\/admin\/settings/);
  }

  /**
   * Check if on admin dashboard
   */
  async isOnDashboard(): Promise<boolean> {
    return this.page.url().includes('/admin');
  }

  /**
   * Get current page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }
}
