'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Share2,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Link as LinkIcon,
} from 'lucide-react';
import { PostRecord } from '@/lib/admin-db';
import { useToast } from '@/components/admin/Toast';

interface LinkedInPublishModalProps {
  post: PostRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LinkedInPublishModal({ post, isOpen, onClose }: LinkedInPublishModalProps) {
  const { showToast } = useToast();
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [personUrn, setPersonUrn] = useState<string | null>(null);
  const [commentary, setCommentary] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [urnInput, setUrnInput] = useState('');
  const [isSavingUrn, setIsSavingUrn] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    success: boolean;
    postUrn?: string;
    postUrl?: string;
    error?: string;
  } | null>(null);

  const handleSaveUrn = async () => {
    if (!urnInput.trim()) return;
    setIsSavingUrn(true);
    try {
      const res = await fetch('/api/admin/linkedin/update-urn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personUrn: urnInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPersonUrn(data.personUrn);
        showToast('LinkedIn Person URN linked successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to update Person URN.', 'error');
      }
    } catch {
      showToast('Network error while saving URN.', 'error');
    } finally {
      setIsSavingUrn(false);
    }
  };

  // Check LinkedIn connection status whenever modal opens
  useEffect(() => {
    if (!isOpen) {
      setPublishResult(null);
      return;
    }

    setLoadingStatus(true);
    fetch('/api/admin/linkedin/status')
      .then((res) => res.json())
      .then((data) => {
        setIsConfigured(data.isConfigured);
        setIsConnected(data.isConnected);
        if (data.connection) {
          setProfileName(data.connection.name || 'Authorized Profile');
          setPersonUrn(data.connection.personUrn);
        }
      })
      .catch(() => {
        setIsConnected(false);
      })
      .finally(() => {
        setLoadingStatus(false);
      });
  }, [isOpen]);

  // Prepopulate commentary with article metadata
  useEffect(() => {
    if (post) {
      const articleUrl = `https://heyprince.in/insights/${post.slug}/`;
      const defaultText = `${post.title}\n\n${post.excerpt || post.seo_description || ''}\n\nRead the full engineering insight:\n${articleUrl}`;
      setCommentary(defaultText);
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const articleUrl = `https://heyprince.in/insights/${post.slug}/`;

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishResult(null);

    try {
      const res = await fetch('/api/admin/linkedin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          commentary: commentary.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPublishResult({
          success: true,
          postUrn: data.postUrn,
          postUrl: data.postUrl,
        });
        showToast('Article published to your personal LinkedIn profile!', 'success');
      } else {
        setPublishResult({
          success: false,
          error: data.error || 'Failed to publish post to LinkedIn.',
        });
        showToast(data.error || 'Failed to publish post.', 'error');
      }
    } catch (err: any) {
      setPublishResult({
        success: false,
        error: err?.message || 'Network error while contacting LinkedIn API.',
      });
      showToast('Error connecting to server.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 15, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="hpa-card"
        style={{
          width: '100%',
          maxWidth: '620px',
          padding: '28px',
          position: 'relative',
          marginBottom: 0,
          border: '1px solid rgba(0, 119, 181, 0.4)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 25px rgba(0, 119, 181, 0.2)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            borderBottom: '1px solid var(--hpa-border)',
            paddingBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#0a66c2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.1rem',
              }}
            >
              in
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Publish Article to LinkedIn
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                Share this engineering insight to your authorized personal profile.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hpa-btn hpa-btn-secondary hpa-btn-icon"
            style={{ padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Loading status */}
        {loadingStatus ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--hpa-text-dim)' }}>
            <Loader2 size={24} className="hpa-spin" style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: '0.86rem' }}>Checking LinkedIn connection...</p>
          </div>
        ) : !isConfigured ? (
          /* Missing Server Environment Variables */
          <div
            style={{
              padding: '20px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', marginBottom: '8px' }}>
              <AlertCircle size={18} />
              <strong style={{ fontSize: '0.92rem' }}>LinkedIn Environment Configuration Needed</strong>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
              Please configure <code style={{ color: 'var(--hpa-primary)' }}>LINKEDIN_CLIENT_ID</code>,{' '}
              <code style={{ color: 'var(--hpa-primary)' }}>LINKEDIN_CLIENT_SECRET</code>, and{' '}
              <code style={{ color: 'var(--hpa-primary)' }}>LINKEDIN_REDIRECT_URI</code> in your environment variables.
            </p>
            <Link
              href="/admin/settings"
              onClick={onClose}
              className="hpa-btn hpa-btn-primary hpa-btn-sm"
              style={{ display: 'inline-flex' }}
            >
              Open Settings & Connect
            </Link>
          </div>
        ) : !isConnected ? (
          /* Account Not Connected */
          <div
            style={{
              padding: '20px',
              borderRadius: '8px',
              background: 'rgba(10, 102, 194, 0.1)',
              border: '1px solid rgba(10, 102, 194, 0.3)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', marginBottom: '8px' }}>
              <Share2 size={18} />
              <strong style={{ fontSize: '0.92rem' }}>Connect Your LinkedIn Personal Profile</strong>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
              Your LinkedIn account is not connected yet. Authorize your personal profile with the{' '}
              <code style={{ color: 'var(--hpa-primary)' }}>w_member_social</code> scope to publish articles directly from the admin panel.
            </p>
            <a
              href="/api/admin/linkedin/connect"
              className="hpa-btn hpa-btn-primary"
              style={{ background: '#0a66c2', borderColor: '#0a66c2', display: 'inline-flex' }}
            >
              <Share2 size={15} />
              <span>Connect LinkedIn Profile Now</span>
            </a>
          </div>
        ) : (
          /* Connected & Ready to Publish */
          <div>
            {/* Account Info Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: !personUrn || personUrn.includes('UNKNOWN') ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: !personUrn || personUrn.includes('UNKNOWN') ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                marginBottom: '18px',
                fontSize: '0.84rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: !personUrn || personUrn.includes('UNKNOWN') ? '#f59e0b' : '#10b981' }}>
                {!personUrn || personUrn.includes('UNKNOWN') ? (
                  <AlertCircle size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>
                  Connected to: <strong>{profileName}</strong>
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--hpa-text-dim)' }}>
                {personUrn && !personUrn.includes('UNKNOWN') ? personUrn : 'Action Needed'}
              </span>
            </div>

            {/* Prompt to link Person URN if UNKNOWN */}
            {(!personUrn || personUrn.includes('UNKNOWN')) && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '8px' }}>
                  <AlertCircle size={17} />
                  <strong style={{ fontSize: '0.92rem' }}>LinkedIn Person Author URN Required</strong>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.85)', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                  Because your app was authorized with the <code style={{ color: 'var(--hpa-primary)' }}>w_member_social</code> publishing permission only (without OpenID profile read access), please enter your LinkedIn Person URN or Member ID to publish articles:
                </p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="e.g. urn:li:person:abc123XYZ or member ID"
                    value={urnInput}
                    onChange={(e) => setUrnInput(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--hpa-border)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveUrn}
                    disabled={isSavingUrn || !urnInput.trim()}
                    className="hpa-btn hpa-btn-primary hpa-btn-sm"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {isSavingUrn ? 'Saving...' : 'Link URN'}
                  </button>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--hpa-text-dim)', margin: 0 }}>
                  💡 <em>Automated option: In your <a href="https://developer.linkedin.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--hpa-primary)', textDecoration: 'underline' }}>LinkedIn Developer Portal</a> under <strong>Products</strong>, enable <strong>"Sign In with LinkedIn using OpenID Connect"</strong> (instant 1-click), then click Reconnect.</em>
                </p>
              </div>
            )}

            {/* Success state */}
            {publishResult?.success ? (
              <div
                style={{
                  padding: '20px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  textAlign: 'center',
                  marginBottom: '20px',
                }}
              >
                <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 10px' }} />
                <h4 style={{ fontSize: '1.05rem', color: '#ffffff', margin: '0 0 8px' }}>
                  Successfully Published to LinkedIn!
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 16px' }}>
                  Your article is now live on your personal LinkedIn feed.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  {publishResult.postUrl && (
                    <a
                      href={publishResult.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hpa-btn hpa-btn-primary hpa-btn-sm"
                      style={{ background: '#0a66c2', borderColor: '#0a66c2' }}
                    >
                      <span>View Post on LinkedIn</span>
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button onClick={onClose} className="hpa-btn hpa-btn-secondary hpa-btn-sm">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Error Banner if publish failed */}
                {publishResult?.error && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      marginBottom: '16px',
                      fontSize: '0.84rem',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Publishing Failed:</strong> {publishResult.error}
                    </div>
                  </div>
                )}

                {/* Article Info Box */}
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--hpa-border)',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem', marginBottom: '4px' }}>
                    {post.title}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      color: 'var(--hpa-primary)',
                      wordBreak: 'break-all',
                    }}
                  >
                    <LinkIcon size={12} />
                    <span>{articleUrl}</span>
                  </div>
                </div>

                {/* Commentary Input */}
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      marginBottom: '6px',
                    }}
                  >
                    Post Commentary / Message (Editable)
                  </label>
                  <textarea
                    rows={6}
                    value={commentary}
                    onChange={(e) => setCommentary(e.target.value)}
                    placeholder="Enter what you would like to share with this article on LinkedIn..."
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--hpa-border)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                  <div style={{ fontSize: '0.78rem', color: 'var(--hpa-text-dim)', marginTop: '4px', textAlign: 'right' }}>
                    {commentary.length} characters
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    onClick={onClose}
                    disabled={isPublishing}
                    className="hpa-btn hpa-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing || !commentary.trim() || !personUrn || personUrn.includes('UNKNOWN')}
                    title={!personUrn || personUrn.includes('UNKNOWN') ? 'Please link your Person URN above to enable publishing' : undefined}
                    className="hpa-btn hpa-btn-primary"
                    style={{
                      background: !personUrn || personUrn.includes('UNKNOWN') ? '#4b5563' : '#0a66c2',
                      borderColor: !personUrn || personUrn.includes('UNKNOWN') ? '#4b5563' : '#0a66c2',
                      cursor: !personUrn || personUrn.includes('UNKNOWN') ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 size={16} className="hpa-spin" />
                        <span>Publishing to LinkedIn...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Publish Article to LinkedIn</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

