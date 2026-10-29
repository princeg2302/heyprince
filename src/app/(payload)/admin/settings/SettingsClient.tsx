'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  Share2,
  Database,
  Server,
  Key,
  ExternalLink,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';
import { AdminUser } from '@/lib/admin-db';
import { LinkedInSettingsCard } from '@/components/admin/LinkedInSettingsCard';
import { MfaSettingsCard } from '@/components/admin/MfaSettingsCard';
import { SocialLinksSettingsCard } from '@/components/admin/SocialLinksSettingsCard';

interface SettingsClientProps {
  user: AdminUser;
  supabaseUrl: string;
}

export function SettingsClient({ user, supabaseUrl }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'security' | 'social' | 'linkedin' | 'system' | 'all'>('all');

  const tabs = [
    { id: 'all', label: 'Overview & All', icon: Layers },
    { id: 'security', label: 'Security & Profile', icon: ShieldCheck },
    { id: 'social', label: 'Social Media Links', icon: Share2 },
    { id: 'linkedin', label: 'LinkedIn Integration', icon: Sparkles },
    { id: 'system', label: 'Cloud & Infrastructure', icon: Database },
  ] as const;

  return (
    <div>
      {/* Page Title */}
      <div className="hpa-page-title-row" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="hpa-page-title">Platform & System Settings</h1>
          <p className="hpa-page-desc">
            Manage your executive profile, Two-Factor Authentication (MFA), public social channels, and cloud infrastructure.
          </p>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--hpa-border)',
          marginBottom: '28px',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? 'rgba(255, 51, 102, 0.08)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--hpa-primary)' : '2px solid transparent',
                borderRadius: '8px 8px 0 0',
                color: isActive ? '#ffffff' : 'var(--hpa-text-dim)',
                padding: '10px 18px',
                fontSize: '0.86rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={15} style={{ color: isActive ? 'var(--hpa-primary)' : 'inherit' }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* SECTION 1: ACCOUNT & SECURITY */}
      {(activeTab === 'all' || activeTab === 'security') && (
        <div style={{ marginBottom: '32px' }}>
          {activeTab === 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ShieldCheck size={18} style={{ color: 'var(--hpa-primary)' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Account Identity & Security
              </h2>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '24px',
              alignItems: 'stretch',
            }}
          >
            {/* Administrator Profile Card */}
            <div
              className="hpa-card"
              style={{
                padding: '24px',
                marginBottom: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User size={20} style={{ color: 'var(--hpa-primary)' }} />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                      Active Administrator
                    </h2>
                  </div>
                  <span className="hpa-pill hpa-pill-admin" style={{ textTransform: 'capitalize' }}>
                    {user.role}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--hpa-primary), var(--hpa-accent))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.4rem',
                      color: '#ffffff',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 4px 16px rgba(255, 51, 102, 0.2)',
                    }}
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                      {user.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.84rem', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: 'var(--hpa-text-dim)' }}>Session Security</span>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>HMAC-SHA256 Signed (7 Days)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: 'var(--hpa-text-dim)' }}>Password Algorithm</span>
                    <span style={{ color: 'var(--hpa-success)', fontWeight: 600 }}>PBKDF2-SHA256 (600k)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--hpa-text-dim)' }}>Status</span>
                    <span style={{ color: 'var(--hpa-success)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <span className="hpa-status-dot" style={{ position: 'static', display: 'inline-block' }} />
                      Verified Active
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={`/admin/users/${user.id}/edit`}
                className="hpa-btn hpa-btn-primary"
                style={{ width: '100%', justifyContent: 'center', height: '42px' }}
              >
                <Key size={15} />
                <span>Edit Profile & Password</span>
              </Link>
            </div>

            {/* MFA Settings Card */}
            <MfaSettingsCard />
          </div>
        </div>
      )}

      {/* SECTION 2: SOCIAL MEDIA & PUBLIC PROFILES */}
      {(activeTab === 'all' || activeTab === 'social') && (
        <div style={{ marginBottom: '32px' }}>
          {activeTab === 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Share2 size={18} style={{ color: 'var(--hpa-primary)' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Public Channels & Social Links
              </h2>
            </div>
          )}

          {/* Social Links Card rendered with full generous width */}
          <SocialLinksSettingsCard />
        </div>
      )}

      {/* SECTION 3: LINKEDIN PUBLISHING INTEGRATION */}
      {(activeTab === 'all' || activeTab === 'linkedin') && (
        <div style={{ marginBottom: '32px' }}>
          {activeTab === 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={18} style={{ color: 'var(--hpa-primary)' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                LinkedIn Automation & Page Publishing
              </h2>
            </div>
          )}

          <LinkedInSettingsCard />
        </div>
      )}

      {/* SECTION 4: CLOUD & INFRASTRUCTURE */}
      {(activeTab === 'all' || activeTab === 'system') && (
        <div style={{ marginBottom: '40px' }}>
          {activeTab === 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Database size={18} style={{ color: 'var(--hpa-primary)' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cloud Database & Architecture
              </h2>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Supabase Infrastructure Card */}
            <div className="hpa-card" style={{ padding: '24px', marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <Database size={20} style={{ color: 'var(--hpa-success)' }} />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    Supabase Infrastructure
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.84rem', marginBottom: '22px' }}>
                  <div>
                    <span style={{ color: 'var(--hpa-text-dim)', display: 'block', marginBottom: '4px' }}>
                      Project REST URL
                    </span>
                    <code style={{ fontSize: '0.8rem', color: 'var(--hpa-primary)', wordBreak: 'break-all' }}>
                      {supabaseUrl}
                    </code>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: 'var(--hpa-text-dim)' }}>Connection Pooler</span>
                    <span className="hpa-status-pill">
                      <span className="hpa-status-dot" />
                      <span>Port 6543 (Transaction)</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: 'var(--hpa-text-dim)' }}>SSL Enforcement</span>
                    <span style={{ color: 'var(--hpa-success)', fontWeight: 600 }}>Enabled (Verified)</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--hpa-text-dim)' }}>Host Region</span>
                    <span style={{ color: '#ffffff' }}>AWS us-west-2</span>
                  </div>
                </div>
              </div>

              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="hpa-btn hpa-btn-secondary"
                style={{ width: '100%', justifyContent: 'space-between' }}
              >
                <span>Open Supabase Cloud Console</span>
                <ExternalLink size={14} />
              </a>
            </div>

            {/* Framework Architecture Card */}
            <div className="hpa-card" style={{ padding: '24px', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <Server size={20} style={{ color: 'var(--hpa-info)' }} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  Framework Architecture & Deployment
                </h2>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  fontSize: '0.84rem',
                }}
              >
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--hpa-border)' }}>
                  <div style={{ color: 'var(--hpa-text-dim)', marginBottom: '4px', fontSize: '0.78rem' }}>Next.js Engine</div>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>16.3.8 (App Router)</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--hpa-border)' }}>
                  <div style={{ color: 'var(--hpa-text-dim)', marginBottom: '4px', fontSize: '0.78rem' }}>Compiler</div>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>Turbopack</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--hpa-border)' }}>
                  <div style={{ color: 'var(--hpa-text-dim)', marginBottom: '4px', fontSize: '0.78rem' }}>UI Runtime</div>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>React 19.3</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--hpa-border)' }}>
                  <div style={{ color: 'var(--hpa-text-dim)', marginBottom: '4px', fontSize: '0.78rem' }}>Edge Infrastructure</div>
                  <div style={{ fontWeight: 700, color: 'var(--hpa-success)' }}>Vercel Ready</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
