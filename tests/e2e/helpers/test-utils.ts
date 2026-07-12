import { Page, expect } from '@playwright/test';

/**
 * Test user credentials
 * Loaded from .env.test file (not committed to git)
 */
export const TEST_USERS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'test.admin@policyai.test',
    password: process.env.TEST_ADMIN_PASSWORD || 'TestAdmin123!@#Secure',
  },
  employee: {
    email: process.env.TEST_EMPLOYEE_EMAIL || 'test.employee@policyai.test', 
    password: process.env.TEST_EMPLOYEE_PASSWORD || 'TestEmployee123!@#Secure',
  },
};

/**
 * Login helper for tests
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_USERS.admin.email);
  await page.fill('input[type="password"]', TEST_USERS.admin.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to admin dashboard
  await page.waitForURL('/admin', { timeout: 10000 });
}

/**
 * Login helper for employee
 */
export async function loginAsEmployee(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_USERS.employee.email);
  await page.fill('input[type="password"]', TEST_USERS.employee.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to employee dashboard
  await page.waitForURL('/employee', { timeout: 10000 });
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  // Click user menu button
  await page.click('[aria-label="User menu"]');
  
  // Click logout button
  await page.click('text=Logout');
  
  // Wait for redirect to login
  await page.waitForURL('/login', { timeout: 5000 });
}

/**
 * Wait for element with timeout
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { timeout, state: 'visible' });
}

/**
 * Check if user is on login page
 */
export async function isOnLoginPage(page: Page): Promise<boolean> {
  return page.url().includes('/login');
}

/**
 * Check for toast/notification message
 */
export async function expectToast(page: Page, message: string) {
  const toast = page.locator('[role="status"], [role="alert"]', { hasText: message });
  await expect(toast).toBeVisible({ timeout: 5000 });
}
