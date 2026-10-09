'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  FileText,
  User,
  Search,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { PostRecord } from '@/lib/admin-db';
import { useToast } from '@/components/admin/Toast';

interface PostFormProps {
  initialData?: PostRecord;
  categories: { id: number; title: string }[];
  isEdit?: boolean;
  defaultAuthorAvatar?: string;
  defaultAuthorName?: string;
}

export function PostForm({
  initialData,
  categories,
  isEdit = false,
  defaultAuthorAvatar,
  defaultAuthorName,
}: PostFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'general' | 'content' | 'author' | 'seo'>('general');
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [readMins, setReadMins] = useState(initialData?.read_mins || '5 min');
  const [categoryId, setCategoryId] = useState<number | ''>(initialData?.category_id || '');
  const [status, setStatus] = useState<'published' | 'draft'>(initialData?.status || 'published');
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || '/assets/blog/photo1.webp');

  // Author
  const [authorName, setAuthorName] = useState(
    initialData?.author_name || defaultAuthorName || 'Prince'
  );
  const [authorRole, setAuthorRole] = useState(
    initialData?.author_role || 'Senior Full Stack Engineer & IT Consultant'
  );
  const [authorAvatar, setAuthorAvatar] = useState(
    initialData?.author_avatar ||
      defaultAuthorAvatar ||
      'https://heyprince.in/wp-content/uploads/2025/09/cropped-prince-profile.webp'
  );

  // Tags
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(
    initialData?.tags?.map((t) => t.tag) || ['Next.js', 'React', 'Architecture']
  );

  // Sections
  const [sections, setSections] = useState<
    {
      heading: string;
      paragraphs: string[];
      bulletPoints: string[];
      quote?: string;
      proTip?: string;
    }[]
  >(
    initialData?.sections?.map((s) => ({
      heading: s.heading,
      paragraphs: s.paragraphs?.map((p) => p.text) || [''],
      bulletPoints: s.bullet_points?.map((b) => b.point) || [],
      quote: s.quote || '',
      proTip: s.pro_tip || '',
    })) || [
      {
        heading: 'Strategic Architecture & Execution',
        paragraphs: ['Engineering high-performance enterprise applications requires meticulous planning, resilient architecture, and zero-compromise security posture.'],
        bulletPoints: ['Modern state management patterns', 'Serverless transaction pooling', 'Sub-second cold-start latency'],
        quote: '',
        proTip: '',
      },
    ]
  );

  // SEO
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description || '');
  const [canonical, setCanonical] = useState(initialData?.canonical || '');

  // Auto-slug generator
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

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Section helpers
  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        heading: 'New Section Heading',
        paragraphs: ['Section content paragraph goes here.'],
        bulletPoints: [],
        quote: '',
        proTip: '',
      },
    ]);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, idx) => idx !== index));
  };

  const handleSectionChange = (index: number, field: string, value: any) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  const handleAddParagraph = (secIdx: number) => {
    const updated = [...sections];
    updated[secIdx].paragraphs.push('');
    setSections(updated);
  };

  const handleRemoveParagraph = (secIdx: number, pIdx: number) => {
    const updated = [...sections];
    updated[secIdx].paragraphs = updated[secIdx].paragraphs.filter((_, idx) => idx !== pIdx);
    setSections(updated);
  };

  const handleParagraphChange = (secIdx: number, pIdx: number, val: string) => {
    const updated = [...sections];
    updated[secIdx].paragraphs[pIdx] = val;
    setSections(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Article title is required.', 'error');
      setActiveTab('general');
      return;
    }
    if (!slug.trim()) {
      showToast('URL slug is required.', 'error');
      setActiveTab('general');
      return;
    }

    setLoading(true);

    const matchedCategory = categories.find((c) => c.id === Number(categoryId));

    const payload = {
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      excerpt: excerpt.trim(),
      read_mins: readMins.trim() || '5 min',
      category_id: categoryId ? Number(categoryId) : null,
      category_name: matchedCategory ? matchedCategory.title : null,
      status,
      cover_image: coverImage.trim() || '/assets/blog/photo1.webp',
      author_name: authorName.trim(),
      author_role: authorRole.trim(),
      author_avatar: authorAvatar.trim(),
      tags: tags.map((t) => ({ tag: t })),
      sections: sections.map((sec) => ({
        heading: sec.heading.trim(),
        quote: sec.quote || '',
        pro_tip: sec.proTip || '',
        paragraphs: sec.paragraphs.filter((p) => p.trim().length > 0).map((p) => ({ text: p })),
        bullet_points: sec.bulletPoints.filter((b) => b.trim().length > 0).map((b) => ({ point: b })),
      })),
      seo_title: seoTitle.trim() || `${title.trim()} | Prince — Tech Partner`,
      seo_description: seoDescription.trim() || excerpt.trim(),
      canonical: canonical.trim() || `https://heyprince.in/insights/${slug.trim()}/`,
    };

    try {
      const url = isEdit ? `/api/admin/posts/${initialData?.id}` : '/api/admin/posts';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to save article.', 'error');
        setLoading(false);
        return;
      }

      showToast(isEdit ? 'Article updated successfully!' : 'Article published successfully!', 'success');

      if (isEdit) {
        router.push(`/admin/posts/${initialData?.id}`);
      } else {
        router.push('/admin/posts');
      }
      router.refresh();
    } catch {
      showToast('Network error while saving article.', 'error');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Header Bar */}
      <div className="hpa-page-title-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href={isEdit ? `/admin/posts/${initialData?.id}` : '/admin/posts'}
            className="hpa-btn hpa-btn-secondary hpa-btn-icon"
            title="Back"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="hpa-page-title">{isEdit ? 'Edit Article' : 'Create New Article'}</h1>
            <p className="hpa-page-desc">
              {isEdit ? `Editing /${slug}` : 'Compose and publish insights to heyprince.in'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin/posts" className="hpa-btn hpa-btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="hpa-btn hpa-btn-primary">
            <Save size={16} />
            <span>{loading ? 'Saving to Database...' : isEdit ? 'Save Changes' : 'Publish Article'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="hpa-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`hpa-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
        >
          <FileText size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Article Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`hpa-tab-btn ${activeTab === 'content' ? 'active' : ''}`}
        >
          <Sparkles size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Content Sections ({sections.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('author')}
          className={`hpa-tab-btn ${activeTab === 'author' ? 'active' : ''}`}
        >
          <User size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Author & Tags
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`hpa-tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
        >
          <Search size={15} style={{ display: 'inline', marginRight: '6px' }} />
          SEO & Meta
        </button>
      </div>

      {/* Tab 1: General Details */}
      {activeTab === 'general' && (
        <div className="hpa-form-card">
          <div className="hpa-form-grid">
            <div className="hpa-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="hpa-form-label">Article Title *</label>
              <input
                type="text"
                className="hpa-form-input"
                placeholder="e.g. Essential Freelancing Tips for IT Professionals in 2026"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </div>

            <div className="hpa-form-group">
              <label className="hpa-form-label">URL Slug *</label>
              <input
                type="text"
                className="hpa-form-input"
                placeholder="freelancing-tips-it-professionals-2026"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
              <span className="hpa-form-help">Live URL: https://heyprince.in/insights/{slug || '...'}/</span>
            </div>

            <div className="hpa-form-group">
              <label className="hpa-form-label">Category</label>
              <select
                className="hpa-form-select"
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

            <div className="hpa-form-group">
              <label className="hpa-form-label">Publication Status</label>
              <select
                className="hpa-form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="published">Published (Visible on site)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>

            <div className="hpa-form-group">
              <label className="hpa-form-label">Estimated Read Time</label>
              <input
                type="text"
                className="hpa-form-input"
                placeholder="5 min"
                value={readMins}
                onChange={(e) => setReadMins(e.target.value)}
              />
            </div>

            <div className="hpa-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="hpa-form-label">Summary / Excerpt *</label>
              <textarea
                className="hpa-form-textarea"
                rows={3}
                placeholder="A compelling 2-sentence summary of the article..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                required
              />
            </div>

            <div className="hpa-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="hpa-form-label">Cover Image URL</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="hpa-form-input"
                  placeholder="/assets/blog/photo1.webp or full HTTPS URL"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                />
                {coverImage && (
                  <img
                    src={coverImage}
                    alt="Preview"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1px solid var(--hpa-border)',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Content Sections */}
      {activeTab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="hpa-card" style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--hpa-border)',
                  paddingBottom: '12px',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--hpa-primary)', fontSize: '0.9rem' }}>
                  Section #{secIdx + 1}
                </div>
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSection(secIdx)}
                    className="hpa-btn hpa-btn-danger hpa-btn-sm"
                  >
                    <Trash2 size={14} />
                    <span>Delete Section</span>
                  </button>
                )}
              </div>

              <div className="hpa-form-group">
                <label className="hpa-form-label">Section Heading *</label>
                <input
                  type="text"
                  className="hpa-form-input"
                  placeholder="e.g. 1. Specializing in High-Leverage Domains"
                  value={sec.heading}
                  onChange={(e) => handleSectionChange(secIdx, 'heading', e.target.value)}
                  required
                />
              </div>

              {/* Paragraphs */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <label className="hpa-form-label" style={{ margin: 0 }}>
                    Paragraphs
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddParagraph(secIdx)}
                    className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                  >
                    <Plus size={13} />
                    <span>Add Paragraph</span>
                  </button>
                </div>
                {sec.paragraphs.map((p, pIdx) => (
                  <div key={pIdx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <textarea
                      className="hpa-form-textarea"
                      rows={3}
                      placeholder={`Paragraph ${pIdx + 1}...`}
                      value={p}
                      onChange={(e) => handleParagraphChange(secIdx, pIdx, e.target.value)}
                    />
                    {sec.paragraphs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveParagraph(secIdx, pIdx)}
                        className="hpa-btn hpa-btn-danger hpa-btn-icon"
                        title="Remove paragraph"
                        style={{ alignSelf: 'flex-start' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Bullet Points */}
              <div className="hpa-form-group">
                <label className="hpa-form-label">Bullet Points (Optional - One per line)</label>
                <textarea
                  className="hpa-form-textarea"
                  rows={3}
                  placeholder="Point 1&#10;Point 2&#10;Point 3"
                  value={sec.bulletPoints.join('\n')}
                  onChange={(e) =>
                    handleSectionChange(
                      secIdx,
                      'bulletPoints',
                      e.target.value.split('\n').filter((l) => l.trim().length > 0)
                    )
                  }
                />
              </div>

              <div className="hpa-form-grid">
                <div className="hpa-form-group">
                  <label className="hpa-form-label">Callout Quote (Optional)</label>
                  <input
                    type="text"
                    className="hpa-form-input"
                    placeholder="Key executive takeaway..."
                    value={sec.quote || ''}
                    onChange={(e) => handleSectionChange(secIdx, 'quote', e.target.value)}
                  />
                </div>
                <div className="hpa-form-group">
                  <label className="hpa-form-label">Pro Tip (Optional)</label>
                  <input
                    type="text"
                    className="hpa-form-input"
                    placeholder="Actionable insider recommendation..."
                    value={sec.proTip || ''}
                    onChange={(e) => handleSectionChange(secIdx, 'proTip', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddSection}
            className="hpa-btn hpa-btn-secondary"
            style={{ width: '100%', padding: '14px', borderStyle: 'dashed' }}
          >
            <Plus size={16} />
            <span>+ Add Another Content Section</span>
          </button>
        </div>
      )}

      {/* Tab 3: Author & Tags */}
      {activeTab === 'author' && (
        <div className="hpa-form-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
            Author Byline
          </h3>
          <div className="hpa-form-grid" style={{ marginBottom: '28px' }}>
            <div className="hpa-form-group">
              <label className="hpa-form-label">Author Name</label>
              <input
                type="text"
                className="hpa-form-input"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </div>
            <div className="hpa-form-group">
              <label className="hpa-form-label">Author Role / Title</label>
              <input
                type="text"
                className="hpa-form-input"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
              />
            </div>
            <div className="hpa-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="hpa-form-label">Author Avatar URL</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {authorAvatar && (
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--hpa-border)',
                      flexShrink: 0,
                    }}
                  />
                )}
                <input
                  type="text"
                  className="hpa-form-input"
                  value={authorAvatar}
                  onChange={(e) => setAuthorAvatar(e.target.value)}
                />
              </div>
              <span className="hpa-form-help">
                💡 To update your author photo globally across all articles at once, go to <strong>Settings &gt; Change Profile Picture</strong>.
              </span>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
            Article Tags
          </h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <input
              type="text"
              className="hpa-form-input"
              placeholder="e.g. Next.js 16, Cloud Architecture, AI Agents"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <button type="button" onClick={handleAddTag} className="hpa-btn hpa-btn-secondary">
              Add Tag
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '100px',
                  background: 'rgba(255, 51, 102, 0.12)',
                  border: '1px solid rgba(255, 51, 102, 0.3)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                }}
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff3366',
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
      )}

      {/* Tab 4: SEO & Meta */}
      {activeTab === 'seo' && (
        <div className="hpa-form-card">
          <div className="hpa-form-grid">
            <div className="hpa-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="hpa-form-label">SEO Meta Title</label>
              <input
                type="text"
                className="hpa-form-input"
                placeholder="Default: [Title] | Prince — Tech Partner"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
              <span className="hpa-form-help">Optimized length: 50-60 characters</span>
            </div>

            <div className="hpa-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="hpa-form-label">SEO Meta Description</label>
              <textarea
                className="hpa-form-textarea"
                rows={3}
                placeholder="A description that appears on Google and social media cards..."
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
              <span className="hpa-form-help">Optimized length: 140-160 characters</span>
            </div>

            <div className="hpa-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="hpa-form-label">Canonical URL</label>
              <input
                type="text"
                className="hpa-form-input"
                placeholder="https://heyprince.in/insights/[slug]/"
                value={canonical}
                onChange={(e) => setCanonical(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default PostForm;
