'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  FolderOpen,
  Mail,
  Image as ImageIcon,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Database,
  Search,
  Plus,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: {
    name?: string;
    email?: string;
    role?: string;
    avatar_url?: string | null;
  };
}

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname || '/admin/';
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Prince';
  const displayRole = user?.role || 'admin';

  const navItems = [
    { label: 'Dashboard', href: '/admin/', icon: LayoutDashboard },
    { label: 'Posts & Insights', href: '/admin/posts/', icon: FileText },
    { label: 'Services', href: '/admin/services/', icon: Briefcase },
    { label: 'Admin Users', href: '/admin/users/', icon: Users },
    { label: 'Categories', href: '/admin/categories/', icon: FolderOpen },
    { label: 'Client Leads', href: '/admin/leads/', icon: Mail },
    { label: 'Media Vault', href: '/admin/media/', icon: ImageIcon },
    { label: 'Settings', href: '/admin/settings/', icon: Settings },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login/';
    } catch {
      window.location.href = '/admin/login/';
    }
  };

  // Generate breadcrumbs from pathname safely
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/') + '/';
    const label =
      seg === 'admin'
        ? 'Dashboard'
        : seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
    const isLast = idx === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <div className="hpa-root">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 45,
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`hpa-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="hpa-sidebar-header">
          <Link href="/admin/" className="hpa-sidebar-logo">
            <img src="/heyprince-logo.svg" alt="HeyPrince" />
            <div className="hpa-sidebar-logo-text">
              <span className="hpa-logo-brand">HeyPrince</span>
              <span className="hpa-logo-sub">Executive Portal</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="hpa-mobile-menu-btn"
            style={{ display: sidebarOpen ? 'block' : 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="hpa-sidebar-nav">
          <span className="hpa-nav-group-title">Navigation</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const normalizedPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
            const isActive =
              item.href === '/admin/'
                ? normalizedPath === '/admin/'
                : normalizedPath.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`hpa-nav-link ${isActive ? 'active' : ''}`}
              >
                <div className="hpa-nav-link-content">
                  <Icon
                    size={18}
                    style={{
                      color: isActive ? 'var(--hpa-primary)' : 'var(--hpa-text-muted)',
                    }}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="hpa-sidebar-footer">
          <a
            href="https://heyprince.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hpa-btn hpa-btn-secondary hpa-btn-sm"
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <span>Live Website</span>
            <ExternalLink size={14} />
          </a>

          <div className="hpa-user-pill">
            <div className="hpa-user-avatar" style={{ overflow: 'hidden', padding: 0 }}>
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="hpa-user-info">
              <div className="hpa-user-name">{displayName}</div>
              <div className="hpa-user-role">{displayRole}</div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="hpa-btn-icon"
              title="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--hpa-text-muted)',
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="hpa-main-wrapper">
        <header className="hpa-header">
          <div className="hpa-header-left">
            <button
              onClick={() => setSidebarOpen(true)}
              className="hpa-mobile-menu-btn"
              title="Open Navigation"
            >
              <Menu size={22} />
            </button>

            <nav className="hpa-breadcrumbs" aria-label="Breadcrumb">
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={b.href}>
                  {i > 0 && <span className="hpa-breadcrumbs-sep">/</span>}
                  {b.isLast ? (
                    <span className="active">{b.label}</span>
                  ) : (
                    <Link href={b.href}>{b.label}</Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="hpa-header-right">
            <div className="hpa-status-pill">
              <span className="hpa-status-dot" />
              <span>Supabase Live</span>
            </div>

            <button
              onClick={handleLogout}
              className="hpa-btn hpa-btn-secondary hpa-btn-sm"
              style={{ gap: '6px' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <main className="hpa-content">{children}</main>
      </div>
    </div>
  );
}

export default AdminLayout;
