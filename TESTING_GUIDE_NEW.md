# Testing Guide - New Structure

## 🎯 Overview

This project now uses **Playwright best practices** with:
- ✅ `data-testid` attributes for reliable element selection
- ✅ Page Object Model (POM) for maintainable tests
- ✅ Test fixtures for automatic setup/teardown
- ✅ Feature-based organization
- ✅ Comprehensive test coverage reporting

---

## 📁 New Folder Structure

```
tests/
├── e2e/
│   ├── features/                    # ✨ NEW: Feature-based tests
│   │   ├── auth.feature.spec.ts     # Authentication tests (6 tests)
│   │   ├── admin.feature.spec.ts    # Admin dashboard tests (10 tests)
│   │   └── employee.feature.spec.ts # Employee dashboard tests (5 tests)
│   │
│   ├── page-objects/                # ✨ NEW: Page Object Models
│   │   ├── HomePage.ts              # Homepage actions & selectors
│   │   ├── LoginPage.ts             # Login page actions & selectors
│   │   ├── AdminDashboardPage.ts    # Admin dashboard POM
│   │   ├── EmployeeDashboardPage.ts # Employee dashboard POM
│   │   └── index.ts                 # Export all POMs
│   │
│   ├── fixtures.ts                  # ✨ NEW: Custom test fixtures
│   │
│   ├── helpers/
│   │   └── test-utils.ts            # Updated with POM helpers
│   │
│   ├── auth.spec.ts                 # 🔄 OLD tests (deprecated)
│   ├── admin.spec.ts                # 🔄 OLD tests (deprecated)
│   └── employee-chat.spec.ts        # 🔄 OLD tests (deprecated)
│
├── setup-test-users.js              # Test user management
├── verify-test-users.js             # Verify test setup
└── insert-profiles.js               # Direct profile creation
```

---

## 🚀 Quick Start

### Run New Tests (Recommended)

```bash
# Run all new feature tests
npm run test:features

# Run specific feature
npm run test:auth        # Authentication tests
npm run test:admin       # Admin dashboard tests  
npm run test:employee    # Employee dashboard tests

# Run with UI (interactive)
npm run test:e2e:ui

# Run with debugging
npm run test:e2e:debug

# Generate coverage report
npm run test:coverage
```

### Run Old Tests (Legacy)

```bash
# These use old selector patterns (not recommended)
npx playwright test auth.spec.ts
npx playwright test admin.spec.ts
```

---

## 📝 Test Results (New Tests)

### ✅ Authentication Feature (`auth.feature.spec.ts`)
- ✅ Homepage load
- ✅ Navigate to login
- ✅ Invalid credentials error
- ✅ Employee login
- ✅ Admin login  
- ✅ Navigate to register

### ✅ Admin Dashboard Feature (`admin.feature.spec.ts`)
- ✅ Display dashboard
- ✅ Navigate to analytics
- ✅ Navigate to documents
- ✅ Navigate to users
- ✅ Navigate to employees
- ✅ Access audit logs
- ✅ Access approved FAQs
- ✅ Access clarifications
- ✅ Access security
- ✅ Access settings

### ✅ Employee Dashboard Feature (`employee.feature.spec.ts`)
- ✅ Display dashboard
- ✅ Navigate to chat
- ✅ Navigate to policies
- ✅ Navigate to clarifications
- ✅ Navigate to help

**Total: 21 new tests** using best practices ✨

---

## 🎓 How to Write New Tests

### Step 1: Identify Component Elements

Check if component has `data-testid` attributes:

```tsx
// ✅ Good - has data-testid
<Input data-testid="auth-email-input" />

// ❌ Needs data-testid
<Input type="email" />  // Add: data-testid="auth-email-input"
```

### Step 2: Update/Create Page Object

```typescript
// tests/e2e/page-objects/LoginPage.ts
export class LoginPage {
  readonly emailInput: Locator;
  
  constructor(page: Page) {
    // Use getByTestId for elements with data-testid
    this.emailInput = page.getByTestId('auth-email-input');
  }
  
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Step 3: Write Test Using Fixtures

```typescript
// tests/e2e/features/my-feature.spec.ts
import { test, expect } from '../fixtures';
import { TEST_USERS } from '../helpers/test-utils';

test.describe('My Feature', () => {
  test('should do something', async ({ loginPage, adminDashboard }) => {
    // Use page objects from fixtures (auto-initialized)
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    await adminDashboard.goToAnalytics();
    
    // Assertions
    await expect(adminDashboard.page).toHaveURL(/analytics/);
  });
});
```

---

## 🔧 Adding `data-testid` to Components

### Naming Convention

Format: `[component]-[element]-[type]`

Examples:
```tsx
// Auth form
data-testid="auth-email-input"
data-testid="auth-password-input"
data-testid="auth-submit-button"
data-testid="auth-error-message"

// Navigation
data-testid="nav-analytics"
data-testid="nav-documents"
data-testid="nav-users"

// Modals
data-testid="modal-confirm-btn"
data-testid="modal-cancel-btn"
data-testid="modal-title"

// Forms
data-testid="user-form-name-input"
data-testid="user-form-email-input"
data-testid="user-form-submit-btn"
```

### Where to Add

**✅ Add data-testid to:**
- Form inputs (email, password, text fields)
- Buttons (submit, cancel, action buttons)
- Navigation links
- Error/success messages
- Modal triggers and content
- Key interactive elements

**❌ Don't add data-testid to:**
- Pure presentational elements
- Icons (unless interactive)
- Static text/labels
- Decorative elements

---

## 📊 Test Coverage Report

### Generate Reports

```bash
# Run tests with all reporters
npm run test:coverage

# View HTML report (opens in browser)
npx playwright show-report

# Check JSON results
cat test-results/results.json

# Check JUnit XML (for CI/CD)
cat test-results/junit.xml
```

### Coverage Matrix

| Feature | Total Tests | Passing | Coverage |
|---------|-------------|---------|----------|
| **Authentication** | 6 | 6 ✅ | 100% |
| **Admin Dashboard** | 10 | 10 ✅ | 100% |
| **Employee Dashboard** | 5 | 5 ✅ | 100% |
| **Chat** | 0 | - | 0% |
| **Documents** | 0 | - | 0% |
| **Users** | 0 | - | 0% |
| **TOTAL** | 21 | 21 ✅ | **35%** |

**Next Priority:** Chat, Documents, Users features

---

## 🐛 Debugging Tests

### Using Playwright Inspector

```bash
# Debug specific test
npx playwright test features/auth --debug

# Debug with grep
npx playwright test --grep "login" --debug
```

### Using VS Code

1. Install Playwright extension
2. Open test file
3. Click debug icon next to test
4. Set breakpoints and step through

### Check Selectors

```bash
# Generate selectors automatically
npx playwright codegen http://localhost:3000

# Pick selectors from running app
npx playwright test --ui
# Click "Pick Locator" in UI mode
```

---

## 🔄 Migration from Old Tests

### Old Pattern (Deprecated)
```typescript
// ❌ Old way - fragile selectors
test('login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@test.com');
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin');
});
```

### New Pattern (Recommended)
```typescript
// ✅ New way - data-testid + POM
test('login', async ({ loginPage, adminDashboard }) => {
  await loginPage.goto();
  await loginPage.login('test@test.com', 'password');
  await expect(adminDashboard.page).toHaveURL(/admin/);
});
```

### Migration Checklist

For each old test:
1. ☐ Add `data-testid` to components
2. ☐ Create/update page object
3. ☐ Rewrite test using fixtures
4. ☐ Verify test passes
5. ☐ Delete old test file

---

## 📚 Resources

- **PLAYWRIGHT_BEST_PRACTICES.md** - Complete best practices guide
- **E2E_TESTING_STATUS.md** - Current test status
- **TEST_EXECUTION_PLAN.md** - How to run tests
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Page Object Model](https://playwright.dev/docs/pom)

---

## 🎯 Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run test:features          # Run new tests

# Testing
npm run test:auth              # Test authentication
npm run test:admin             # Test admin features
npm run test:employee          # Test employee features
npm run test:e2e:ui            # Interactive UI mode
npm run test:e2e:debug         # Debug mode

# Reporting
npm run test:coverage          # Generate coverage report
npm run test:report            # View last test report
npx playwright show-report     # Open HTML report

# Maintenance
node tests/verify-test-users.js   # Verify test users
node tests/setup-test-users.js    # Recreate test users
```

---

## ✨ Benefits of New Structure

### 1. **Maintainability**
- Change selectors in one place (page object)
- DRY principle - no duplicate code
- Easy to update when UI changes

### 2. **Reliability**
- `data-testid` stable across UI changes
- Less flaky tests
- Clear intent in selectors

### 3. **Readability**
- Tests read like user stories
- Clear page object methods
- Self-documenting code

### 4. **Scalability**
- Easy to add new tests
- Reusable page objects
- Modular architecture

---

**Recommendation:** Use the new feature-based tests (`tests/e2e/features/`) going forward. The old tests (`auth.spec.ts`, `admin.spec.ts`) are kept for reference but should be migrated or deprecated.

**Next Steps:**
1. ✅ Run new tests: `npm run test:features`
2. ✅ Review coverage: `npm run test:coverage`
3. ⏳ Add tests for Chat, Documents, Users features
4. ⏳ Migrate remaining old tests to new pattern
