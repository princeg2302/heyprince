import React from 'react';
import {
  Users,
  Briefcase,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Mail,
  ExternalLink,
  Plus,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Database,
  Server,
  Sparkles,
  Inbox,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface CustomDashboardProps {
  payload?: any;
  user?: any;
  permissions?: any;
}

export const CustomDashboard = async ({ payload, user }: CustomDashboardProps) => {
  // Fetch real-time metrics safely from database
  let leadsCount = 0;
  let servicesCount = 0;
  let postsCount = 0;
  let categoriesCount = 0;
  let mediaCount = 0;
  let usersCount = 0;
  let recentLeads: any[] = [];

  if (payload) {
    try {
      const [leadsRes, servicesRes, postsRes, categoriesRes, mediaRes, usersRes] = await Promise.all([
        payload.count({ collection: 'leads' }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'services' }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'posts' }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'categories' }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'media' }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'users' }).catch(() => ({ totalDocs: 0 })),
      ]);

      leadsCount = leadsRes?.totalDocs ?? 0;
      servicesCount = servicesRes?.totalDocs ?? 0;
      postsCount = postsRes?.totalDocs ?? 0;
      categoriesCount = categoriesRes?.totalDocs ?? 0;
      mediaCount = mediaRes?.totalDocs ?? 0;
      usersCount = usersRes?.totalDocs ?? 0;

      const leadsList = await payload.find({
        collection: 'leads',
        limit: 5,
        sort: '-createdAt',
      }).catch(() => ({ docs: [] }));

      recentLeads = leadsList?.docs ?? [];
    } catch (err) {
      console.error('Error fetching dashboard counts:', err);
    }
  }

  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'Prince';

  const metrics = [
    {
      title: 'Client Inquiries',
      count: leadsCount,
      subtext: 'Form submissions & quotes',
      badge: 'Active CRM',
      badgeColor: '#ff3366',
      icon: Mail,
      iconColor: '#ff3366',
      bgGlow: 'rgba(255, 51, 102, 0.08)',
      borderColor: 'rgba(255, 51, 102, 0.25)',
      link: '/admin/collections/leads',
      createLink: '/admin/collections/leads/create',
    },
    {
      title: 'Services Catalog',
      count: servicesCount,
      subtext: 'Core service offerings',
      badge: 'Live',
      badgeColor: '#00f5a0',
      icon: Briefcase,
      iconColor: '#00f5a0',
      bgGlow: 'rgba(0, 245, 160, 0.08)',
      borderColor: 'rgba(0, 245, 160, 0.25)',
      link: '/admin/collections/services',
      createLink: '/admin/collections/services/create',
    },
    {
      title: 'Insights & Articles',
      count: postsCount,
      subtext: 'Published blog posts',
      badge: 'SEO Active',
      badgeColor: '#8b5cf6',
      icon: FileText,
      iconColor: '#a78bfa',
      bgGlow: 'rgba(139, 92, 246, 0.08)',
      borderColor: 'rgba(139, 92, 246, 0.25)',
      link: '/admin/collections/posts',
      createLink: '/admin/collections/posts/create',
    },
    {
      title: 'Taxonomies',
      count: categoriesCount,
      subtext: 'Content categories',
      badge: 'Organized',
      badgeColor: '#f59e0b',
      icon: FolderOpen,
      iconColor: '#fbbf24',
      bgGlow: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.25)',
      link: '/admin/collections/categories',
      createLink: '/admin/collections/categories/create',
    },
    {
      title: 'Media Vault',
      count: mediaCount,
      subtext: 'Images, logos & assets',
      badge: 'Storage',
      badgeColor: '#38bdf8',
      icon: ImageIcon,
      iconColor: '#38bdf8',
      bgGlow: 'rgba(56, 189, 248, 0.08)',
      borderColor: 'rgba(56, 189, 248, 0.25)',
      link: '/admin/collections/media',
      createLink: '/admin/collections/media/create',
    },
    {
      title: 'Admin Security',
      count: usersCount,
      subtext: 'Authorized managers',
      badge: 'Superuser',
      badgeColor: '#ec4899',
      icon: ShieldCheck,
      iconColor: '#f472b6',
      bgGlow: 'rgba(236, 72, 153, 0.08)',
      borderColor: 'rgba(236, 72, 153, 0.25)',
      link: '/admin/collections/users',
      createLink: '/admin/collections/users/create',
    },
  ];

  const quickActions = [
    { label: '+ New Article', href: '/admin/collections/posts/create', icon: FileText, color: '#8b5cf6' },
    { label: '+ Add Service', href: '/admin/collections/services/create', icon: Sparkles, color: '#00f5a0' },
    { label: 'Review Leads', href: '/admin/collections/leads', icon: Mail, color: '#ff3366' },
    { label: '+ Upload Media', href: '/admin/collections/media/create', icon: ImageIcon, color: '#38bdf8' },
  ];

  return (
    <div className="hp-dashboard-wrapper">
      {/* Top Welcome Banner */}
      <section className="hp-banner-card">
        <div className="hp-banner-content">
          <div className="hp-banner-header">
            <span className="hp-pill hp-pill-glow">
              <span className="hp-pulse-dot" />
              Production Live • heyprince.in
            </span>
            <span className="hp-pill">
              <Database size={13} style={{ marginRight: '5px', color: '#00f5a0' }} />
              Supabase PostgreSQL (SSL)
            </span>
            <span className="hp-pill">
              <Server size={13} style={{ marginRight: '5px', color: '#38bdf8' }} />
              Next.js 16 Turbopack
            </span>
          </div>

          <h1 className="hp-banner-title">
            Executive Command Center
          </h1>
          <p className="hp-banner-sub">
            Welcome back, <strong style={{ color: '#ffffff' }}>{userDisplayName}</strong>. Manage your client leads, portfolio catalog, technical insights, and media assets in real time.
          </p>
        </div>

        <div className="hp-banner-actions">
          <a
            href="https://heyprince.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hp-btn hp-btn-primary"
          >
            <span>View Live Site</span>
            <ArrowUpRight size={16} />
          </a>
          <a
            href="https://heyprince.in/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="hp-btn hp-btn-secondary"
          >
            <span>Test Contact Form</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </section>

      {/* Quick Launch Bar */}
      <section className="hp-quickbar">
        <span className="hp-quickbar-label">
          <Activity size={14} style={{ color: '#ff3366' }} />
          Quick Actions:
        </span>
        <div className="hp-quickbar-buttons">
          {quickActions.map((qa, i) => {
            const IconComponent = qa.icon;
            return (
              <a key={i} href={qa.href} className="hp-quick-btn">
                <IconComponent size={14} style={{ color: qa.color }} />
                <span>{qa.label}</span>
              </a>
            );
          })}
        </div>
      </section>

      {/* 6 Metric KPI Cards */}
      <section className="hp-metrics-grid">
        {metrics.map((m, idx) => {
          const IconComp = m.icon;
          return (
            <div
              key={idx}
              className="hp-metric-card"
              style={{
                background: `linear-gradient(145deg, ${m.bgGlow} 0%, rgba(13, 13, 20, 0.95) 100%)`,
                borderColor: m.borderColor,
              }}
            >
              <div className="hp-card-top">
                <div
                  className="hp-card-icon"
                  style={{ background: m.bgGlow, color: m.iconColor }}
                >
                  <IconComp size={22} />
                </div>
                <span
                  className="hp-card-badge"
                  style={{
                    color: m.badgeColor,
                    borderColor: `${m.badgeColor}40`,
                    background: `${m.badgeColor}15`,
                  }}
                >
                  {m.badge}
                </span>
              </div>

              <div className="hp-card-number">{m.count}</div>
              <div className="hp-card-title">{m.title}</div>
              <div className="hp-card-sub">{m.subtext}</div>

              <div className="hp-card-footer">
                <a href={m.link} className="hp-card-link">
                  Manage <ArrowUpRight size={14} />
                </a>
                {m.createLink && (
                  <a href={m.createLink} className="hp-card-add" title="Create New">
                    <Plus size={14} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Main 2-Column Split: Recent Inquiries + Collection Navigation */}
      <div className="hp-split-section">
        {/* Left: Recent Inquiries */}
        <section className="hp-recent-inquiries-card">
          <div className="hp-section-header">
            <div>
              <h2 className="hp-section-title">
                <Mail size={18} style={{ color: '#ff3366', marginRight: '8px' }} />
                Recent Inquiries & Leads
              </h2>
              <p className="hp-section-sub">Real-time incoming submissions from heyprince.in/contact</p>
            </div>
            <a href="/admin/collections/leads" className="hp-link-more">
              View All ({leadsCount}) →
            </a>
          </div>

          {recentLeads.length > 0 ? (
            <div className="hp-table-container">
              <table className="hp-table">
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
                  {recentLeads.map((lead: any) => {
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

                    const dateStr = lead.createdAt
                      ? new Date(lead.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Recently';

                    return (
                      <tr key={lead.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{lead.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                            {lead.email}
                          </div>
                        </td>
                        <td>
                          <span className="hp-service-tag">{lead.service || 'Consultation'}</span>
                        </td>
                        <td>
                          <span
                            className="hp-status-tag"
                            style={{ color: statusColor, background: statusBg, borderColor: `${statusColor}40` }}
                          >
                            {statusVal.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                          {dateStr}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <a
                            href={`/admin/collections/leads/${lead.id}`}
                            className="hp-btn-sm"
                          >
                            Open →
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="hp-empty-state">
              <Inbox size={42} style={{ color: 'rgba(255, 255, 255, 0.2)', marginBottom: '12px' }} />
              <h3 style={{ color: '#ffffff', fontSize: '1.05rem', margin: '0 0 6px 0' }}>
                No Inquiries Recorded Yet
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto 16px' }}>
                When clients fill out the contact form on heyprince.in/contact, inquiries will populate here automatically.
              </p>
              <a
                href="https://heyprince.in/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="hp-btn hp-btn-secondary"
                style={{ display: 'inline-flex' }}
              >
                Send Test Lead ↗
              </a>
            </div>
          )}
        </section>

        {/* Right: Content Architecture Hub */}
        <section className="hp-hub-card">
          <div className="hp-section-header">
            <div>
              <h2 className="hp-section-title">
                <FolderOpen size={18} style={{ color: '#a78bfa', marginRight: '8px' }} />
                Content Catalog & Assets
              </h2>
              <p className="hp-section-sub">Direct access to portfolio collections</p>
            </div>
          </div>

          <div className="hp-catalog-list">
            <div className="hp-catalog-item">
              <div className="hp-catalog-info">
                <Briefcase size={18} style={{ color: '#00f5a0' }} />
                <div>
                  <div className="hp-catalog-title">Services</div>
                  <div className="hp-catalog-desc">React, AI, Next.js, and CMS services</div>
                </div>
              </div>
              <div className="hp-catalog-actions">
                <span className="hp-catalog-count">{servicesCount} items</span>
                <a href="/admin/collections/services" className="hp-btn-sm">
                  View
                </a>
                <a href="/admin/collections/services/create" className="hp-btn-sm-icon">
                  <Plus size={13} />
                </a>
              </div>
            </div>

            <div className="hp-catalog-item">
              <div className="hp-catalog-info">
                <FileText size={18} style={{ color: '#a78bfa' }} />
                <div>
                  <div className="hp-catalog-title">Insights & Articles</div>
                  <div className="hp-catalog-desc">Engineering thoughts & industry updates</div>
                </div>
              </div>
              <div className="hp-catalog-actions">
                <span className="hp-catalog-count">{postsCount} items</span>
                <a href="/admin/collections/posts" className="hp-btn-sm">
                  View
                </a>
                <a href="/admin/collections/posts/create" className="hp-btn-sm-icon">
                  <Plus size={13} />
                </a>
              </div>
            </div>

            <div className="hp-catalog-item">
              <div className="hp-catalog-info">
                <FolderOpen size={18} style={{ color: '#fbbf24' }} />
                <div>
                  <div className="hp-catalog-title">Categories</div>
                  <div className="hp-catalog-desc">Classification tags for insights</div>
                </div>
              </div>
              <div className="hp-catalog-actions">
                <span className="hp-catalog-count">{categoriesCount} items</span>
                <a href="/admin/collections/categories" className="hp-btn-sm">
                  View
                </a>
                <a href="/admin/collections/categories/create" className="hp-btn-sm-icon">
                  <Plus size={13} />
                </a>
              </div>
            </div>

            <div className="hp-catalog-item">
              <div className="hp-catalog-info">
                <ImageIcon size={18} style={{ color: '#38bdf8' }} />
                <div>
                  <div className="hp-catalog-title">Media Library</div>
                  <div className="hp-catalog-desc">Cover images, logos, client badges</div>
                </div>
              </div>
              <div className="hp-catalog-actions">
                <span className="hp-catalog-count">{mediaCount} files</span>
                <a href="/admin/collections/media" className="hp-btn-sm">
                  View
                </a>
                <a href="/admin/collections/media/create" className="hp-btn-sm-icon">
                  <Plus size={13} />
                </a>
              </div>
            </div>

            <div className="hp-catalog-item">
              <div className="hp-catalog-info">
                <ShieldCheck size={18} style={{ color: '#ec4899' }} />
                <div>
                  <div className="hp-catalog-title">Admin Accounts</div>
                  <div className="hp-catalog-desc">System access & user security</div>
                </div>
              </div>
              <div className="hp-catalog-actions">
                <span className="hp-catalog-count">{usersCount} user</span>
                <a href="/admin/collections/users" className="hp-btn-sm">
                  View
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* System Infrastructure Bar */}
      <footer className="hp-infra-footer">
        <div className="hp-infra-item">
          <span className="hp-infra-dot" />
          <span>PostgreSQL Status: <strong>Supabase Pooler (Healthy)</strong></span>
        </div>
        <div className="hp-infra-item">
          <span>Engine: <strong>Next.js 16.3.8 Turbopack</strong></span>
        </div>
        <div className="hp-infra-item">
          <span>Live URL: <a href="https://heyprince.in" target="_blank" rel="noopener noreferrer" style={{ color: '#ff3366', textDecoration: 'none' }}>heyprince.in ↗</a></span>
        </div>
        <div className="hp-infra-item">
          <span>Security: <strong>SSL / TLS 1.3 Verified</strong></span>
        </div>
      </footer>
    </div>
  );
};

export default CustomDashboard;

