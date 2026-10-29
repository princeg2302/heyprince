'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, HelpCircle, Loader2, KeyRound, Smartphone, LifeBuoy } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();

  // Step 1: Primary Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Step 2: Multi-Factor Authentication
  const [step, setStep] = useState<'password' | 'mfa'>('password');
  const [mfaPendingToken, setMfaPendingToken] = useState('');
  const [mfaMode, setMfaMode] = useState<'totp' | 'recovery' | 'email'>('totp');
  const [mfaCode, setMfaCode] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your administrator email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid administrator credentials. Please check your details.');
        setLoading(false);
        return;
      }

      // Check if MFA is required
      if (data.requireMfa && data.mfaPendingToken) {
        setMfaPendingToken(data.mfaPendingToken);
        setStep('mfa');
        setLoading(false);
        return;
      }

      // Success: full navigation ensures session cookie is immediately sent to SSR
      window.location.href = '/admin/';
    } catch {
      setError('A connection error occurred. Please verify your network and try again.');
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mfaCode.trim()) {
      setError('Please enter your verification code.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/mfa/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfaPendingToken,
          code: mfaCode.trim(),
          type: mfaMode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid 2FA verification code. Please check and try again.');
        setLoading(false);
        return;
      }

      // 2FA Verified! Navigate into portal
      window.location.href = '/admin/';
    } catch {
      setError('Authentication failed due to a network error. Please try again.');
      setLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setError(null);
    setSendingEmailOtp(true);
    try {
      const res = await fetch('/api/admin/mfa/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaPendingToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailOtpSent(true);
        setMfaMode('email');
      } else {
        setError(data.error || 'Failed to dispatch email verification code.');
      }
    } catch {
      setError('Network error while requesting email code.');
    } finally {
      setSendingEmailOtp(false);
    }
  };

  return (
    <div
      className="hpa-login-card"
      style={{
        width: '100%',
        maxWidth: '440px',
        background: '#0d0d14',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '36px 32px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--hpa-font)',
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #ff3366 0%, #8b5cf6 50%, #00f5a0 100%)',
        }}
      />

      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'rgba(255, 51, 102, 0.1)',
            border: '1px solid rgba(255, 51, 102, 0.25)',
            marginBottom: '16px',
          }}
        >
          {step === 'mfa' ? (
            <ShieldCheck size={28} color="#ff3366" />
          ) : (
            <img
              src="/heyprince-logo.svg"
              alt="HeyPrince"
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
          )}
        </div>

        <h1
          className="hpa-heading"
          style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            margin: '0 0 6px 0',
            fontFamily: 'var(--hpa-font-heading)',
          }}
        >
          {step === 'mfa' ? 'Two-Factor Verification' : 'Executive Command Center'}
        </h1>
        <p style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.55)', margin: 0, fontFamily: 'var(--hpa-font)' }}>
          {step === 'mfa'
            ? 'Enter your second authentication factor to confirm identity.'
            : 'Enter your authorized credentials to access management controls.'}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            fontSize: '0.84rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: PASSWORD FORM */}
      {step === 'password' && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.85)',
                marginBottom: '6px',
              }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={17}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. contact@heyprince.in"
                autoComplete="email"
                required
                className="hpa-form-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                htmlFor="password"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.85)',
                }}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--hpa-primary)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={17}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
                className="hpa-form-input"
                style={{ paddingLeft: '38px', paddingRight: '38px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--hpa-primary)', cursor: 'pointer' }}
              />
              Remember session (7 days)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="hpa-btn hpa-btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: '44px', fontSize: '0.92rem' }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="hpa-spinner" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Executive Portal</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: MFA VERIFICATION */}
      {step === 'mfa' && (
        <form onSubmit={handleMfaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Factor selection tabs */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              type="button"
              onClick={() => { setMfaMode('totp'); setMfaCode(''); }}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                background: mfaMode === 'totp' ? 'var(--hpa-primary)' : 'transparent',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Smartphone size={13} />
              <span>Authenticator</span>
            </button>
            <button
              type="button"
              onClick={() => { setMfaMode('email'); setMfaCode(''); }}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                background: mfaMode === 'email' ? 'var(--hpa-primary)' : 'transparent',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Mail size={13} />
              <span>Email OTP</span>
            </button>
            <button
              type="button"
              onClick={() => { setMfaMode('recovery'); setMfaCode(''); }}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                background: mfaMode === 'recovery' ? 'var(--hpa-primary)' : 'transparent',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <LifeBuoy size={13} />
              <span>Backup</span>
            </button>
          </div>

          {/* Mode explanation */}
          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.4 }}>
            {mfaMode === 'totp' && 'Open your Authenticator app (Google Authenticator, 1Password, Microsoft) and enter the 6-digit code.'}
            {mfaMode === 'email' && (
              <div>
                <span>A single-use 6-digit code sent to your verified administrator email. </span>
                {!emailOtpSent && (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={sendingEmailOtp}
                    style={{ background: 'none', border: 'none', color: '#ff3366', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    {sendingEmailOtp ? 'Sending...' : 'Click to send code'}
                  </button>
                )}
                {emailOtpSent && <span style={{ color: 'var(--hpa-success)', fontWeight: 600 }}> (Sent! Check inbox)</span>}
              </div>
            )}
            {mfaMode === 'recovery' && 'Enter one of your 8-character emergency backup recovery codes (e.g. A1B2-C3D4).'}
          </div>

          <div>
            <label
              htmlFor="mfaCode"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.85)',
                marginBottom: '6px',
              }}
            >
              {mfaMode === 'recovery' ? 'Emergency Backup Code' : '6-Digit Verification Code'}
            </label>
            <div style={{ position: 'relative' }}>
              <KeyRound
                size={17}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              />
              <input
                id="mfaCode"
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder={mfaMode === 'recovery' ? 'XXXX-XXXX' : '000000'}
                maxLength={mfaMode === 'recovery' ? 12 : 6}
                required
                autoFocus
                className="hpa-form-input"
                style={{
                  paddingLeft: '38px',
                  letterSpacing: mfaMode === 'recovery' ? '2px' : '6px',
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="hpa-btn hpa-btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: '44px', fontSize: '0.92rem' }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="hpa-spinner" />
                <span>Verifying Factor...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Verify & Authorize Access</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setStep('password'); setError(null); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.45)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            &larr; Back to password login
          </button>
        </form>
      )}

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0d0d14',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 51, 102, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--hpa-primary)',
              }}
            >
              <HelpCircle size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0' }}>
              Administrator Recovery
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.86rem', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              For enterprise security, password resets are restricted to authorized administrators via secure server console or verified identity credentials. Contact <strong>contact@heyprince.in</strong> for credential recovery.
            </p>
            <button
              onClick={() => setForgotModalOpen(false)}
              className="hpa-btn hpa-btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
