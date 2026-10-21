'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Send,
  ExternalLink,
  Share2,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  Loader2,
  AlertCircle,
  ThumbsDown,
  RotateCcw,
  Eye,
  Check,
  Copy,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '@/components/admin/Toast';

export interface DraftSection {
  heading: string;
  quote?: string;
  proTip?: string;
  paragraphs: string[];
  bulletPoints?: string[];
}

export interface ModalDraftItem {
  id: string | number;
  sourceType?: 'chief' | 'news';
  draftType?: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  slug?: string;
  readMins?: string;
  categoryName?: string;
  tags?: string[];
  sections?: DraftSection[];
  linkedinPost?: string;
  raw?: any;
}

interface MobileDraftApprovalModalProps {
  draft: ModalDraftItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccessPublished?: (publishedUrl?: string) => void;
}

const QUICK_PROMPTS = [
  '🔥 Make tone punchier, authoritative & direct',
  '💡 Add real-world code & architecture example',
  '⚡ Emphasize Next.js 16, Turbopack & AI swarms',
  '✂️ Shorten length & make intro concise',
  '🎯 Rewrite title to be ultra-viral & high CTR',
  '💼 Highlight HeyPrince.in enterprise ROI & case studies',
];

export function MobileDraftApprovalModal({
  draft: initialDraft,
  isOpen,
  onClose,
  onSuccessPublished,
}: MobileDraftApprovalModalProps) {
  const { showToast } = useToast();

  const [currentDraft, setCurrentDraft] = useState<ModalDraftItem>(initialDraft);
  const [activeTab, setActiveTab] = useState<'article' | 'social' | 'customize'>('article');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [shareToLinkedIn, setShareToLinkedIn] = useState(true);
  const [summaryOfChanges, setSummaryOfChanges] = useState<string | null>(null);
  const [publishedResult, setPublishedResult] = useState<{
    publishedUrl?: string;
    linkedInUrl?: string;
  } | null>(null);
  const [rejectionPromptOpen, setRejectionPromptOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [copiedLinkedIn, setCopiedLinkedIn] = useState(false);

  // Sync draft if prop changes
  React.useEffect(() => {
    setCurrentDraft(initialDraft);
    setPublishedResult(null);
    setSummaryOfChanges(null);
  }, [initialDraft]);

  if (!isOpen) return null;

  // Handle AI Refinement
  const handleRefineDraft = async (promptToUse?: string) => {
    const prompt = (promptToUse || customInstructions).trim();
    if (!prompt) {
      showToast('Please type your instructions or tap a suggestion above.', 'error');
      return;
    }

    setIsRefining(true);
    try {
      const res = await fetch('/api/admin/approvals/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: currentDraft.id,
          sourceType: currentDraft.sourceType || 'chief',
          instructions: prompt,
        }),
      });

      const data = await res.json();
      if (data.success && data.draft) {
        // Update local state with refined draft
        setCurrentDraft((prev) => ({
          ...prev,
          title: data.draft.title || prev.title,
          excerpt: data.draft.excerpt || prev.excerpt,
          sections: data.draft.sections || prev.sections,
          linkedinPost: data.draft.linkedinPost || prev.linkedinPost,
          tags: data.draft.tags || prev.tags,
          coverImage: data.draft.coverImage || prev.coverImage,
        }));

        setSummaryOfChanges(data.summaryOfChanges || 'Article revised based on your instructions.');
        setCustomInstructions('');
        setActiveTab('article'); // Show updated article
        showToast('Draft refined by JARVIS! Check the updated preview.', 'success');
      } else {
        showToast(data.error || 'Failed to refine draft with AI', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Network error while refining draft', 'error');
    } finally {
      setIsRefining(false);
    }
  };

  // Handle Live Publish
  const handleApproveAndPublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch('/api/admin/approvals/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDraft.id,
          sourceType: currentDraft.sourceType || 'chief',
          action: 'publish',
          publishToLinkedIn: shareToLinkedIn,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPublishedResult({
          publishedUrl: data.publishedUrl,
          linkedInUrl: data.linkedInUrl,
        });
        showToast('Article published live to HeyPrince.in!', 'success');
        if (onSuccessPublished) {
          onSuccessPublished(data.publishedUrl);
        }
      } else {
        showToast(data.error || 'Failed to publish draft', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Network error while publishing', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const res = await fetch('/api/admin/approvals/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDraft.id,
          sourceType: currentDraft.sourceType || 'chief',
          action: 'reject',
          rejectionReason: rejectionReason || 'Rejected by Admin',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Draft rejected and archived.', 'info');
        onClose();
        if (onSuccessPublished) onSuccessPublished();
      } else {
        showToast(data.error || 'Failed to reject draft', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Network error while rejecting', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCopyLinkedIn = () => {
    if (currentDraft.linkedinPost) {
      navigator.clipboard.writeText(currentDraft.linkedinPost);
      setCopiedLinkedIn(true);
      setTimeout(() => setCopiedLinkedIn(false), 2000);
      showToast('LinkedIn copy copied to clipboard!', 'success');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 5, 10, 0.92)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          height: '100dvh',
          maxHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #13141f 0%, #0c0d14 100%)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.95)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Sticky Mobile Header */}
        <header
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(19, 20, 31, 0.96)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: 'rgba(255, 71, 87, 0.15)',
                color: '#ff6b81',
                border: '1px solid rgba(255, 71, 87, 0.3)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={11} />
              <span>{currentDraft.draftType?.replace(/_/g, ' ') || 'Blog Draft'}</span>
            </span>

            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#94a3b8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentDraft.readMins || '5 min read'}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </header>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(14, 15, 24, 0.85)',
            padding: '4px 12px',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setActiveTab('article')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'article' ? 'rgba(255, 71, 87, 0.2)' : 'transparent',
              color: activeTab === 'article' ? '#ffffff' : '#94a3b8',
              fontWeight: activeTab === 'article' ? 700 : 500,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <FileText size={14} />
            <span>Article Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('customize')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'customize' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeTab === 'customize' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'customize' ? 700 : 500,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Sparkles size={14} />
            <span>⚡ AI Customize</span>
          </button>

          <button
            onClick={() => setActiveTab('social')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'social' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'social' ? '#34d399' : '#94a3b8',
              fontWeight: activeTab === 'social' ? 700 : 500,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Share2 size={14} />
            <span>LinkedIn & SEO</span>
          </button>
        </div>

        {/* Refinement Banner if recently changed */}
        {summaryOfChanges && (
          <div
            style={{
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <Sparkles size={16} color="#34d399" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 600, display: 'block' }}>
                Refined by JARVIS:
              </span>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', wordBreak: 'break-word' }}>
                {summaryOfChanges}
              </span>
            </div>
          </div>
        )}

        {/* Scrollable Modal Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* TAB 1: ARTICLE PREVIEW */}
          {activeTab === 'article' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Cover Image */}
              {currentDraft.coverImage && (
                <div
                  style={{
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    maxHeight: '220px',
                    position: 'relative',
                  }}
                >
                  <img
                    src={currentDraft.coverImage}
                    alt={currentDraft.title}
                    style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      background: 'rgba(0,0,0,0.75)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      color: '#ffffff',
                    }}
                  >
                    {currentDraft.categoryName || 'Technology & Engineering'}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <h1
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: 1.3,
                    margin: '0 0 6px 0',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {currentDraft.title}
                </h1>
                {currentDraft.slug && (
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    URL: https://heyprince.in/insights/{currentDraft.slug}/
                  </span>
                )}
              </div>

              {/* Executive Summary Callout */}
              {currentDraft.excerpt && (
                <div
                  style={{
                    background: 'rgba(255, 71, 87, 0.08)',
                    borderLeft: '4px solid #ff4757',
                    padding: '12px 14px',
                    borderRadius: '0 8px 8px 0',
                    fontSize: '0.86rem',
                    color: '#f8fafc',
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: '#ff6b81' }}>Executive Summary: </strong>
                  {currentDraft.excerpt}
                </div>
              )}

              {/* Sections */}
              {Array.isArray(currentDraft.sections) && currentDraft.sections.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {currentDraft.sections.map((sec, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '10px',
                        padding: '14px',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: '#38bdf8',
                          margin: '0 0 10px 0',
                          lineHeight: 1.3,
                        }}
                      >
                        {sec.heading}
                      </h3>

                      {sec.quote && (
                        <blockquote
                          style={{
                            margin: '0 0 10px 0',
                            padding: '8px 12px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderLeft: '3px solid #38bdf8',
                            fontStyle: 'italic',
                            color: '#94a3b8',
                            fontSize: '0.82rem',
                          }}
                        >
                          "{sec.quote}"
                        </blockquote>
                      )}

                      {Array.isArray(sec.paragraphs) &&
                        sec.paragraphs.map((p, pIdx) => (
                          <p
                            key={pIdx}
                            style={{
                              fontSize: '0.86rem',
                              color: '#cbd5e1',
                              lineHeight: 1.6,
                              margin: '0 0 10px 0',
                            }}
                          >
                            {p}
                          </p>
                        ))}

                      {Array.isArray(sec.bulletPoints) && sec.bulletPoints.length > 0 && (
                        <ul
                          style={{
                            margin: '8px 0 0 0',
                            paddingLeft: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px',
                          }}
                        >
                          {sec.bulletPoints.map((b, bIdx) => (
                            <li
                              key={bIdx}
                              style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}
                            >
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}

                      {sec.proTip && (
                        <div
                          style={{
                            marginTop: '10px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            fontSize: '0.8rem',
                            color: '#34d399',
                          }}
                        >
                          <strong>Pro Tip: </strong>
                          {sec.proTip}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : currentDraft.raw?.content ? (
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '14px',
                    fontSize: '0.86rem',
                    color: '#e2e8f0',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {currentDraft.raw.content}
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.86rem', textAlign: 'center', padding: '20px' }}>
                  No article content available to preview.
                </div>
              )}

              {/* Tags */}
              {Array.isArray(currentDraft.tags) && currentDraft.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {currentDraft.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      style={{
                        fontSize: '0.72rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        color: '#94a3b8',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Jump to Customization */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(255, 71, 87, 0.1) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginTop: '10px',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>
                    Want to tweak something?
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
                    Send instructions to JARVIS and preview updates instantly.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('customize')}
                  className="hpa-btn hpa-btn-primary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.76rem',
                    background: '#38bdf8',
                    borderColor: '#38bdf8',
                    color: '#000000',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={13} />
                  <span>Customize</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: AI CUSTOMIZATION */}
          {activeTab === 'customize' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={18} color="#38bdf8" />
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#ffffff', fontWeight: 700 }}>
                    Refine with JARVIS AI
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  Tell JARVIS exactly how you'd like to adjust this article. JARVIS will rewrite the draft and re-render the preview for your approval.
                </p>
              </div>

              {/* Quick Prompt Pills */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#64748b',
                    marginBottom: '8px',
                    letterSpacing: '0.05em',
                  }}
                >
                  Quick One-Tap Customizations:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {QUICK_PROMPTS.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => {
                        setCustomInstructions(prompt);
                        handleRefineDraft(prompt);
                      }}
                      disabled={isRefining}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '20px',
                        padding: '6px 12px',
                        fontSize: '0.76rem',
                        color: '#f1f5f9',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Instructions Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  htmlFor="custom-instructions"
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#64748b',
                    letterSpacing: '0.05em',
                  }}
                >
                  Or Enter Your Specific Customization:
                </label>
                <textarea
                  id="custom-instructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Make the intro punchier, add a paragraph about HeyPrince.in's autonomous AI swarms, and shorten the conclusion..."
                  rows={4}
                  disabled={isRefining}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '0.86rem',
                    color: '#ffffff',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: 1.5,
                  }}
                />

                <button
                  type="button"
                  onClick={() => handleRefineDraft()}
                  disabled={isRefining || !customInstructions.trim()}
                  className="hpa-btn hpa-btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                    borderColor: '#38bdf8',
                    color: '#000000',
                    fontWeight: 700,
                    padding: '12px',
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isRefining ? (
                    <>
                      <Loader2 size={16} className="hpa-spin" />
                      <span>JARVIS is refining draft...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Apply Customization & Update Popup</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SOCIAL & SEO */}
          {activeTab === 'social' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* LinkedIn Preview Card */}
              <div
                style={{
                  background: 'rgba(10, 102, 194, 0.08)',
                  border: '1px solid rgba(10, 102, 194, 0.25)',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#0a66c2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                      }}
                    >
                      in
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#ffffff' }}>
                        Prince (HeyPrince.in)
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Autonomous AI Chief of Staff Post
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyLinkedIn}
                    className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                    style={{ fontSize: '0.74rem' }}
                  >
                    {copiedLinkedIn ? <Check size={12} color="#00ff88" /> : <Copy size={12} />}
                    <span>{copiedLinkedIn ? 'Copied' : 'Copy Post'}</span>
                  </button>
                </div>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '14px',
                    fontSize: '0.84rem',
                    color: '#e2e8f0',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    maxHeight: '260px',
                    overflowY: 'auto',
                  }}
                >
                  {currentDraft.linkedinPost || 'No LinkedIn copy generated yet.'}
                </div>
              </div>

              {/* Google Search Snippet Preview */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Google Search Snippet Preview:
                </span>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>
                  https://heyprince.in › insights › {currentDraft.slug || 'slug'}
                </div>
                <h4
                  style={{
                    margin: '0 0 4px 0',
                    fontSize: '1rem',
                    color: '#8ab4f8',
                    fontWeight: 600,
                    lineHeight: 1.3,
                  }}
                >
                  {currentDraft.title}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#bdc1c6', lineHeight: 1.4 }}>
                  {currentDraft.excerpt || 'Read the latest technical analysis and insights.'}
                </p>
              </div>
            </div>
          )}

          {/* Published Celebration View */}
          {publishedResult && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(10, 12, 20, 0.98)',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <CheckCircle2 size={56} color="#00ff88" style={{ marginBottom: '16px' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0' }}>
                Article Published Live!
              </h2>
              <p
                style={{
                  fontSize: '0.86rem',
                  color: '#94a3b8',
                  maxWidth: '380px',
                  lineHeight: 1.5,
                  margin: '0 0 20px 0',
                }}
              >
                Your approved article is now live on HeyPrince.in. Anyone worldwide can read it.
              </p>

              {publishedResult.publishedUrl && (
                <a
                  href={publishedResult.publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hpa-btn hpa-btn-primary"
                  style={{
                    background: '#00ff88',
                    borderColor: '#00ff88',
                    color: '#000000',
                    fontWeight: 700,
                    padding: '12px 20px',
                    fontSize: '0.9rem',
                    marginBottom: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Open Live Article</span>
                  <ExternalLink size={16} />
                </a>
              )}

              {publishedResult.linkedInUrl && (
                <span style={{ fontSize: '0.78rem', color: '#38bdf8', display: 'block', marginBottom: '16px' }}>
                  Shared to LinkedIn Profile
                </span>
              )}

              <button
                onClick={onClose}
                className="hpa-btn hpa-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.84rem' }}
              >
                Done / Close
              </button>
            </div>
          )}
        </div>

        {/* Sticky Mobile Action Footer */}
        {!publishedResult && (
          <footer
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(15, 16, 26, 0.98)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            {/* LinkedIn Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.78rem',
                color: '#cbd5e1',
              }}
            >
              <input
                type="checkbox"
                checked={shareToLinkedIn}
                onChange={(e) => setShareToLinkedIn(e.target.checked)}
                style={{ accentColor: '#ff4757', width: '15px', height: '15px' }}
              />
              <span>Also publish social companion post to LinkedIn</span>
            </label>

            {/* Rejection Prompt Box if open */}
            {rejectionPromptOpen && (
              <div
                style={{
                  background: 'rgba(255, 71, 87, 0.1)',
                  border: '1px solid rgba(255, 71, 87, 0.3)',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <input
                  type="text"
                  placeholder="Optional rejection reason..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '0.8rem',
                    color: '#ffffff',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => setRejectionPromptOpen(false)}
                    className="hpa-btn hpa-btn-secondary hpa-btn-sm"
                    style={{ fontSize: '0.74rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isRejecting}
                    className="hpa-btn hpa-btn-sm"
                    style={{
                      background: '#ff4757',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                    }}
                  >
                    {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!rejectionPromptOpen && (
                <button
                  type="button"
                  onClick={() => setRejectionPromptOpen(true)}
                  className="hpa-btn hpa-btn-secondary"
                  style={{
                    fontSize: '0.8rem',
                    color: '#ff6b81',
                    padding: '10px 14px',
                    flexShrink: 0,
                  }}
                >
                  <ThumbsDown size={14} />
                  <span>Reject</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleApproveAndPublish}
                disabled={isPublishing || isRefining}
                className="hpa-btn hpa-btn-primary"
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #00ff88 0%, #00b894 100%)',
                  borderColor: '#00ff88',
                  color: '#000000',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(0, 255, 136, 0.35)',
                }}
              >
                {isPublishing ? (
                  <>
                    <Loader2 size={16} className="hpa-spin" />
                    <span>Publishing Live...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Approve & Publish to Live Site</span>
                  </>
                )}
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

