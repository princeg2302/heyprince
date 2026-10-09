import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit2,
  ExternalLink,
  Briefcase,
  Layers,
  Sparkles,
  CheckCircle2,
  DollarSign,
  HelpCircle,
  Tag,
} from 'lucide-react';
import { getCurrentAdmin, getServiceById } from '@/lib/admin-db';
import AdminLayout from '@/components/admin/AdminLayout';

export const metadata = {
  title: 'View Service — HeyPrince Admin',
  description: 'Inspect complete service specifications, deliverables, and workflow.',
};

export default async function ViewServicePage({
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

  const service = await getServiceById(numId);
  if (!service) notFound();

  return (
    <AdminLayout user={user}>
      {/* Header Bar */}
      <div className="ad-page-title-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/admin/services" className="ad-btn ad-btn-secondary ad-btn-icon" title="Back to Services">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className={`ad-pill ${service.published ? 'ad-pill-published' : 'ad-pill-draft'}`}>
                {service.published ? 'Live / Published' : 'Draft / Hidden'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--ad-text-dim)' }}>
                ID #{service.id} • /{service.slug}
              </span>
            </div>
            <h1 className="ad-page-title">{service.title}</h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href={`https://heyprince.in/services/${service.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ad-btn ad-btn-secondary"
          >
            <span>View on Live Site</span>
            <ExternalLink size={14} />
          </a>
          <Link href={`/admin/services/${service.id}/edit`} className="ad-btn ad-btn-primary">
            <Edit2 size={15} />
            <span>Edit Service</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Overview Card */}
          <div className="ad-card" style={{ padding: '24px' }}>
            {service.tagline && (
              <div
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--ad-primary)',
                  marginBottom: '14px',
                }}
              >
                "{service.tagline}"
              </div>
            )}

            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              Hero Overview
            </h3>
            <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
              {service.hero_description || service.short_description || 'No description provided.'}
            </p>

            {service.description && service.description !== service.hero_description && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--ad-border)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  Comprehensive Description
                </h3>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.7)', whiteSpace: 'pre-line', margin: 0 }}>
                  {service.description}
                </p>
              </div>
            )}
          </div>

          {/* Deliverables */}
          {service.deliverables && service.deliverables.length > 0 && (
            <div className="ad-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
                Included Deliverables ({service.deliverables.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {service.deliverables.map((deliv, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--ad-border)',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.92rem', marginBottom: '4px' }}>
                      {deliv.title}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.5 }}>
                      {deliv.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process Steps */}
          {service.process && service.process.length > 0 && (
            <div className="ad-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
                Delivery Roadmap
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {service.process.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                      padding: '14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--ad-border)',
                    }}
                  >
                    <div
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(0, 245, 160, 0.1)',
                        border: '1px solid rgba(0, 245, 160, 0.3)',
                        color: 'var(--ad-success)',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                      }}
                    >
                      {step.step}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.92rem' }}>
                        {step.title}
                      </div>
                      <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {service.faqs && service.faqs.length > 0 && (
            <div className="ad-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
                Service FAQs
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {service.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--ad-border)',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem', marginBottom: '4px' }}>
                      Q: {faq.q}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                      {faq.a}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key Specs Card */}
          <div className="ad-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
              Service Configuration
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ad-text-dim)' }}>Category</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>{service.category_name || 'General'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ad-text-dim)' }}>Pricing Type</span>
                <span style={{ color: '#ffffff', textTransform: 'capitalize' }}>
                  {service.pricing_type.replace('_', ' ')}
                </span>
              </div>

              {service.starting_price && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ad-text-dim)' }}>Starting Price</span>
                  <span style={{ color: 'var(--ad-success)', fontWeight: 700 }}>
                    ${service.starting_price}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ad-text-dim)' }}>Card Theme</span>
                <span style={{ color: '#ffffff', textTransform: 'capitalize' }}>{service.card_theme}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ad-text-dim)' }}>Featured Status</span>
                <span style={{ color: service.is_featured ? 'var(--ad-success)' : 'var(--ad-text-muted)' }}>
                  {service.is_featured ? '★ Yes' : 'No'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ad-text-dim)' }}>Sort Order</span>
                <span style={{ color: '#ffffff' }}>#{service.sort_order}</span>
              </div>
            </div>
          </div>

          {/* Tech Stack Pills */}
          {service.tech_stack && service.tech_stack.length > 0 && (
            <div className="ad-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
                Tech Stack ({service.tech_stack.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {service.tech_stack.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.78rem',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      background: 'rgba(0, 245, 160, 0.08)',
                      border: '1px solid rgba(0, 245, 160, 0.25)',
                      color: '#ffffff',
                    }}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SEO Details */}
          <div className="ad-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
              SEO Configuration
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--ad-text-dim)', display: 'block', marginBottom: '2px' }}>Meta Title</span>
                <span style={{ color: '#ffffff' }}>{service.seo_title || service.title}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ad-text-dim)', display: 'block', marginBottom: '2px' }}>Description</span>
                <span style={{ color: 'var(--ad-text-muted)' }}>{service.seo_description || service.short_description}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
