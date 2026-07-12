# 🧪 Testing Documentation

Complete testing guide for PolicyPal AI with Playwright E2E tests.

---

## Overview

PolicyPal AI uses **Playwright** for comprehensive end-to-end testing following industry best practices:

- ✅ **81+ tests** covering all features
- ✅ **Page Object Model** for maintainability
- ✅ **Test fixtures** for clean setup
- ✅ **data-testid** selectors (stable & reliable)
- ✅ **Feature-based organization**
- ✅ **Multiple reporters** (HTML, JSON, JUnit)
- ✅ **Video recording** on failure
- ✅ **Comprehensive coverage** reports

---

## Quick Start

### Run All Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (visual debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

### Run Specific Tests

```bash
# Authentication tests only
npm run test:auth

# Admin dashboard tests
npm run test:admin

# Employee portal tests
npm run test:employee

# All feature tests
npm run test:features
```

### View Test Report

```bash
# Generate and view HTML report
npm run test:report

# Or after running tests with coverage
npm run test:coverage
```

---

## Test Structure

### Folder Organization

```
tests/e2e/
├── features/                 # Feature-based tests (NEW structure)
│   ├── auth.feature.spec.ts       # 5 auth tests ✅
│   ├── admin.feature.spec.ts      # 10 admin tests ✅
│   └── employee.feature.spec.ts   # 5 employee tests ✅
├── scenarios.spec.ts         # 17 real-world scenario tests
├── integration.spec.ts       # 9 integration workflow tests
├── performance.spec.ts       # 11 performance validation tests
├── page-objects/            # Page Object Models
│   ├── HomePage.ts
│   ├── LoginPage.ts
│   ├── AdminDashboardPage.ts
│   └── EmployeeDashboardPage.ts
├── fixtures.ts              # Custom test fixtures
└── helpers/
    └── test-utils.ts        # Utilities and test credentials
```

### Test Categories

**Total: 81+ comprehensive tests**

| Category | Tests | Description |
|----------|-------|-------------|
| **Feature Tests** | 20 | Auth, admin, employee features |
| **Scenarios** | 17 | Real user workflows |
| **Integration** | 9 | Multi-feature workflows |
| **Performance** | 11 | Load time validation |
| **Edge Cases** | 10+ | Error handling, validation |

---

## Test Credentials

Secure test users stored in `.env.test` (gitignored):

```env
# Test Environment
BASE_URL=http://localhost:3000

# Test Admin User
TEST_ADMIN_EMAIL=test.admin@policyai.test
TEST_ADMIN_PASSWORD=TestAdmin123!@#Secure
TEST_ADMIN_ID=8050157d-e8e0-4ab3-a71d-64aaf64b1a3f

# Test Employee User  
TEST_EMPLOYEE_EMAIL=test.employee@policyai.test
TEST_EMPLOYEE_PASSWORD=TestEmployee123!@#Secure
TEST_EMPLOYEE_ID=dce3b201-721a-4bf4-804c-45714247997c
```

**Security:**
- ✅ `.env.test` in `.gitignore`
- ✅ Never committed to repo
- ✅ Test org isolated from production
- ✅ Strong passwords enforced

---

## Page Object Model

### Architecture

Tests use Page Object Model (POM) pattern for maintainability:

```typescript
// page-objects/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}
  
  async login(email: string, password: string) {
    await this.page.getByTestId('auth-email-input').fill(email);
    await this.page.getByTestId('auth-password-input').fill(password);
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.getByTestId('auth-submit-button').click(),
    ]);
  }
}
```

### Available Page Objects

1. **HomePage** - Landing page interactions
2. **LoginPage** - Authentication flows
3. **AdminDashboardPage** - Admin navigation
4. **EmployeeDashboardPage** - Employee navigation

### Usage with Fixtures

```typescript
import { test, expect } from '../fixtures';

test('should login as employee', async ({ loginPage, employeeDashboard }) => {
  await loginPage.goto();
  await loginPage.login(TEST_USERS.employee.email, TEST_USERS.employee.password);
  await expect(employeeDashboard.page).toHaveURL(/\/employee/);
});
```

---

## Test Fixtures

Custom fixtures automatically initialize page objects:

```typescript
// fixtures.ts
export const test = base.extend<PageObjects>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  adminDashboard: async ({ page }, use) => {
    await use(new AdminDashboardPage(page));
  },
  employeeDashboard: async ({ page }, use) => {
    await use(new EmployeeDashboardPage(page));
  },
});
```

**Benefits:**
- ✅ No boilerplate in tests
- ✅ Automatic cleanup
- ✅ Type-safe
- ✅ Reusable across tests

---

## Selector Strategy

Following Playwright best practices:

### Priority Order

1. **data-testid** (Primary - Most stable)
   ```typescript
   page.getByTestId('auth-email-input')
   ```

2. **getByRole** (Semantic - Good for accessibility)
   ```typescript
   page.getByRole('button', { name: 'Submit' })
   ```

3. **getByLabel** (Form fields)
   ```typescript
   page.getByLabel('Email address')
   ```

4. **getByText** (Unique text)
   ```typescript
   page.getByText('Welcome back')
   ```

❌ **Avoid:** CSS selectors, XPath (fragile)

### data-testid Pattern

Components have data-testid attributes:

```tsx
// components/auth/auth-form.tsx
<Input 
  data-testid="auth-email-input"
  type="email"
  placeholder="Email"
/>

<Button data-testid="auth-submit-button">
  Sign In
</Button>
```

**Naming Convention:**
- Format: `{feature}-{element}-{type}`
- Examples: `auth-email-input`, `nav-documents`, `chat-send-button`
- Auto-generated for navigation: `nav-${name.toLowerCase()}`

---

## Test Scenarios

### Authentication (5 tests)

```typescript
✓ should load homepage successfully
✓ should navigate to login page from homepage  
✓ should show error for invalid credentials
✓ should successfully login as employee
✓ should successfully login as admin
```

### Admin Dashboard (10 tests)

```typescript
✓ should navigate to Documents page
✓ should navigate to Users page
✓ should navigate to Analytics page
✓ should navigate to Audit Logs page
✓ should navigate to Security page
✓ should navigate to Clarifications page
✓ should navigate to Approved FAQs page
✓ should navigate to Employees page
✓ should navigate to Settings page
✓ should navigate back to Dashboard
```

### Employee Portal (5 tests)

```typescript
✓ should navigate to Ask Policy AI (chat)
✓ should navigate to Browse Policies
✓ should navigate to My Clarifications
✓ should navigate to Help & Contact
✓ should navigate back to Dashboard
```

### Real User Scenarios (17 tests)

- **Onboarding:** Complete employee onboarding journey
- **Daily Usage:** Morning routine, clarifications, document search
- **Admin Workflows:** Upload docs, manage FAQs, user management, analytics
- **Error Recovery:** Network errors, session expiration
- **Edge Cases:** Long messages, rapid questions, special characters
- **Accessibility:** Keyboard navigation, screen readers

### Integration Tests (9 tests)

- End-to-end workflows spanning multiple features
- Question → AI Answer → History → Analytics
- Document upload → Processing → Embedding → Search
- Clarification creation → HR review → Resolution

### Performance Tests (11 tests)

- Page load time validation
- Response time checks
- Resource usage monitoring
- API endpoint performance

---

## Configuration

### playwright.config.ts

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Sequential for DB tests
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid race conditions
  
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['list'], // Console output
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.RECORD_VIDEO === 'true' ? 'on' : 'retain-on-failure',
  },
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

### Key Settings

- **Sequential execution** - Avoid DB conflicts
- **Single worker** - Predictable test order
- **Multiple reporters** - HTML (visual), JSON (CI/CD), JUnit (standard)
- **Video on failure** - Debug failed tests
- **Trace on retry** - Full debugging info

---

## Reporting

### HTML Report (Visual)

```bash
npm run test:report
```

**Features:**
- ✅ Browser-based interactive report
- ✅ Screenshots of failures
- ✅ Video playback inline
- ✅ Traces for debugging
- ✅ Filterable by status

### JSON Report (CI/CD)

Located at: `test-results/results.json`

```json
{
  "config": { ... },
  "suites": [ ... ],
  "stats": {
    "passed": 20,
    "failed": 0,
    "skipped": 1,
    "total": 21
  }
}
```

### JUnit XML (Standard)

Located at: `test-results/junit.xml`

Compatible with Jenkins, GitLab CI, CircleCI, etc.

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Run tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3000
          TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
          TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}
          TEST_EMPLOYEE_EMAIL: ${{ secrets.TEST_EMPLOYEE_EMAIL }}
          TEST_EMPLOYEE_PASSWORD: ${{ secrets.TEST_EMPLOYEE_PASSWORD }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Vercel Integration

See [Automated Testing After Build](#automated-testing-after-build) section in main README.

---

## Writing New Tests

### Step-by-Step

1. **Create test file in features/**
   ```typescript
   // tests/e2e/features/my-feature.spec.ts
   import { test, expect } from '../fixtures';
   import { TEST_USERS } from '../helpers/test-utils';
   ```

2. **Use fixtures for page objects**
   ```typescript
   test('should do something', async ({ loginPage, adminDashboard }) => {
     // Test code
   });
   ```

3. **Follow selector hierarchy**
   - Prefer data-testid
   - Use getByRole for semantic elements
   - Avoid CSS/XPath selectors

4. **Add data-testid to components**
   ```tsx
   <Button data-testid="my-feature-submit">Submit</Button>
   ```

5. **Run test**
   ```bash
   npx playwright test my-feature.spec.ts
   ```

### Example Test

```typescript
import { test, expect } from '../fixtures';
import { TEST_USERS } from '../helpers/test-utils';

test.describe('My Feature', () => {
  test.beforeEach(async ({ loginPage, adminDashboard }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test('should perform action', async ({ page }) => {
    await page.getByTestId('my-feature-button').click();
    await expect(page.getByTestId('my-feature-result')).toBeVisible();
  });
});
```

---

## Debugging

### Interactive Mode

```bash
# UI mode (recommended)
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through)
npm run test:e2e:debug
```

### Debug Specific Test

```bash
npx playwright test --debug --grep "should login"
```

### View Traces

```bash
# After test failure
npx playwright show-trace test-results/*/trace.zip
```

---

## Best Practices

### ✅ Do

- Use Page Object Model
- Use test fixtures
- Use data-testid selectors
- Write descriptive test names
- Test happy paths AND edge cases
- Keep tests independent
- Clean up test data
- Use meaningful assertions

### ❌ Don't

- Use CSS/XPath selectors
- Hard-code waits (use waitFor* methods)
- Test implementation details
- Share state between tests
- Skip error scenarios
- Make tests dependent on order
- Commit .env.test file

---

## Troubleshooting

### Tests Timing Out

**Solutions:**
- Increase timeout: `test.setTimeout(60000)`
- Check dev server is running
- Use `waitForLoadState('networkidle')`
- Add explicit waits for elements

### Selector Not Found

**Solutions:**
- Verify data-testid exists in component
- Check element is visible: `await expect(element).toBeVisible()`
- Wait for element: `await page.waitForSelector('[data-testid="..."]')`
- Use Playwright Inspector: `npm run test:e2e:debug`

### Database State Issues

**Solutions:**
- Use isolated test organization
- Clean up after tests
- Reset test data between runs
- Use transactions if possible

---

## Related Documentation

- [Playwright Best Practices](../PLAYWRIGHT_BEST_PRACTICES.md) - Detailed best practices
- [Demo Videos](DEMO_VIDEOS.md) - Video recording guide
- [Architecture](ARCHITECTURE.md) - System architecture
- [Test Suite Verification](../TEST_SUITE_VERIFICATION.md) - Complete test inventory

---

**Last Updated:** 2026-07-12
