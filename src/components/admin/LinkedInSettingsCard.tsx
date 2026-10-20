'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Edit2,
  Save,
  Clock,
  Send,
  Loader2,
  Building2,
} from 'lucide-react';
import { useToast } from '@/components/admin/Toast';

export function LinkedInSettingsCard() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    isConfigured: boolean;
    redirectUri: string;
    hasClientId: boolean;
    hasClientSecret: boolean;
    isConnected: boolean;
    connection: {
      id: number;
      personUrn: string;
      memberId?: string;
      name?: string;
      avatarUrl?: string;
      expiresAt: string;
      lastPublishedAt?: string;
      organizationUrn?: string | null;
      organizationName?: string | null;
      postTarget?: 'personal' | 'organization' | 'both';
      scope: string;
      needsPersonUrn?: boolean;
    } | null;
    recentShares: any[];
  } | null>(null);

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [editingUrn, setEditingUrn] = useState(false);
  const [customUrn, setCustomUrn] = useState('');
  const [savingUrn, setSavingUrn] = useState(false);

  // Company / Organization Page state
  const [orgUrn, setOrgUrn] = useState('');
  const [orgName, setOrgName] = useState('');
  const [postTarget, setPostTarget] = useState<'personal' | 'organization' | 'both'>('personal');
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/linkedin/status');
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.connection) {
          if (json.connection.personUrn) {
            setCustomUrn(json.connection.personUrn);
          }
          setOrgUrn(json.connection.organizationUrn || '');
          setOrgName(json.connection.organizationName || '');
          setPostTarget(json.connection.postTarget || 'personal');
        }
      }
    } catch {
      showToast('Could not fetch LinkedIn status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/linkedin/update-urn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personUrn: customUrn.trim(),
          organizationUrn: orgUrn.trim(),
          organizationName: orgName.trim(),
          postTarget,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('LinkedIn destination settings saved successfully!', 'success');
        setEditingUrn(false);
        fetchStatus();
      } else {
        showToast(json.error || 'Failed to update settings.', 'error');
      }
    } catch {
      showToast('Network error while saving settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check URL parameters for OAuth return notifications
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('linkedin') === 'connected') {
        const name = params.get('linkedin_name');
        showToast(
          name ? `LinkedIn connected successfully for ${name}!` : 'LinkedIn connected successfully!',
          'success'
        );
        window.history.replaceState({}, '', window.location.pathname);
      } else if (params.get('linkedin_error')) {
        showToast(`LinkedIn Connection Error: ${params.get('linkedin_error')}`, 'error');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const handleCopyCallback = () => {
    const url = data?.redirectUri || 'https://heyprince.in/api/linkedin/callback';
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    showToast('Callback URL copied to clipboard!', 'success');
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this LinkedIn profile?')) return;
    setDisconnecting(true);
    try {
      const res = await fetch('/api/admin/linkedin/disconnect', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast('LinkedIn profile disconnected.', 'success');
        fetchStatus();
      } else {
        showToast(json.error || 'Failed to disconnect.', 'error');
      }
    } catch {
      showToast('Network error while disconnecting.', 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveUrn = async () => {
    if (!customUrn.trim()) return;
    setSavingUrn(true);
    try {
      const res = await fetch('/api/admin/linkedin/update-urn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personUrn: customUrn.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Person URN updated successfully.', 'success');
        setEditingUrn(false);
        fetchStatus();
      } else {
        showToast(json.error || 'Failed to update Person URN.', 'error');
      }
    } catch {
      showToast('Failed to save Person URN.', 'error');
    } finally {
      setSavingUrn(false);
    }
  };

  return (
    <div className="hpa-card" style={{ padding: '24px', gridColumn: 'span 2', marginBottom: 0 }}>
      {/* Title Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          borderBottom: '1px solid var(--hpa-border)',
          paddingBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#0a66c2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1rem',
            }}
          >
            in
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              LinkedIn Personal Profile Integration
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
              OAuth 2.0 authorization and 1-click article publishing with <code style={{ color: 'var(--hpa-primary)' }}>w_member_social</code> scope.
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="hpa-btn hpa-btn-secondary hpa-btn-icon"
          title="Refresh LinkedIn Status"
        >
          <RefreshCw size={14} className={loading ? 'hpa-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--hpa-text-dim)' }}>
          <Loader2 size={24} className="hpa-spin" style={{ margin: '0 auto 10px' }} />
          <p style={{ fontSize: '0.84rem' }}>Checking LinkedIn integration status...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Status Alert Banner */}
          {data?.isConnected ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: '#0a66c2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    overflow: 'hidden',
                  }}
                >
                  {data.connection?.avatarUrl ? (
                    <img
                      src={data.connection.avatarUrl}
                      alt={data.connection.name || 'LinkedIn User'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    data.connection?.name?.charAt(0) || 'IN'
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.98rem' }}>
                      {data.connection?.name || 'Authorized Member Profile'}
                    </span>
                    <span className="hpa-pill hpa-pill-published" style={{ fontSize: '0.72rem' }}>
                      Active
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--hpa-text-dim)', marginTop: '2px' }}>
                    Scope: <code style={{ color: 'var(--hpa-primary)' }}>{data.connection?.scope}</code> • Access token stored securely server-side
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href="/api/admin/linkedin/connect"
                  onClick={() => setConnecting(true)}
                  className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                  title="Refresh authorization code"
                >
                  {connecting ? <Loader2 size={13} className="hpa-spin" /> : <RefreshCw size={13} />}
                  <span>{connecting ? 'Redirecting...' : 'Reconnect'}</span>
                </a>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="hpa-btn hpa-btn-danger hpa-btn-sm"
                >
                  {disconnecting ? <Loader2 size={13} className="hpa-spin" /> : <LogOut size={13} />}
                  <span>{disconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: '8px',
                background: 'rgba(10, 102, 194, 0.08)',
                border: '1px solid rgba(10, 102, 194, 0.3)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', marginBottom: '4px' }}>
                  <Share2 size={18} />
                  <strong style={{ fontSize: '0.95rem' }}>Personal Profile Not Connected</strong>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
                  Connect your LinkedIn account using OAuth 2.0 to publish existing articles directly to your personal feed.
                </p>
              </div>

              <a
                href="/api/admin/linkedin/connect"
                onClick={() => setConnecting(true)}
                className="hpa-btn hpa-btn-primary"
                style={{
                  background: '#0a66c2',
                  borderColor: '#0a66c2',
                  whiteSpace: 'nowrap',
                }}
              >
                {connecting ? <Loader2 size={15} className="hpa-spin" /> : <Share2 size={15} />}
                <span>{connecting ? 'Connecting...' : 'Connect LinkedIn Profile'}</span>
              </a>
            </div>
          )}

          {/* Details & Specs Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px',
              fontSize: '0.84rem',
            }}
          >
            {/* Person URN */}
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--hpa-border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ color: 'var(--hpa-text-dim)' }}>Person URN (Author ID)</span>
                {data?.isConnected && !editingUrn && (
                  <button
                    onClick={() => setEditingUrn(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--hpa-primary)', cursor: 'pointer', padding: 0 }}
                    title="Edit URN"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
              </div>

              {editingUrn || data?.connection?.needsPersonUrn || data?.connection?.personUrn?.includes('UNKNOWN') ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={customUrn}
                      onChange={(e) => setCustomUrn(e.target.value)}
                      placeholder="e.g. urn:li:person:abc123XYZ or member ID"
                      style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--hpa-border)',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                      }}
                    />
                    <button
                      onClick={handleSaveUrn}
                      disabled={savingUrn || !customUrn.trim()}
                      className="hpa-btn hpa-btn-primary hpa-btn-sm"
                      style={{ padding: '4px 10px' }}
                    >
                      {savingUrn ? <Loader2 size={12} className="hpa-spin" /> : <Save size={12} />}
                      <span>{savingUrn ? 'Saving...' : 'Save'}</span>
                    </button>
                    {editingUrn && (
                      <button
                        onClick={() => setEditingUrn(false)}
                        className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                        style={{ padding: '4px 8px' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#f59e0b', lineHeight: 1.4 }}>
                    ⚠️ Your LinkedIn token only has <code style={{ color: '#ffffff' }}>w_member_social</code> write permission. Enter your Person URN above or enable <strong>"Sign In with LinkedIn using OpenID Connect"</strong> in Developer Portal &rarr; Products and click Reconnect.
                  </div>
                </div>
              ) : (
                <code style={{ fontSize: '0.82rem', color: data?.connection?.personUrn ? 'var(--hpa-primary)' : 'var(--hpa-text-dim)' }}>
                  {data?.connection?.personUrn || 'Not connected yet'}
                </code>
              )}
            </div>

            {/* Token Expiration */}
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--hpa-border)',
              }}
            >
              <div style={{ color: 'var(--hpa-text-dim)', marginBottom: '6px' }}>Token Validity (Server Session)</div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>
                {data?.connection?.expiresAt
                  ? `Valid until ${new Date(data.connection.expiresAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}`
                  : 'Pending Authorization'}
              </div>
            </div>

            {/* Publishing Destination Target Selector */}
            {data?.isConnected && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--hpa-border)',
                  gridColumn: '1 / -1',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Share2 size={16} style={{ color: 'var(--hpa-primary)' }} />
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>Daily &amp; Manual Publishing Destination</span>
                  </div>
                  <span className="hpa-pill hpa-pill-published" style={{ textTransform: 'capitalize' }}>
                    Active Target: {postTarget === 'both' ? 'Both (Profile + Page)' : postTarget === 'organization' ? 'Company Page Only' : 'Personal Profile Only'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {/* Option 1: Personal */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: `1px solid ${postTarget === 'personal' ? 'var(--hpa-primary)' : 'var(--hpa-border)'}`,
                      background: postTarget === 'personal' ? 'rgba(212, 0, 39, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="postTarget"
                      value="personal"
                      checked={postTarget === 'personal'}
                      onChange={() => setPostTarget('personal')}
                      style={{ accentColor: 'var(--hpa-primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>Personal Profile Only</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)' }}>Post to {data?.connection?.name || 'Personal Feed'}</div>
                    </div>
                  </label>

                  {/* Option 2: Organization */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: `1px solid ${postTarget === 'organization' ? 'var(--hpa-primary)' : 'var(--hpa-border)'}`,
                      background: postTarget === 'organization' ? 'rgba(212, 0, 39, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="postTarget"
                      value="organization"
                      checked={postTarget === 'organization'}
                      onChange={() => setPostTarget('organization')}
                      style={{ accentColor: 'var(--hpa-primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>Company Page Only</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)' }}>Post to {orgName || 'Company Page'}</div>
                    </div>
                  </label>

                  {/* Option 3: Both */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: `1px solid ${postTarget === 'both' ? 'var(--hpa-primary)' : 'var(--hpa-border)'}`,
                      background: postTarget === 'both' ? 'rgba(212, 0, 39, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="postTarget"
                      value="both"
                      checked={postTarget === 'both'}
                      onChange={() => setPostTarget('both')}
                      style={{ accentColor: 'var(--hpa-primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>Both (Profile + Page)</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)' }}>Publish simultaneously to both</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* LinkedIn Company / Organization Page Configuration */}
            {data?.isConnected && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--hpa-border)',
                  gridColumn: '1 / -1',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={16} style={{ color: '#0a66c2' }} />
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>LinkedIn Company / Organization Page Settings</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <a
                      href="/api/admin/linkedin/connect?with_org=true"
                      className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                      title="Request w_organization_social scope from LinkedIn"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      <RefreshCw size={12} />
                      <span>Reconnect with Page Scope</span>
                    </a>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--hpa-text-dim)', marginBottom: '6px' }}>
                      Organization ID or Numeric ID
                    </label>
                    <input
                      type="text"
                      value={orgUrn}
                      onChange={(e) => setOrgUrn(e.target.value)}
                      placeholder="e.g. 10482910 or urn:li:organization:10482910"
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--hpa-border)',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--hpa-text-dim)', marginBottom: '6px' }}>
                      Company Page Name (Display Label)
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. HeyPrince"
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--hpa-border)',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--hpa-text-dim)', maxWidth: '620px', lineHeight: 1.4 }}>
                    💡 <strong>Where to find Page ID:</strong> Go to your LinkedIn Page Admin URL (e.g. <code>https://www.linkedin.com/company/<strong>12345678</strong>/admin/</code>). The number is your Organization ID.
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="hpa-btn hpa-btn-primary hpa-btn-sm"
                    style={{ padding: '6px 16px' }}
                  >
                    {savingSettings ? <Loader2 size={13} className="hpa-spin" /> : <Save size={13} />}
                    <span>{savingSettings ? 'Saving Settings...' : 'Save LinkedIn Destination Settings'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Registered Callback URL */}
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--hpa-border)',
                gridColumn: '1 / -1',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ color: 'var(--hpa-text-dim)' }}>Production OAuth Callback URL (Registered in Developer Portal)</span>
                <button
                  onClick={handleCopyCallback}
                  className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                  style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                >
                  {copiedUrl ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <code style={{ fontSize: '0.82rem', color: 'var(--hpa-primary)', wordBreak: 'break-all' }}>
                {data?.redirectUri || 'https://heyprince.in/api/linkedin/callback'}
              </code>
            </div>
          </div>

          {/* Vercel Environment Variables Checklist */}
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--hpa-border)',
            }}
          >
            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.88rem', marginBottom: '10px' }}>
              Required Vercel Server Environment Variables:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {data?.hasClientId ? (
                  <CheckCircle2 size={15} style={{ color: 'var(--hpa-success)' }} />
                ) : (
                  <AlertCircle size={15} style={{ color: 'var(--hpa-warning)' }} />
                )}
                <span><code style={{ color: '#ffffff' }}>LINKEDIN_CLIENT_ID</code></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {data?.hasClientSecret ? (
                  <CheckCircle2 size={15} style={{ color: 'var(--hpa-success)' }} />
                ) : (
                  <AlertCircle size={15} style={{ color: 'var(--hpa-warning)' }} />
                )}
                <span><code style={{ color: '#ffffff' }}>LINKEDIN_CLIENT_SECRET</code></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--hpa-success)' }} />
                <span><code style={{ color: '#ffffff' }}>LINKEDIN_REDIRECT_URI</code> (https://heyprince.in/api/linkedin/callback)</span>
              </div>
            </div>
          </div>

          {/* Recent LinkedIn Article Shares */}
          {data?.recentShares && data.recentShares.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
                Recent LinkedIn Publications
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.recentShares.map((share: any) => (
                  <div
                    key={share.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--hpa-border)',
                      borderRadius: '6px',
                      fontSize: '0.84rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`hpa-pill ${share.status === 'published' ? 'hpa-pill-published' : 'hpa-pill-draft'}`}>
                        {share.status}
                      </span>
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>
                        {share.post_title || `Article #${share.post_id}`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: 'var(--hpa-text-dim)', fontSize: '0.78rem' }}>
                        {new Date(share.created_at).toLocaleDateString()}
                      </span>
                      {share.linkedin_post_urn && (
                        <a
                          href={`https://www.linkedin.com/feed/update/${encodeURIComponent(share.linkedin_post_urn)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                          style={{ padding: '3px 8px' }}
                        >
                          <span>Feed Link</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

