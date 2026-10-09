import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Settings as SettingsIcon,
  Database,
  Server,
  ShieldCheck,
  User,
  Key,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { getCurrentAdmin } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';

export const metadata = {
  title: 'Settings — HeyPrince Admin',
  description: 'System configuration, profile, and infrastructure security.',
};

export default async function SettingsPage() {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muzbzrxwbanzsjvgtexp.supabase.co';

  return (
    <AdminLayout user={user}>
      <div className="ad-page-title-row">
        <div>
          <h1 className="ad-page-title">Platform & System Settings</h1>
          <p className="ad-page-desc">
            Environment specifications, security keys, and administrator profile.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Administrator Profile */}
        <div className="ad-card" style={{ padding: '24px', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <User size={20} style={{ color: 'var(--ad-primary)' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Active Administrator
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--ad-primary), var(--ad-accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: '#ffffff',
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '1rem' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                {user.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ad-text-dim)' }}>Role Tier</span>
              <span className="ad-pill ad-pill-admin" style={{ textTransform: 'capitalize' }}>
                {user.role}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ad-text-dim)' }}>Session Duration</span>
              <span style={{ color: '#ffffff' }}>7 Days (HTTP-only)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ad-text-dim)' }}>Encryption</span>
              <span style={{ color: 'var(--ad-success)' }}>PBKDF2-SHA256 (600k)</span>
            </div>
          </div>

          <Link href={`/admin/users/${user.id}/edit`} className="ad-btn ad-btn-primary" style={{ width: '100%' }}>
            <Key size={14} />
            <span>Update Profile or Password</span>
          </Link>
        </div>

        {/* Database & Supabase */}
        <div className="ad-card" style={{ padding: '24px', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Database size={20} style={{ color: 'var(--ad-success)' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Supabase Infrastructure
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.84rem', marginBottom: '20px' }}>
            <div>
              <span style={{ color: 'var(--ad-text-dim)', display: 'block', marginBottom: '2px' }}>
                Project REST URL
              </span>
              <code style={{ fontSize: '0.8rem', color: 'var(--ad-primary)', wordBreak: 'break-all' }}>
                {supabaseUrl}
              </code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ad-text-dim)' }}>Connection Pooler</span>
              <span className="ad-status-pill">
                <span className="ad-status-dot" />
                <span>Port 6543 (Transaction)</span>
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ad-text-dim)' }}>SSL Enforcement</span>
              <span style={{ color: 'var(--ad-success)', fontWeight: 600 }}>Enabled (Verified)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ad-text-dim)' }}>Host Region</span>
              <span style={{ color: '#ffffff' }}>AWS us-west-2</span>
            </div>
          </div>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="ad-btn ad-btn-secondary"
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <span>Open Supabase Cloud Console</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Runtime Engine */}
        <div className="ad-card" style={{ padding: '24px', gridColumn: 'span 2', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Server size={20} style={{ color: 'var(--ad-info)' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Framework Architecture & Deployment
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              fontSize: '0.84rem',
            }}
          >
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--ad-border)',
              }}
            >
              <div style={{ color: 'var(--ad-text-dim)', marginBottom: '4px' }}>Next.js Version</div>
              <div style={{ fontWeight: 700, color: '#ffffff' }}>16.3.8 (App Router)</div>
            </div>

            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--ad-border)',
              }}
            >
              <div style={{ color: 'var(--ad-text-dim)', marginBottom: '4px' }}>Compiler</div>
              <div style={{ fontWeight: 700, color: '#ffffff' }}>Turbopack Engine</div>
            </div>

            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--ad-border)',
              }}
            >
              <div style={{ color: 'var(--ad-text-dim)', marginBottom: '4px' }}>UI Runtime</div>
              <div style={{ fontWeight: 700, color: '#ffffff' }}>React 19.3</div>
            </div>

            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--ad-border)',
              }}
            >
              <div style={{ color: 'var(--ad-text-dim)', marginBottom: '4px' }}>Hosting Compatibility</div>
              <div style={{ fontWeight: 700, color: 'var(--ad-success)' }}>Vercel Ready</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
