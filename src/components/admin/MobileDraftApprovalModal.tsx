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
  Bookmark,
  Edit3,
  Mail,
  ShieldCheck,
  Building,
  Target,
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
  sourceType?: 'chief' | 'news' | 'outreach';
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
  targetUrl?: string;
  // Outreach fields
  isOutreachProposal?: boolean;
  businessName?: string;
  domain?: string;
  websiteUrl?: string;
  contactEmail?: string;
  contactName?: string;
  leadScore?: number;
  confidenceLevel?: number;
  evidence?: string[];
  likelyNeeds?: string;
  recommendedService?: string;
  proposedNextAction?: string;
  personalizedEmailSubject?: string;
  personalizedEmailBody?: string;
  sendStatus?: string;
  idempotencyKey?: string;
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

  // Outreach Editing & Sending States
  const isOutreach =
    currentDraft.sourceType === 'outreach' ||
    Boolean(currentDraft.isOutreachProposal) ||
    currentDraft.draftType === 'outreach_draft' ||
    currentDraft.draftType === 'outreach_proposal' ||
    currentDraft.draftType === 'client_proposal';

  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [editSubject, setEditSubject] = useState(
    currentDraft.personalizedEmailSubject || currentDraft.title
  );
  const [editBody, setEditBody] = useState(
    currentDraft.personalizedEmailBody || currentDraft.raw?.content || currentDraft.excerpt || ''
  );
  const [editRecipientEmail, setEditRecipientEmail] = useState(currentDraft.contactEmail || '');
  const [isSendingOutreach, setIsSendingOutreach] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Sync draft if prop changes
  React.useEffect(() => {
    setCurrentDraft(initialDraft);
    setPublishedResult(null);
    setSummaryOfChanges(null);
    setEditSubject(initialDraft.personalizedEmailSubject || initialDraft.title);
    setEditBody(initialDraft.personalizedEmailBody || initialDraft.raw?.content || initialDraft.excerpt || '');
    setEditRecipientEmail(initialDraft.contactEmail || '');
    setIsEditingProposal(false);
  }, [initialDraft]);

  if (!isOpen) return null;

  // Handle AI Refinement for Articles
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
        setActiveTab('article');
        showToast('Draft refined by JARVIS! Check the preview.', 'success');
      } else {
        showToast(data.error || 'Failed to refine draft with AI', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Network error while refining draft', 'error');
    } finally {
      setIsRefining(false);
    }
  };

  // Handle Live Publish for Blogs
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
        if (onSuccessPublished) onSuccessPublished(data.publishedUrl);
      } else {
        showToast(data.error || 'Publish failed', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Network error while publishing', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle Approve & Send Outreach Proposal (With Idempotency)
  const handleApproveAndSendOutreach = async () => {
    if (!editRecipientEmail || !editRecipientEmail.includes('@')) {
      showToast('Please enter a valid recipient email address first.', 'error');
      setIsEditingProposal(true);
      return;
    }

    setIsSendingOutreach(true);
    try {
      const res = await fetch('/api/admin/approvals/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDraft.id,
          sourceType: 'outreach',
          action: 'approve_and_send_outreach',
          customSubject: editSubject,
          customBody: editBody,
          recipientEmail: editRecipientEmail,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Outreach pitch approved and sent successfully!', 'success');
        onClose();
        if (onSuccessPublished) onSuccessPublished();
      } else {
        showToast(data.error || 'Outreach send failed.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Network error while dispatching outreach.', 'error');
    } finally {
      setIsSendingOutreach(false);
    }
  };

  // Handle Save Edited Draft Inline
  const handleSaveEditedDraft = async () => {
    setIsSavingDraft(true);
    try {
      const res = await fetch('/api/admin/approvals/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDraft.id,
          sourceType: currentDraft.sourceType,
          action: 'edit_draft',
          title: editSubject,
          content: editBody,
          subject: editSubject,
          bodyText: editBody,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Draft changes saved successfully.', 'success');
        setIsEditingProposal(false);
        setCurrentDraft((prev) => ({
          ...prev,
          title: editSubject,
          personalizedEmailSubject: editSubject,
          personalizedEmailBody: editBody,
        }));
      } else {
        showToast(data.error || 'Failed to save draft changes.', 'error');
      }
    } catch {
      showToast('Network error saving draft.', 'error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle Save for Later
  const handleSaveForLater = async () => {
    try {
      const res = await fetch('/api/admin/approvals/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDraft.id,
          sourceType: currentDraft.sourceType,
          action: 'save_for_later',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Proposal saved for later review.', 'info');
        onClose();
        if (onSuccessPublished) onSuccessPublished();
      } else {
        showToast(data.error || 'Failed to save for later.', 'error');
      }
    } catch {
      showToast('Network error saving for later.', 'error');
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
                background: isOutreach ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 71, 87, 0.15)',
                color: isOutreach ? '#c084fc' : '#ff6b81',
                border: isOutreach ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255, 71, 87, 0.3)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={11} />
              <span>{isOutreach ? 'Client Outreach Proposal' : currentDraft.draftType?.replace(/_/g, ' ') || 'Blog Draft'}</span>
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
              {isOutreach
                ? currentDraft.businessName || currentDraft.domain || 'Lead Proposal'
                : currentDraft.readMins || '5 min read'}
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

        {/* Tab Switcher (For Articles only) */}
        {!isOutreach && (
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
        )}

        {/* Scrollable Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* ================================================================ */}
          {/* OUTREACH PROPOSAL VIEW                                            */}
          {/* ================================================================ */}
          {isOutreach ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Prospect Dossier Card */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(19, 20, 31, 0.9) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px' }}>
                      {currentDraft.businessName || currentDraft.title}
                    </h2>
                    {currentDraft.websiteUrl && (
                      <a
                        href={currentDraft.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '0.82rem',
                          color: '#38bdf8',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'none',
                        }}
                      >
                        <span>{currentDraft.domain || currentDraft.websiteUrl}</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#34d399',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                      }}
                    >
                      Fit Score: {currentDraft.leadScore || 85}/100
                    </span>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'rgba(56, 189, 248, 0.2)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                      }}
                    >
                      Confidence: {currentDraft.confidenceLevel || 88}%
                    </span>
                  </div>
                </div>

                {/* Evidence & Opportunity Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginTop: '4px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                      Recommended Service
                    </span>
                    <strong style={{ fontSize: '0.84rem', color: '#ffffff' }}>
                      {currentDraft.recommendedService || 'Next.js Frontend Architecture & Speed Optimization'}
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                      Likely Needs & Pain Point
                    </span>
                    <strong style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                      {currentDraft.likelyNeeds || 'Sub-second mobile speed optimization & modern UX'}
                    </strong>
                  </div>
                </div>

                {/* Technical Evidence Bullets */}
                {Array.isArray(currentDraft.evidence) && currentDraft.evidence.length > 0 && (
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Audit Evidence Supporting Opportunity
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {currentDraft.evidence.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contact Email Field */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '8px' }}>
                  <Mail size={14} color="#a855f7" />
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Recipient Email:</span>
                  {isEditingProposal ? (
                    <input
                      type="email"
                      value={editRecipientEmail}
                      onChange={(e) => setEditRecipientEmail(e.target.value)}
                      placeholder="e.g. contact@business.com"
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '4px',
                        color: '#ffffff',
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                      }}
                    />
                  ) : (
                    <strong style={{ fontSize: '0.82rem', color: editRecipientEmail ? '#ffffff' : '#f43f5e' }}>
                      {editRecipientEmail || '⚠️ No email specified — Click "Edit Pitch" to enter'}
                    </strong>
                  )}
                </div>
              </div>

              {/* Personalized Pitch Card (Preview or Editable) */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(19, 20, 31, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Edit3 size={15} color="#c084fc" />
                    <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: '#ffffff' }}>
                      Personalized Cold Email Pitch
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingProposal(!isEditingProposal)}
                    style={{
                      background: isEditingProposal ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: isEditingProposal ? '#38bdf8' : '#cbd5e1',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                    }}
                  >
                    {isEditingProposal ? 'Cancel Editing' : '✏️ Edit Pitch Before Approval'}
                  </button>
                </div>

                {isEditingProposal ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Email Subject Line:
                      </label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          padding: '8px 10px',
                          fontSize: '0.84rem',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Email Body:
                      </label>
                      <textarea
                        rows={8}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          padding: '10px',
                          fontSize: '0.84rem',
                          lineHeight: 1.5,
                          fontFamily: 'monospace',
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveEditedDraft}
                      disabled={isSavingDraft}
                      className="hpa-btn hpa-btn-primary"
                      style={{ alignSelf: 'flex-start', padding: '6px 14px', fontSize: '0.78rem' }}
                    >
                      {isSavingDraft ? <Loader2 size={13} className="hpa-spin" /> : <Check size={13} />}
                      <span>Save Draft Changes</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', marginBottom: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Subject:</span>
                      <strong style={{ fontSize: '0.86rem', color: '#ffffff' }}>{editSubject}</strong>
                    </div>

                    <pre
                      style={{
                        background: 'rgba(0,0,0,0.4)',
                        padding: '14px',
                        borderRadius: '8px',
                        color: '#cbd5e1',
                        fontSize: '0.82rem',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        margin: 0,
                      }}
                    >
                      {editBody}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ================================================================ */
            /* BLOG / SERVICE PAGE / CONTENT DRAFT VIEW                         */
            /* ================================================================ */
            <>
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
                        margin: '0 0 6px',
                        lineHeight: 1.3,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {currentDraft.title}
                    </h1>
                    <p style={{ fontSize: '0.86rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                      {currentDraft.excerpt}
                    </p>
                  </div>

                  {/* Sections Preview */}
                  {currentDraft.sections && currentDraft.sections.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {currentDraft.sections.map((sec, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '14px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8', margin: '0 0 8px' }}>
                            {sec.heading}
                          </h3>
                          {sec.quote && (
                            <blockquote
                              style={{
                                margin: '0 0 10px',
                                paddingLeft: '12px',
                                borderLeft: '3px solid #ff4757',
                                color: '#e2e8f0',
                                fontStyle: 'italic',
                                fontSize: '0.82rem',
                              }}
                            >
                              &quot;{sec.quote}&quot;
                            </blockquote>
                          )}
                          {sec.paragraphs?.map((p, pIdx) => (
                            <p key={pIdx} style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.55, margin: '0 0 8px' }}>
                              {p}
                            </p>
                          ))}
                          {sec.proTip && (
                            <div
                              style={{
                                padding: '8px 10px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                borderLeft: '3px solid #10b981',
                                borderRadius: '4px',
                                fontSize: '0.76rem',
                                color: '#6ee7b7',
                              }}
                            >
                              <strong>Pro-Tip:</strong> {sec.proTip}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: AI CUSTOMIZATION */}
              {activeTab === 'customize' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(56, 189, 248, 0.08)',
                      borderRadius: '8px',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700, fontSize: '0.84rem' }}>
                      <Sparkles size={16} />
                      <span>Live Voice & Text AI Directives</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#cbd5e1' }}>
                      Instruct JARVIS on how to revise this draft. Changes apply instantly without republishing.
                    </p>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                      One-Tap Refinement Presets:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {QUICK_PROMPTS.map((promptText, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleRefineDraft(promptText)}
                          disabled={isRefining}
                          style={{
                            padding: '6px 10px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '20px',
                            color: '#e2e8f0',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                          }}
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Prompt Text Area */}
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                      Custom Directive for JARVIS:
                    </label>
                    <textarea
                      rows={3}
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="e.g. Expand on the Supabase Edge Functions part and add a comparison table..."
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        padding: '10px',
                        fontSize: '0.82rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRefineDraft()}
                      disabled={isRefining || !customInstructions.trim()}
                      className="hpa-btn hpa-btn-primary"
                      style={{ marginTop: '8px', padding: '8px 14px', fontSize: '0.8rem' }}
                    >
                      {isRefining ? <Loader2 size={13} className="hpa-spin" /> : <Send size={13} />}
                      <span>Execute AI Refinement</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: SOCIAL & SEO */}
              {activeTab === 'social' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399' }}>
                        LinkedIn Companion Post Copy
                      </span>
                      <button
                        onClick={handleCopyLinkedIn}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#34d399',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.74rem',
                        }}
                      >
                        {copiedLinkedIn ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedLinkedIn ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        padding: '10px',
                        background: 'rgba(0,0,0,0.5)',
                        borderRadius: '6px',
                        color: '#cbd5e1',
                        fontSize: '0.78rem',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                      }}
                    >
                      {currentDraft.linkedinPost || 'No companion post generated.'}
                    </pre>
                  </div>
                </div>
              )}
            </>
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
            {/* LinkedIn Toggle for Blogs */}
            {!isOutreach && (
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
            )}

            {/* Rejection Prompt Box */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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

              {isOutreach ? (
                <>
                  <button
                    type="button"
                    onClick={handleSaveForLater}
                    className="hpa-btn hpa-btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '10px 12px' }}
                  >
                    <Bookmark size={14} />
                    <span>Save for Later</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApproveAndSendOutreach}
                    disabled={isSendingOutreach}
                    className="hpa-btn hpa-btn-primary"
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderColor: '#10b981',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    {isSendingOutreach ? (
                      <>
                        <Loader2 size={16} className="hpa-spin" />
                        <span>Sending Outreach...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Approve & Send Proposal</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
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
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
