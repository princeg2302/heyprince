'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

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

      // Success: full navigation ensures session cookie is immediately sent to SSR
      window.location.href = '/admin/';
    } catch {
      setError('A connection error occurred. Please verify your network and try again.');
      setLoading(false);
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
          <img
            src="/heyprince-logo.svg"
            alt="HeyPrince"
            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
          />
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
          Executive Command Center
        </h1>
        <p style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.55)', margin: 0, fontFamily: 'var(--hpa-font)' }}>
          Enter your authorized credentials to access management controls.
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

      {/* Form */}
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
              placeholder="e.g. it@heyprince.in"
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
                color: '#ff3366',
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
              style={{ paddingLeft: '38px', paddingRight: '40px' }}
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
                color: 'rgba(255, 255, 255, 0.45)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ accentColor: '#ff3366', cursor: 'pointer' }}
          />
          <label
            htmlFor="rememberMe"
            style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer' }}
          >
            Keep me signed in for 7 days
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="hpa-btn hpa-btn-primary"
          style={{ width: '100%', padding: '12px', marginTop: '6px' }}
        >
          {loading ? (
            <span>Verifying Credentials...</span>
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Security Footer */}
      <div
        style={{
          marginTop: '28px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '0.74rem',
          color: 'rgba(255, 255, 255, 0.4)',
        }}
      >
        <ShieldCheck size={14} style={{ color: '#00f5a0' }} />
        <span>End-to-End Encrypted • Supabase SSL Pooler</span>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="hpa-modal-backdrop" onClick={() => setForgotModalOpen(false)}>
          <div className="hpa-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <HelpCircle size={22} style={{ color: '#ff3366' }} />
              <h3 className="hpa-modal-title" style={{ margin: 0 }}>
                Password Recovery
              </h3>
            </div>
            <p className="hpa-modal-text">
              For administrative security, password resets are controlled via the server environment or direct Supabase administrative authorization.
            </p>
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.8rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '18px',
              }}
            >
              Default administrator seed account:
              <br />
              <strong style={{ color: '#ffffff' }}>it@heyprince.in</strong>
              <br />
              <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                Configured via PAYLOAD_ADMIN_PASSWORD environment secret.
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="hpa-btn hpa-btn-primary hpa-btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
