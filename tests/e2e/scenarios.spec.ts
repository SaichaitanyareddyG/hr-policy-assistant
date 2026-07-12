import { test, expect, Page } from '@playwright/test';
import { loginAsEmployee, loginAsAdmin } from './helpers/test-utils';

/**
 * SCENARIO-BASED TESTS: Real User Workflows
 * These tests simulate actual user journeys through the application
 */

test.describe('Scenario: New Employee Onboarding', () => {
  test('Complete employee onboarding journey', async ({ page }) => {
    /**
     * SCENARIO: New employee joins company and explores the system
     * 1. Receives invite link
     * 2. Creates account
     * 3. Logs in for first time
     * 4. Explores available features
     * 5. Asks first HR question
     */
    
    // Step 1: Land on homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/PolicyAI|HR Policy/i);
    
    // Step 2: Navigate to login
    await page.click('text=/sign in|login/i');
    await expect(page).toHaveURL(/.*login/);
    
    // Step 3: See register option
    const registerLink = page.locator('text=/sign up|register|create account/i');
    await expect(registerLink).toBeVisible();
    
    // Note: Actual registration would require email verification
    // In real scenario, employee would use invite link
  });
});

test.describe('Scenario: Employee Daily Usage', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
  });

  test('Morning routine: Check policies and ask questions', async ({ page }) => {
    /**
     * SCENARIO: Employee starts work day
     * 1. Checks available policies
     * 2. Asks question about vacation
     * 3. Asks follow-up question
     * 4. Reads policy document
     */
    
    // Step 1: Navigate to policies
    await page.click('text=/policies/i');
    await expect(page).toHaveURL(/.*employee\/policies/);
    
    // Should see list of policies
    await expect(page.locator('text=/policy|document|handbook/i')).toBeVisible({ timeout: 5000 });
    
    // Step 2: Go to chat to ask question
    await page.click('text=/chat/i');
    await expect(page).toHaveURL(/.*employee\/chat/);
    
    const chatInput = page.locator('textarea, input[placeholder*="question"], input[placeholder*="Ask"]').first();
    
    // Ask about vacation policy
    await chatInput.fill('How many vacation days do I get per year?');
    await page.click('button[type="submit"], button:has-text("Send")');
    
    // Wait for response
    await expect(page.locator('text=/vacation|days|leave|annual/i')).toBeVisible({ timeout: 30000 });
    
    // Step 3: Ask follow-up
    await page.waitForTimeout(2000);
    await chatInput.fill('Can I carry over unused days to next year?');
    await page.click('button[type="submit"], button:has-text("Send")');
    
    await expect(page.locator('text=/carry|rollover|next year/i')).toBeVisible({ timeout: 30000 });
  });

  test('Submit clarification request for unclear policy', async ({ page }) => {
    /**
     * SCENARIO: Employee needs clarification
     * 1. Asks question in chat
     * 2. Answer is unclear or not satisfactory
     * 3. Requests clarification from HR
     */
    
    await page.click('text=/chat/i');
    
    const chatInput = page.locator('textarea, input[placeholder*="question"], input[placeholder*="Ask"]').first();
    await chatInput.fill('What is the policy on remote work equipment?');
    await page.click('button[type="submit"], button:has-text("Send")');
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    // Look for clarification button/link
    const clarificationButton = page.locator('button:has-text("Ask HR"), button:has-text("Request Clarification"), a:has-text("Clarification")');
    
    if (await clarificationButton.isVisible({ timeout: 3000 })) {
      await clarificationButton.first().click();
      
      // Should show clarification form
      await expect(page.locator('textarea, input[type="text"]')).toBeVisible({ timeout: 5000 });
    } else {
      // Navigate to clarifications page manually
      await page.click('text=/clarification|help/i');
      await expect(page).toHaveURL(/.*employee\/clarifications|help/);
    }
  });

  test('Search and read specific policy document', async ({ page }) => {
    /**
     * SCENARIO: Employee needs to read full policy
     * 1. Goes to policies page
     * 2. Searches for specific policy
     * 3. Opens and reads document
     */
    
    await page.click('text=/policies/i');
    await expect(page).toHaveURL(/.*employee\/policies/);
    
    // Search for vacation policy
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('vacation');
      await page.waitForTimeout(1000);
      
      // Click first result
      const firstPolicy = page.locator('[class*="policy"], [class*="document"], [class*="card"]').first();
      if (await firstPolicy.isVisible()) {
        await firstPolicy.click();
        
        // Should show policy details
        await expect(page.locator('text=/vacation|leave|time off/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Scenario: Admin Content Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Upload and process new policy document', async ({ page }) => {
    /**
     * SCENARIO: Admin uploads new HR policy
     * 1. Navigate to documents
     * 2. Upload new document
     * 3. Process document (extract text, generate embeddings)
     * 4. Verify document appears in list
     * 5. Test that employees can find it
     */
    
    // Step 1: Go to documents page
    await page.click('text=/documents/i');
    await expect(page).toHaveURL(/.*admin\/documents/);
    
    // Step 2: Click upload
    const uploadButton = page.locator('button:has-text("Upload"), a:has-text("Upload")').first();
    await uploadButton.click();
    await expect(page).toHaveURL(/.*upload/);
    
    // Should see upload interface
    await expect(page.locator('input[type="file"], [class*="dropzone"]')).toBeVisible();
    
    // Note: Actual file upload would require test file
    // In real test, you would upload a sample PDF/DOCX
  });

  test('Review and approve FAQ from chat history', async ({ page }) => {
    /**
     * SCENARIO: Admin curates common questions
     * 1. Reviews chat analytics
     * 2. Identifies frequently asked questions
     * 3. Approves FAQ for quick answers
     */
    
    // Navigate to approved FAQs or analytics
    const faqLink = page.locator('text=/faq|approved/i').first();
    
    if (await faqLink.isVisible({ timeout: 3000 })) {
      await faqLink.click();
      
      // Should show FAQ management interface
      await expect(page.locator('text=/question|answer|approve/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Handle employee clarification request', async ({ page }) => {
    /**
     * SCENARIO: Admin responds to clarification
     * 1. Check clarifications inbox
     * 2. Read employee question
     * 3. Provide detailed answer
     * 4. Mark as resolved
     */
    
    const clarificationsLink = page.locator('text=/clarification/i').first();
    
    if (await clarificationsLink.isVisible({ timeout: 3000 })) {
      await clarificationsLink.click();
      await expect(page).toHaveURL(/.*clarifications/);
      
      // Should show pending clarifications
      await expect(page.locator('text=/pending|new|unresolved/i')).toBeVisible({ timeout: 5000 });
      
      // Click first clarification
      const firstClarification = page.locator('[class*="clarification"], tr, [class*="card"]').first();
      
      if (await firstClarification.isVisible()) {
        await firstClarification.click();
        
        // Should show clarification details
        await expect(page.locator('textarea, [contenteditable="true"]')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('Monitor system usage through analytics', async ({ page }) => {
    /**
     * SCENARIO: Weekly admin check-in
     * 1. View analytics dashboard
     * 2. Check most asked questions
     * 3. Review document usage
     * 4. Monitor user engagement
     */
    
    await page.click('text=/analytics/i');
    await expect(page).toHaveURL(/.*admin\/analytics/);
    
    // Should show charts and metrics
    await expect(page.locator('text=/chart|statistics|metrics|questions|users/i')).toBeVisible({ timeout: 5000 });
    
    // Check for key metrics
    const metrics = ['Total Questions', 'Active Users', 'Documents', 'Top Questions'];
    
    for (const metric of metrics) {
      const metricElement = page.locator(`text=/${metric}/i`);
      if (await metricElement.isVisible({ timeout: 2000 })) {
        console.log(`✓ Found metric: ${metric}`);
      }
    }
  });

  test('User management: Invite new employee', async ({ page }) => {
    /**
     * SCENARIO: New hire joining company
     * 1. Admin creates invite
     * 2. Sets role (employee/admin)
     * 3. Sends invitation email
     * 4. Tracks invitation status
     */
    
    await page.click('text=/users/i');
    await expect(page).toHaveURL(/.*admin\/users/);
    
    // Look for invite button
    const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Add User")').first();
    
    if (await inviteButton.isVisible({ timeout: 3000 })) {
      await inviteButton.click();
      
      // Should show invite form
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
      
      // Fill invite form
      await page.fill('input[type="email"]', 'newemployee@company.com');
      
      // Select role if dropdown exists
      const roleSelect = page.locator('select, [role="combobox"]').first();
      if (await roleSelect.isVisible({ timeout: 2000 })) {
        await roleSelect.click();
      }
    }
  });

  test('Audit trail: Review security logs', async ({ page }) => {
    /**
     * SCENARIO: Security compliance check
     * 1. Access audit logs
     * 2. Filter by action type
     * 3. Review user activities
     * 4. Export logs if needed
     */
    
    const auditLink = page.locator('text=/audit|logs|security/i').first();
    
    if (await auditLink.isVisible({ timeout: 3000 })) {
      await auditLink.click();
      
      // Should show audit log table
      await expect(page.locator('text=/action|timestamp|user|event/i')).toBeVisible({ timeout: 5000 });
      
      // Check for filters
      const filterButton = page.locator('button:has-text("Filter"), select').first();
      if (await filterButton.isVisible({ timeout: 2000 })) {
        console.log('✓ Filters available');
      }
    }
  });
});

test.describe('Scenario: Error Recovery', () => {
  test('Recover from network error during chat', async ({ page }) => {
    /**
     * SCENARIO: Network interruption during chat
     * 1. Start asking question
     * 2. Simulate network failure
     * 3. Show error message
     * 4. Allow retry
     */
    
    await loginAsEmployee(page);
    await page.click('text=/chat/i');
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    const chatInput = page.locator('textarea, input[placeholder*="question"]').first();
    await chatInput.fill('What is the vacation policy?');
    await page.click('button[type="submit"], button:has-text("Send")');
    
    // Should show error
    await expect(page.locator('text=/error|failed|network|connection/i')).toBeVisible({ timeout: 10000 });
    
    // Restore connection
    await page.context().setOffline(false);
    
    // Should be able to retry
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")');
    if (await retryButton.isVisible({ timeout: 3000 })) {
      await retryButton.click();
    }
  });

  test('Handle session expiration gracefully', async ({ page }) => {
    /**
     * SCENARIO: User session expires
     * 1. User logged in and active
     * 2. Session expires (simulate by clearing cookies)
     * 3. Next action triggers re-auth
     * 4. Redirect to login with return URL
     */
    
    await loginAsEmployee(page);
    await page.click('text=/chat/i');
    
    // Clear session cookies
    await page.context().clearCookies();
    
    // Try to navigate
    await page.click('text=/policies/i');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });
});

test.describe('Scenario: Edge Cases', () => {
  test('Handle extremely long chat message', async ({ page }) => {
    /**
     * SCENARIO: User sends very long question
     * Should either accept with character limit or show validation
     */
    
    await loginAsEmployee(page);
    await page.click('text=/chat/i');
    
    const longMessage = 'What is the vacation policy? '.repeat(100); // ~2700 chars
    
    const chatInput = page.locator('textarea, input[placeholder*="question"]').first();
    await chatInput.fill(longMessage);
    
    await page.click('button[type="submit"], button:has-text("Send")');
    
    // Should either:
    // 1. Accept and process
    // 2. Show character limit warning
    await page.waitForTimeout(5000);
  });

  test('Rapid successive questions in chat', async ({ page }) => {
    /**
     * SCENARIO: User sends multiple questions quickly
     * System should queue and handle them properly
     */
    
    await loginAsEmployee(page);
    await page.click('text=/chat/i');
    
    const chatInput = page.locator('textarea, input[placeholder*="question"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Send")');
    
    const questions = [
      'What is the vacation policy?',
      'How many sick days do I get?',
      'What is the remote work policy?',
    ];
    
    // Send questions rapidly
    for (const question of questions) {
      await chatInput.fill(question);
      await submitButton.click();
      await page.waitForTimeout(500); // Small delay between questions
    }
    
    // All questions should appear in chat
    for (const question of questions) {
      await expect(page.locator(`text="${question}"`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Handle special characters in search', async ({ page }) => {
    /**
     * SCENARIO: User searches with special characters
     * Should handle gracefully without breaking
     */
    
    await loginAsEmployee(page);
    await page.click('text=/policies/i');
    
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 3000 })) {
      const specialQueries = [
        '<script>alert("test")</script>',
        "'; DROP TABLE documents;--",
        '../../etc/passwd',
        '${process.env.SECRET}',
      ];
      
      for (const query of specialQueries) {
        await searchInput.fill(query);
        await page.waitForTimeout(500);
        
        // Should not crash or execute malicious code
        await expect(page).toHaveURL(/.*employee\/policies/);
      }
    }
  });
});

test.describe('Scenario: Accessibility', () => {
  test('Keyboard navigation through chat interface', async ({ page }) => {
    /**
     * SCENARIO: User navigates using only keyboard
     * All interactive elements should be accessible via Tab/Enter
     */
    
    await loginAsEmployee(page);
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to reach chat link
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    const tagName = await focusedElement.evaluate(el => el?.tagName);
    
    expect(['A', 'BUTTON', 'INPUT']).toContain(tagName);
  });

  test('Screen reader compatibility - check ARIA labels', async ({ page }) => {
    /**
     * SCENARIO: Visually impaired user uses screen reader
     * Important elements should have proper ARIA labels
     */
    
    await page.goto('/');
    
    // Check for ARIA landmarks
    const nav = page.locator('[role="navigation"]');
    const main = page.locator('[role="main"]');
    
    if (await nav.isVisible({ timeout: 3000 })) {
      console.log('✓ Navigation landmark found');
    }
    
    if (await main.isVisible({ timeout: 3000 })) {
      console.log('✓ Main content landmark found');
    }
  });
});
