import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaWhatsapp,
  FaLinkedinIn,
  FaInstagram,
  FaClock,
  FaGlobe,
  FaPaperPlane,
  FaCheck,
  FaCircleCheck,
  FaCopy,
  FaChevronDown,
  FaCalendarDays,
  FaCode,
} from 'react-icons/fa6';

export interface ContactPageProps {
  onNavigateHome: () => void;
}

const SERVICE_OPTIONS = [
  'Frontend React / Next.js',
  'Full-Stack Web App',
  'UI/UX Redesign & Motion',
  'WordPress & Custom Theme',
  'Shopify E-Commerce Store',
  'Speed & SEO Optimization',
  'Technical Architecture & Advisory',
];

const BUDGET_OPTIONS = ['< $1,500', '$1,500 - $3,500', '$3,500 - $7,500', '$7,500+'];

const TIMELINE_OPTIONS = ['ASAP (< 2 weeks)', '1 - 2 Months', '3+ Months / Flexible'];

const FAQS = [
  {
    q: 'How quickly can we kick off a new project?',
    a: 'Typically within 2 to 5 business days after our initial discovery chat and scope alignment. If you have a critical sprint deadline, let me know in your message and I will prioritize scheduling.',
  },
  {
    q: 'Do you collaborate with international clients across timezones?',
    a: 'Yes, over 70% of my clients are based across the US (EST/PST), Europe (GMT/CET), and Australia. I maintain flexible overlapping working hours and provide detailed async video and code updates.',
  },
  {
    q: 'What does your typical engineering process look like?',
    a: 'We begin with technical discovery and architecture review, followed by interactive wireframing/prototyping, sprint-based development with live staging previews, automated testing, deployment, and a 30-day post-launch warranty.',
  },
  {
    q: 'Do you offer ongoing retainer & maintenance support?',
    a: 'Yes! Many clients retain me on a monthly basis for continuous performance monitoring, security patches, new feature additions, and technical advisory.',
  },
];

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigateHome }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'Frontend React / Next.js',
    budget: '$1,500 - $3,500',
    timeline: '1 - 2 Months',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // CRITICAL: Ensure instant scroll to top on mount before paint
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handleCopyEmail = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText('it@heyprince.in');
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('https://formsubmit.co/ajax/it@heyprince.in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          _subject: `New Project Inquiry: ${formData.service} from ${formData.name}`,
          _template: 'table',
          Name: formData.name,
          Email: formData.email,
          Phone: formData.phone || 'Not provided',
          'Service Needed': formData.service,
          'Estimated Budget': formData.budget,
          'Launch Timeline': formData.timeline,
          'Project Details': formData.message,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        // Fallback: trigger mailto directly so the inquiry is never missed
        window.location.href = `mailto:it@heyprince.in?subject=${encodeURIComponent(
          `Project Inquiry: ${formData.service} from ${formData.name}`
        )}&body=${encodeURIComponent(
          `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || 'N/A'}\nService: ${formData.service}\nBudget: ${formData.budget}\nTimeline: ${formData.timeline}\n\nProject Details:\n${formData.message}`
        )}`;
        setIsSubmitted(true);
      }
    } catch {
      // Fallback: trigger mailto directly
      window.location.href = `mailto:it@heyprince.in?subject=${encodeURIComponent(
        `Project Inquiry: ${formData.service} from ${formData.name}`
      )}&body=${encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || 'N/A'}\nService: ${formData.service}\nBudget: ${formData.budget}\nTimeline: ${formData.timeline}\n\nProject Details:\n${formData.message}`
      )}`;
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic WhatsApp link with prefilled project information
  const dynamicWhatsAppMessage = encodeURIComponent(
    `Hi Prince! I'm interested in working together on a project.\n\n` +
      `• Name: ${formData.name || 'Visitor'}\n` +
      `• Service: ${formData.service}\n` +
      `• Budget: ${formData.budget}\n` +
      `• Timeline: ${formData.timeline}\n` +
      (formData.message ? `• Note: ${formData.message}` : '')
  );

  const whatsAppUrl = `https://wa.me/919120900010?text=${dynamicWhatsAppMessage}`;

  return (
    <div className="contact-page-wrapper">
      <div className="container">
        {/* Navigation & Breadcrumbs */}
        <div className="contact-nav-bar">
          <button
            type="button"
            className="btn-back-home"
            onClick={onNavigateHome}
            aria-label="Back to Portfolio"
          >
            <FaArrowLeft />
            <span>Back to Portfolio</span>
          </button>

          <nav className="contact-breadcrumbs" aria-label="Breadcrumb">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
            >
              Home
            </a>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Contact</span>
          </nav>
        </div>

        {/* Hero Header */}
        <header className="contact-hero-section text-center">
          <div className="availability-badge">
            <span className="pulse-dot"></span>
            <span>Available for new projects &amp; consultations in 2026</span>
          </div>

          <h1 className="contact-main-heading">
            Let’s Build Something <br />
            <span className="text-red word">
              <span>E</span>
              <span>x</span>
              <span>t</span>
              <span>r</span>
              <span>a</span>
              <span>o</span>
              <span>r</span>
              <span>d</span>
              <span>i</span>
              <span>n</span>
              <span>a</span>
              <span>r</span>
              <span>y</span>
            </span>
          </h1>

          <p className="contact-subheading">
            Whether you need a full-scale web application, an ultra-smooth motion redesign, or expert tech
            consultation — let’s turn your vision into high-impact digital experiences.
          </p>
        </header>

        {/* Main Content Grid: Form + Info Hub */}
        <div className="contact-layout-grid">
          {/* Left Column: Interactive Project Inquiry Form */}
          <div className="contact-form-column">
            <div className="contact-card-box">
              {isSubmitted ? (
                <div className="inquiry-success-view text-center">
                  <div className="success-badge-circle">
                    <FaCircleCheck />
                  </div>
                  <h3>Message Dispatched!</h3>
                  <p className="success-desc">
                    Thank you, <strong>{formData.name}</strong>. Your project inquiry has been received. Expect a
                    personal review and reply at <strong>{formData.email}</strong> within 2 to 4 hours.
                  </p>

                  <div className="submitted-summary-box">
                    <div className="summary-row">
                      <span className="sum-label">Selected Service:</span>
                      <span className="sum-val">{formData.service}</span>
                    </div>
                    <div className="summary-row">
                      <span className="sum-label">Estimated Budget:</span>
                      <span className="sum-val">{formData.budget}</span>
                    </div>
                    <div className="summary-row">
                      <span className="sum-label">Target Timeline:</span>
                      <span className="sum-val">{formData.timeline}</span>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="portal-btn"
                      style={{ background: '#25d366', borderColor: '#25d366' }}
                    >
                      <span className="mr-right">Also Send via WhatsApp</span>
                      <span className="arrow">
                        <FaWhatsapp size={18} color="#000" />
                      </span>
                    </a>
                    <button
                      type="button"
                      className="portal-btn"
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({
                          name: '',
                          email: '',
                          phone: '',
                          service: 'Frontend React / Next.js',
                          budget: '$1,500 - $3,500',
                          timeline: '1 - 2 Months',
                          message: '',
                        });
                      }}
                    >
                      <span className="mr-right">Send Another Message</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-actual-form">
                  <div className="form-card-title-wrap">
                    <h3>Project Inquiry</h3>
                    <p>Share your vision, current challenges, and project requirements.</p>
                  </div>

                  {/* Name and Email */}
                  <div className="form-two-cols">
                    <div className="form-field-group">
                      <label className="field-label" htmlFor="clientName">
                        Your Name <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        id="clientName"
                        name="name"
                        autoComplete="name"
                        aria-required="true"
                        required
                        className="custom-input"
                        placeholder="e.g. Alex Morgan"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="form-field-group">
                      <label className="field-label" htmlFor="clientEmail">
                        Your Email <span className="req">*</span>
                      </label>
                      <input
                        type="email"
                        id="clientEmail"
                        name="email"
                        autoComplete="email"
                        aria-required="true"
                        required
                        className="custom-input"
                        placeholder="e.g. alex@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Phone / WhatsApp */}
                  <div className="form-field-group">
                    <label className="field-label" htmlFor="clientPhone">
                      Phone / WhatsApp (Optional)
                    </label>
                    <input
                      type="tel"
                      id="clientPhone"
                      name="phone"
                      autoComplete="tel"
                      className="custom-input"
                      placeholder="e.g. +1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  {/* Service Needed Selector */}
                  <div className="form-field-group">
                    <label className="field-label">What service are you looking for?</label>
                    <div className="chips-flex-wrap">
                      {SERVICE_OPTIONS.map((srv) => (
                        <button
                          key={srv}
                          type="button"
                          className={`custom-chip ${formData.service === srv ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, service: srv })}
                        >
                          {srv}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget Selector */}
                  <div className="form-field-group">
                    <label className="field-label">Estimated Budget</label>
                    <div className="chips-flex-wrap">
                      {BUDGET_OPTIONS.map((b) => (
                        <button
                          key={b}
                          type="button"
                          className={`custom-chip ${formData.budget === b ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, budget: b })}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Selector */}
                  <div className="form-field-group">
                    <label className="field-label">Target Launch Timeline</label>
                    <div className="chips-flex-wrap">
                      {TIMELINE_OPTIONS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`custom-chip ${formData.timeline === t ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, timeline: t })}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Field */}
                  <div className="form-field-group">
                    <label className="field-label" htmlFor="projectMessage">
                      Project Details &amp; Goals <span className="req">*</span>
                    </label>
                    <textarea
                      id="projectMessage"
                      name="message"
                      aria-required="true"
                      required
                      rows={4}
                      className="custom-textarea"
                      placeholder="Tell me about your goals, current challenges, reference designs, or any specific requirements..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="portal-btn w-100 justify-content-center"
                    disabled={isSubmitting}
                  >
                    <span className="mr-right">
                      {isSubmitting ? 'Transmitting Request...' : 'Send Project Inquiry'}
                    </span>
                    <span className="arrow">
                      <FaPaperPlane size={16} color="#000" />
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Direct Info Hub */}
          <div className="contact-info-column">
            {/* Direct Email Card */}
            <div className="hub-contact-card">
              <div className="card-top-header">
                <div className="hub-icon-wrap email-icon">
                  <FaEnvelope />
                </div>
                <div>
                  <h4 className="hub-card-title">Direct Email</h4>
                  <p className="hub-card-sub">Best for project specs, briefs, and RFPs</p>
                </div>
              </div>

              <div className="hub-action-row">
                <a href="mailto:it@heyprince.in" className="hub-direct-link">
                  it@heyprince.in
                </a>
                <button
                  type="button"
                  className={`btn-hub-copy ${copiedEmail ? 'copied' : ''}`}
                  onClick={handleCopyEmail}
                  title="Copy email to clipboard"
                  aria-label="Copy email"
                >
                  {copiedEmail ? <FaCheck /> : <FaCopy />}
                  <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Instant WhatsApp Card */}
            <div className="hub-contact-card">
              <div className="card-top-header">
                <div className="hub-icon-wrap whatsapp-icon">
                  <FaWhatsapp />
                </div>
                <div>
                  <h4 className="hub-card-title">Instant WhatsApp</h4>
                  <p className="hub-card-sub">Quick questions &amp; direct chat</p>
                </div>
              </div>

              <div className="hub-action-row">
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hub-direct-link"
                >
                  +91 9120900010
                </a>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-hub-chat"
                >
                  Chat &rarr;
                </a>
              </div>
            </div>

            {/* Response Time & Global Remote Cards */}
            <div className="hub-mini-cards-grid">
              <div className="mini-info-box">
                <FaClock className="mini-icon text-red" />
                <span className="mini-label">Response Time</span>
                <strong className="mini-value">&lt; 2 Hours</strong>
              </div>

              <div className="mini-info-box">
                <FaGlobe className="mini-icon text-cyan" />
                <span className="mini-label">Location</span>
                <strong className="mini-value">India (Global Remote)</strong>
              </div>
            </div>

            {/* Social Connectivity */}
            <div className="hub-social-box">
              <h5>Direct Social Channels</h5>
              <div className="social-pill-row">
                <a
                  href="https://www.linkedin.com/in/mr-goyal/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hub-social-pill linkedin"
                  aria-label="LinkedIn"
                >
                  <FaLinkedinIn />
                  <span>LinkedIn</span>
                </a>
                <a
                  href="https://www.instagram.com/heyprince.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hub-social-pill instagram"
                  aria-label="Instagram"
                >
                  <FaInstagram />
                  <span>Instagram</span>
                </a>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hub-social-pill whatsapp"
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Frequently Asked Questions */}
            <div className="hub-faq-box">
              <h5>Frequently Asked Questions</h5>
              <div className="custom-faq-list">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx} className={`faq-single-item ${isOpen ? 'active' : ''}`}>
                      <button
                        type="button"
                        className="faq-q-btn"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                      >
                        <span>{faq.q}</span>
                        <FaChevronDown className={`chevron-indicator ${isOpen ? 'rotate' : ''}`} />
                      </button>
                      {isOpen && <div className="faq-a-content">{faq.a}</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Engineering Insights Interlinking Box */}
            <div className="hub-insights-box" style={{ marginTop: '24px', padding: '24px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h5 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '14px' }}>Latest Tech Insights</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li>
                  <a href="/choose-it-services-provider/" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#d40027' }}>&bull;</span> How to Choose the Right IT Services Provider
                  </a>
                </li>
                <li>
                  <a href="/professional-website-2026/" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#d40027' }}>&bull;</span> Why Every Business Needs a Professional Website
                  </a>
                </li>
                <li>
                  <a href="/web-development-trends-2026/" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#d40027' }}>&bull;</span> Top Web Development Trends in 2026
                  </a>
                </li>
                <li>
                  <a href="/freelancing-tips-it-professionals-2026/" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#d40027' }}>&bull;</span> Essential Freelancing Tips for IT Professionals
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
