import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { query } from './outreach/db';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// ============================================================================
// 1. Base32 Encoding / Decoding for TOTP (RFC 3548 / RFC 6238)
// ============================================================================

export function generateBase32Secret(length = 20): string {
  const bytes = crypto.randomBytes(length);
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32ToBuffer(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/[\s-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

// ============================================================================
// 2. RFC 6238 TOTP Generator & Verifier
// ============================================================================

export function generateTOTP(secretBase32: string, timeStepSeconds = 30, offsetSteps = 0): string {
  const key = base32ToBuffer(secretBase32);
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / timeStepSeconds) + offsetSteps;

  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, '0');
  return otp;
}

export function verifyTOTP(token: string, secretBase32: string, windowSteps = 1): boolean {
  if (!token || !secretBase32) return false;
  const sanitized = token.trim().replace(/\s+/g, '');
  if (sanitized.length !== 6 || !/^\d{6}$/.test(sanitized)) return false;

  for (let offset = -windowSteps; offset <= windowSteps; offset++) {
    const expected = generateTOTP(secretBase32, 30, offset);
    if (crypto.timingSafeEqual(Buffer.from(sanitized), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}

export function getOtpAuthUri(email: string, secretBase32: string): string {
  const account = encodeURIComponent(email.trim());
  const issuer = encodeURIComponent('HeyPrince');
  return `otpauth://totp/${issuer}:${account}?secret=${secretBase32}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

// ============================================================================
// 3. Backup Recovery Codes
// ============================================================================

export function generateRecoveryCodes(count = 8): { rawCodes: string[]; hashedCodes: { hash: string; used: boolean }[] } {
  const rawCodes: string[] = [];
  const hashedCodes: { hash: string; used: boolean }[] = [];

  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const code = `${part1}-${part2}`;
    rawCodes.push(code);

    const hash = crypto.createHash('sha256').update(code.replace(/[\s-]/g, '').toUpperCase()).digest('hex');
    hashedCodes.push({ hash, used: false });
  }

  return { rawCodes, hashedCodes };
}

export function hashRecoveryCode(code: string): string {
  return crypto.createHash('sha256').update(code.replace(/[\s-]/g, '').toUpperCase()).digest('hex');
}

// ============================================================================
// 4. Temporary Signed MFA Login Token (HMAC-SHA256)
// ============================================================================

function getMfaSigningSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.PAYLOAD_SECRET ||
    'heyprince-admin-mfa-intermediate-signing-secret'
  );
}

export function createMfaPendingToken(userId: number, email: string): string {
  const payload = {
    userId,
    email,
    exp: Date.now() + 5 * 60 * 1000, // 5 minutes TTL
    type: 'mfa_pending',
  };
  const base64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getMfaSigningSecret()).update(base64).digest('hex');
  return `${base64}.${sig}`;
}

export function verifyMfaPendingToken(token: string): { userId: number; email: string } | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [base64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', getMfaSigningSecret()).update(base64).digest('hex');

  const sigBuf = Buffer.from(sig, 'hex');
  const expBuf = Buffer.from(expectedSig, 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(base64, 'base64url').toString('utf8'));
    if (payload.type !== 'mfa_pending' || !payload.userId || Date.now() > payload.exp) {
      return null;
    }
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

// ============================================================================
// 5. Database MFA Operations
// ============================================================================

export interface AdminMfaRecord {
  id: number;
  user_id: number;
  mfa_enabled: boolean;
  totp_secret: string | null;
  recovery_codes: { hash: string; used: boolean }[];
  email_otp_code: string | null;
  email_otp_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAdminMfaState(userId: number): Promise<AdminMfaRecord | null> {
  const rows = await query<AdminMfaRecord>(
    `SELECT * FROM admin_mfa WHERE user_id = $1 LIMIT 1;`,
    [userId]
  );
  return rows[0] || null;
}

export async function enableAdminTotpMfa(userId: number, secret: string, hashedCodes: { hash: string; used: boolean }[]): Promise<boolean> {
  await query(
    `INSERT INTO admin_mfa (user_id, mfa_enabled, totp_secret, recovery_codes, updated_at)
     VALUES ($1, true, $2, $3::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       mfa_enabled = true,
       totp_secret = EXCLUDED.totp_secret,
       recovery_codes = EXCLUDED.recovery_codes,
       updated_at = NOW();`,
    [userId, secret, JSON.stringify(hashedCodes)]
  );
  return true;
}

export async function disableAdminMfa(userId: number): Promise<boolean> {
  await query(
    `UPDATE admin_mfa SET mfa_enabled = false, totp_secret = NULL, recovery_codes = '[]'::jsonb, updated_at = NOW() WHERE user_id = $1;`,
    [userId]
  );
  return true;
}

export async function verifyAndConsumeRecoveryCode(userId: number, code: string): Promise<boolean> {
  const mfa = await getAdminMfaState(userId);
  if (!mfa || !mfa.mfa_enabled || !Array.isArray(mfa.recovery_codes)) return false;

  const inputHash = hashRecoveryCode(code);
  let matchedIdx = -1;

  for (let i = 0; i < mfa.recovery_codes.length; i++) {
    const item = mfa.recovery_codes[i];
    if (!item.used && item.hash === inputHash) {
      matchedIdx = i;
      break;
    }
  }

  if (matchedIdx === -1) return false;

  mfa.recovery_codes[matchedIdx].used = true;
  await query(
    `UPDATE admin_mfa SET recovery_codes = $1::jsonb, updated_at = NOW() WHERE user_id = $2;`,
    [JSON.stringify(mfa.recovery_codes), userId]
  );
  return true;
}

// ============================================================================
// 6. Email OTP Notification
// ============================================================================

export async function sendEmailOtp(userId: number, targetEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    await query(
      `INSERT INTO admin_mfa (user_id, mfa_enabled, email_otp_code, email_otp_expires_at, updated_at)
       VALUES ($1, false, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         email_otp_code = EXCLUDED.email_otp_code,
         email_otp_expires_at = EXCLUDED.email_otp_expires_at,
         updated_at = NOW();`,
      [userId, otpCode, expiresAt]
    );

    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const smtpPort = Number(process.env.SMTP_PORT) || 465;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('[sendEmailOtp] SMTP not configured; OTP for testing:', otpCode);
      return { success: true };
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"HeyPrince Security" <${smtpUser}>`,
      to: targetEmail,
      subject: `[HeyPrince Security] Your Executive Portal 2FA Verification Code: ${otpCode}`,
      html: `
        <div style="font-family: sans-serif; background: #07070a; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <div style="font-size: 1.4rem; font-weight: 800; color: #ff3366;">HeyPrince Security</div>
          </div>
          <h2 style="font-size: 1.2rem; margin-bottom: 12px; color: #ffffff;">Executive Portal Two-Factor Verification</h2>
          <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.5;">
            An administrator login attempt was initiated. Use the single-use 6-digit verification code below to authorize access.
          </p>
          <div style="margin: 24px 0; padding: 16px; background: rgba(255, 51, 102, 0.1); border: 1px solid rgba(255, 51, 102, 0.3); border-radius: 8px; text-align: center;">
            <span style="font-size: 2rem; font-weight: 800; letter-spacing: 6px; color: #ff3366; font-family: monospace;">${otpCode}</span>
          </div>
          <p style="color: rgba(255,255,255,0.5); font-size: 0.8rem; margin: 0;">
            This code expires in 10 minutes. If you did not initiate this request, verify your account security immediately.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (err: any) {
    console.error('[sendEmailOtp] Failed to send email OTP:', err);
    return { success: false, error: err?.message || 'Failed to send email verification code' };
  }
}

export async function verifyEmailOtp(userId: number, code: string): Promise<boolean> {
  const mfa = await getAdminMfaState(userId);
  if (!mfa || !mfa.email_otp_code || !mfa.email_otp_expires_at) return false;

  const isExpired = new Date(mfa.email_otp_expires_at).getTime() < Date.now();
  if (isExpired) return false;

  const valid = crypto.timingSafeEqual(
    Buffer.from(code.trim()),
    Buffer.from(mfa.email_otp_code.trim())
  );

  if (valid) {
    // Invalidate consumed OTP
    await query(`UPDATE admin_mfa SET email_otp_code = NULL, email_otp_expires_at = NULL WHERE user_id = $1;`, [userId]);
    return true;
  }

  return false;
}
