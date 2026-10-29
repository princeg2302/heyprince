'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Key,
  Copy,
  Check,
  Loader2,
  Lock,
  LifeBuoy,
  RefreshCw,
} from 'lucide-react';

export function MfaSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [recoveryCodesLeft, setRecoveryCodesLeft] = useState(0);

  // Setup state
  const [settingUp, setSettingUp] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    otpAuthUri: string;
    recoveryCodes: string[];
    hashedRecoveryCodes: any[];
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Disable state
  const [disableModal, setDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    fetchMfaStatus();
  }, []);

  const fetchMfaStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/mfa/status');
      const data = await res.json();
      if (res.ok && data.success) {
        setMfaEnabled(data.mfaEnabled);
        setRecoveryCodesLeft(data.recoveryCodesLeft);
      }
    } catch {
      // transient network error
    } finally {
      setLoading(false);
    }
  };

  const handleStartSetup = async () => {
    setError(null);
    setSuccessMsg(null);
    setSettingUp(true);
    try {
      const res = await fetch('/api/admin/mfa/setup', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSetupData(data);
      } else {
        setError(data.error || 'Failed to initiate 2FA setup.');
        setSettingUp(false);
      }
    } catch {
      setError('Network error while initiating 2FA setup.');
      setSettingUp(false);
    }
  };

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData || !verifyCode.trim()) return;

    setError(null);
    setVerifying(true);

    try {
      const res = await fetch('/api/admin/mfa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verifyCode.trim(),
          secret: setupData.secret,
          hashedRecoveryCodes: setupData.hashedRecoveryCodes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMfaEnabled(true);
        setSettingUp(false);
        setSetupData(null);
        setVerifyCode('');
        setSuccessMsg('Multi-Factor Authentication (MFA) enabled successfully!');
        fetchMfaStatus();
      } else {
        setError(data.error || 'Invalid verification code. Please check your authenticator app.');
      }
    } catch {
      setError('Network error during verification.');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) return;

    setError(null);
    setDisabling(true);

    try {
      const res = await fetch('/api/admin/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMfaEnabled(false);
        setDisableModal(false);
        setDisablePassword('');
        setSuccessMsg('MFA has been disabled.');
        fetchMfaStatus();
      } else {
        setError(data.error || 'Failed to disable MFA. Check your password.');
      }
    } catch {
      setError('Network error while disabling MFA.');
    } finally {
      setDisabling(false);
    }
  };

  const copySecret = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const copyCodes = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.recoveryCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  return (
    <div className="hpa-card" style={{ padding: '24px', marginBottom: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {mfaEnabled ? (
            <ShieldCheck size={22} style={{ color: 'var(--hpa-success)' }} />
          ) : (
            <ShieldAlert size={22} style={{ color: 'var(--hpa-primary)' }} />
          )}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Two-Factor Authentication (MFA / 2FA)
          </h2>
        </div>
        <span
          className={`hpa-pill ${mfaEnabled ? 'hpa-pill-active' : 'hpa-pill-admin'}`}
          style={{ textTransform: 'uppercase', fontSize: '0.72rem' }}
        >
          {loading ? 'Checking...' : mfaEnabled ? 'Enabled & Active' : 'Not Enabled'}
        </span>
      </div>

      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.84rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>
        Enforce secondary identity verification via standard Authenticator Apps (Google Authenticator, Microsoft, 1Password), Email OTP, and single-use emergency backup recovery codes.
      </p>

      {/* Notifications */}
      {error && (
        <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', color: '#f43f5e', fontSize: '0.82rem', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(0, 245, 160, 0.1)', border: '1px solid rgba(0, 245, 160, 0.25)', color: 'var(--hpa-success)', fontSize: '0.82rem', marginBottom: '16px' }}>
          {successMsg}
        </div>
      )}

      {/* STATE 1: MFA IS ENABLED */}
      {mfaEnabled && !settingUp && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--hpa-text-dim)' }}>Primary Factor</span>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>PBKDF2-SHA256 Password</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--hpa-text-dim)' }}>Second Factor (MFA)</span>
              <span style={{ color: 'var(--hpa-success)', fontWeight: 600 }}>TOTP (RFC 6238) + Email OTP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--hpa-text-dim)' }}>Unused Recovery Codes</span>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>{recoveryCodesLeft} remaining</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setDisableModal(true)}
              className="hpa-btn hpa-btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Lock size={14} />
              <span>Disable MFA</span>
            </button>
            <button
              onClick={handleStartSetup}
              className="hpa-btn hpa-btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <RefreshCw size={14} />
              <span>Reset & New Codes</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: MFA NOT ENABLED */}
      {!mfaEnabled && !settingUp && (
        <div>
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(255, 51, 102, 0.05)',
              border: '1px solid rgba(255, 51, 102, 0.15)',
              marginBottom: '16px',
              fontSize: '0.82rem',
              color: 'rgba(255, 255, 255, 0.75)',
            }}
          >
            🔒 <strong>Security Warning:</strong> Your account currently relies only on a password. Enabling Multi-Factor Authentication prevents unauthorized access even if credentials are exposed.
          </div>

          <button
            onClick={handleStartSetup}
            className="hpa-btn hpa-btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Smartphone size={16} />
            <span>Set Up Authenticator MFA (2FA)</span>
          </button>
        </div>
      )}

      {/* STATE 3: SETUP IN PROGRESS */}
      {settingUp && setupData && (
        <form onSubmit={handleVerifySetup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--hpa-border)', fontSize: '0.82rem' }}>
            <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
              Step 1: Add Secret to Authenticator App
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>
              Enter this Base32 secret key manually in Google Authenticator, 1Password, or Microsoft Authenticator:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <code style={{ background: '#000', padding: '6px 10px', borderRadius: '6px', color: 'var(--hpa-primary)', fontFamily: 'monospace', fontSize: '0.9rem', letterSpacing: '1px', flex: 1, wordBreak: 'break-all' }}>
                {setupData.secret}
              </code>
              <button
                type="button"
                onClick={copySecret}
                className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                style={{ padding: '6px 12px' }}
              >
                {copiedSecret ? <Check size={14} color="var(--hpa-success)" /> : <Copy size={14} />}
                <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Backup recovery codes */}
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--hpa-border)', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, color: '#ffffff' }}>Step 2: Save Emergency Recovery Codes</span>
              <button
                type="button"
                onClick={copyCodes}
                style={{ background: 'none', border: 'none', color: 'var(--hpa-primary)', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
              >
                {copiedCodes ? '✓ Copied All' : 'Copy All Codes'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '8px' }}>
              {setupData.recoveryCodes.map((code, i) => (
                <div key={i} style={{ background: '#000', padding: '4px 6px', borderRadius: '4px', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: '#00f5a0' }}>
                  {code}
                </div>
              ))}
            </div>
          </div>

          {/* Verification Code Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)', marginBottom: '6px' }}>
              Step 3: Enter 6-Digit Code From Authenticator App
            </label>
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              required
              className="hpa-form-input"
              style={{ letterSpacing: '4px', fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700 }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={verifying}
              className="hpa-btn hpa-btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {verifying ? <Loader2 size={16} className="hpa-spinner" /> : <ShieldCheck size={16} />}
              <span>Verify & Activate MFA</span>
            </button>
            <button
              type="button"
              onClick={() => { setSettingUp(false); setSetupData(null); }}
              className="hpa-btn hpa-btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Disable Modal */}
      {disableModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <form onSubmit={handleDisableMfa} style={{ background: '#0d0d14', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0' }}>
              Confirm Disabling MFA
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.84rem', margin: '0 0 16px 0' }}>
              Enter your administrator password to confirm turning off two-factor authentication.
            </p>
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Your password"
              required
              className="hpa-form-input"
              style={{ marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={disabling}
                className="hpa-btn hpa-btn-primary"
                style={{ flex: 1, justifyContent: 'center', background: '#f43f5e' }}
              >
                {disabling ? 'Disabling...' : 'Confirm Disable'}
              </button>
              <button
                type="button"
                onClick={() => setDisableModal(false)}
                className="hpa-btn hpa-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
