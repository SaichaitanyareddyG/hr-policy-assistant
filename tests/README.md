# E2E Testing Guide

## Overview
This project uses Playwright for end-to-end testing with comprehensive scenario coverage including real-world user workflows, integration tests, and performance benchmarks.

## Test Suites

### 📋 Basic Feature Tests
- **auth.spec.ts** - Authentication (login, register, validation)
- **employee-chat.spec.ts** - Chat features (messages, guardrails, history)
- **admin.spec.ts** - Admin dashboard (navigation, documents, users)

### 🎬 Scenario Tests (Real User Workflows)
- **scenarios.spec.ts** - Complete user journeys:
  - New employee onboarding
  - Daily employee usage patterns
  - Admin content management
  - Error recovery flows
  - Edge cases and accessibility

### 🔗 Integration Tests
- **integration.spec.ts** - Cross-feature workflows:
  - Question → AI → History → Analytics
  - Document upload → Processing → Employee access
  - Clarification request workflow
  - Access control and permissions
  - Data persistence

### ⚡ Performance Tests
- **performance.spec.ts** - Load times and responsiveness:
  - Page load benchmarks (< 3s goal)
  - AI response times (< 30s, ideally < 10s)
  - Search performance
  - Network efficiency

## Quick Start

### 1. Setup Test Users
Before running tests, create test accounts in your Supabase database:

**Admin User:**
- Email: `admin@test.com`
- Password: `Test123!@#`
- Role: `admin`

**Employee User:**
- Email: `employee@test.com`
- Password: `Test123!@#`
- Role: `employee`

Update credentials in `tests/e2e/helpers/test-utils.ts` if using different accounts.

### 2. Run Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# View test report
npm run test:report
```

## Test Structure

```
tests/e2e/
├── auth.spec.ts              # Authentication tests (login, register)
├── employee-chat.spec.ts     # Employee chat feature tests
├── admin.spec.ts             # Admin dashboard tests
└── helpers/
    └── test-utils.ts         # Reusable test utilities
```

## Test Coverage

### Authentication (`auth.spec.ts`) - 7 tests
✅ Homepage loads successfully  
✅ Navigation to login page  
✅ Validation errors for empty fields  
✅ Invalid credentials show error  
✅ Successful employee login  
✅ Successful admin login  
✅ Navigation to register page

### Employee Chat (`employee-chat.spec.ts`) - 6 tests
✅ Chat interface displays correctly  
✅ Send message and receive AI response  
✅ Guardrails reject off-topic questions  
✅ Conversation history maintained  
✅ Clear chat history  
✅ Sources displayed when available

### Admin Dashboard (`admin.spec.ts`) - 11 tests
✅ Dashboard displays correctly  
✅ Navigate to analytics page  
✅ Navigate to documents page  
✅ Navigate to users page  
✅ Access audit logs  
✅ Document upload page  
✅ Approved FAQs page  
✅ Clarifications page  
✅ Document list display  
✅ Search documents  
✅ View document details

### Real-World Scenarios (`scenarios.spec.ts`) - 20+ tests
✅ Complete employee onboarding journey  
✅ Daily usage: Check policies and ask questions  
✅ Submit clarification requests  
✅ Search and read policy documents  
✅ Admin uploads and processes documents  
✅ Review and approve FAQs  
✅ Handle clarification requests  
✅ Monitor system analytics  
✅ Invite new employees  
✅ Review audit trail  
✅ Error recovery (network failures, session expiration)  
✅ Edge cases (long messages, special characters)  
✅ Accessibility (keyboard navigation, ARIA labels)

### Integration Tests (`integration.spec.ts`) - 10+ tests
✅ End-to-end question flow  
✅ Document upload to employee query  
✅ Complete clarification workflow  
✅ Role-based access control  
✅ Cross-feature search consistency  
✅ Data persistence across refreshes  
✅ Session management  
✅ Real-time updates

### Performance Tests (`performance.spec.ts`) - 12+ tests
✅ Page load times (< 3s goal)  
✅ Login performance  
✅ Chat responsiveness  
✅ Large data handling  
✅ AI response times (< 30s)  
✅ Search performance  
✅ Memory leak detection  
✅ Network efficiency  
✅ Progressive loading

**Total: 70+ comprehensive tests covering all critical paths**

## Best Practices

### 1. Test Isolation
- Each test is independent
- Tests clean up after themselves
- No shared state between tests

### 2. Stable Selectors
Tests use stable selectors in this order:
1. Text content (most reliable)
2. ARIA labels
3. Data-testid attributes
4. CSS classes (least reliable)

### 3. Timeouts
- Default: 5 seconds
- AI responses: 30 seconds
- Navigation: 10 seconds

### 4. Parallel Execution
Tests run sequentially by default to avoid database conflicts. Adjust in `playwright.config.ts`:

```typescript
workers: process.env.CI ? 1 : 1, // Increase for parallel tests
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install dependencies
  run: npm ci
  
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium
  
- name: Run E2E tests
  run: npm run test:e2e
  env:
    BASE_URL: ${{ secrets.BASE_URL }}
    
- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Environment Variables

Create `.env.test` for test-specific config:

```bash
# Base URL for tests
BASE_URL=http://localhost:3004

# Supabase (use test project)
NEXT_PUBLIC_SUPABASE_URL=your-test-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-key
```

## Debugging Tests

### Visual Debug Mode
```bash
npm run test:e2e:debug
```
- Step through tests line by line
- Inspect page state
- Modify selectors on the fly

### UI Mode
```bash
npm run test:e2e:ui
```
- Interactive test runner
- Time travel through test execution
- View screenshots and videos

### VS Code Integration
Install "Playwright Test for VS Code" extension:
- Run tests from editor
- Set breakpoints
- View results inline

## Common Issues

### Test Timeouts
If tests timeout, check:
- Dev server is running (`npm run dev`)
- Database is accessible
- Network connection stable

### Flaky Tests
If tests fail intermittently:
- Increase timeouts for slow operations
- Add explicit waits for dynamic content
- Check for race conditions

### Authentication Failures
- Verify test users exist in database
- Check credentials in `test-utils.ts`
- Ensure Supabase is configured correctly

## Adding New Tests
Testing Strategy](./TESTING_STRATEGY.md) - Comprehensive best practices guide
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

## Test Strategy

For detailed information about:
- Test organization and pyramid strategy
- Best practices and patterns
- Debugging techniques
- Performance benchmarks
- Maintenance guidelines

See **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)** for the complete guide.
2. Import helpers from `test-utils.ts`
3. Use descriptive test names
4. Follow AAA pattern:
   - **Arrange**: Setup test data
   - **Act**: Perform actions
   - **Assert**: Verify results

Example:
```typescript
import { test, expect } from '@playwright/test';
import { loginAsEmployee } from './helpers/test-utils';

test('should display user profile', async ({ page }) => {
  // Arrange
  await loginAsEmployee(page);
  
  // Act
  await page.click('text=Profile');
  
  // Assert
  await expect(page.locator('h1')).toContainText('Profile');
});
```

## Performance Testing

Monitor test execution time:
```bash
npm run test:e2e -- --reporter=json
```

Analyze slow tests in `test-results/results.json`.

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
