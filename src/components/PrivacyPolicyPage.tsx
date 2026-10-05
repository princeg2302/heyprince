import React, { useLayoutEffect, useRef, useEffect } from 'react';
import {
  FaArrowLeft,
  FaShieldHalved,
  FaCookieBite,
  FaLock,
  FaUserShield,
  FaEnvelope,
  FaWhatsapp,
  FaArrowRight,
} from 'react-icons/fa6';

export interface PrivacyPolicyPageProps {
  onNavigateHome: () => void;
  onNavigateContact?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  onNavigateHome,
  onNavigateContact,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Scroll to top instantly on mount
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Top reading progress bar
  useEffect(() => {
    let ticking = false;
    const updateProgress = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const progress = total > 0 ? window.scrollY / total : 0;
      const clamped = Math.min(1, Math.max(0, progress));
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${clamped})`;
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    updateProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const openCookieModal = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open_cookie_preferences'));
    }
  };

  return (
    <article className="single-privacy-page">
      {/* Top Reading Progress Bar */}
      <div ref={progressBarRef} className="reading-progress-bar" aria-hidden="true" />

      {/* Hero Header */}
      <header className="privacy-hero-section">
        <div className="container">
          <nav className="blog-breadcrumb" aria-label="Breadcrumb">
            <button
              type="button"
              onClick={onNavigateHome}
              className="breadcrumb-btn"
            >
              Home
            </button>
            <span className="breadcrumb-sep">&gt;</span>
            <span className="breadcrumb-current">Privacy Policy</span>
          </nav>

          <div className="privacy-hero-content text-center">
            <div className="privacy-badge">
              <FaShieldHalved size={14} />
              <span>Data Protection &amp; Transparency</span>
            </div>
            <h1 className="privacy-title">Privacy Policy</h1>
            <p className="privacy-subtitle">
              Learn how Prince (HeyPrince) protects your personal information, manages analytical data,
              and honors your consent preferences.
            </p>
            <div className="privacy-meta-badge">
              <span>Last Updated: October 2026</span>
              <span className="meta-sep">&bull;</span>
              <span>Effective Globally</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Privacy Content Body */}
      <div className="privacy-body-container container">
        <div className="privacy-grid-layout">
          {/* Main Document Content */}
          <main className="privacy-content-main">
            {/* Quick Summary Card */}
            <div className="privacy-summary-card">
              <div className="summary-icon">
                <FaLock size={24} color="#00ff88" />
              </div>
              <div className="summary-text">
                <h3>Our Core Privacy Commitment</h3>
                <p>
                  We believe in total transparency and zero intrusive data brokers. We collect only what is strictly necessary to communicate with you about your web engineering projects and improve site performance. We never sell, rent, or trade your personal data.
                </p>
              </div>
            </div>

            {/* Section 1 */}
            <section id="section-overview" className="privacy-section">
              <h2>1. Introduction &amp; Scope</h2>
              <p>
                This Privacy Policy explains how <strong>Prince</strong> (&quot;HeyPrince&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operating via <strong>heyprince.in</strong>, collects, processes, stores, and protects personal information when you visit our website, use our interactive tools, or engage our senior IT consulting and full-stack software development services.
              </p>
              <p>
                By accessing or using <strong>heyprince.in</strong>, you acknowledge that you have read and understood the practices described in this policy. If you have questions, you may contact us anytime at <a href="mailto:it@heyprince.in" className="privacy-link">it@heyprince.in</a>.
              </p>
            </section>

            {/* Section 2 */}
            <section id="section-info-we-collect" className="privacy-section">
              <h2>2. Information We Collect</h2>
              <p>We collect information in two primary ways:</p>

              <div className="privacy-info-block">
                <h4>A. Information You Voluntarily Provide</h4>
                <ul>
                  <li>
                    <strong>Contact &amp; Inquiry Details:</strong> When you submit our contact form, request a project scope, or message us via WhatsApp/Email, we collect your name, email address, phone/WhatsApp number, company name, and project requirements.
                  </li>
                  <li>
                    <strong>Consultation Notes:</strong> Technical project briefs, design assets, and architectural requirements shared during exploratory meetings.
                  </li>
                </ul>
              </div>

              <div className="privacy-info-block">
                <h4>B. Information Collected Automatically</h4>
                <ul>
                  <li>
                    <strong>Device &amp; Telemetry Data:</strong> Browser user agent, screen resolution, operating system, language settings, and general approximate geographic location (city/country level).
                  </li>
                  <li>
                    <strong>Usage &amp; Interaction Data:</strong> Pages visited, time spent on interactive sections (such as our Cyber Arcade and services catalog), Core Web Vitals (LCP, CLS, INP), and referral URLs.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section id="section-cookies" className="privacy-section">
              <h2>3. Cookies &amp; Consent Management</h2>
              <p>
                We use cookies and similar browser storage mechanisms to help you navigate efficiently and perform certain functions. Detailed information about all cookies used across our services is categorized below:
              </p>

              <div className="cookie-category-box">
                <h4>Cookie Consent Categories</h4>
                <ul>
                  <li>
                    <strong>Necessary Cookies (Always Active):</strong> Essential for core site functionalities, security verification, and persisting your cookie consent settings. They do not store personally identifiable information.
                  </li>
                  <li>
                    <strong>Functional Cookies:</strong> Enable enhanced features like social sharing, user preferences, and interactive UI widgets.
                  </li>
                  <li>
                    <strong>Analytics Cookies:</strong> Help us measure website traffic, bounce rates, popular content, and navigational paths to optimize technical architecture.
                  </li>
                  <li>
                    <strong>Performance Cookies:</strong> Track Core Web Vitals, script execution speed, and latency indices to ensure high-speed user experiences.
                  </li>
                  <li>
                    <strong>Advertisement Cookies:</strong> Used to evaluate campaign reach and measure visitor engagement with featured offerings.
                  </li>
                  <li>
                    <strong>Uncategorised Cookies:</strong> Cookies that are undergoing active classification and analysis.
                  </li>
                </ul>

                <div className="cookie-cta-row">
                  <button
                    type="button"
                    className="portal-btn"
                    onClick={openCookieModal}
                  >
                    <span className="mr-right">Manage Cookie Preferences</span>
                    <span className="arrow">
                      <FaCookieBite size={18} color="#000" />
                    </span>
                  </button>
                  <span className="cookie-cta-note">
                    You can adjust or withdraw consent at any time.
                  </span>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="section-usage" className="privacy-section">
              <h2>4. How We Use Your Information</h2>
              <p>Your information is used strictly for legitimate business and engineering purposes:</p>
              <ul>
                <li>To review your technical requirements, prepare estimates, and deliver custom full-stack solutions.</li>
                <li>To provide ongoing IT consulting, API integrations, and software maintenance.</li>
                <li>To optimize website performance, fix technical bugs, and harden cybersecurity protections.</li>
                <li>To comply with applicable legal obligations, invoicing regulations, and client service agreements.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="section-third-parties" className="privacy-section">
              <h2>5. Third-Party Services &amp; Infrastructure</h2>
              <p>
                We do not sell personal data to third parties. We may share information with trusted infrastructure providers solely to host and operate our services:
              </p>
              <ul>
                <li><strong>Hosting &amp; CDN:</strong> GitHub Pages / Cloudflare edge networks for resilient, fast content delivery.</li>
                <li><strong>Analytics:</strong> Anonymized Google Analytics (with IP masking enabled).</li>
                <li><strong>Communication:</strong> WhatsApp Business API and secure email servers for client communications.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="section-rights" className="privacy-section">
              <h2>6. Your Data Rights (GDPR, CCPA &amp; DPDP)</h2>
              <p>Depending on your jurisdiction, you have the following rights regarding your personal information:</p>
              <ul>
                <li><strong>Right of Access:</strong> Request a copy of the personal information we hold about you.</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
                <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your personal records.</li>
                <li><strong>Right to Restrict or Object:</strong> Object to specific data processing activities or withdraw previously given consent.</li>
              </ul>
              <p>
                To exercise any of these rights, contact us at <a href="mailto:it@heyprince.in" className="privacy-link">it@heyprince.in</a>. We respond to all verified requests within 30 days.
              </p>
            </section>

            {/* Section 7 */}
            <section id="section-contact" className="privacy-section">
              <h2>7. Contact Information</h2>
              <p>
                If you have questions, feedback, or concerns regarding this Privacy Policy or our data protection measures, please reach out directly:
              </p>

              <div className="contact-card-inline">
                <h4>Prince — HeyPrince IT Consulting</h4>
                <p>Email: <a href="mailto:it@heyprince.in" className="privacy-link">it@heyprince.in</a></p>
                <p>Website: <a href="https://heyprince.in" className="privacy-link">heyprince.in</a></p>
                <div className="d-flex flex-wrap gap-3 mt-3">
                  <button
                    type="button"
                    className="portal-btn"
                    onClick={() => {
                      if (onNavigateContact) onNavigateContact();
                      else onNavigateHome();
                    }}
                  >
                    <span className="mr-right">Contact Form</span>
                    <span className="arrow">
                      <FaArrowRight size={16} color="#000" />
                    </span>
                  </button>
                  <a
                    href="https://wa.me/919120900010"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portal-btn"
                    style={{ background: '#25d366', borderColor: '#25d366' }}
                  >
                    <span className="mr-right">WhatsApp</span>
                    <span className="arrow">
                      <FaWhatsapp size={16} color="#000" />
                    </span>
                  </a>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </article>
  );
};

export default PrivacyPolicyPage;
