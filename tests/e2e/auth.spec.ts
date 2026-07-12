import { test, expect } from '@playwright/test';
import { TEST_USERS } from './helpers/test-utils';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/PolicyAI|HR Policy/i);
    
    // Check for key landing page elements
    await expect(page.locator('text=/get started|sign in|login/i')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // Click login/sign in button
    await page.click('text=/sign in|login/i');
    
    // Should be on login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation error for empty login', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    const errorMessage = page.locator('text=/required|enter your email|enter your password/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 3000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    const errorMessage = page.locator('text=/invalid|incorrect|failed/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login as employee', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in employee credentials
    await page.fill('input[type="email"]', TEST_USERS.employee.email);
    await page.fill('input[type="password"]', TEST_USERS.employee.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to employee dashboard
    await expect(page).toHaveURL(/.*employee/, { timeout: 10000 });
    
    // Should see employee dashboard elements
    await expect(page.locator('text=/chat|policies|help/i')).toBeVisible();
  });

  test('should successfully login as admin', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in admin credentials  
    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/.*admin/, { timeout: 10000 });
    
    // Should see admin dashboard elements
    await expect(page.locator('text=/analytics|documents|users/i')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    
    // Click register/sign up link
    const registerLink = page.locator('text=/sign up|register|create account/i');
    await registerLink.click();
    
    // Should be on register page
    await expect(page).toHaveURL(/.*register|signup/);
  });
});
