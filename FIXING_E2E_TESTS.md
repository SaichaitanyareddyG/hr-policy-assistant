# Quick Guide: Fixing Remaining E2E Tests

## Current Status
- ✅ Auth tests: 6/6 passing
- 🔄 Admin tests: 3/11 passing  
- ⏳ Chat tests: 0/6 passing

## Why Tests Are Failing
Most failures are due to **selector mismatches** - the test is looking for UI elements that either:
1. Have different text/attributes than expected
2. Take longer to load than the timeout allows
3. Are named differently in the actual app

## How to Fix Tests (Step-by-Step)

### Step 1: Run a Single Failing Test
```bash
npx playwright test employee-chat.spec.ts --grep "display chat interface" --reporter=list
```

### Step 2: Open the Screenshot
When a test fails, Playwright saves screenshots:
```bash
open test-results/[test-name]/test-failed-1.png
```

### Step 3: Inspect What Went Wrong
Look at the error message and screenshot to see:
- What element was the test looking for?
- Is that element visible in the screenshot?
- Does it have a different name or class?

### Step 4: Run in Debug Mode (Best Option)
```bash
npx playwright test employee-chat.spec.ts --grep "display chat interface" --debug
```
This opens a browser window and Playwright Inspector where you can:
- Step through the test line by line
- See exactly what selectors match
- Try different selectors in real-time
- Click "Pick Locator" to find the right selector

### Step 5: Update the Selector
Based on what you find, update the test file:

**Before:**
```typescript
await page.click('text=/chat/i');
```

**After (if element has class instead):**
```typescript
await page.click('[href="/employee/chat"]');
// or
await page.click('.nav-link-chat');
```

### Step 6: Re-run the Test
```bash
npx playwright test employee-chat.spec.ts --grep "display chat interface" --reporter=list
```

---

## Common Selector Patterns

### Text-Based Selectors
```typescript
// Exact text
page.locator('text=Chat')

// Regex (case-insensitive)
page.locator('text=/chat/i')

// Partial match
page.locator('text=/chat|conversation|messages/i')

// Multiple matches - use .first()
page.locator('text=/analytics/i').first()
```

### Attribute Selectors
```typescript
// By placeholder
page.locator('input[placeholder*="Ask"]')

// By type
page.locator('button[type="submit"]')

// By href
page.locator('a[href="/admin/analytics"]')

// By role
page.getByRole('button', { name: 'Send' })
```

### CSS Selectors
```typescript
// By class
page.locator('.chat-input')

// By ID
page.locator('#message-box')

// By data attribute
page.locator('[data-testid="chat-input"]')
```

### Combined Selectors
```typescript
// Multiple alternatives
page.locator('textarea, input[placeholder*="question"], input[placeholder*="Ask"]')

// Parent > child
page.locator('form > button[type="submit"]')

// :has() pseudo-class
page.locator('button:has-text("Send")')
```

---

## Quick Fixes for Specific Tests

### Employee Chat Tests

**Test:** "should display chat interface"
```typescript
// Current (might fail)
await page.click('text=/chat/i');

// Try these alternatives:
await page.click('a[href*="chat"]');
await page.click('[data-testid="nav-chat"]');
await page.getByRole('link', { name: /chat/i });

// For input field:
await page.locator('textarea[placeholder*="question"]').first()
// or
await page.locator('[role="textbox"]').first()
```

**Test:** "should send a message"
```typescript
// Try finding the actual input element:
const input = await page.locator('textarea').first();
// or
const input = await page.locator('[contenteditable="true"]');
```

### Admin Tests

**Test:** "should navigate to analytics page"
```typescript
// Current (might fail)
await page.click('text=/analytics/i');

// Try these:
await page.click('a[href*="analytics"]');
await page.click('[data-testid="nav-analytics"]');
await page.getByRole('link', { name: /analytics/i }).first();
```

---

## Debugging Tools

### 1. Playwright Inspector (Best)
```bash
npx playwright test --debug
```
- Step through tests
- Pick locators visually
- See what matches

### 2. Playwright UI Mode (Interactive)
```bash
npx playwright test --ui
```
- Run tests in browser
- Watch them execute
- Time-travel debugging

### 3. Trace Viewer (Post-Failure Analysis)
```bash
# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### 4. Console Logging (Quick Debug)
```typescript
// Add to test to see what's on page:
const text = await page.textContent('body');
console.log('Page content:', text);

// Check if element exists
const exists = await page.locator('text=/chat/i').count();
console.log('Chat links found:', exists);
```

---

## Pro Tips

### 1. Wait for Network Idle
Some elements need data to load first:
```typescript
await page.waitForLoadState('networkidle');
await expect(page.locator('...')).toBeVisible();
```

### 2. Increase Timeouts for Specific Tests
```typescript
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ... test code
});
```

### 3. Use Soft Assertions (Continue on Failure)
```typescript
await expect.soft(page.locator('.optional')).toBeVisible();
// Test continues even if this fails
```

### 4. Get Element Info for Debugging
```typescript
// See all attributes
const element = page.locator('button').first();
const html = await element.innerHTML();
console.log('Element HTML:', html);
```

---

## Recommended Order to Fix Tests

1. **Start with Simple Admin Tests** (3 already passing)
   - Fix navigation tests (analytics, documents, users)
   - Pattern is clear from passing tests

2. **Then Employee Chat Tests**
   - Get navigation working first
   - Then test chat interface
   - Message sending last (most complex)

3. **Finally Scenario Tests**
   - These combine multiple steps
   - Easier once basic tests pass

---

## When to Skip Tests (For Now)

Skip tests that depend on:
- External API calls (unless mocked)
- Email sending
- File uploads (until Playwright storage configured)
- Real-time features (WebSockets, etc.)

Example:
```typescript
test.skip('should send email notification', async ({ page }) => {
  // Skip until email service is mocked
});
```

---

## Need Help?

Run Playwright codegen to auto-generate selectors:
```bash
npx playwright codegen http://localhost:3000
```

This opens a browser and records your actions, generating test code automatically!

---

**Remember:** The test infrastructure is solid (6/6 auth tests prove this). The remaining failures are just selector adjustments - normal when writing E2E tests for an existing app.
