import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Briefcase,
  Users,
  FolderOpen,
  Mail,
  Image as ImageIcon,
  Plus,
  ArrowUpRight,
  Database,
  Server,
  Sparkles,
  Activity,
  CheckCircle2,
  Inbox,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { getCurrentAdmin, getDashboardStats } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';

export const metadata = {
  title: 'Executive Dashboard — HeyPrince Admin',
  description: 'Production administration command center for heyprince.in',
};

export default async function AdminDashboardPage() {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login/');
  }

  const stats = await getDashboardStats();

  const metrics = [
    {
      title: 'Client Inquiries',
      count: stats.leadsCount,
      subtext: `${stats.newLeadsCount} new submissions`,
      badge: stats.newLeadsCount > 0 ? `${stats.newLeadsCount} New` : 'CRM Active',
      badgeColor: '#ff3366',
      icon: Mail,
      iconColor: '#ff3366',
      bgGlow: 'rgba(255, 51, 102, 0.08)',
      borderColor: 'rgba(255, 51, 102, 0.25)',
      link: '/admin/leads',
      createLink: null,
    },
    {
      title: 'Services Catalog',
      count: stats.servicesCount,
      subtext: `${stats.featuredServicesCount} featured offerings`,
      badge: `${stats.publishedServicesCount} Live`,
      badgeColor: '#00f5a0',
      icon: Briefcase,
      iconColor: '#00f5a0',
      bgGlow: 'rgba(0, 245, 160, 0.08)',
      borderColor: 'rgba(0, 245, 160, 0.25)',
      link: '/admin/services',
      createLink: '/admin/services/new',
    },
    {
      title: 'Insights & Articles',
      count: stats.postsCount,
      subtext: `${stats.draftPostsCount} drafts pending`,
      badge: `${stats.publishedPostsCount} Published`,
      badgeColor: '#8b5cf6',
      icon: FileText,
      iconColor: '#a78bfa',
      bgGlow: 'rgba(139, 92, 246, 0.08)',
      borderColor: 'rgba(139, 92, 246, 0.25)',
      link: '/admin/posts',
      createLink: '/admin/posts/new',
    },
    {
      title: 'Taxonomies',
      count: stats.categoriesCount,
      subtext: 'Content categories',
      badge: 'Organized',
      badgeColor: '#f59e0b',
      icon: FolderOpen,
      iconColor: '#fbbf24',
      bgGlow: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.25)',
      link: '/admin/categories',
      createLink: '/admin/categories',
    },
    {
      title: 'Media Library',
      count: stats.mediaCount,
      subtext: 'Assets & uploaded files',
      badge: 'Storage',
      badgeColor: '#38bdf8',
      icon: ImageIcon,
      iconColor: '#38bdf8',
      bgGlow: 'rgba(56, 189, 248, 0.08)',
      borderColor: 'rgba(56, 189, 248, 0.25)',
      link: '/admin/media',
      createLink: '/admin/media',
    },
    {
      title: 'Admin Security',
      count: stats.usersCount,
      subtext: 'Authorized managers',
      badge: 'Protected',
      badgeColor: '#ec4899',
      icon: Users,
      iconColor: '#f472b6',
      bgGlow: 'rgba(236, 72, 153, 0.08)',
      borderColor: 'rgba(236, 72, 153, 0.25)',
      link: '/admin/users',
      createLink: '/admin/users/new',
    },
  ];

  const quickActions = [
    { label: '+ Add Article', href: '/admin/posts/new', icon: FileText, color: '#8b5cf6' },
    { label: '+ Add Service', href: '/admin/services/new', icon: Sparkles, color: '#00f5a0' },
    { label: '+ Add User', href: '/admin/users/new', icon: Users, color: '#ec4899' },
    { label: 'Review Leads', href: '/admin/leads', icon: Mail, color: '#ff3366' },
    { label: 'Manage Media', href: '/admin/media', icon: ImageIcon, color: '#38bdf8' },
  ];

  return (
    <AdminLayout user={user}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(22, 22, 34, 0.8) 0%, rgba(13, 13, 20, 0.95) 100%)',
          border: '1px solid rgba(255, 51, 102, 0.2)',
          borderRadius: '16px',
          padding: '28px 32px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #ff3366 0%, #8b5cf6 50%, #00f5a0 100%)',
          }}
        />

        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '100px',
                background: 'rgba(0, 245, 160, 0.1)',
                border: '1px solid rgba(0, 245, 160, 0.3)',
                color: '#00f5a0',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              <span className="ad-status-dot" />
              Production Live • heyprince.in
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              <Database size={13} style={{ color: '#00f5a0' }} />
              Supabase PostgreSQL Pooler (SSL)
            </span>
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
            Executive Command Center
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.6)', margin: 0, maxWidth: '640px' }}>
            Welcome back, <strong style={{ color: '#ffffff' }}>{user.name}</strong>. Manage your client leads, service portfolio, technical articles, and system security in real time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="https://heyprince.in"
            target="_blank"
            rel="noopener noreferrer"
            className="ad-btn ad-btn-primary"
          >
            <span>View Live Site</span>
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>

      {/* Quick Launch Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(14, 14, 22, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '24px',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.76rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'rgba(255, 255, 255, 0.5)',
            marginRight: '6px',
          }}
        >
          <Activity size={14} style={{ color: '#ff3366' }} />
          Quick Actions:
        </span>
        {quickActions.map((qa, i) => {
          const Icon = qa.icon;
          return (
            <Link
              key={i}
              href={qa.href}
              className="ad-btn ad-btn-secondary ad-btn-sm"
              style={{ gap: '6px' }}
            >
              <Icon size={14} style={{ color: qa.color }} />
              <span>{qa.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 6 Metric KPI Cards */}
      <div className="ad-stats-grid">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="ad-stat-card"
              style={{
                background: `linear-gradient(145deg, ${m.bgGlow} 0%, rgba(13, 13, 20, 0.95) 100%)`,
                borderColor: m.borderColor,
              }}
            >
              <div className="ad-stat-top">
                <div
                  className="ad-stat-icon-box"
                  style={{ background: m.bgGlow, color: m.iconColor }}
                >
                  <Icon size={20} />
                </div>
                <span
                  className="ad-stat-badge"
                  style={{
                    color: m.badgeColor,
                    borderColor: `${m.badgeColor}40`,
                    background: `${m.badgeColor}15`,
                  }}
                >
                  {m.badge}
                </span>
              </div>

              <div className="ad-stat-num">{m.count}</div>
              <div className="ad-stat-title">{m.title}</div>
              <div className="ad-stat-sub">{m.subtext}</div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '10px',
                  marginTop: '14px',
                }}
              >
                <Link
                  href={m.link}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.75)',
                    textDecoration: 'none',
                  }}
                >
                  Manage <ArrowUpRight size={13} />
                </Link>
                {m.createLink && (
                  <Link
                    href={m.createLink}
                    className="ad-btn-icon"
                    title="Add Record"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  >
                    <Plus size={13} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Split Section: Recent Leads & Recent Articles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Left: Recent Inquiries & Leads */}
        <div className="ad-card" style={{ marginBottom: 0 }}>
          <div className="ad-card-header">
            <div>
              <h2 className="ad-card-title">
                <Mail size={18} style={{ color: '#ff3366' }} />
                Recent Client Leads
              </h2>
              <p className="ad-card-sub">Real-time incoming submissions from contact form</p>
            </div>
            <Link href="/admin/leads" className="ad-btn ad-btn-secondary ad-btn-sm">
              View All ({stats.leadsCount}) →
            </Link>
          </div>

          {stats.recentLeads.length > 0 ? (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentLeads.map((lead: any) => {
                    const statusVal = lead.status || 'NEW';
                    let statusColor = '#38bdf8';
                    let statusBg = 'rgba(56, 189, 248, 0.12)';
                    if (statusVal === 'WON') {
                      statusColor = '#00f5a0';
                      statusBg = 'rgba(0, 245, 160, 0.12)';
                    } else if (statusVal === 'CONTACTED' || statusVal === 'QUALIFIED') {
                      statusColor = '#fbbf24';
                      statusBg = 'rgba(251, 191, 36, 0.12)';
                    } else if (statusVal === 'LOST') {
                      statusColor = '#94a3b8';
                      statusBg = 'rgba(148, 163, 184, 0.12)';
                    }

                    const dateStr = lead.created_at
                      ? new Date(lead.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Recent';

                    return (
                      <tr key={lead.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{lead.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                            {lead.email}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                            {lead.service || 'Consultation'}
                          </span>
                        </td>
                        <td>
                          <span
                            className="ad-pill"
                            style={{ color: statusColor, background: statusBg, borderColor: `${statusColor}40` }}
                          >
                            {statusVal.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                          {dateStr}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link href="/admin/leads" className="ad-btn ad-btn-secondary ad-btn-sm">
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ad-empty-state">
              <Inbox size={42} style={{ color: 'rgba(255, 255, 255, 0.2)', marginBottom: '12px' }} />
              <h3 className="ad-empty-title">No Inquiries Recorded Yet</h3>
              <p className="ad-empty-sub">
                Client submissions from heyprince.in/contact will populate here automatically.
              </p>
            </div>
          )}
        </div>

        {/* Right: Latest Articles */}
        <div className="ad-card" style={{ marginBottom: 0 }}>
          <div className="ad-card-header">
            <div>
              <h2 className="ad-card-title">
                <FileText size={18} style={{ color: '#8b5cf6' }} />
                Published Articles
              </h2>
              <p className="ad-card-sub">Engineering thought leadership & insights</p>
            </div>
            <Link href="/admin/posts" className="ad-btn ad-btn-secondary ad-btn-sm">
              View All ({stats.postsCount}) →
            </Link>
          </div>

          {stats.recentPosts.length > 0 ? (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPosts.map((post: any) => (
                    <tr key={post.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#ffffff', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {post.title}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                          /{post.slug}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                          {post.category_name || 'General'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`ad-pill ${post.status === 'published' ? 'ad-pill-published' : 'ad-pill-draft'}`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/admin/posts/${post.id}`} className="ad-btn ad-btn-secondary ad-btn-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ad-empty-state">
              <FileText size={42} style={{ color: 'rgba(255, 255, 255, 0.2)', marginBottom: '12px' }} />
              <h3 className="ad-empty-title">No Articles Found</h3>
              <p className="ad-empty-sub">Create your first technical article or insight post.</p>
              <Link href="/admin/posts/new" className="ad-btn ad-btn-primary ad-btn-sm">
                + Create Article
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Infrastructure Footer Bar */}
      <footer
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'rgba(12, 12, 18, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '14px 24px',
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="ad-status-dot" />
          <span>PostgreSQL: <strong>Supabase Pooler (Healthy)</strong></span>
        </div>
        <div>
          <span>Engine: <strong>Next.js 16.3 Turbopack</strong></span>
        </div>
        <div>
          <span>Auth: <strong>PBKDF2-SHA256 (600k rounds)</strong></span>
        </div>
        <div>
          <span>SSL: <strong>TLS 1.3 Verified</strong></span>
        </div>
      </footer>
    </AdminLayout>
  );
}
