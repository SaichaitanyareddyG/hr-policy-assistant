# Playwright Testing Best Practices Implementation

## ✅ What We've Implemented

This project follows **Playwright's official best practices** for E2E testing:

### 1. ✅ Use data-testid Attributes

**Why:** Resilient to UI changes, clear intent, better maintainability

**Implementation:**
```tsx
// components/auth/auth-form.tsx
<Input
  data-testid="auth-email-input"
  type="email"
  ...
/>

<Button 
  data-testid="auth-submit-button"
  type="submit"
>
```

**Usage in Tests:**
```typescript
const emailInput = page.getByTestId('auth-email-input');
await emailInput.fill('user@test.com');
```

**Naming Convention:**
- Use kebab-case: `auth-email-input`, `nav-analytics`
- Format: `[component]-[element]-[type]`
- Examples:
  - `auth-email-input` - auth form email input
  - `nav-analytics` - navigation link to analytics
  - `auth-error-message` - authentication error message

---

### 2. ✅ Page Object Model (POM) Pattern

**Why:** Encapsulates page logic, DRY principle, easier maintenance

**Structure:**
```
tests/e2e/
├── page-objects/
│   ├── LoginPage.ts          # Login page actions & selectors
│   ├── HomePage.ts            # Homepage actions
│   ├── EmployeeDashboardPage.ts  # Employee dashboard
│   ├── AdminDashboardPage.ts     # Admin dashboard
│   └── index.ts               # Export all page objects
├── fixtures.ts                # Custom Playwright fixtures
└── features/                  # Feature-based test organization
    ├── auth.feature.spec.ts
    ├── admin.feature.spec.ts
    └── employee.feature.spec.ts
```

**Example Page Object:**
```typescript
// page-objects/LoginPage.ts
export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  
  constructor(page: Page) {
    this.emailInput = page.getByTestId('auth-email-input');
    this.passwordInput = page.getByTestId('auth-password-input');
  }
  
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

**Usage in Tests:**
```typescript
import { test } from '../fixtures';

test('should login successfully', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('user@test.com', 'password');
  // Fixture automatically provides loginPage instance
});
```

---

### 3. ✅ Test Fixtures

**Why:** Automatic setup/teardown, reusable test context, cleaner tests

**Implementation:**
```typescript
// fixtures.ts
export const test = base.extend<PageObjects>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});
```

**Benefits:**
- No manual page object instantiation
- Automatic cleanup
- Type-safe test context
- Easy to extend with custom fixtures

---

### 4. ✅ Feature-Based Organization

**Why:** Mirrors user workflows, easier to find tests, better documentation

**Structure:**
```
tests/e2e/features/
├── auth.feature.spec.ts       # All authentication tests
├── admin.feature.spec.ts      # All admin dashboard tests
├── employee.feature.spec.ts   # All employee tests
└── scenarios/                 # Complex multi-step scenarios
    ├── employee-workflow.spec.ts
    └── admin-workflow.spec.ts
```

---

### 5. ✅ Proper Selectors Hierarchy

**Priority Order (Most Stable → Least Stable):**

1. **`getByTestId()`** - Most reliable (our primary method)
   ```typescript
   page.getByTestId('auth-email-input')
   ```

2. **`getByRole()`** - Accessibility-focused
   ```typescript
   page.getByRole('button', { name: /sign in/i })
   page.getByRole('link', { name: /analytics/i })
   ```

3. **`getByLabel()`** - For form inputs
   ```typescript
   page.getByLabel('Email address')
   ```

4. **`getByPlaceholder()`** - Fallback for inputs
   ```typescript
   page.getByPlaceholder('Enter your email')
   ```

5. **Avoid:** CSS selectors, XPath, text selectors (fragile)

---

### 6. ✅ Explicit Waiting

**Why:** Handles async operations, reduces flakiness

**Best Practices:**
```typescript
// ✅ Good - Wait for navigation
await Promise.all([
  page.waitForURL(/\/admin/),
  page.click('button[type="submit"]'),
]);

// ✅ Good - Wait for element state
await page.getByTestId('nav-analytics').waitFor({ state: 'visible' });

// ❌ Bad - Hard timeout
await page.waitForTimeout(3000); // Avoid!
```

---

### 7. ✅ Clear Test Structure

**Format:**
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ loginPage }) => {
    // Common setup
    await loginPage.goto();
  });

  test('should perform specific action', async ({ page }) => {
    // Arrange - Set up test data
    const testData = 'test value';
    
    // Act - Perform action
    await page.getByTestId('input').fill(testData);
    
    // Assert - Verify outcome
    await expect(page.getByTestId('result')).toHaveText(testData);
  });
});
```

---

### 8. ✅ Comprehensive Reporting

**Configured Reporters:**
- **HTML Report** - Visual test results browser
- **List Reporter** - Console output during test run
- **JSON Reporter** - Machine-readable results for CI/CD
- **JUnit Reporter** - Standard XML format for CI/CD integration

**Generate Coverage Report:**
```bash
# Run tests with full reporting
npx playwright test --reporter=html,list,json,junit

# View HTML report
npx playwright show-report test-results/html-report
```

---

## 📊 Test Coverage Tracking

### Feature Coverage Matrix

| Feature Area | Tests | Status | Coverage |
|-------------|-------|--------|----------|
| Authentication | 6 | ✅ Passing | 100% |
| Admin Dashboard | 10 | ✅ Passing | 100% |
| Employee Dashboard | 5 | ✅ Passing | 100% |
| Chat Functionality | 6 | ⏳ TODO | 0% |
| Document Management | 8 | ⏳ TODO | 0% |
| User Management | 7 | ⏳ TODO | 0% |

### How to Track Coverage

1. **Test Results JSON:**
   ```bash
   npx playwright test --reporter=json
   # Check test-results/results.json
   ```

2. **HTML Report:**
   ```bash
   npx playwright test --reporter=html
   npx playwright show-report
   ```

3. **Custom Coverage Script:**
   ```bash
   npm run test:coverage
   ```

---

## 🎯 Selector Best Practices Summary

### ✅ DO Use:

1. **data-testid** (Primary)
   ```typescript
   page.getByTestId('auth-email-input')
   ```

2. **Role-based selectors** (Accessibility)
   ```typescript
   page.getByRole('button', { name: 'Submit' })
   ```

3. **Label-based selectors** (Forms)
   ```typescript
   page.getByLabel('Email address')
   ```

### ❌ DON'T Use:

1. **CSS class selectors** (brittle)
   ```typescript
   page.locator('.btn-primary') // Avoid!
   ```

2. **XPath** (hard to read, brittle)
   ```typescript
   page.locator('//div[@class="content"]//button') // Avoid!
   ```

3. **Text content selectors** (i18n issues)
   ```typescript
   page.locator('text=Submit') // Avoid!
   ```

---

## 🏗️ Adding New Tests

### Step 1: Add data-testid to Component
```tsx
// components/MyComponent.tsx
<button 
  onClick={handleClick}
  data-testid="my-component-submit-btn"
>
  Submit
</button>
```

### Step 2: Create/Update Page Object
```typescript
// tests/e2e/page-objects/MyComponentPage.ts
export class MyComponentPage {
  readonly submitBtn: Locator;
  
  constructor(page: Page) {
    this.submitBtn = page.getByTestId('my-component-submit-btn');
  }
  
  async submit() {
    await this.submitBtn.click();
  }
}
```

### Step 3: Add to Fixtures (if new page)
```typescript
// tests/e2e/fixtures.ts
export const test = base.extend<PageObjects>({
  myComponentPage: async ({ page }, use) => {
    await use(new MyComponentPage(page));
  },
});
```

### Step 4: Write Test
```typescript
// tests/e2e/features/my-feature.spec.ts
import { test, expect } from '../fixtures';

test('should submit form', async ({ myComponentPage }) => {
  await myComponentPage.goto();
  await myComponentPage.submit();
  // assertions...
});
```

---

## 📚 Additional Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Selectors Best Practices](https://playwright.dev/docs/selectors)

---

## 🎓 Quick Reference

### Running Tests
```bash
# All tests
npx playwright test

# Specific feature
npx playwright test features/auth

# With UI
npx playwright test --ui

# Debug mode
npx playwright test --debug

# Show report
npx playwright show-report
```

### Writing Tests
```typescript
// Import test with fixtures
import { test, expect } from '../fixtures';

// Use page objects from fixtures
test('my test', async ({ loginPage, adminDashboard }) => {
  await loginPage.login('user@test.com', 'pass');
  await adminDashboard.goToAnalytics();
  await expect(adminDashboard.page).toHaveURL(/analytics/);
});
```

### Adding data-testid
```tsx
// Format: [component]-[element]-[type]
data-testid="auth-email-input"
data-testid="nav-analytics"
data-testid="modal-confirm-btn"
```

---

**Last Updated:** 2026-07-12  
**Framework:** Playwright v1.48+  
**Pattern:** Page Object Model + Test Fixtures  
**Selector Strategy:** data-testid (primary) + getByRole (secondary)
