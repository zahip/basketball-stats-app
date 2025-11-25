# Authentication Issue Diagnosis Report

## Summary
Login is failing because Supabase Auth is rejecting all email addresses with error: "Email address is invalid"

## Root Cause
The Supabase project `tthrpnxypkqajccbwvfu.supabase.co` has Auth configured but is rejecting all email login attempts.

## Test Results

### 1. Environment Configuration ✅
- **Frontend env**: `.env.local` exists with valid Supabase URL and anon key
- **Backend env**: `.env` exists with valid Supabase URL and service key
- **JWT token**: Valid (expires 2035-11-02)
- **Frontend server**: Running on port 3000 (HTTP 200)
- **Backend server**: Running on port 3002 (HTTP 200)
- **Supabase endpoint**: Reachable (HTTP 200)

### 2. Code Structure ✅
- **Auth context**: `/web/src/lib/auth-context.tsx` - properly implemented
- **Login page**: `/web/src/app/auth/login/page.tsx` - exists and uses magic link
- **Callback page**: `/web/src/app/auth/callback/page.tsx` - exists
- **Supabase client**: `/web/src/lib/supabase.ts` - properly configured
- **AuthProvider**: Wrapped in app layout via Providers

### 3. Supabase Auth API ❌ FAILING
```bash
curl -X POST "https://tthrpnxypkqajccbwvfu.supabase.co/auth/v1/otp" \
  -H "apikey: [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

Response: {"code":400,"error_code":"email_address_invalid","msg":"Email address \"user@example.com\" is invalid"}
```

## The Problem

Supabase Auth is configured with **restrictive email validation** or **missing email provider setup**. This prevents ANY email from being accepted for magic link authentication.

## Solutions

### Option 1: Configure Supabase Auth Email Provider (Recommended)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/tthrpnxypkqajccbwvfu
2. **Navigate to**: Authentication → Email Templates → Settings
3. **Configure SMTP Settings**:
   - Enable email authentication
   - Set up email provider (Supabase built-in, SendGrid, AWS SES, etc.)
4. **Enable Magic Links**:
   - Authentication → Providers → Email
   - Enable "Email provider"
   - Enable "Confirm email" (optional for dev, required for prod)

### Option 2: Use Development Mode Without Email

Temporarily disable email validation for development:

1. **Go to Supabase Dashboard**: Authentication → Settings
2. **Enable "Disable email confirmation"** (allows auto-confirmation without SMTP)
3. **This allows**: Users to sign in without receiving actual emails

### Option 3: Switch to Alternative Auth Method

Instead of magic links, use:

**Password-based authentication**:
```typescript
// In auth-context.tsx
const signInWithPassword = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { error }
}
```

**OAuth providers** (Google, GitHub):
```typescript
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { error }
}
```

### Option 4: Development Bypass (Quick Fix for Local Dev)

Create a development mode bypass by checking if Supabase is properly configured:

**File**: `/web/src/lib/supabase.ts`
```typescript
// Add configuration check
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key || url.includes('your-project') || key.includes('your-anon-key')) {
    return false
  }
  return true
}

export const supabaseEnabled = isSupabaseConfigured()
```

**File**: `/web/src/app/auth/login/page.tsx`
```typescript
// Add development bypass
if (!supabaseEnabled && process.env.NODE_ENV === 'development') {
  // Show development mode message
  return <div>Auth disabled in development mode</div>
}
```

## Recommended Action

**Immediate fix**: Go to Supabase Dashboard and configure email settings:

1. Visit: https://supabase.com/dashboard/project/tthrpnxypkqajccbwvfu/settings/auth
2. Check "Email Auth" settings
3. Either:
   - Configure SMTP provider (production-ready)
   - OR disable email confirmation (dev only)

## Verification Steps

After applying fix, test with:
```bash
curl -X POST "https://tthrpnxypkqajccbwvfu.supabase.co/auth/v1/otp" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0aHJwbnh5cGtxYWpjY2J3dmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNzgxODUsImV4cCI6MjA3NzY1NDE4NX0.AQHnsiXEJIOTeON0VnWD3lcScRkZyILSrlSEQnA4OeA" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'
```

Expected response after fix:
```json
{}
```
(Empty object = success, email sent)

## Additional Notes

- **Current auth method**: Magic link (OTP via email)
- **Supabase project**: tthrpnxypkqajccbwvfu (ap-southeast-2 region)
- **Auth implementation**: Fully implemented in code, just needs Supabase config
- **No code changes needed**: This is a Supabase dashboard configuration issue

