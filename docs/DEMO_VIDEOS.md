# 🎬 Demo Videos Documentation

Complete guide for generating and using Playwright demo videos for PolicyPal AI.

---

## Overview

PolicyPal AI uses Playwright to automatically capture real user workflows as demo videos. These videos showcase actual application features and are perfect for:

- 📚 **Documentation** - Show how features work
- 🎤 **Presentations** - Professional demos
- 👥 **Onboarding** - Train new team members
- 🐛 **Debugging** - Visual test failure analysis

---

## Video Categories

### 🔐 Authentication & Access Control

**What's Included:**
- Employee login and dashboard navigation
- Admin login with role-based access
- Invite-based onboarding flow
- Error handling for invalid credentials

**Demo Script:**
```bash
npm run test:demo
```

### 💬 Employee Experience

**What's Included:**
- Asking HR policy questions
- Viewing chat history
- Browsing policy documents
- Requesting clarifications from HR
- Navigation between sections

**Demo Script:**
```bash
RECORD_VIDEO=true npx playwright test features/employee.feature.spec.ts
```

### 👥 Admin Features

**What's Included:**
- Uploading and processing documents
- Managing users and sending invitations
- Viewing analytics dashboard
- Handling employee clarifications
- Reviewing security audit logs
- Navigating admin sections

**Demo Script:**
```bash
RECORD_VIDEO=true npx playwright test features/admin.feature.spec.ts
```

### 🔄 Integration Workflows

**What's Included:**
- End-to-end scenarios
- Multi-feature workflows
- Error recovery flows
- Edge case handling

**Demo Script:**
```bash
RECORD_VIDEO=true npx playwright test integration.spec.ts
```

---

## Configuration

### Playwright Configuration

Located in `playwright.config.ts`:

```typescript
use: {
  video: process.env.RECORD_VIDEO === 'true' ? 'on' : 'retain-on-failure',
  
  ...(process.env.RECORD_VIDEO === 'true' && {
    video: {
      mode: 'on',
      size: { width: 1280, height: 720 },
    },
  }),
}
```

### Recording Modes

**Development Mode (Default):**
```typescript
video: 'retain-on-failure'
```
- Only saves videos when tests fail
- Helps debug test failures
- Minimal disk space usage
- Automatic cleanup of passed tests

**Demo Mode (Documentation):**
```bash
RECORD_VIDEO=true npm run test:features
```
- Records all tests (pass or fail)
- HD quality (1280x720)
- Perfect for showcasing features
- Saved as WebM format

---

## Scripts

### Quick Commands

```bash
# Authentication flows only (5 videos, ~5-10s)
npm run test:demo

# All feature tests (20+ videos, ~60s)
npm run test:demo:all

# Custom selection
RECORD_VIDEO=true npx playwright test [path-to-test]
```

### Script Definitions

From `package.json`:

```json
{
  "scripts": {
    "test:demo": "RECORD_VIDEO=true playwright test features/auth.feature.spec.ts --project=chromium --reporter=list",
    "test:demo:all": "RECORD_VIDEO=true playwright test features/ --project=chromium --reporter=html,list"
  }
}
```

---

## Output

### Video Format

- **Format:** WebM
- **Resolution:** 1280x720 (HD)
- **Codec:** VP8/VP9
- **Audio:** No audio track
- **Average Size:** 60KB - 200KB per video (30s-2min tests)

### File Location

```
test-results/
├── features-auth-feature-Auth-[hash]-[test-name]-chromium/
│   ├── video.webm
│   └── trace.zip
├── features-admin-feature-Admin-[hash]-[test-name]-chromium/
│   ├── video.webm
│   └── trace.zip
└── ...
```

### Finding Videos

```bash
# List all videos
find test-results -name "*.webm"

# List with sizes
find test-results -name "*.webm" -exec ls -lh {} \;

# Count videos
find test-results -name "*.webm" | wc -l
```

---

## Generating Demo Videos

### Step-by-Step

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Run tests with recording:**
   ```bash
   npm run test:demo
   ```

3. **Wait for completion:**
   - Watch terminal for test results
   - Videos saved automatically

4. **Find videos:**
   ```bash
   find test-results -name "*.webm"
   ```

5. **View videos:**
   ```bash
   # macOS
   open test-results/[test-folder]/video.webm
   
   # Linux
   xdg-open test-results/[test-folder]/video.webm
   
   # Windows
   start test-results/[test-folder]/video.webm
   ```

### Example Output

```bash
$ npm run test:demo

Running 5 tests using 1 worker

  ✓ should load homepage successfully (1.2s)
  ✓ should navigate to login page from homepage (908ms)
  ✓ should show error for invalid credentials (1.8s)
  ✓ should successfully login as employee (1.6s)
  ✓ should successfully login as admin (1.8s)

  5 passed (7.6s)

Videos saved to:
  test-results/features-auth-*/video.webm
```

---

## Using Demo Videos

### In Documentation

**Markdown Embed (GitHub):**
```markdown
## Feature Demo

![Demo Video](./videos/employee-chat-demo.webm)
```

**HTML Embed:**
```html
<video width="640" height="360" controls>
  <source src="./videos/employee-chat-demo.webm" type="video/webm">
  Your browser does not support video playback.
</video>
```

### In Presentations

1. Export videos from test-results/
2. Add to presentation software (PowerPoint, Keynote, Google Slides)
3. Set to autoplay or click-to-play
4. Add captions if needed

### For Onboarding

1. **Create video library:**
   ```bash
   mkdir -p docs/videos
   ```

2. **Organize by feature:**
   ```bash
   docs/videos/
   ├── auth/
   │   ├── login-employee.webm
   │   └── login-admin.webm
   ├── employee/
   │   ├── chat-demo.webm
   │   └── policies-demo.webm
   └── admin/
       ├── upload-document.webm
       └── manage-users.webm
   ```

3. **Link in onboarding docs**

### For Bug Reports

Videos automatically saved when tests fail:
```bash
# Run test
npm run test:e2e

# If test fails, video saved automatically
# Attach video to bug report
```

---

## Best Practices

### Recording

✅ **Do:**
- Use `RECORD_VIDEO=true` for demos only
- Record on clean test database
- Use realistic test data
- Keep tests focused (1-2 min max)
- Test on stable dev server

❌ **Don't:**
- Record all tests all the time (disk space)
- Include sensitive data in demos
- Make videos too long (over 5 min)
- Commit videos to git (use gitignore)

### Organization

**Recommended Structure:**
```
docs/
├── videos/          # Curated demo videos for docs
│   ├── README.md   # Video index
│   └── *.webm
test-results/        # Temporary test artifacts (gitignored)
└── */video.webm
```

### Performance

- Videos are ~100-200KB for typical tests
- WebM format offers good compression
- HD resolution (1280x720) is sufficient
- Clean up test-results/ periodically:
  ```bash
  rm -rf test-results/
  ```

---

## Troubleshooting

### Videos Not Generated

**Check:**
1. Environment variable set: `RECORD_VIDEO=true`
2. Test completed successfully
3. test-results/ folder exists and is writable
4. Sufficient disk space

### Videos Too Large

**Solutions:**
1. Reduce test duration
2. Limit browser viewport size
3. Use `video: 'retain-on-failure'` by default
4. Compress with ffmpeg if needed:
   ```bash
   ffmpeg -i input.webm -c:v libvpx-vp9 -crf 30 output.webm
   ```

### Can't Play Videos

**Fixes:**
- Install codec pack (Windows)
- Use VLC media player
- Convert to MP4 if needed:
  ```bash
  ffmpeg -i input.webm -c:v libx264 output.mp4
  ```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests with Videos

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with video
        run: RECORD_VIDEO=true npm run test:e2e
        env:
          BASE_URL: http://localhost:3000
      
      - name: Upload videos on failure
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-videos
          path: test-results/**/video.webm
```

---

## Related Documentation

- [Testing Guide](../TESTING_GUIDE_NEW.md)
- [Playwright Best Practices](../PLAYWRIGHT_BEST_PRACTICES.md)
- [Architecture](ARCHITECTURE.md)

---

**Last Updated:** 2026-07-12
