'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FaHeart,
  FaReply,
  FaShieldHalved,
  FaRotate,
  FaCircleCheck,
  FaPaperPlane,
  FaRegComments,
  FaXmark,
} from 'react-icons/fa6';

export interface CommentItem {
  id: number;
  postSlug: string;
  parentId: number | null;
  authorName: string;
  authorAvatar: string;
  content: string;
  likesCount: number;
  hasLiked?: boolean;
  isAuthor: boolean;
  createdAt: string;
  replies?: CommentItem[];
}

interface DiscussionSectionProps {
  slug: string;
  postTitle?: string;
}

export const DiscussionSection: React.FC<DiscussionSectionProps> = ({ slug }) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Top-level comment form state
  const [authorName, setAuthorName] = useState<string>('');
  const [authorEmail, setAuthorEmail] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Active reply target state
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyAuthorName, setReplyAuthorName] = useState<string>('');
  const [replyAuthorEmail, setReplyAuthorEmail] = useState<string>('');
  const [replyContent, setReplyContent] = useState<string>('');
  const [replySubmitting, setReplySubmitting] = useState<boolean>(false);

  // Dynamic Client-side Security Math Challenge (Anti-Bot Cyber Shield)
  const [num1, setNum1] = useState<number>(3);
  const [num2, setNum2] = useState<number>(4);
  const [userMathAnswer, setUserMathAnswer] = useState<string>('');
  const [replyMathAnswer, setReplyMathAnswer] = useState<string>('');

  const generateNewMathChallenge = useCallback(() => {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 1;
    setNum1(a);
    setNum2(b);
    setUserMathAnswer('');
    setReplyMathAnswer('');
  }, []);

  useEffect(() => {
    generateNewMathChallenge();
  }, [generateNewMathChallenge]);

  // Load saved name/email from localStorage if previously commented
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('hp_discuss_author_name');
      const savedEmail = localStorage.getItem('hp_discuss_author_email');
      if (savedName) {
        setAuthorName(savedName);
        setReplyAuthorName(savedName);
      }
      if (savedEmail) {
        setAuthorEmail(savedEmail);
        setReplyAuthorEmail(savedEmail);
      }
    } catch {}
  }, []);

  // Fetch comments from API
  const fetchComments = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      try {
        const res = await fetch(`/api/blog/comments?slug=${encodeURIComponent(slug)}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (data.success) {
          setComments(data.comments || []);
          setTotalCount(data.count || 0);
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Format relative timestamp
  const formatTimeAgo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffSecs = Math.floor((now.getTime() - d.getTime()) / 1000);

      if (diffSecs < 60) return 'Just now';
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;

      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return 'Recently';
    }
  };

  // Handle Comment Submission (Top-level)
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const expectedSum = (num1 + num2).toString();
    if (userMathAnswer.trim() !== expectedSum) {
      setErrorMsg(`Security verification failed. Please solve: ${num1} + ${num2} = ?`);
      return;
    }

    if (!authorName.trim() || !authorEmail.trim() || !content.trim()) {
      setErrorMsg('Please provide your name, email, and comment message.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim(),
          content: content.trim(),
          securityAnswer: userMathAnswer.trim(),
          expectedAnswer: expectedSum,
          website_hp_check: '', // Honeypot field must stay empty
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit comment');
      }

      // Persist contact details for returning visits
      try {
        localStorage.setItem('hp_discuss_author_name', authorName.trim());
        localStorage.setItem('hp_discuss_author_email', authorEmail.trim());
      } catch {}

      setContent('');
      setUserMathAnswer('');
      generateNewMathChallenge();
      setSuccessMsg('Your comment has been posted!');
      setTimeout(() => setSuccessMsg(null), 4000);

      // Refresh list
      await fetchComments(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reply Submission (Nested)
  const handleSubmitReply = async (parentId: number, e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const expectedSum = (num1 + num2).toString();
    if (replyMathAnswer.trim() !== expectedSum) {
      setErrorMsg(`Security verification failed. Please solve: ${num1} + ${num2} = ?`);
      return;
    }

    if (!replyAuthorName.trim() || !replyAuthorEmail.trim() || !replyContent.trim()) {
      setErrorMsg('Please fill in your name, email, and reply content.');
      return;
    }

    setReplySubmitting(true);
    try {
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          parentId,
          authorName: replyAuthorName.trim(),
          authorEmail: replyAuthorEmail.trim(),
          content: replyContent.trim(),
          securityAnswer: replyMathAnswer.trim(),
          expectedAnswer: expectedSum,
          website_hp_check: '',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to post reply');
      }

      try {
        localStorage.setItem('hp_discuss_author_name', replyAuthorName.trim());
        localStorage.setItem('hp_discuss_author_email', replyAuthorEmail.trim());
      } catch {}

      setReplyContent('');
      setReplyingToId(null);
      generateNewMathChallenge();
      setSuccessMsg('Your reply has been added to the discussion!');
      setTimeout(() => setSuccessMsg(null), 4000);

      await fetchComments(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to post reply. Please try again.');
    } finally {
      setReplySubmitting(false);
    }
  };

  // Handle Comment Like
  const handleLikeComment = async (commentId: number) => {
    // Optimistic UI update
    setComments((prev) => updateCommentLikesOptimistic(prev, commentId));

    try {
      const res = await fetch('/api/blog/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback on error
        await fetchComments(true);
      }
    } catch {
      await fetchComments(true);
    }
  };

  const updateCommentLikesOptimistic = (list: CommentItem[], targetId: number): CommentItem[] => {
    return list.map((item) => {
      if (item.id === targetId) {
        const nextLiked = !item.hasLiked;
        return {
          ...item,
          hasLiked: nextLiked,
          likesCount: nextLiked ? item.likesCount + 1 : Math.max(0, item.likesCount - 1),
        };
      }
      if (item.replies && item.replies.length > 0) {
        return {
          ...item,
          replies: updateCommentLikesOptimistic(item.replies, targetId),
        };
      }
      return item;
    });
  };

  return (
    <section className="discussion-container" id="discussion-section">
      {/* Discussion Header */}
      <div className="discussion-header">
        <div className="discussion-title-wrap">
          <FaRegComments className="discussion-title-icon" />
          <h3 className="discussion-title">
            Live Discussion
            <span className="discussion-badge">
              {totalCount} {totalCount === 1 ? 'comment' : 'comments'}
            </span>
          </h3>
        </div>

        <button
          type="button"
          className={`discussion-refresh-btn ${refreshing ? 'rotating' : ''}`}
          onClick={() => fetchComments(true)}
          title="Refresh discussion feed"
          aria-label="Refresh comments"
        >
          <FaRotate size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Security Cyber-Shield Notice */}
      <div className="discussion-security-notice">
        <FaShieldHalved className="shield-icon" />
        <span>
          Protected by real-time cyber defense: automated spam interception, zero script injection, and private email encryption.
        </span>
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="discussion-alert error">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} aria-label="Close error">
            <FaXmark size={12} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="discussion-alert success">
          <FaCircleCheck size={14} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Comment Form */}
      <form className="discussion-form" onSubmit={handleSubmitComment}>
        <div className="form-intro">
          <h4>Join the Conversation</h4>
          <p>Share your architectural insights, ask questions, or challenge our assumptions.</p>
        </div>

        {/* Hidden Honeypot Field for Bot Interception */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <label htmlFor="website_hp_check">Leave this field blank</label>
          <input
            type="text"
            id="website_hp_check"
            name="website_hp_check"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="form-row-2col">
          <div className="input-group">
            <label htmlFor="author_name">Your Name</label>
            <input
              type="text"
              id="author_name"
              placeholder="e.g. Alex Morgan"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={50}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="author_email">
              Your Email <span className="privacy-note">(Strictly Private)</span>
            </label>
            <input
              type="email"
              id="author_email"
              placeholder="name@company.com"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              maxLength={100}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <div className="label-with-count">
            <label htmlFor="comment_content">Comment</label>
            <span className="char-count">{content.length}/2000</span>
          </div>
          <textarea
            id="comment_content"
            rows={4}
            placeholder="Write your perspective, code ideas, or experience on this topic..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            required
          />
        </div>

        {/* Anti-Bot Math Challenge */}
        <div className="form-footer-row">
          <div className="math-challenge-box">
            <span className="challenge-label">Security Check:</span>
            <span className="challenge-equation">
              {num1} + {num2} = ?
            </span>
            <input
              type="text"
              placeholder="Answer"
              className="challenge-input"
              value={userMathAnswer}
              onChange={(e) => setUserMathAnswer(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-submit-comment"
            disabled={submitting}
          >
            <FaPaperPlane size={13} />
            <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="comments-thread-wrap">
        {loading ? (
          <div className="comments-loading-state">
            <FaRotate className="rotating" size={20} />
            <p>Loading live discussion thread...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="comments-empty-state">
            <FaRegComments size={32} />
            <h5>No comments yet</h5>
            <p>Be the first to share your thoughts and start the discussion on this engineering story!</p>
          </div>
        ) : (
          <div className="comments-list">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                replyingToId={replyingToId}
                setReplyingToId={setReplyingToId}
                replyAuthorName={replyAuthorName}
                setReplyAuthorName={setReplyAuthorName}
                replyAuthorEmail={replyAuthorEmail}
                setReplyAuthorEmail={setReplyAuthorEmail}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                replyMathAnswer={replyMathAnswer}
                setReplyMathAnswer={setReplyMathAnswer}
                num1={num1}
                num2={num2}
                replySubmitting={replySubmitting}
                onSubmitReply={handleSubmitReply}
                onLikeComment={handleLikeComment}
                formatTimeAgo={formatTimeAgo}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

interface CommentCardProps {
  comment: CommentItem;
  replyingToId: number | null;
  setReplyingToId: (id: number | null) => void;
  replyAuthorName: string;
  setReplyAuthorName: (val: string) => void;
  replyAuthorEmail: string;
  setReplyAuthorEmail: (val: string) => void;
  replyContent: string;
  setReplyContent: (val: string) => void;
  replyMathAnswer: string;
  setReplyMathAnswer: (val: string) => void;
  num1: number;
  num2: number;
  replySubmitting: boolean;
  onSubmitReply: (parentId: number, e: React.FormEvent) => Promise<void>;
  onLikeComment: (commentId: number) => Promise<void>;
  formatTimeAgo: (dateStr: string) => string;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  replyingToId,
  setReplyingToId,
  replyAuthorName,
  setReplyAuthorName,
  replyAuthorEmail,
  setReplyAuthorEmail,
  replyContent,
  setReplyContent,
  replyMathAnswer,
  setReplyMathAnswer,
  num1,
  num2,
  replySubmitting,
  onSubmitReply,
  onLikeComment,
  formatTimeAgo,
}) => {
  const isReplying = replyingToId === comment.id;

  return (
    <div className={`comment-card ${comment.parentId ? 'nested-reply' : 'root-comment'}`}>
      <div className="comment-main">
        {/* Left Avatar Column */}
        <div className="comment-avatar-wrap">
          <img
            src={comment.authorAvatar}
            alt={comment.authorName}
            className="comment-avatar"
            width={40}
            height={40}
            loading="lazy"
          />
        </div>

        {/* Right Content Column */}
        <div className="comment-body">
          <div className="comment-meta-row">
            <div className="comment-author-info">
              <span className="comment-author-name">{comment.authorName}</span>
              {comment.isAuthor && (
                <span className="verified-author-badge">
                  👑 Author / Tech Partner
                </span>
              )}
            </div>
            <span className="comment-timestamp">{formatTimeAgo(comment.createdAt)}</span>
          </div>

          <div className="comment-text">
            {comment.content.split('\n').map((paragraph, pIdx) => (
              <p key={pIdx}>{paragraph}</p>
            ))}
          </div>

          {/* Comment Action Buttons */}
          <div className="comment-actions-bar">
            <button
              type="button"
              className={`comment-like-btn ${comment.hasLiked ? 'liked' : ''}`}
              onClick={() => onLikeComment(comment.id)}
              aria-label={comment.hasLiked ? 'Unlike comment' : 'Like comment'}
            >
              <FaHeart color={comment.hasLiked ? '#d40027' : 'currentColor'} size={12} />
              <span>{comment.likesCount > 0 ? comment.likesCount : 'Like'}</span>
            </button>

            <button
              type="button"
              className="comment-reply-btn"
              onClick={() => setReplyingToId(isReplying ? null : comment.id)}
              aria-label={`Reply to ${comment.authorName}`}
            >
              <FaReply size={11} />
              <span>{isReplying ? 'Cancel Reply' : 'Reply'}</span>
            </button>
          </div>

          {/* Inline Reply Form (Threaded) */}
          {isReplying && (
            <form
              className="reply-inline-form"
              onSubmit={(e) => onSubmitReply(comment.id, e)}
            >
              <div className="reply-header">
                <span>Replying to <strong>@{comment.authorName}</strong></span>
                <button
                  type="button"
                  className="reply-close-btn"
                  onClick={() => setReplyingToId(null)}
                >
                  <FaXmark size={12} />
                </button>
              </div>

              <div className="form-row-2col">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="reply-input"
                  value={replyAuthorName}
                  onChange={(e) => setReplyAuthorName(e.target.value)}
                  maxLength={50}
                  required
                />
                <input
                  type="email"
                  placeholder="Your Email (Private)"
                  className="reply-input"
                  value={replyAuthorEmail}
                  onChange={(e) => setReplyAuthorEmail(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <textarea
                rows={3}
                placeholder={`Write your reply to ${comment.authorName}...`}
                className="reply-textarea"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                maxLength={2000}
                required
              />

              <div className="reply-footer-row">
                <div className="math-challenge-box small">
                  <span className="challenge-equation">{num1} + {num2} = ?</span>
                  <input
                    type="text"
                    placeholder="Answer"
                    className="challenge-input small"
                    value={replyMathAnswer}
                    onChange={(e) => setReplyMathAnswer(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-submit-reply"
                  disabled={replySubmitting}
                >
                  <FaPaperPlane size={11} />
                  <span>{replySubmitting ? 'Posting...' : 'Post Reply'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Render Nested Children Replies in Same Thread */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="nested-replies-list">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              replyAuthorName={replyAuthorName}
              setReplyAuthorName={setReplyAuthorName}
              replyAuthorEmail={replyAuthorEmail}
              setReplyAuthorEmail={setReplyAuthorEmail}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              replyMathAnswer={replyMathAnswer}
              setReplyMathAnswer={setReplyMathAnswer}
              num1={num1}
              num2={num2}
              replySubmitting={replySubmitting}
              onSubmitReply={onSubmitReply}
              onLikeComment={onLikeComment}
              formatTimeAgo={formatTimeAgo}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscussionSection;
