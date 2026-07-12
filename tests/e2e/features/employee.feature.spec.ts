/**
 * Employee Dashboard Feature Tests
 * 
 * Tests employee dashboard functionality using Page Object Model
 * and data-testid selectors following Playwright best practices.
 */

import { test, expect } from '../fixtures';
import { TEST_USERS } from '../helpers/test-utils';

test.describe('Employee Dashboard', () => {
  // Login before each test
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.employee.email, TEST_USERS.employee.password);
  });

  test('should display employee dashboard', async ({ employeeDashboard }) => {
    // Should be on employee dashboard
    await expect(employeeDashboard.page).toHaveURL(/\/employee/);
    
    // Should see navigation items
    await expect(employeeDashboard.chatNav).toBeVisible();
    await expect(employeeDashboard.policiesNav).toBeVisible();
  });

  test('should navigate to chat page', async ({ employeeDashboard }) => {
    await employeeDashboard.goToChat();
    
    // Should be on chat page
    await expect(employeeDashboard.page).toHaveURL(/\/employee\/chat/);
  });

  test('should navigate to policies page', async ({ employeeDashboard }) => {
    await employeeDashboard.goToPolicies();
    
    // Should be on policies page
    await expect(employeeDashboard.page).toHaveURL(/\/employee\/policies/);
  });

  test('should navigate to clarifications page', async ({ employeeDashboard }) => {
    await employeeDashboard.goToClarifications();
    
    // Should be on clarifications page
    await expect(employeeDashboard.page).toHaveURL(/\/employee\/clarifications/);
  });

  test('should navigate to help page', async ({ employeeDashboard }) => {
    await employeeDashboard.goToHelp();
    
    // Should be on help page
    await expect(employeeDashboard.page).toHaveURL(/\/employee\/help/);
  });
});
