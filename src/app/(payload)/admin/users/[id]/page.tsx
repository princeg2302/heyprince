import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit2,
  Users,
  ShieldCheck,
  Shield,
  Calendar,
  Mail,
  Key,
} from 'lucide-react';
import { getCurrentAdmin, getUserById } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';

export const metadata = {
  title: 'View User Profile — HeyPrince Admin',
  description: 'Inspect admin account details and authorization levels.',
};

export default async function ViewUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) notFound();

  const targetUser = await getUserById(numId);
  if (!targetUser) notFound();

  return (
    <AdminLayout user={user}>
      <div className="ad-page-title-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/admin/users" className="ad-btn ad-btn-secondary ad-btn-icon" title="Back to Users">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                className="ad-pill"
                style={{
                  background: targetUser.role === 'admin' ? 'rgba(255, 51, 102, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                  borderColor: targetUser.role === 'admin' ? 'rgba(255, 51, 102, 0.3)' : 'rgba(56, 189, 248, 0.3)',
                  color: targetUser.role === 'admin' ? 'var(--ad-primary)' : 'var(--ad-info)',
                }}
              >
                {targetUser.role === 'admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                <span style={{ textTransform: 'capitalize' }}>{targetUser.role} Account</span>
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--ad-text-dim)' }}>
                User ID #{targetUser.id}
              </span>
            </div>
            <h1 className="ad-page-title">{targetUser.name}</h1>
          </div>
        </div>

        <Link href={`/admin/users/${targetUser.id}/edit`} className="ad-btn ad-btn-primary">
          <Edit2 size={15} />
          <span>Edit Profile & Password</span>
        </Link>
      </div>

      <div className="ad-card" style={{ maxWidth: '680px', padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--ad-primary), var(--ad-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#ffffff',
            }}
          >
            {targetUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
              {targetUser.name}
            </h2>
            <div style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              {targetUser.email}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', fontSize: '0.88rem' }}>
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--ad-border)',
            }}
          >
            <div style={{ color: 'var(--ad-text-dim)', fontSize: '0.78rem', marginBottom: '4px' }}>
              Access Tier
            </div>
            <div style={{ fontWeight: 700, color: '#ffffff', textTransform: 'capitalize' }}>
              {targetUser.role} (Superuser privileges)
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--ad-border)',
            }}
          >
            <div style={{ color: 'var(--ad-text-dim)', fontSize: '0.78rem', marginBottom: '4px' }}>
              Account Created
            </div>
            <div style={{ fontWeight: 600, color: '#ffffff' }}>
              {new Date(targetUser.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--ad-border)',
            }}
          >
            <div style={{ color: 'var(--ad-text-dim)', fontSize: '0.78rem', marginBottom: '4px' }}>
              Authentication Standard
            </div>
            <div style={{ fontWeight: 600, color: 'var(--ad-success)' }}>
              PBKDF2-SHA256 (600k rounds)
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--ad-border)',
            }}
          >
            <div style={{ color: 'var(--ad-text-dim)', fontSize: '0.78rem', marginBottom: '4px' }}>
              Database Record
            </div>
            <div style={{ fontWeight: 600, color: '#ffffff' }}>
              Supabase public.users #{targetUser.id}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
