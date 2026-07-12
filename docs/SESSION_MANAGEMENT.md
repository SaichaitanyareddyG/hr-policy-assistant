# Session Management & Auto Logout

## Overview

PolicyPal AI implements comprehensive session management with automatic logout for security. The system monitors user sessions and activity to protect against unauthorized access.

## Features

### 1. **Session Expiry (1 Hour)**
- Sessions automatically expire after **1 hour** of initial login
- Cookie `maxAge` set to 3600 seconds (1 hour)
- HttpOnly, SameSite cookies for security
- Automatic token refresh handled by Supabase

### 2. **Idle Timeout (30 Minutes)**
- Users are automatically logged out after **30 minutes of inactivity**
- Activity is tracked via mouse, keyboard, scroll, touch events
- More secure than session expiry alone

### 3. **Warning Before Logout**
- Warning dialog appears **5 minutes before** auto logout
- Shows countdown timer in human-readable format
- Users can choose to:
  - **Stay Logged In** - Extends session by refreshing token
  - **Logout Now** - Immediate logout

### 4. **Automatic Session Refresh**
- Sessions are checked every **60 seconds** for validity
- Idle status checked every **10 seconds**
- Automatic token refresh when user interacts
- Prevents unnecessary logouts for active users

### 5. **Logout Reason Display**
- Users redirected to login page with reason parameter
- Clear message explaining why they were logged out:
  - "Session expired"
  - "Logged out due to inactivity"
  - "Manual logout"

---

## Configuration

All session settings are centralized in `lib/config.ts`:

```typescript
export const AUTH_CONFIG = {
  cookieName: 'sb-auth-token',
  sessionDuration: 3600,              // 1 hour (in seconds)
  idleTimeout: 1800,                  // 30 minutes (in seconds)
  sessionCheckInterval: 60000,        // Check every 60 seconds
  logoutWarningTime: 300,             // Warn 5 minutes before logout (in seconds)
  passwordMinLength: 8,
};
```

### Recommended Settings

| Setting | Production | Development | Description |
|---------|-----------|-------------|-------------|
| `sessionDuration` | 3600 (1 hour) | 7200 (2 hours) | Total session length |
| `idleTimeout` | 1800 (30 min) | 3600 (1 hour) | Inactivity timeout |
| `sessionCheckInterval` | 60000 (1 min) | 60000 (1 min) | Check frequency |
| `logoutWarningTime` | 300 (5 min) | 300 (5 min) | Warning time |

---

## Architecture

### Components

1. **`hooks/useSessionMonitor.ts`** - Core session monitoring logic
   - Tracks user activity
   - Monitors session validity
   - Handles auto logout
   - Provides session extension

2. **`components/auth/SessionMonitor.tsx`** - Warning dialog UI
   - Shows expiry/idle warnings
   - Countdown timer
   - Stay logged in / Logout buttons

3. **`components/auth/AuthProvider.tsx`** - Client wrapper
   - Wraps authenticated layouts
   - Initializes SessionMonitor
   - Works with Server Components

4. **`lib/supabase/client.ts`** - Browser client config
   - Auth persistence settings
   - Auto token refresh
   - Cookie storage key

5. **`lib/supabase/server.ts`** - Server client config
   - Cookie maxAge enforcement
   - HttpOnly, Secure flags
   - SameSite protection

6. **`lib/supabase/middleware.ts`** - Middleware config
   - Session refresh on requests
   - Auto redirect expired sessions
   - Protected route checking

---

## User Experience Flow

### Normal Session Flow

```
User logs in
    ↓
Session created (1 hour expiry)
    ↓
User interacts with app
    ↓
Activity tracked continuously
    ↓
Token auto-refreshes on interaction
    ↓
Session extended automatically
```

### Idle Timeout Flow

```
User stops interacting
    ↓
Idle time increases (checked every 10s)
    ↓
24 minutes idle (80% of 30 min)
    ↓
Warning dialog appears: "6 minutes until logout"
    ↓
User has 2 choices:
    ├─ Click "Stay Logged In" → Session refreshed, timer reset
    └─ Do nothing or click "Logout Now" → Auto logout at 30 minutes
```

### Session Expiry Flow

```
User logged in for 55 minutes
    ↓
Session check detects 5 minutes remaining
    ↓
Warning dialog appears: "5 minutes until logout"
    ↓
User has 2 choices:
    ├─ Click "Stay Logged In" → Token refreshed, new 1-hour session
    └─ Do nothing → Auto logout at 60 minutes
```

---

## Security Features

### 1. **Cookie Security**
```typescript
{
  httpOnly: true,           // JavaScript cannot access
  secure: true,             // HTTPS only in production
  sameSite: 'lax',          // CSRF protection
  maxAge: 3600,             // 1 hour expiry
}
```

### 2. **Token Refresh**
- Automatic token refresh handled by Supabase
- Only refreshes for active users
- Expired tokens cannot be refreshed
- Refresh fails → automatic logout

### 3. **Activity Tracking**
- Mouse movements, clicks
- Keyboard input
- Scrolling
- Touch events
- No sensitive data stored

### 4. **Protected Routes**
Middleware automatically redirects unauthenticated users:
```typescript
const isProtectedRoute = 
  url.pathname.startsWith('/admin') || 
  url.pathname.startsWith('/employee');

if (isProtectedRoute && !user) {
  return NextResponse.redirect(new URL('/login', request.url));
}
```

---

## API Reference

### useSessionMonitor Hook

```typescript
import { useSessionMonitor } from '@/hooks/useSessionMonitor';

function MyComponent() {
  const {
    isSessionValid,      // boolean - Is session still valid?
    isIdle,              // boolean - Is user idle?
    showWarning,         // boolean - Show warning dialog?
    timeUntilLogout,     // number - Seconds until auto logout
    lastActivity,        // Date - Last user activity timestamp
    updateActivity,      // function - Manually update activity
    extendSession,       // function - Refresh session token
    logout,              // function - Manual logout
  } = useSessionMonitor();
}
```

### Session Extension

```typescript
// Extend session manually
const extendSession = async () => {
  const success = await supabase.auth.refreshSession();
  if (success) {
    // Session extended by 1 hour
    // Activity timer reset
  }
};
```

### Manual Logout

```typescript
// Logout with custom reason
await supabase.auth.signOut();
router.push('/login?reason=Manual logout');
```

---

## Testing

### Test Session Expiry

1. **Reduce session duration** (dev only):
   ```typescript
   // lib/config.ts
   sessionDuration: 120, // 2 minutes for testing
   logoutWarningTime: 30, // 30 seconds warning
   ```

2. **Login and wait** 1.5 minutes
3. **Warning should appear** at 1:30
4. **Auto logout** at 2:00 if no action

### Test Idle Timeout

1. **Reduce idle timeout** (dev only):
   ```typescript
   // lib/config.ts
   idleTimeout: 120, // 2 minutes for testing
   ```

2. **Login and stay idle** (no mouse/keyboard)
3. **Warning should appear** at 1:36 (80% of 2 min)
4. **Auto logout** at 2:00 if no action

### Test Session Extension

1. **Login and wait** for warning dialog
2. **Click "Stay Logged In"**
3. **Verify**:
   - Dialog closes
   - Session refreshed (check browser dev tools → Application → Cookies)
   - Timer reset

### Test Activity Tracking

1. **Login and wait** until near idle timeout
2. **Move mouse or type** before timeout
3. **Verify**:
   - No warning appears
   - Timer resets
   - Session remains active

---

## Troubleshooting

### Warning Dialog Not Showing

**Possible Causes:**
- SessionMonitor not imported in layout
- AuthProvider not wrapping content
- alert-dialog component missing

**Solution:**
```tsx
// app/admin/layout.tsx or app/employee/layout.tsx
import { AuthProvider } from '@/components/auth/AuthProvider';

return (
  <AuthProvider>
    {/* Your layout content */}
  </AuthProvider>
);
```

### Session Not Expiring

**Possible Causes:**
- Cookie maxAge not set
- Session duration too long
- Auto refresh preventing expiry

**Solution:**
Check `lib/supabase/server.ts` and `lib/supabase/middleware.ts`:
```typescript
cookieStore.set({ 
  name, 
  value, 
  maxAge: AUTH_CONFIG.sessionDuration, // Must be set
});
```

### Auto Logout Too Aggressive

**Solution:**
Increase timeouts in `lib/config.ts`:
```typescript
sessionDuration: 7200,  // 2 hours
idleTimeout: 3600,      // 1 hour
```

### User Never Goes Idle

**Possible Causes:**
- Activity listeners not attached
- Background processes triggering activity

**Solution:**
Check console logs during idle timeout. Should see:
- "Auto logout: Logged out due to inactivity"

---

## Best Practices

### 1. **Production Settings**
- Session: 1-2 hours max
- Idle: 30 minutes recommended
- Warning: 5 minutes minimum

### 2. **User Communication**
- Clear warning messages
- Countdown timer visible
- Easy to extend session

### 3. **Security**
- Always use HttpOnly cookies
- Enable Secure flag in production
- SameSite='lax' minimum

### 4. **Monitoring**
- Log auto logout events
- Track session extension frequency
- Monitor idle timeout triggers

### 5. **Testing**
- Test with short durations in dev
- Verify all warning scenarios
- Check protected route redirects

---

## Related Files

| File | Purpose |
|------|---------|
| `hooks/useSessionMonitor.ts` | Session monitoring logic |
| `components/auth/SessionMonitor.tsx` | Warning dialog UI |
| `components/auth/AuthProvider.tsx` | Client wrapper |
| `lib/config.ts` | Session configuration |
| `lib/supabase/client.ts` | Browser client setup |
| `lib/supabase/server.ts` | Server client setup |
| `lib/supabase/middleware.ts` | Request middleware |
| `middleware.ts` | Route middleware |
| `app/admin/layout.tsx` | Admin layout with auth |
| `app/employee/layout.tsx` | Employee layout with auth |
| `app/(auth)/login/page.tsx` | Login with logout reason |

---

## Compliance

This session management implementation helps with:

- **GDPR** - Automatic session termination reduces data exposure
- **SOC 2** - Idle timeout prevents unauthorized access
- **HIPAA** - Session security for healthcare data
- **PCI DSS** - Secure session management for sensitive data

---

## Future Enhancements

### Potential Improvements

1. **Remember Me Option**
   - Extended session for trusted devices
   - 7-30 day session duration
   - Secure token storage

2. **Session History**
   - Log all sessions in database
   - Track concurrent sessions
   - Force logout from all devices

3. **Geo-based Security**
   - Detect unusual locations
   - Require re-auth for new locations
   - IP whitelist/blacklist

4. **Device Management**
   - See all active sessions
   - Logout individual devices
   - Trusted device list

5. **Adaptive Timeout**
   - Adjust based on user role
   - Admins: shorter timeout
   - Employees: longer timeout

---

## Summary

✅ **Session expires after 1 hour**  
✅ **Auto logout after 30 minutes idle**  
✅ **Warning 5 minutes before logout**  
✅ **Easy session extension**  
✅ **Secure cookie handling**  
✅ **Protected route middleware**  
✅ **Clear logout reasons**  
✅ **Activity tracking**  

Your app now has **enterprise-grade session management**! 🔒

---

**Last Updated**: May 29, 2026  
**Status**: Production Ready  
**Version**: 1.0.0
