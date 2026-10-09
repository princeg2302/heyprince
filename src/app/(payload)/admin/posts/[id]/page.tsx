import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit2,
  ExternalLink,
  Calendar,
  Clock,
  FolderOpen,
  User,
  Quote,
  Lightbulb,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { getCurrentAdmin, getPostById } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';

export const metadata = {
  title: 'View Article — HeyPrince Admin',
  description: 'Inspect article details, content sections, and metadata.',
};

export default async function ViewPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect('/admin/login/');
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) notFound();

  const post = await getPostById(numId);
  if (!post) notFound();

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Draft (Unpublished)';

  return (
    <AdminLayout user={user}>
      {/* Top Action Bar */}
      <div className="hpa-page-title-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/admin/posts" className="hpa-btn hpa-btn-secondary hpa-btn-icon" title="Back to Posts">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                className={`hpa-pill ${post.status === 'published' ? 'hpa-pill-published' : 'hpa-pill-draft'}`}
              >
                {post.status}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--hpa-text-dim)' }}>
                ID #{post.id} • /{post.slug}
              </span>
            </div>
            <h1 className="hpa-page-title">{post.title}</h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href={`https://heyprince.in/insights/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hpa-btn hpa-btn-secondary"
          >
            <span>View on Live Site</span>
            <ExternalLink size={14} />
          </a>
          <Link href={`/admin/posts/${post.id}/edit`} className="hpa-btn hpa-btn-primary">
            <Edit2 size={15} />
            <span>Edit Article</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Main Content Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Cover & Excerpt Card */}
          <div className="hpa-card" style={{ padding: '24px' }}>
            {post.cover_image && (
              <img
                src={post.cover_image}
                alt={post.title}
                style={{
                  width: '100%',
                  maxHeight: '380px',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  border: '1px solid var(--hpa-border)',
                }}
              />
            )}

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              Article Summary / Excerpt
            </h3>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: 1.6,
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '16px 20px',
                borderRadius: '8px',
                borderLeft: '3px solid var(--hpa-primary)',
                margin: 0,
              }}
            >
              {post.excerpt}
            </p>
          </div>

          {/* Sections List */}
          {post.sections && post.sections.length > 0 ? (
            post.sections.map((sec, idx) => (
              <div key={idx} className="hpa-card" style={{ padding: '24px' }}>
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(255, 51, 102, 0.15)',
                      color: 'var(--hpa-primary)',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span>{sec.heading}</span>
                </h2>

                {sec.paragraphs &&
                  sec.paragraphs.map((p, pIdx) => (
                    <p
                      key={pIdx}
                      style={{
                        fontSize: '0.92rem',
                        lineHeight: 1.7,
                        color: 'rgba(255, 255, 255, 0.75)',
                        marginBottom: '14px',
                      }}
                    >
                      {p.text}
                    </p>
                  ))}

                {sec.bullet_points && sec.bullet_points.length > 0 && (
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '16px 0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {sec.bullet_points.map((b, bIdx) => (
                      <li
                        key={bIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          fontSize: '0.9rem',
                          color: 'rgba(255, 255, 255, 0.85)',
                        }}
                      >
                        <CheckCircle2
                          size={16}
                          style={{ color: 'var(--hpa-success)', marginTop: '3px', flexShrink: 0 }}
                        />
                        <span>{b.point}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {sec.quote && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '14px 18px',
                      background: 'rgba(139, 92, 246, 0.08)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      borderRadius: '8px',
                      display: 'flex',
                      gap: '12px',
                    }}
                  >
                    <Quote size={20} style={{ color: 'var(--hpa-accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.88rem', fontStyle: 'italic', color: '#ffffff' }}>
                      "{sec.quote}"
                    </span>
                  </div>
                )}

                {sec.pro_tip && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '14px 18px',
                      background: 'rgba(0, 245, 160, 0.06)',
                      border: '1px solid rgba(0, 245, 160, 0.2)',
                      borderRadius: '8px',
                      display: 'flex',
                      gap: '12px',
                    }}
                  >
                    <Lightbulb size={20} style={{ color: 'var(--hpa-success)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                      <strong>Pro-Tip:</strong> {sec.pro_tip}
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="hpa-card" style={{ padding: '24px' }}>
              <p style={{ color: 'var(--hpa-text-muted)', margin: 0 }}>
                No structured sections added yet for this post.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Meta Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metadata Card */}
          <div className="hpa-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
              Publishing Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--hpa-text-dim)' }}>Status</span>
                <span className={`hpa-pill ${post.status === 'published' ? 'hpa-pill-published' : 'hpa-pill-draft'}`}>
                  {post.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--hpa-text-dim)' }}>Category</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>{post.category_name || 'General'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--hpa-text-dim)' }}>Read Duration</span>
                <span style={{ color: '#ffffff' }}>{post.read_mins || '5 min'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--hpa-text-dim)' }}>Published Date</span>
                <span style={{ color: '#ffffff' }}>{formattedDate}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--hpa-text-dim)' }}>Created</span>
                <span style={{ color: '#ffffff' }}>
                  {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Author Card */}
          <div className="hpa-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
              Author Byline
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={post.author_avatar || 'https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/1791537029941-author.jpg'}
                alt={post.author_name}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid var(--hpa-border)',
                }}
              />
              <div>
                <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>
                  {post.author_name}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--hpa-text-dim)', lineHeight: 1.3 }}>
                  {post.author_role}
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="hpa-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
                Tags ({post.tags.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {post.tags.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.76rem',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--hpa-border)',
                      color: 'rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    #{t.tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SEO Inspector */}
          <div className="hpa-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
              SEO Metadata
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--hpa-text-dim)', display: 'block', marginBottom: '2px' }}>Meta Title</span>
                <span style={{ color: '#ffffff' }}>{post.seo_title || post.title}</span>
              </div>
              <div>
                <span style={{ color: 'var(--hpa-text-dim)', display: 'block', marginBottom: '2px' }}>Description</span>
                <span style={{ color: 'var(--hpa-text-muted)' }}>{post.seo_description || post.excerpt}</span>
              </div>
              <div>
                <span style={{ color: 'var(--hpa-text-dim)', display: 'block', marginBottom: '2px' }}>Canonical URL</span>
                <span style={{ color: 'var(--hpa-primary)', wordBreak: 'break-all' }}>
                  {post.canonical || `https://heyprince.in/insights/${post.slug}/`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
