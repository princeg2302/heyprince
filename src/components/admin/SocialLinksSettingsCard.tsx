'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Save,
  Check,
  ExternalLink,
  Loader2,
  Globe,
  Sparkles,
  Eye,
  EyeOff,
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

  const handleActiveToggle = (platform: string) => {
    setLinks((prev) =>
      prev.map((item) =>
        item.platform === platform ? { ...item, is_active: !item.is_active } : item
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

  const getPlatformDetails = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return {
          icon: <FaLinkedinIn size={16} color="#0077b5" />,
          bg: 'rgba(0, 119, 181, 0.12)',
          border: 'rgba(0, 119, 181, 0.3)',
          placeholder: 'https://www.linkedin.com/in/mr-goyal/',
          hint: 'Professional networking & thought leadership',
        };
      case 'instagram':
        return {
          icon: <FaInstagram size={16} color="#e4405f" />,
          bg: 'rgba(228, 64, 95, 0.12)',
          border: 'rgba(228, 64, 95, 0.3)',
          placeholder: 'https://www.instagram.com/heyprince.in/',
          hint: 'Visual portfolio & behind-the-scenes updates',
        };
      case 'whatsapp':
        return {
          icon: <FaWhatsapp size={16} color="#25d366" />,
          bg: 'rgba(37, 211, 102, 0.12)',
          border: 'rgba(37, 211, 102, 0.3)',
          placeholder: 'https://wa.me/919120900010',
          hint: 'Direct business messaging & quick consultations',
        };
      case 'github':
        return {
          icon: <FaGithub size={16} color="#ffffff" />,
          bg: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.2)',
          placeholder: 'https://github.com/princeg2302',
          hint: 'Open source repositories & code showcases',
        };
      case 'twitter':
        return {
          icon: <FaTwitter size={16} color="#1da1f2" />,
          bg: 'rgba(29, 161, 242, 0.12)',
          border: 'rgba(29, 161, 242, 0.3)',
          placeholder: 'https://x.com/yourhandle',
          hint: 'Tech insights, announcements & quick thoughts',
        };
      case 'youtube':
        return {
          icon: <FaYoutube size={16} color="#ff0000" />,
          bg: 'rgba(255, 0, 0, 0.12)',
          border: 'rgba(255, 0, 0, 0.3)',
          placeholder: 'https://youtube.com/@yourchannel',
          hint: 'Tutorials, case studies & project walkthroughs',
        };
      default:
        return {
          icon: <Globe size={16} color="var(--hpa-primary)" />,
          bg: 'rgba(255, 51, 102, 0.12)',
          border: 'rgba(255, 51, 102, 0.3)',
          placeholder: 'https://...',
          hint: 'Public profile or link',
        };
    }
  };

  return (
    <div className="hpa-card" style={{ padding: '28px', marginBottom: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(255, 51, 102, 0.1)',
              border: '1px solid rgba(255, 51, 102, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Share2 size={20} style={{ color: 'var(--hpa-primary)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
              Public Social Media Profiles & Links
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.84rem', margin: '2px 0 0 0' }}>
              Configure the exact links and visibility for your website header, footer, contact form, and author bio.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="hpa-pill hpa-pill-active" style={{ fontSize: '0.74rem', padding: '4px 10px' }}>
            <span className="hpa-status-dot" style={{ position: 'static', display: 'inline-block', marginRight: '6px' }} />
            Live Sync Enabled
          </span>
        </div>
      </div>

      {/* Status Message */}
      {msg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: msg.type === 'success' ? 'rgba(0, 245, 160, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(0, 245, 160, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            color: msg.type === 'success' ? 'var(--hpa-success)' : '#f43f5e',
            fontSize: '0.86rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {msg.type === 'success' ? <Check size={16} /> : null}
          <span>{msg.text}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
          <Loader2 size={22} className="hpa-spinner" style={{ margin: '0 auto 10px' }} />
          Loading social profiles...
        </div>
      ) : (
        <form onSubmit={handleSave}>
          {/* Responsive 2-Column Grid of Spacious Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {links.map((item) => {
              const details = getPlatformDetails(item.platform);

              return (
                <div
                  key={item.platform}
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    background: item.is_active ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                    border: `1px solid ${item.is_active ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)'}`,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {/* Card Header: Icon, Label & Toggle Switch */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: details.bg,
                          border: `1px solid ${details.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {details.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.92rem' }}>
                          {item.label || item.platform}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                          {details.hint}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hpa-btn-icon"
                          title={`Test ${item.label} link in new tab`}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}

                      {/* Interactive Active / Hidden Pill Button */}
                      <button
                        type="button"
                        onClick={() => handleActiveToggle(item.platform)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          border: `1px solid ${item.is_active ? 'rgba(0, 245, 160, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                          background: item.is_active ? 'rgba(0, 245, 160, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                          color: item.is_active ? 'var(--hpa-success)' : 'rgba(255, 255, 255, 0.4)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {item.is_active ? (
                          <>
                            <Eye size={12} />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Spacious Full-Width URL Input */}
                  <div>
                    <input
                      type="text"
                      value={item.url}
                      onChange={(e) => handleUrlChange(item.platform, e.target.value)}
                      placeholder={details.placeholder}
                      className="hpa-form-input"
                      style={{
                        width: '100%',
                        height: '40px',
                        fontSize: '0.86rem',
                        fontFamily: 'monospace',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Bar (with ample margin away from floating assistants) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--hpa-border)',
              paddingBottom: '20px',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              💡 Changes apply immediately across the entire site without requiring a rebuild.
            </div>

            <button
              type="submit"
              disabled={saving}
              className="hpa-btn hpa-btn-primary"
              style={{
                padding: '12px 28px',
                fontSize: '0.92rem',
                fontWeight: 700,
                minWidth: '220px',
                justifyContent: 'center',
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="hpa-spinner" />
                  <span>Saving Profiles...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Social Media Links</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
