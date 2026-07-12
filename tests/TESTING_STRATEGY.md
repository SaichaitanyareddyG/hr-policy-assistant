# Testing Strategy & Best Practices

## Test Organization

```
tests/e2e/
├── auth.spec.ts              # Basic authentication tests
├── employee-chat.spec.ts     # Employee chat feature tests  
├── admin.spec.ts             # Admin dashboard tests
├── scenarios.spec.ts         # Real-world user scenarios ⭐
├── integration.spec.ts       # Cross-feature integration tests ⭐
├── performance.spec.ts       # Performance benchmarks ⭐
└── helpers/
    └── test-utils.ts         # Reusable utilities
```

## Test Categories

### 1. **Basic Tests** (`auth.spec.ts`, `employee-chat.spec.ts`, `admin.spec.ts`)
- **Purpose**: Verify individual features work in isolation
- **When to run**: Every code change
- **Duration**: Fast (1-3 minutes)
- **Coverage**: Core functionality

### 2. **Scenario Tests** (`scenarios.spec.ts`) ⭐
- **Purpose**: Simulate real user journeys
- **When to run**: Before releases, nightly builds
- **Duration**: Medium (5-10 minutes)
- **Coverage**: User workflows, edge cases, error recovery

**Key Scenarios:**
- New employee onboarding
- Daily employee usage patterns
- Admin content management workflows
- Error recovery and edge cases
- Accessibility compliance

### 3. **Integration Tests** (`integration.spec.ts`) ⭐
- **Purpose**: Verify features work together correctly
- **When to run**: Before releases
- **Duration**: Medium-Long (10-20 minutes)
- **Coverage**: Cross-feature interactions, data flow

**Key Integrations:**
- Question flow: Employee → AI → History → Analytics
- Document upload: Admin → Processing → Employee access
- Clarification workflow: Employee → Admin → Response
- Access control: Role-based permissions
- Data persistence across sessions

### 4. **Performance Tests** (`performance.spec.ts`) ⭐
- **Purpose**: Ensure acceptable load times and responsiveness
- **When to run**: Before releases, after major changes
- **Duration**: Medium (5-10 minutes)
- **Coverage**: Page load times, API response times, resource usage

**Key Metrics:**
- Homepage: < 3 seconds
- Login: < 2 seconds
- AI responses: < 30 seconds (< 10 seconds ideal)
- Search: < 3 seconds
- Navigation: < 2 seconds

## Test Pyramid Strategy

```
        /\
       /  \      E2E Scenarios (Few, Slow, High Value)
      /____\     ← scenarios.spec.ts, integration.spec.ts
     /      \    
    /        \   Feature Tests (More, Medium Speed)
   /__________\  ← auth.spec.ts, employee-chat.spec.ts, admin.spec.ts
  /            \
 /              \ Unit Tests (Many, Fast, Low Level)
/________________\ ← lib/**/*.test.ts (future)
```

## Best Practices

### 1. Test Naming
✅ **Good:**
```typescript
test('Employee can ask vacation policy question and receive answer with sources', async ({ page }) => {
```

❌ **Bad:**
```typescript
test('test1', async ({ page }) => {
```

**Pattern:** `<Actor> can <action> and <expected outcome>`

### 2. Test Structure (AAA Pattern)

```typescript
test('should display chat interface', async ({ page }) => {
  // ARRANGE - Setup test data
  await loginAsEmployee(page);
  await page.click('text=/chat/i');
  
  // ACT - Perform action
  const chatInput = page.locator('textarea[placeholder*="question"]');
  
  // ASSERT - Verify outcome
  await expect(chatInput).toBeVisible();
  await expect(page.locator('button:has-text("Send")')).toBeVisible();
});
```

### 3. Stable Selectors Priority

1. **Text content** (most stable)
   ```typescript
   await page.click('text=Login');
   await page.locator('text=/sign in|login/i');
   ```

2. **ARIA labels** (semantic)
   ```typescript
   await page.click('[aria-label="User menu"]');
   ```

3. **Data-testid** (explicit test hooks)
   ```typescript
   await page.click('[data-testid="submit-button"]');
   ```

4. **CSS classes** (least stable, avoid if possible)
   ```typescript
   await page.click('.btn-primary'); // Only if no better option
   ```

### 4. Waiting Strategies

✅ **Good - Wait for specific condition:**
```typescript
await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 5000 });
await page.waitForURL('/dashboard');
await page.waitForLoadState('networkidle');
```

❌ **Bad - Arbitrary timeouts:**
```typescript
await page.waitForTimeout(5000); // Flaky!
```

**Exception:** Use `waitForTimeout` only for:
- Debounce delays (short, 500-1000ms)
- Waiting for animations
- Known processing delays

### 5. Test Isolation

Each test should:
- ✅ Be independent (can run alone)
- ✅ Clean up after itself
- ✅ Not depend on other tests
- ✅ Use fresh data

```typescript
test.beforeEach(async ({ page }) => {
  // Fresh login for each test
  await loginAsEmployee(page);
});

test.afterEach(async ({ page }) => {
  // Cleanup if needed
  await page.close();
});
```

### 6. Error Handling

Test both happy and unhappy paths:

```typescript
test('should show error for invalid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'invalid@example.com');
  await page.fill('input[type="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');
  
  // Expect error message
  await expect(page.locator('text=/invalid|incorrect|failed/i')).toBeVisible();
});
```

### 7. Data-Driven Tests

Use loops for testing multiple scenarios:

```typescript
test('should handle special characters in search', async ({ page }) => {
  const testCases = [
    '<script>alert("xss")</script>',
    "'; DROP TABLE--",
    '../../etc/passwd',
  ];
  
  for (const testCase of testCases) {
    await searchInput.fill(testCase);
    // Verify no crash or security issue
  }
});
```

### 8. Parallel Execution

Configure in `playwright.config.ts`:

```typescript
workers: process.env.CI ? 1 : 2, // Parallel on local, sequential on CI
fullyParallel: false, // Use true for independent tests
```

**When to parallelize:**
- ✅ Read-only tests (viewing pages)
- ✅ Tests with isolated test data

**When to avoid:**
- ❌ Tests that modify shared database
- ❌ Tests with race conditions

### 9. Accessibility Testing

Include accessibility checks:

```typescript
test('should be keyboard navigable', async ({ page }) => {
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  
  const focusedElement = await page.evaluateHandle(() => document.activeElement);
  const tagName = await focusedElement.evaluate(el => el?.tagName);
  
  expect(['A', 'BUTTON', 'INPUT']).toContain(tagName);
});

test('should have ARIA landmarks', async ({ page }) => {
  await expect(page.locator('[role="navigation"]')).toBeVisible();
  await expect(page.locator('[role="main"]')).toBeVisible();
});
```

### 10. Performance Benchmarks

Track performance over time:

```typescript
test('chat interface loads quickly', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/employee/chat');
  await page.waitForLoadState('domcontentloaded');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(2000);
  console.log(`✓ Chat loaded in ${loadTime}ms`);
});
```

## Running Tests

### Development
```bash
# Interactive mode - best for writing tests
npm run test:e2e:ui

# Headed mode - see what's happening
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug -- scenarios.spec.ts
```

### CI/CD
```bash
# Run all tests
npm run test:e2e

# Run specific suite
npm run test:e2e -- auth.spec.ts

# Run tests matching pattern
npm run test:e2e -- --grep "employee"
```

### Test Selection Strategy

**On every commit (fast feedback):**
```bash
npm run test:e2e -- auth.spec.ts employee-chat.spec.ts
```

**Before PR merge:**
```bash
npm run test:e2e -- auth.spec.ts employee-chat.spec.ts admin.spec.ts integration.spec.ts
```

**Before release:**
```bash
npm run test:e2e  # All tests including scenarios and performance
```

## Test Maintenance

### When to Update Tests

1. **Feature changes** - Update related test immediately
2. **UI refactoring** - Update selectors if needed
3. **New features** - Add tests before or with feature
4. **Bug fixes** - Add regression test

### Avoiding Flaky Tests

Common causes and solutions:

| Cause | Solution |
|-------|----------|
| Race conditions | Use explicit waits, not timeouts |
| Network delays | Increase timeout for network calls |
| Animation timing | Wait for animation completion |
| Stale selectors | Use more stable selectors |
| Test interdependence | Ensure test isolation |

### Test Code Quality

Treat test code like production code:
- ✅ Extract reusable helpers
- ✅ Use descriptive names
- ✅ Keep tests focused and small
- ✅ Comment complex logic
- ✅ DRY principle (Don't Repeat Yourself)

## Debugging Failed Tests

### 1. Visual Debugging
```bash
npm run test:e2e:debug -- --grep "failing test name"
```

### 2. Screenshots on Failure
Automatically captured in `test-results/`

### 3. Video Recording
Set in `playwright.config.ts`:
```typescript
video: 'retain-on-failure'
```

### 4. Console Logs
```typescript
page.on('console', msg => console.log('Browser:', msg.text()));
```

### 5. Trace Viewer
```bash
npx playwright show-trace test-results/trace.zip
```

## Test Reports

### HTML Report
```bash
npm run test:report
```

### JSON Report
```bash
npm run test:e2e -- --reporter=json
```

### JUnit (for CI)
In `playwright.config.ts`:
```typescript
reporter: [
  ['junit', { outputFile: 'test-results/junit.xml' }]
]
```

## Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| Critical paths (login, chat) | 100% |
| Core features | 80-90% |
| Admin features | 70-80% |
| Edge cases | 50-60% |

## Continuous Improvement

### Weekly Review
- Check for flaky tests (fail rate > 5%)
- Review test execution time (goal: < 15 minutes total)
- Update test data and credentials

### Monthly Review
- Analyze test coverage
- Remove obsolete tests
- Refactor duplicated code
- Update documentation

### After Incidents
- Add regression test for bugs
- Improve test coverage in weak areas
- Update test scenarios based on user issues

## Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Automation Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [AAA Pattern](https://automationpanda.com/2020/07/07/arrange-act-assert-a-pattern-for-writing-good-tests/)
- [Page Object Model](https://playwright.dev/docs/pom) (for scaling)

## Next Steps

1. **Add unit tests** for lib/ functions
2. **Add API tests** for route handlers
3. **Add component tests** for React components (Vitest + Testing Library)
4. **Add visual regression tests** (Playwright visual comparisons)
5. **Load testing** for production (k6, Artillery)

## Questions?

See `tests/README.md` for quick start guide or ask in team chat!
