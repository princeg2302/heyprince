'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Briefcase,
  Layers,
  HelpCircle,
  Search,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ServiceRecord } from '@/lib/admin-db';
import { useToast } from '@/components/admin/Toast';

interface ServiceFormProps {
  initialData?: ServiceRecord;
  categories: { id: number; title: string }[];
  isEdit?: boolean;
}

export function ServiceForm({ initialData, categories, isEdit = false }: ServiceFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'essentials' | 'deliverables' | 'process' | 'faqs' | 'seo'>('essentials');
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [shortTitle, setShortTitle] = useState(initialData?.short_title || '');
  const [tagline, setTagline] = useState(initialData?.tagline || '');
  const [categoryId, setCategoryId] = useState<number | ''>(initialData?.category_id || '');
  const [cardTheme, setCardTheme] = useState(initialData?.card_theme || 'black');
  const [isFeatured, setIsFeatured] = useState(Boolean(initialData?.is_featured));
  const [featuredBadge, setFeaturedBadge] = useState(initialData?.featured_badge || '');
  const [iconName, setIconName] = useState(initialData?.icon_name || 'FaCode');
  const [shortDescription, setShortDescription] = useState(initialData?.short_description || '');
  const [heroDescription, setHeroDescription] = useState(initialData?.hero_description || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [pricingType, setPricingType] = useState(initialData?.pricing_type || 'custom');
  const [startingPrice, setStartingPrice] = useState<number | ''>(initialData?.starting_price || '');
  const [published, setPublished] = useState(initialData?.published !== undefined ? initialData.published : true);
  const [sortOrder, setSortOrder] = useState<number>(initialData?.sort_order || 0);

  // Deliverables
  const [deliverables, setDeliverables] = useState<{ title: string; desc: string }[]>(
    initialData?.deliverables || [
      { title: 'Technical Architecture Plan', desc: 'Comprehensive system diagrams and data flow documentation.' },
      { title: 'Production Implementation', desc: 'End-to-end engineered codebase with automated testing.' },
    ]
  );

  // Tech stack
  const [techStackInput, setTechStackInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>(
    initialData?.tech_stack?.map((t) => t.name) || ['Next.js 16', 'React 19', 'TypeScript', 'Supabase', 'PostgreSQL']
  );

  // Process
  const [processSteps, setProcessSteps] = useState<{ step: string; title: string; desc: string }[]>(
    initialData?.process || [
      { step: '01', title: 'Discovery & Requirements', desc: 'In-depth architecture analysis and roadmap definition.' },
      { step: '02', title: 'Rapid Prototyping', desc: 'Iterative sprint delivery with continuous feedback.' },
      { step: '03', title: 'Hardened Production Launch', desc: 'Stress testing, performance auditing, and deployment.' },
    ]
  );

  // FAQs
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>(
    initialData?.faqs || [
      { q: 'How long does an engagement take?', a: 'Standard engineering projects range from 2 to 6 weeks depending on scope.' },
    ]
  );

  // SEO
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description || '');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleAddDeliverable = () => {
    setDeliverables([...deliverables, { title: '', desc: '' }]);
  };

  const handleAddProcessStep = () => {
    const nextNum = String(processSteps.length + 1).padStart(2, '0');
    setProcessSteps([...processSteps, { step: nextNum, title: '', desc: '' }]);
  };

  const handleAddFaq = () => {
    setFaqs([...faqs, { q: '', a: '' }]);
  };

  const handleAddTech = () => {
    if (techStackInput.trim() && !techStack.includes(techStackInput.trim())) {
      setTechStack([...techStack, techStackInput.trim()]);
      setTechStackInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Service title is required.', 'error');
      setActiveTab('essentials');
      return;
    }
    if (!slug.trim()) {
      showToast('URL slug is required.', 'error');
      setActiveTab('essentials');
      return;
    }

    setLoading(true);
    const matchedCategory = categories.find((c) => c.id === Number(categoryId));

    const payload = {
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      short_title: shortTitle.trim() || title.trim(),
      tagline: tagline.trim(),
      category_id: categoryId ? Number(categoryId) : null,
      category_name: matchedCategory ? matchedCategory.title : null,
      card_theme: cardTheme,
      is_featured: isFeatured,
      featured_badge: featuredBadge.trim() || (isFeatured ? '★ FEATURED' : null),
      icon_name: iconName.trim() || 'FaCode',
      short_description: shortDescription.trim() || heroDescription.trim(),
      hero_description: heroDescription.trim() || shortDescription.trim(),
      description: description.trim() || heroDescription.trim(),
      pricing_type: pricingType,
      starting_price: startingPrice !== '' ? Number(startingPrice) : null,
      published,
      sort_order: Number(sortOrder) || 0,
      deliverables: deliverables.filter((d) => d.title.trim().length > 0),
      tech_stack: techStack.map((name) => ({ name })),
      process: processSteps.filter((p) => p.title.trim().length > 0),
      faqs: faqs.filter((f) => f.q.trim().length > 0),
      seo_title: seoTitle.trim() || `${title.trim()} | Prince — Senior IT Consultant`,
      seo_description: seoDescription.trim() || shortDescription.trim(),
    };

    try {
      const url = isEdit ? `/api/admin/services/${initialData?.id}` : '/api/admin/services';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to save service.', 'error');
        setLoading(false);
        return;
      }

      showToast(isEdit ? 'Service updated successfully!' : 'Service created successfully!', 'success');

      if (isEdit) {
        router.push(`/admin/services/${initialData?.id}`);
      } else {
        router.push('/admin/services');
      }
      router.refresh();
    } catch {
      showToast('Network error while saving service.', 'error');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Header Bar */}
      <div className="ad-page-title-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href={isEdit ? `/admin/services/${initialData?.id}` : '/admin/services'}
            className="ad-btn ad-btn-secondary ad-btn-icon"
            title="Back"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="ad-page-title">{isEdit ? 'Edit Service' : 'Add New Service'}</h1>
            <p className="ad-page-desc">
              {isEdit ? `Editing /${slug}` : 'Define an executive engineering offering'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin/services" className="ad-btn ad-btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="ad-btn ad-btn-primary">
            <Save size={16} />
            <span>{loading ? 'Saving to Database...' : isEdit ? 'Save Changes' : 'Create Service'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="ad-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('essentials')}
          className={`ad-tab-btn ${activeTab === 'essentials' ? 'active' : ''}`}
        >
          <Briefcase size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Essentials & Pricing
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('deliverables')}
          className={`ad-tab-btn ${activeTab === 'deliverables' ? 'active' : ''}`}
        >
          <Layers size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Deliverables ({deliverables.length}) & Tech ({techStack.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('process')}
          className={`ad-tab-btn ${activeTab === 'process' ? 'active' : ''}`}
        >
          <Sparkles size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Delivery Process ({processSteps.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('faqs')}
          className={`ad-tab-btn ${activeTab === 'faqs' ? 'active' : ''}`}
        >
          <HelpCircle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          FAQs ({faqs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`ad-tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
        >
          <Search size={15} style={{ display: 'inline', marginRight: '6px' }} />
          SEO
        </button>
      </div>

      {/* Tab 1: Essentials */}
      {activeTab === 'essentials' && (
        <div className="ad-form-card">
          <div className="ad-form-grid">
            <div className="ad-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="ad-form-label">Service Title *</label>
              <input
                type="text"
                className="ad-form-input"
                placeholder="e.g. AI Services & Project Automations"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </div>

            <div className="ad-form-group">
              <label className="ad-form-label">URL Slug *</label>
              <input
                type="text"
                className="ad-form-input"
                placeholder="ai-automation"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
              <span className="ad-form-help">Live URL: https://heyprince.in/services/{slug || '...'}/</span>
            </div>

            <div className="ad-form-group">
              <label className="ad-form-label">Category</label>
              <select
                className="ad-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="ad-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="ad-form-label">Tagline</label>
              <input
                type="text"
                className="ad-form-input"
                placeholder="Supercharge your workflows with custom AI agents and automated pipelines."
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>

            <div className="ad-form-group">
              <label className="ad-form-label">Card Theme</label>
              <select
                className="ad-select"
                value={cardTheme}
                onChange={(e) => setCardTheme(e.target.value)}
              >
                <option value="black">Black (Dark Slate)</option>
                <option value="white">White (Light Cream)</option>
                <option value="red">Red (Accent Branded)</option>
                <option value="featured">Featured (Border Highlight)</option>
              </select>
            </div>

            <div className="ad-form-group">
              <label className="ad-form-label">Icon Name</label>
              <input
                type="text"
                className="ad-form-input"
                placeholder="FaCode, FaBrain, FaDatabase, FaRocket"
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
              />
            </div>

            <div className="ad-form-group">
              <label className="ad-form-label">Pricing Type</label>
              <select
                className="ad-select"
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value)}
              >
                <option value="custom">Custom Quote</option>
                <option value="starting_at">Starting At ($)</option>
                <option value="fixed">Fixed Package ($)</option>
                <option value="hourly">Hourly Retainer ($)</option>
              </select>
            </div>

            <div className="ad-form-group">
              <label className="ad-form-label">Starting Price ($)</label>
              <input
                type="number"
                className="ad-form-input"
                placeholder="e.g. 2500"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value ? Number(e.target.value) : '')}
              />
            </div>

            <div className="ad-form-group">
              <label className="ad-form-label">Sort Order</label>
              <input
                type="number"
                className="ad-form-input"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>

            <div className="ad-form-group">
              <label className="ad-form-label">Publication Status</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    style={{ accentColor: 'var(--ad-primary)' }}
                  />
                  <span>Published on Live Site</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    style={{ accentColor: 'var(--ad-success)' }}
                  />
                  <span>Featured Badge</span>
                </label>
              </div>
            </div>

            <div className="ad-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="ad-form-label">Executive Hero Description</label>
              <textarea
                className="ad-form-textarea"
                rows={4}
                placeholder="High-impact overview explaining value and business ROI..."
                value={heroDescription}
                onChange={(e) => setHeroDescription(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Deliverables & Tech */}
      {activeTab === 'deliverables' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Deliverables */}
          <div className="ad-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  Client Deliverables
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--ad-text-muted)', margin: '2px 0 0 0' }}>
                  Concrete outcomes client receives upon engagement
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="ad-btn ad-btn-secondary ad-btn-sm"
              >
                <Plus size={14} />
                <span>Add Deliverable</span>
              </button>
            </div>

            {deliverables.map((deliv, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--ad-border)',
                  marginBottom: '12px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    className="ad-form-input"
                    placeholder="Deliverable Title (e.g. CI/CD Pipeline Automation)"
                    value={deliv.title}
                    onChange={(e) => {
                      const updated = [...deliverables];
                      updated[idx].title = e.target.value;
                      setDeliverables(updated);
                    }}
                  />
                  <textarea
                    className="ad-form-textarea"
                    rows={2}
                    placeholder="Detailed description of what is built..."
                    value={deliv.desc}
                    onChange={(e) => {
                      const updated = [...deliverables];
                      updated[idx].desc = e.target.value;
                      setDeliverables(updated);
                    }}
                  />
                </div>
                {deliverables.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDeliverables(deliverables.filter((_, i) => i !== idx))}
                    className="ad-btn ad-btn-danger ad-btn-icon"
                    title="Remove deliverable"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Tech Stack */}
          <div className="ad-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
              Technologies & Tools
            </h3>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <input
                type="text"
                className="ad-form-input"
                placeholder="e.g. Next.js 16, Supabase, Tailwind, Docker"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
              />
              <button type="button" onClick={handleAddTech} className="ad-btn ad-btn-secondary">
                Add Tech
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {techStack.map((tech) => (
                <span
                  key={tech}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '100px',
                    background: 'rgba(0, 245, 160, 0.1)',
                    border: '1px solid rgba(0, 245, 160, 0.25)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                  }}
                >
                  <span>{tech}</span>
                  <button
                    type="button"
                    onClick={() => setTechStack(techStack.filter((t) => t !== tech))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--ad-danger)',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 700,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Process Steps */}
      {activeTab === 'process' && (
        <div className="ad-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Delivery Workflow Steps
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--ad-text-muted)', margin: '2px 0 0 0' }}>
                Phases through which this project is executed
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddProcessStep}
              className="ad-btn ad-btn-secondary ad-btn-sm"
            >
              <Plus size={14} />
              <span>Add Step</span>
            </button>
          </div>

          {processSteps.map((step, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--ad-border)',
                marginBottom: '12px',
                display: 'flex',
                gap: '14px',
              }}
            >
              <input
                type="text"
                className="ad-form-input"
                style={{ width: '64px', textAlign: 'center', fontWeight: 700 }}
                value={step.step}
                onChange={(e) => {
                  const updated = [...processSteps];
                  updated[idx].step = e.target.value;
                  setProcessSteps(updated);
                }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  className="ad-form-input"
                  placeholder="Phase Title (e.g. Discovery & System Blueprint)"
                  value={step.title}
                  onChange={(e) => {
                    const updated = [...processSteps];
                    updated[idx].title = e.target.value;
                    setProcessSteps(updated);
                  }}
                />
                <textarea
                  className="ad-form-textarea"
                  rows={2}
                  placeholder="What happens in this milestone..."
                  value={step.desc}
                  onChange={(e) => {
                    const updated = [...processSteps];
                    updated[idx].desc = e.target.value;
                    setProcessSteps(updated);
                  }}
                />
              </div>
              {processSteps.length > 1 && (
                <button
                  type="button"
                  onClick={() => setProcessSteps(processSteps.filter((_, i) => i !== idx))}
                  className="ad-btn ad-btn-danger ad-btn-icon"
                  title="Remove step"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: FAQs */}
      {activeTab === 'faqs' && (
        <div className="ad-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Frequently Asked Questions
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--ad-text-muted)', margin: '2px 0 0 0' }}>
                Address prospective client inquiries
              </p>
            </div>
            <button type="button" onClick={handleAddFaq} className="ad-btn ad-btn-secondary ad-btn-sm">
              <Plus size={14} />
              <span>Add FAQ</span>
            </button>
          </div>

          {faqs.map((faq, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--ad-border)',
                marginBottom: '12px',
                display: 'flex',
                gap: '14px',
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  className="ad-form-input"
                  placeholder="Question (e.g. Can this integrate with my existing database?)"
                  value={faq.q}
                  onChange={(e) => {
                    const updated = [...faqs];
                    updated[idx].q = e.target.value;
                    setFaqs(updated);
                  }}
                />
                <textarea
                  className="ad-form-textarea"
                  rows={2}
                  placeholder="Answer..."
                  value={faq.a}
                  onChange={(e) => {
                    const updated = [...faqs];
                    updated[idx].a = e.target.value;
                    setFaqs(updated);
                  }}
                />
              </div>
              {faqs.length > 1 && (
                <button
                  type="button"
                  onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                  className="ad-btn ad-btn-danger ad-btn-icon"
                  title="Remove FAQ"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: SEO */}
      {activeTab === 'seo' && (
        <div className="ad-form-card">
          <div className="ad-form-grid">
            <div className="ad-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="ad-form-label">SEO Meta Title</label>
              <input
                type="text"
                className="ad-form-input"
                placeholder="Default: [Title] | Prince — Senior IT Consultant"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>
            <div className="ad-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="ad-form-label">SEO Meta Description</label>
              <textarea
                className="ad-form-textarea"
                rows={3}
                placeholder="Search engine summary..."
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default ServiceForm;
