/**
 * Authentication Feature Tests
 * 
 * Tests authentication flows using Page Object Model pattern
 * and data-testid selectors following Playwright best practices.
 * 
 * @see https://playwright.dev/docs/pom
 * @see https://playwright.dev/docs/best-practices
 */

import { test, expect } from '../fixtures';
import { TEST_USERS } from '../helpers/test-utils';

test.describe('Authentication', () => {
  test('should load homepage successfully', async ({ homePage }) => {
    await homePage.goto();
    
    // Check page title
    await expect(homePage.page).toHaveTitle(/PolicyAI|HR Policy/i);
    
    // Check for CTA buttons (using .first() for multiple matches)
    const ctaButton = homePage.page.getByRole('link', { name: /get started|sign in|login/i }).first();
    await expect(ctaButton).toBeVisible();
  });

  test('should navigate to login page from homepage', async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.goToLogin();
    
    // Should be on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should show error for invalid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    
    // Attempt login with invalid credentials
    await loginPage.attemptLogin('invalid@test.com', 'wrongpassword');
    
    // Should show error message
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 5000 });
    const errorText = await loginPage.getErrorMessage();
    expect(errorText.toLowerCase()).toContain('invalid');
  });

  test('should successfully login as employee', async ({ loginPage, employeeDashboard }) => {
    await loginPage.goto();
    
    // Login with employee credentials
    await loginPage.login(TEST_USERS.employee.email, TEST_USERS.employee.password);
    
    // Should redirect to employee dashboard
    await expect(employeeDashboard.page).toHaveURL(/.*employee/, { timeout: 15000 });
    
    // Verify we're on the employee page (primary goal of auth test)
    const isOnDashboard = await employeeDashboard.isOnDashboard();
    expect(isOnDashboard).toBe(true);
  });

  test('should successfully login as admin', async ({ loginPage, adminDashboard }) => {
    await loginPage.goto();
    
    // Login with admin credentials
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    // Should redirect to admin dashboard
    await expect(adminDashboard.page).toHaveURL(/.*admin/, { timeout: 15000 });
    
    // Verify we're on the admin page (primary goal of auth test)
    const isOnDashboard = await adminDashboard.isOnDashboard();
    expect(isOnDashboard).toBe(true);
  });

  test.skip('should navigate to register page', async ({ homePage, page }) => {
    await homePage.goto();
    
    // Look for register/signup link
    const registerLink = page.getByRole('link', { name: /sign up|register|create account/i }).first();
    await registerLink.click();
    
    // Should navigate to register page
    await expect(page).toHaveURL(/register|signup/);
  });
});
