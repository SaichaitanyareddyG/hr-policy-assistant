/**
 * Admin Dashboard Feature Tests
 * 
 * Tests admin dashboard functionality using Page Object Model
 * and data-testid selectors following Playwright best practices.
 */

import { test, expect } from '../fixtures';
import { TEST_USERS } from '../helpers/test-utils';

test.describe('Admin Dashboard', () => {
  // Login before each test
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test('should display admin dashboard', async ({ adminDashboard }) => {
    // Should be on admin dashboard
    await expect(adminDashboard.page).toHaveURL(/\/admin$/);
    
    // Should see navigation items
    await expect(adminDashboard.dashboardNav).toBeVisible();
    await expect(adminDashboard.documentsNav).toBeVisible();
  });

  test('should navigate to analytics page', async ({ adminDashboard }) => {
    await adminDashboard.goToAnalytics();
    
    // Should be on analytics page
    await expect(adminDashboard.page).toHaveURL(/\/admin\/analytics/);
  });

  test('should navigate to documents page', async ({ adminDashboard }) => {
    await adminDashboard.goToDocuments();
    
    // Should be on documents page
    await expect(adminDashboard.page).toHaveURL(/\/admin\/documents/);
  });

  test('should navigate to users page', async ({ adminDashboard }) => {
    await adminDashboard.goToUsers();
    
    // Should be on users page
    await expect(adminDashboard.page).toHaveURL(/\/admin\/users/);
  });

  test('should navigate to employees page', async ({ adminDashboard }) => {
    await adminDashboard.goToEmployees();
    
    // Should be on employees page
    await expect(adminDashboard.page).toHaveURL(/\/admin\/employees/);
  });

  test('should access audit logs', async ({ adminDashboard }) => {
    await adminDashboard.goToAuditLogs();
    
    // Should be on audit logs page
    await expect(adminDashboard.page).toHaveURL(/\/admin\/audit-logs/);
  });

  test('should access approved FAQs page', async ({ adminDashboard }) => {
    await adminDashboard.goToApprovedFaqs();
    
    // Should be on approved FAQs page
    await expect(adminDashboard.page).toHaveURL(/\/admin\/approved-faqs/);
  });

  test('should access clarifications page', async ({ adminDashboard }) => {
    await adminDashboard.goToClarifications();
    
    // Should be on clarifications page
    await expect(adminDashboard.page).toHaveURL(/\/admin\/clarifications/);
  });

  test('should access security page', async ({ adminDashboard }) => {
    await adminDashboard.goToSecurity();
    
    // Should be on security page
    await expect(adminDashboard.page).toHaveURL(/\/admin\/security/);
  });

  test('should access settings page', async ({ adminDashboard }) => {
    await adminDashboard.goToSettings();
    
    // Should be on settings page
    await expect(adminDashboard.page).toHaveURL(/\/admin\/settings/);
  });
});
