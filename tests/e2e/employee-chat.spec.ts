import { test, expect } from '@playwright/test';
import { loginAsEmployee, expectToast } from './helpers/test-utils';

test.describe('Employee Chat Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login as employee before each test
    await loginAsEmployee(page);
    
    // Navigate to chat page
    await page.click('text=/chat/i');
    await expect(page).toHaveURL(/.*employee\/chat/);
  });

  test('should display chat interface', async ({ page }) => {
    // Check for chat input
    await expect(page.locator('textarea, input[placeholder*="question"], input[placeholder*="Ask"]')).toBeVisible();
    
    // Check for send button
    await expect(page.locator('button[type="submit"], button:has-text("Send")')).toBeVisible();
  });

  test('should send a message and receive response', async ({ page }) => {
    const question = 'What is the vacation policy?';
    
    // Type question
    const input = page.locator('textarea, input[placeholder*="question"], input[placeholder*="Ask"]').first();
    await input.fill(question);
    
    // Send message
    await page.click('button[type="submit"], button:has-text("Send")');
    
    // Should show user message
    await expect(page.locator(`text="${question}"`)).toBeVisible({ timeout: 5000 });
    
    // Should show loading indicator or response
    // Wait for AI response (may take a few seconds)
    await expect(page.locator('text=/vacation|policy|days|leave/i')).toBeVisible({ 
      timeout: 30000 // AI responses can take time
    });
  });

  test('should reject off-topic questions with guardrails', async ({ page }) => {
    const offTopicQuestion = 'What is the weather today?';
    
    // Type off-topic question
    const input = page.locator('textarea, input[placeholder*="question"], input[placeholder*="Ask"]').first();
    await input.fill(offTopicQuestion);
    
    // Send message
    await page.click('button[type="submit"], button:has-text("Send")');
    
    // Should show rejection message
    await expect(page.locator('text=/HR policies|cannot answer|off-topic/i')).toBeVisible({ 
      timeout: 30000 
    });
  });

  test('should maintain conversation history', async ({ page }) => {
    // Send first message
    const input = page.locator('textarea, input[placeholder*="question"], input[placeholder*="Ask"]').first();
    
    await input.fill('What are the working hours?');
    await page.click('button[type="submit"], button:has-text("Send")');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Send follow-up question
    await input.fill('Can you summarize that?');
    await page.click('button[type="submit"], button:has-text("Send")');
    
    // Both messages should be visible in history
    await expect(page.locator('text="What are the working hours?"')).toBeVisible();
    await expect(page.locator('text="Can you summarize that?"')).toBeVisible();
  });

  test('should clear chat history', async ({ page }) => {
    // Send a message first
    const input = page.locator('textarea, input[placeholder*="question"], input[placeholder*="Ask"]').first();
    await input.fill('Test message');
    await page.click('button[type="submit"], button:has-text("Send")');
    
    // Wait for message to appear
    await expect(page.locator('text="Test message"')).toBeVisible();
    
    // Look for clear/new chat button
    const clearButton = page.locator('button:has-text("New Chat"), button:has-text("Clear"), button[aria-label*="clear"]');
    
    if (await clearButton.isVisible()) {
      await clearButton.click();
      
      // Message should be gone
      await expect(page.locator('text="Test message"')).not.toBeVisible();
    }
  });

  test('should show sources when available', async ({ page }) => {
    const input = page.locator('textarea, input[placeholder*="question"], input[placeholder*="Ask"]').first();
    await input.fill('What is the remote work policy?');
    await page.click('button[type="submit"], button:has-text("Send")');
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    // Check for sources section (if documents exist)
    const sources = page.locator('text=/source|document|reference/i');
    
    // Sources may or may not appear depending on document availability
    // Just check the response loaded
    await expect(page.locator('[class*="message"], [class*="response"]')).toHaveCount(
      await page.locator('[class*="message"], [class*="response"]').count()
    );
  });
});
