# Production-Ready Custom CAPTCHA Verification Service — Next.js + Supabase

A lightweight, high-performance, and privacy-preserving security verification service built natively on **Next.js (App Router)** and **Supabase (PostgreSQL)**.

This custom service completely eliminates dependencies on third-party tracking services (such as Google reCAPTCHA or Cloudflare Turnstile), granting full sovereignty over bot mitigation, rate limiting, and visitor experience.

---

## 1. Architecture & Security Model

```
[Browser / Client]
       │
       ▼
1. POST /api/captcha/challenge ────► Generates challenge, stores in DB, returns question + HMAC token
       │
2. User Solves Question (e.g. 14 + 7)
       │
       ▼
3. POST /api/captcha/verify   ────► Verifies answer, marks challenge consumed (atomic 1-time use),
       │                            issues signed verification proof token (5-min TTL)
       ▼
4. Form Submission With Proof  ────► Protected business route calls verifyAndConsumeProof()
                                    Marks proof consumed atomically (one-time use enforced)
```

### Key Security Defenses:
- **Zero Plaintext Storage**: All challenge answers are hashed using HMAC-SHA256 with a private server pepper before database persistence.
- **Atomic One-Time Use**: Stored procedures use PostgreSQL row locking (`SELECT ... FOR UPDATE`) to prevent race conditions, replay attacks, and double-submissions.
- **Cryptographic Token Binding**: Challenges and proofs are signed with HMAC-SHA256 tokens bound to client IP hashes, purpose (`contact-form`, `signup`, `login`), site key, and expiration timestamps.
- **Timing Signal Detection**: Sub-600ms rapid submissions are rejected as automated bot activity.
- **Row Level Security (RLS)**: Anonymous and authenticated direct table access is denied. All verification runs through server-side stored procedures with `SECURITY DEFINER`.
- **Honeypot Shielding**: Includes hidden anti-bot honeypot fields (`hp_nobot_guard`) with `autoComplete="off"` to prevent browser autofill collision while trapping naive scrapers.
- **Fail-Closed Design**: If database or signature validation fails, access is denied.

---

## 2. Supabase SQL Setup

The database schema and atomic procedures are located in:
- `supabase/migrations/20261020_custom_captcha.sql`
- `src/lib/captcha/schema.sql`

### Running the Migration:
You can run the migration script directly via:
```bash
npm run migrate:captcha
```

### Core Database Entities:
1. `captcha_sites`: Multi-site registry managing allowed origins, rate limits, and TTLs.
2. `captcha_challenges`: Ephemeral challenge records storing question, answer hash, client IP hash, attempts, and consumption timestamps.
3. `captcha_proofs`: Ephemeral proof records tracking issued tokens to enforce single-use consumption on protected routes.
4. `captcha_rate_limits`: Atomic sliding-window rate limit counters.
5. **Stored Procedures**:
   - `consume_captcha_challenge()`: Validates answer, increments attempts (max 3), sets `consumed_at`.
   - `consume_captcha_proof()`: Validates proof hash and purpose, sets `consumed_at`.
   - `check_captcha_rate_limit()`: Atomic rate limiter.
   - `cleanup_expired_captcha_records()`: Auto-cleans expired records older than 1 hour.

---

## 3. Environment Variables Configuration

Add the following variables to `.env.local` (local) and Vercel Project Settings (production):

```bash
# Public Site Key identifying the authorized website
NEXT_PUBLIC_CAPTCHA_SITE_KEY="hp_site_live_default"

# Server-Only HMAC Secret (Minimum 32 characters, never exposed to clients)
CAPTCHA_SIGNING_SECRET="your-32-character-random-cryptographic-secret"

# Supabase Transaction Pooler Connection String (Port 6543)
DATABASE_URI="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

---

## 4. API Endpoints

### 1. Request a Challenge
**Endpoint**: `POST /api/captcha/challenge`

**Request Body**:
```json
{
  "siteKey": "hp_site_live_default",
  "purpose": "contact-form",
  "difficulty": "easy"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "challengeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "question": "What is 14 + 8?",
  "type": "math",
  "signedToken": "eyJjaWQiOiIzZm...b5c2",
  "expiresAt": "2026-10-20T17:15:00.000Z",
  "ttlSeconds": 300,
  "audioPrompt": "What is fourteen plus eight?"
}
```

---

### 2. Verify Challenge Answer
**Endpoint**: `POST /api/captcha/verify`

**Request Body**:
```json
{
  "challengeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "answer": "22",
  "signedToken": "eyJjaWQiOiIzZm...b5c2",
  "purpose": "contact-form",
  "siteKey": "hp_site_live_default",
  "elapsedMs": 2400
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "verificationProof": "cproof_eyJwaWQiOi...7da8",
  "expiresAt": "2026-10-20T17:20:00.000Z",
  "ttlSeconds": 300
}
```

**Response (400 Bad Request — Incorrect Answer)**:
```json
{
  "success": false,
  "error": "Incorrect answer. Please try again.",
  "code": "INCORRECT_ANSWER",
  "attemptsLeft": 2
}
```

---

## 5. Frontend React Component Integration

Import and place `<CustomCaptcha />` in any form:

```tsx
import React, { useState, useRef } from 'react';
import { CustomCaptcha, CustomCaptchaHandle } from '@/components/captcha/CustomCaptcha';

export function MyContactForm() {
  const [captchaProof, setCaptchaProof] = useState('');
  const captchaRef = useRef<CustomCaptchaHandle>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaProof) {
      alert('Please complete the security check.');
      return;
    }

    const response = await fetch('/api/leads/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Morgan',
        email: 'alex@example.com',
        captchaProof,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      // If security verification failed, reset captcha
      if (result.message?.includes('Security') || result.errors?.captcha) {
        captchaRef.current?.reset();
        setCaptchaProof('');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Name" required />
      <input type="email" placeholder="Email" required />

      {/* Security Verification Component */}
      <CustomCaptcha
        ref={captchaRef}
        purpose="contact-form"
        onVerified={(proof) => setCaptchaProof(proof)}
        onExpired={() => setCaptchaProof('')}
      />

      <button type="submit">Submit Inquiry</button>
    </form>
  );
}
```

### Accessibility Features Built-In:
- **Speech Synthesis Audio Readout**: Click the speaker icon to hear the challenge via Web Speech API.
- **Accessible ARIA Live Regions**: Informs screen readers of loading and error states without focus disruption.
- **Keyboard Navigation**: Pressing `Enter` automatically submits the challenge answer for verification.

---

## 6. Protecting Server-Side API Routes

Use the `verifyAndConsumeProof` helper to secure any route (e.g. `/api/leads`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAndConsumeProof } from '@/lib/captcha/verifier';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim();

  // 1. Verify and atomically consume proof
  const captchaCheck = await verifyAndConsumeProof(body.captchaProof, {
    purpose: 'contact-form',
    clientIp,
  });

  if (!captchaCheck.success) {
    return NextResponse.json(
      {
        success: false,
        message: captchaCheck.error || 'Security verification failed.',
        code: captchaCheck.code,
      },
      { status: 400 }
    );
  }

  // 2. Perform protected business logic (e.g. database insert, emails)
  // ...
  return NextResponse.json({ success: true });
}
```

---

## 7. Automated Test Suite

Run the 14-point security and functional test suite:
```bash
npm run test:captcha
```

### Verified Test Vectors:
1. Challenge generation & token structure.
2. Correct answer acceptance & proof token generation.
3. Incorrect answer rejection & attempt decrement.
4. Challenge expiration rejection.
5. HMAC signature tampering rejection.
6. Challenge replay (double-submission) rejection.
7. Purpose mismatch protection (`contact-form` vs `login`).
8. Verification proof validation & atomic database consumption.
9. Proof replay rejection (enforcing single-use per business action).
10. Proof bound to wrong business action rejection.
11. Timing signals (sub-600ms automated submissions flagged).
12. Domain & origin allowlist enforcement.
13. Fail-closed behavior on null, empty, or corrupted proofs.
14. Database atomic rate-limiting counters.

---

## 8. Deployment & Vercel Instructions

1. **Database Migration**: Ensure the migration has run on your Supabase project:
   ```bash
   npm run migrate:captcha
   ```
2. **Vercel Settings**: Add the environment variables under **Settings > Environment Variables**:
   - `NEXT_PUBLIC_CAPTCHA_SITE_KEY`
   - `CAPTCHA_SIGNING_SECRET`
   - `DATABASE_URI`
3. **Deploy**: Push changes to `main` branch. Vercel will build and deploy the production API routes.

