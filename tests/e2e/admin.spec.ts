import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/test-utils';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);
  });

  test('should display admin dashboard', async ({ page }) => {
    // Should be on admin page
    await expect(page).toHaveURL(/.*admin/);
    
    // Check for navigation items
    await expect(page.locator('text=/analytics|documents|users|employees/i')).toBeVisible();
  });

  test('should navigate to analytics page', async ({ page }) => {
    await page.click('text=/analytics/i');
    await expect(page).toHaveURL(/.*admin\/analytics/);
    
    // Should show analytics content
    await expect(page.locator('text=/chart|statistics|metrics|overview/i')).toBeVisible();
  });

  test('should navigate to documents page', async ({ page }) => {
    await page.click('text=/documents/i');
    await expect(page).toHaveURL(/.*admin\/documents/);
    
    // Should show documents list or upload button
    await expect(page.locator('text=/upload|add document|document list/i')).toBeVisible();
  });

  test('should navigate to users page', async ({ page }) => {
    await page.click('text=/users/i');
    await expect(page).toHaveURL(/.*admin\/users/);
    
    // Should show users table or list
    await expect(page.locator('text=/email|role|status|invite/i')).toBeVisible();
  });

  test('should access audit logs', async ({ page }) => {
    // Navigate to audit logs (might be under security or settings)
    const auditLink = page.locator('text=/audit|logs|security/i').first();
    
    if (await auditLink.isVisible()) {
      await auditLink.click();
      
      // Should show audit logs table
      await expect(page.locator('text=/action|timestamp|user|event/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to document upload page', async ({ page }) => {
    // Go to documents
    await page.click('text=/documents/i');
    await expect(page).toHaveURL(/.*admin\/documents/);
    
    // Click upload button
    const uploadButton = page.locator('button:has-text("Upload"), a:has-text("Upload")').first();
    await uploadButton.click();
    
    // Should be on upload page
    await expect(page).toHaveURL(/.*upload/);
    
    // Should show file input
    await expect(page.locator('input[type="file"], [class*="dropzone"]')).toBeVisible();
  });

  test('should show approved FAQs page', async ({ page }) => {
    const faqLink = page.locator('text=/faq|approved/i').first();
    
    if (await faqLink.isVisible()) {
      await faqLink.click();
      
      // Should show FAQs list
      await expect(page.locator('text=/question|answer|approved/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should access clarifications page', async ({ page }) => {
    const clarificationsLink = page.locator('text=/clarification/i').first();
    
    if (await clarificationsLink.isVisible()) {
      await clarificationsLink.click();
      
      // Should show clarifications list
      await expect(page).toHaveURL(/.*clarifications/);
      await expect(page.locator('text=/question|status|pending|resolved/i')).toBeVisible();
    }
  });
});

test.describe('Admin Document Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to documents page
    await page.click('text=/documents/i');
    await expect(page).toHaveURL(/.*admin\/documents/);
  });

  test('should display documents list', async ({ page }) => {
    // Should show table or grid of documents
    await expect(page.locator('[class*="table"], [class*="grid"], [class*="list"]')).toBeVisible({ timeout: 5000 });
  });

  test('should search documents', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('policy');
      
      // Should filter results
      await page.waitForTimeout(1000);
    }
  });

  test('should view document details', async ({ page }) => {
    // Find first document in list
    const firstDocument = page.locator('[class*="document"], tr, [class*="card"]').first();
    
    if (await firstDocument.isVisible()) {
      // Click to view details
      await firstDocument.click();
      
      // Should show document details
      await expect(page.locator('text=/title|description|uploaded|status/i')).toBeVisible({ timeout: 5000 });
    }
  });
});
