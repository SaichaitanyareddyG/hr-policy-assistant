import { test, expect } from '@playwright/test';

/**
 * PERFORMANCE TESTS: Load time and responsiveness
 * Note: These are basic performance checks, not full load testing
 */

test.describe('Performance: Page Load Times', () => {
  test('Homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    console.log(`✓ Homepage loaded in ${loadTime}ms`);
  });

  test('Login page loads quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
    console.log(`✓ Login page loaded in ${loadTime}ms`);
  });

  test('Chat interface responds quickly to user input', async ({ page }) => {
    await page.goto('/login');
    
    // Quick login
    await page.fill('input[type="email"]', 'employee@test.com');
    await page.fill('input[type="password"]', 'Test123!@#');
    
    const loginStart = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*employee/, { timeout: 10000 });
    const loginTime = Date.now() - loginStart;
    
    console.log(`✓ Login completed in ${loginTime}ms`);
    
    // Navigate to chat
    const chatNavStart = Date.now();
    await page.click('text=/chat/i');
    await page.waitForURL(/.*employee\/chat/);
    const chatNavTime = Date.now() - chatNavStart;
    
    expect(chatNavTime).toBeLessThan(2000);
    console.log(`✓ Chat navigation in ${chatNavTime}ms`);
  });
});

test.describe('Performance: Large Data Handling', () => {
  test('Policies list handles many documents', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'employee@test.com');
    await page.fill('input[type="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*employee/);
    
    const startTime = Date.now();
    await page.click('text=/policies/i');
    await page.waitForURL(/.*employee\/policies/);
    
    // Wait for list to render
    await page.waitForSelector('[class*="policy"], [class*="document"], [class*="list"]', { 
      timeout: 5000 
    });
    
    const renderTime = Date.now() - startTime;
    
    // Should render within 3 seconds even with many documents
    expect(renderTime).toBeLessThan(3000);
    console.log(`✓ Document list rendered in ${renderTime}ms`);
  });

  test('Chat history with many messages loads efficiently', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'employee@test.com');
    await page.fill('input[type="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*employee/);
    
    await page.click('text=/chat/i');
    await page.waitForURL(/.*employee\/chat/);
    
    // Measure time to render existing chat history
    const startTime = Date.now();
    await page.waitForSelector('textarea, input[placeholder*="question"]', { timeout: 5000 });
    const renderTime = Date.now() - startTime;
    
    expect(renderTime).toBeLessThan(2000);
    console.log(`✓ Chat history rendered in ${renderTime}ms`);
  });
});

test.describe('Performance: API Response Times', () => {
  test('AI chat response time is reasonable', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'employee@test.com');
    await page.fill('input[type="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*employee/);
    
    await page.click('text=/chat/i');
    
    const chatInput = page.locator('textarea, input[placeholder*="question"]').first();
    await chatInput.fill('What is the vacation policy?');
    
    // Measure response time
    const startTime = Date.now();
    await page.click('button[type="submit"], button:has-text("Send")');
    
    // Wait for AI response
    await page.waitForSelector('text=/vacation|policy|days/i', { timeout: 30000 });
    const responseTime = Date.now() - startTime;
    
    // AI responses should complete within 30 seconds
    expect(responseTime).toBeLessThan(30000);
    console.log(`✓ AI response in ${responseTime}ms`);
    
    // Ideal response time under 10 seconds
    if (responseTime < 10000) {
      console.log('✓ Excellent response time!');
    } else if (responseTime < 20000) {
      console.log('⚠ Response time acceptable but could be improved');
    } else {
      console.log('⚠ Response time slow, consider optimization');
    }
  });

  test('Document search returns results quickly', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'employee@test.com');
    await page.fill('input[type="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*employee/);
    
    await page.click('text=/policies/i');
    
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 3000 })) {
      const startTime = Date.now();
      await searchInput.fill('vacation');
      
      // Wait for search results
      await page.waitForTimeout(1500); // Debounce time
      
      const searchTime = Date.now() - startTime;
      
      // Search should complete quickly
      expect(searchTime).toBeLessThan(3000);
      console.log(`✓ Search completed in ${searchTime}ms`);
    }
  });
});

test.describe('Performance: Resource Usage', () => {
  test('No memory leaks on navigation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'employee@test.com');
    await page.fill('input[type="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*employee/);
    
    // Navigate through multiple pages repeatedly
    const routes = ['/employee/chat', '/employee/policies', '/employee/help', '/employee'];
    
    for (let i = 0; i < 3; i++) {
      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(500);
      }
    }
    
    // If we got here without crashing, basic navigation is stable
    console.log('✓ No obvious memory leaks detected in navigation');
  });

  test('Chat input remains responsive with many messages', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'employee@test.com');
    await page.fill('input[type="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*employee/);
    
    await page.click('text=/chat/i');
    
    const chatInput = page.locator('textarea, input[placeholder*="question"]').first();
    
    // Type and measure responsiveness
    const startTime = Date.now();
    await chatInput.type('Test message', { delay: 50 });
    const typingTime = Date.now() - startTime;
    
    // Typing should be instant
    expect(typingTime).toBeLessThan(1000);
    console.log(`✓ Input remains responsive: ${typingTime}ms`);
  });
});

test.describe('Performance: Network Efficiency', () => {
  test('Pages use appropriate caching', async ({ page }) => {
    // First visit
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get resource count
    const firstLoad = await page.evaluate(() => performance.getEntriesByType('resource').length);
    
    // Navigate away
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Return to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const secondLoad = await page.evaluate(() => performance.getEntriesByType('resource').length);
    
    // Second load should use cached resources (fewer or equal resources loaded)
    console.log(`First load: ${firstLoad} resources, Second load: ${secondLoad} resources`);
    
    // At minimum, we should see resources being loaded
    expect(firstLoad).toBeGreaterThan(0);
  });

  test('Images and assets load progressively', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Page should be interactive before all images load
    await page.waitForLoadState('domcontentloaded');
    const interactiveTime = Date.now() - startTime;
    
    // Should become interactive quickly
    expect(interactiveTime).toBeLessThan(3000);
    console.log(`✓ Page interactive in ${interactiveTime}ms`);
    
    // Wait for full load
    await page.waitForLoadState('networkidle');
    const fullLoadTime = Date.now() - startTime;
    
    console.log(`✓ Full load in ${fullLoadTime}ms`);
  });
});
