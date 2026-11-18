'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  MessageSquare,
  AtSign,
} from 'lucide-react';

function XIcon({ size = 16, color = '#1da1f2' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color }}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
import { PostRecord } from '@/lib/admin-db';
import { useToast } from '@/components/admin/Toast';
import { PlatformConfigStatus, SocialPlatform, SocialPublishResult } from '@/lib/social/types';

interface SocialPublishModalProps {
  post: PostRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SocialPublishModal({ post, isOpen, onClose }: SocialPublishModalProps) {
  const { showToast } = useToast();
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [platforms, setPlatforms] = useState<PlatformConfigStatus[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<SocialPlatform, boolean>>({
    threads: true,
    twitter: true,
    whatsapp: true,
  });
  const [customText, setCustomText] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<SocialPublishResult[] | null>(null);

  // Fetch status of social platforms whenever modal opens
  useEffect(() => {
    if (!isOpen) {
      setPublishResults(null);
      return;
    }

    setLoadingStatus(true);
    fetch('/api/admin/social/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.platforms && Array.isArray(data.platforms)) {
          setPlatforms(data.platforms);

          // Default selected platforms to only those that are configured
          const initialSelection: Record<SocialPlatform, boolean> = {
            threads: false,
            twitter: false,
            whatsapp: false,
          };

          data.platforms.forEach((p: PlatformConfigStatus) => {
            if (p.isConfigured && p.platform in initialSelection) {
              initialSelection[p.platform] = true;
            }
          });

          // If none are configured, keep all selected so admin can test or see config warnings
          const hasAnyConfigured = Object.values(initialSelection).some(Boolean);
          if (hasAnyConfigured) {
            setSelectedPlatforms(initialSelection);
          } else {
            setSelectedPlatforms({ threads: true, twitter: true, whatsapp: true });
          }
        }
      })
      .catch((err) => {
        console.warn('[SocialPublishModal] Error fetching statuses:', err);
      })
      .finally(() => {
        setLoadingStatus(false);
      });
  }, [isOpen]);

  // Prepopulate default text based on post details
  useEffect(() => {
    if (post) {
      const articleUrl = `https://heyprince.in/insights/${post.slug}/`;
      const title = post.title || 'Engineering Insight';
      const excerpt = post.excerpt || post.seo_description || '';
      const text = `${title}\n\n${excerpt}\n\nRead the full engineering insight:\n${articleUrl}\n\n#Tech #Engineering #Software`;
      setCustomText(text);
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const togglePlatform = (p: SocialPlatform) => {
    setSelectedPlatforms((prev) => ({
      ...prev,
      [p]: !prev[p],
    }));
  };

  const handlePublish = async () => {
    const targetPlatforms = (Object.keys(selectedPlatforms) as SocialPlatform[]).filter(
      (k) => selectedPlatforms[k]
    );

    if (targetPlatforms.length === 0) {
      showToast('Please select at least one social platform to publish to.', 'error');
      return;
    }

    setIsPublishing(true);
    setPublishResults(null);

    try {
      const res = await fetch('/api/admin/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          platforms: targetPlatforms,
          customText: customText.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.results) {
        setPublishResults(data.results);
        if (data.publishedCount > 0) {
          showToast(`Published successfully to ${data.publishedCount} platform${data.publishedCount > 1 ? 's' : ''}!`, 'success');
        } else if (data.skippedCount > 0) {
          showToast('Selected platforms are not configured with API credentials.', 'info');
        } else {
          showToast(data.message || 'Publishing finished with warnings.', 'error');
        }
      } else {
        showToast(data.error || 'Failed to dispatch social media publish request.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Network error contacting social API route.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const textLength = customText.length;
  const isTwitterOverLimit = selectedPlatforms.twitter && textLength > 280;
  const isThreadsOverLimit = selectedPlatforms.threads && textLength > 500;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 15, 0.85)',
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
          maxWidth: '660px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          position: 'relative',
          marginBottom: 0,
          border: '1px solid rgba(255, 51, 102, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 51, 102, 0.15)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ff3366, #ff6b3d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Share2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Publish to Social Media
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--hpa-text-dim)', margin: '2px 0 0' }}>
                Distribute insight across Threads, Twitter / X, and WhatsApp Channel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hpa-btn hpa-btn-secondary hpa-btn-icon"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Platform Selection Cards */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>
            Select Target Channels
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {/* Threads */}
            {(() => {
              const status = platforms.find((p) => p.platform === 'threads');
              const configured = status ? status.isConfigured : false;
              const isSelected = selectedPlatforms.threads;
              return (
                <div
                  onClick={() => togglePlatform('threads')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: isSelected
                      ? '1px solid #ff3366'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected
                      ? 'rgba(255, 51, 102, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.84rem', color: '#ffffff' }}>
                      <AtSign size={16} style={{ color: '#ff3366' }} />
                      <span>Threads</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ accentColor: '#ff3366' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: configured ? 'var(--hpa-success)' : 'var(--hpa-text-dim)' }}>
                    {loadingStatus ? 'Checking...' : configured ? 'Configured' : 'Needs API Keys'}
                  </div>
                </div>
              );
            })()}

            {/* Twitter / X */}
            {(() => {
              const status = platforms.find((p) => p.platform === 'twitter');
              const configured = status ? status.isConfigured : false;
              const isSelected = selectedPlatforms.twitter;
              return (
                <div
                  onClick={() => togglePlatform('twitter')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: isSelected
                      ? '1px solid #1da1f2'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected
                      ? 'rgba(29, 161, 242, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.84rem', color: '#ffffff' }}>
                      <XIcon size={16} color="#1da1f2" />
                      <span>Twitter / X</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ accentColor: '#1da1f2' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: configured ? 'var(--hpa-success)' : 'var(--hpa-text-dim)' }}>
                    {loadingStatus ? 'Checking...' : configured ? 'Configured' : 'Needs API Keys'}
                  </div>
                </div>
              );
            })()}

            {/* WhatsApp Channel */}
            {(() => {
              const status = platforms.find((p) => p.platform === 'whatsapp');
              const configured = status ? status.isConfigured : false;
              const isSelected = selectedPlatforms.whatsapp;
              return (
                <div
                  onClick={() => togglePlatform('whatsapp')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: isSelected
                      ? '1px solid #25d366'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected
                      ? 'rgba(37, 211, 102, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.84rem', color: '#ffffff' }}>
                      <MessageSquare size={16} style={{ color: '#25d366' }} />
                      <span>WhatsApp</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ accentColor: '#25d366' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: configured ? 'var(--hpa-success)' : 'var(--hpa-text-dim)' }}>
                    {loadingStatus ? 'Checking...' : configured ? 'Configured' : 'Needs API Keys'}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Content Editor */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
              Post Commentary
            </label>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem' }}>
              {selectedPlatforms.twitter && (
                <span style={{ color: isTwitterOverLimit ? '#f87171' : 'var(--hpa-text-dim)' }}>
                  Twitter: {textLength}/280 {isTwitterOverLimit ? '(Too long)' : ''}
                </span>
              )}
              {selectedPlatforms.threads && (
                <span style={{ color: isThreadsOverLimit ? '#f87171' : 'var(--hpa-text-dim)' }}>
                  Threads: {textLength}/500 {isThreadsOverLimit ? '(Too long)' : ''}
                </span>
              )}
            </div>
          </div>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={7}
            className="hpa-input"
            style={{
              width: '100%',
              fontSize: '0.84rem',
              lineHeight: 1.5,
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
            placeholder="Write commentary for your social broadcasts..."
          />
        </div>

        {/* Publication Results if available */}
        {publishResults && (
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '18px',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              Publishing Results:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {publishResults.map((res) => (
                <div
                  key={res.platform}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: res.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: res.success ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {res.success ? (
                      <CheckCircle2 size={15} style={{ color: '#4ade80' }} />
                    ) : (
                      <AlertCircle size={15} style={{ color: '#f87171' }} />
                    )}
                    <span style={{ fontWeight: 600, color: '#ffffff', textTransform: 'capitalize' }}>
                      {res.platform}
                    </span>
                    <span style={{ color: res.success ? '#4ade80' : '#f87171', fontSize: '0.76rem' }}>
                      {res.success ? 'Published' : res.error || 'Failed'}
                    </span>
                  </div>

                  {res.externalPostUrl && (
                    <a
                      href={res.externalPostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                      style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px' }}
                    >
                      <span>View</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="hpa-btn hpa-btn-secondary"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="hpa-btn hpa-btn-primary"
            style={{
              background: 'linear-gradient(135deg, #ff3366, #ff6b3d)',
              borderColor: '#ff3366',
              gap: '6px',
            }}
          >
            {isPublishing ? (
              <>
                <Loader2 size={16} className="hpa-spin" />
                <span>Publishing to Channels...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>Publish to Selected</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
