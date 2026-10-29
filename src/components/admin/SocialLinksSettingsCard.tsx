'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Save,
  Check,
  ExternalLink,
  Loader2,
  Globe,
} from 'lucide-react';
import { FaLinkedinIn, FaInstagram, FaWhatsapp, FaGithub, FaTwitter, FaYoutube } from 'react-icons/fa';

interface SocialLinkState {
  platform: string;
  url: string;
  label: string;
  is_active: boolean;
}

export function SocialLinksSettingsCard() {
  const [links, setLinks] = useState<SocialLinkState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/social-links');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.links)) {
        setLinks(data.links);
      }
    } catch {
      // transient network error
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (platform: string, newUrl: string) => {
    setLinks((prev) =>
      prev.map((item) =>
        item.platform === platform ? { ...item, url: newUrl } : item
      )
    );
  };

  const handleActiveToggle = (platform: string, isActive: boolean) => {
    setLinks((prev) =>
      prev.map((item) =>
        item.platform === platform ? { ...item, is_active: isActive } : item
      )
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch('/api/admin/settings/social-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ text: 'Social media links updated successfully across the website!', type: 'success' });
        setTimeout(() => setMsg(null), 4000);
      } else {
        setMsg({ text: data.error || 'Failed to update social links.', type: 'error' });
      }
    } catch {
      setMsg({ text: 'Network error while saving links.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return <FaLinkedinIn size={16} color="#0077b5" />;
      case 'instagram':
        return <FaInstagram size={16} color="#e4405f" />;
      case 'whatsapp':
        return <FaWhatsapp size={16} color="#25d366" />;
      case 'github':
        return <FaGithub size={16} color="#ffffff" />;
      case 'twitter':
        return <FaTwitter size={16} color="#1da1f2" />;
      case 'youtube':
        return <FaYoutube size={16} color="#ff0000" />;
      default:
        return <Globe size={16} color="var(--hpa-primary)" />;
    }
  };

  return (
    <div className="hpa-card" style={{ padding: '24px', marginBottom: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Share2 size={20} style={{ color: 'var(--hpa-primary)' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Social Media & Public Profiles
          </h2>
        </div>
        <span className="hpa-pill hpa-pill-active" style={{ fontSize: '0.72rem' }}>
          Live Website Sync
        </span>
      </div>

      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.84rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>
        Update the social links and contact profiles displayed in your website header, footer, contact page, and executive bio.
      </p>

      {/* Message Alert */}
      {msg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: msg.type === 'success' ? 'rgba(0, 245, 160, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(0, 245, 160, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
            color: msg.type === 'success' ? 'var(--hpa-success)' : '#f43f5e',
            fontSize: '0.82rem',
            marginBottom: '16px',
          }}
        >
          {msg.text}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
          <Loader2 size={18} className="hpa-spinner" style={{ margin: '0 auto 8px' }} />
          Loading profiles...
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {links.map((item) => (
            <div
              key={item.platform}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--hpa-border)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getPlatformIcon(item.platform)}
              </div>

              <div style={{ width: '90px', flexShrink: 0 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
                  {item.label || item.platform}
                </span>
              </div>

              <input
                type="text"
                value={item.url}
                onChange={(e) => handleUrlChange(item.platform, e.target.value)}
                placeholder={`https://${item.platform}.com/...`}
                className="hpa-form-input"
                style={{ flex: 1, height: '36px', fontSize: '0.82rem' }}
              />

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hpa-btn-icon"
                  title="Test Link"
                  style={{ color: 'rgba(255, 255, 255, 0.5)', display: 'flex', alignItems: 'center' }}
                >
                  <ExternalLink size={15} />
                </a>
              )}

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: item.is_active ? 'var(--hpa-success)' : 'rgba(255, 255, 255, 0.3)',
                  flexShrink: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={item.is_active}
                  onChange={(e) => handleActiveToggle(item.platform, e.target.checked)}
                  style={{ accentColor: 'var(--hpa-primary)', cursor: 'pointer' }}
                />
                <span>{item.is_active ? 'Active' : 'Hidden'}</span>
              </label>
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="hpa-btn hpa-btn-primary"
            style={{ marginTop: '8px', justifyContent: 'center' }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="hpa-spinner" />
                <span>Saving Links...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Social Media Links</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
