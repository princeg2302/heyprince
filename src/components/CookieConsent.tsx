import React, { useState, useEffect } from 'react';
import {
  FaXmark,
  FaChevronDown,
  FaChevronRight,
  FaCookieBite,
  FaShieldHalved,
} from 'react-icons/fa6';

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  performance: boolean;
  advertisement: boolean;
  uncategorised: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  performance: false,
  advertisement: false,
  uncategorised: false,
};

const ALL_ACCEPTED_PREFERENCES: CookiePreferences = {
  necessary: true,
  functional: true,
  analytics: true,
  performance: true,
  advertisement: true,
  uncategorised: true,
};

const STORAGE_KEY = 'heyprince_cookie_consent_v1';

export interface CookieConsentProps {
  onOpenPrivacyPolicy?: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onOpenPrivacyPolicy }) => {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showMoreIntro, setShowMoreIntro] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    necessary: false,
    functional: false,
    analytics: false,
    performance: false,
    advertisement: false,
    uncategorised: false,
  });

  // On mount: check if consent already stored
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed.preferences, necessary: true });
        setBannerVisible(false);
      } else {
        // Small delay so entrance animation is smooth
        const timer = setTimeout(() => {
          setBannerVisible(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      setBannerVisible(true);
    }
  }, []);

  // Listen for global custom event to open preferences from Footer or Privacy Policy
  useEffect(() => {
    const handleOpenCustomise = () => {
      setModalOpen(true);
      setBannerVisible(false);
    };

    window.addEventListener('open_cookie_preferences', handleOpenCustomise);
    return () => {
      window.removeEventListener('open_cookie_preferences', handleOpenCustomise);
    };
  }, []);

  const saveToStorage = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          preferences: prefs,
          timestamp: new Date().toISOString(),
        })
      );
    } catch {
      // Storage safety fallback
    }
  };

  const handleAcceptAll = () => {
    setPreferences(ALL_ACCEPTED_PREFERENCES);
    saveToStorage(ALL_ACCEPTED_PREFERENCES);
    setBannerVisible(false);
    setModalOpen(false);
  };

  const handleRejectAll = () => {
    setPreferences(DEFAULT_PREFERENCES);
    saveToStorage(DEFAULT_PREFERENCES);
    setBannerVisible(false);
    setModalOpen(false);
  };

  const handleSavePreferences = () => {
    const finalPrefs = { ...preferences, necessary: true };
    setPreferences(finalPrefs);
    saveToStorage(finalPrefs);
    setModalOpen(false);
    setBannerVisible(false);
  };

  const toggleCategoryExpand = (catKey: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  const handleTogglePreference = (catKey: keyof CookiePreferences) => {
    if (catKey === 'necessary') return; // Always active
    setPreferences((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  const categories = [
    {
      key: 'necessary' as const,
      title: 'Necessary',
      alwaysActive: true,
      desc: 'Necessary cookies are required to enable the basic features of this site, such as providing secure log-in or adjusting your consent preferences. These cookies do not store any personally identifiable data.',
    },
    {
      key: 'functional' as const,
      title: 'Functional',
      alwaysActive: false,
      desc: 'Functional cookies help perform certain functionalities like sharing the content of the website on social media platforms, collecting feedback, and other third-party features.',
    },
    {
      key: 'analytics' as const,
      title: 'Analytics',
      alwaysActive: false,
      desc: 'Analytical cookies are used to understand how visitors interact with the website. These cookies help provide information on metrics such as the number of visitors, bounce rate, traffic source, etc.',
    },
    {
      key: 'performance' as const,
      title: 'Performance',
      alwaysActive: false,
      desc: 'Performance cookies are used to understand and analyse the key performance indexes of the website which helps in delivering a better user experience for the visitors.',
    },
    {
      key: 'advertisement' as const,
      title: 'Advertisement',
      alwaysActive: false,
      desc: 'Advertisement cookies are used to provide visitors with customised advertisements based on the pages you visited previously and to analyse the effectiveness of the ad campaigns.',
    },
    {
      key: 'uncategorised' as const,
      title: 'Uncategorised',
      alwaysActive: false,
      desc: 'Other uncategorised cookies are those that are being analysed and have not been classified into a category as yet.',
    },
  ];

  return (
    <>
      {/* 1. INITIAL FLOATING COOKIE CONSENT BANNER (Reference: media_1791190499787.png) */}
      {bannerVisible && !modalOpen && (
        <div className="cookie-banner-overlay" role="region" aria-label="Cookie consent banner">
          <div className="cookie-banner-box">
            <h3 className="cookie-banner-title">We value your privacy</h3>
            <p className="cookie-banner-text">
              We use cookies to enhance your browsing experience, serve personalised ads or content,
              and analyse our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
            </p>

            <div className="cookie-banner-actions">
              <button
                type="button"
                className="btn-cookie-customise"
                onClick={() => setModalOpen(true)}
              >
                Customise
              </button>
              <button
                type="button"
                className="btn-cookie-reject"
                onClick={handleRejectAll}
              >
                Reject All
              </button>
              <button
                type="button"
                className="btn-cookie-accept"
                onClick={handleAcceptAll}
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CUSTOMISE CONSENT PREFERENCES MODAL (Reference: media_1791190557040.png) */}
      {modalOpen && (
        <div
          className="cookie-modal-backdrop"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
        >
          <div
            className="cookie-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="cookie-modal-header">
              <h3 id="cookie-modal-title" className="cookie-modal-heading">
                Customise Consent Preferences
              </h3>
              <button
                type="button"
                className="cookie-modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Close preferences"
              >
                <FaXmark size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="cookie-modal-body">
              <p className="cookie-modal-intro">
                We use cookies to help you navigate efficiently and perform certain functions. You will find detailed information about all cookies under each consent category below.
              </p>
              <p className="cookie-modal-intro-secondary">
                The cookies that are categorised as &quot;Necessary&quot; are stored on your browser as they are essential for enabling the basic functionalities of the site.
                {!showMoreIntro && (
                  <button
                    type="button"
                    className="btn-cookie-show-more"
                    onClick={() => setShowMoreIntro(true)}
                  >
                    ... Show more
                  </button>
                )}
              </p>

              {showMoreIntro && (
                <p className="cookie-modal-intro-expanded">
                  We also use third-party cookies that help us analyze how you use this website, store your preferences, and provide content and advertisements that are relevant to you. These cookies will only be stored in your browser with your prior consent. You can choose to enable or disable some or all of these cookies, but disabling some of them may affect your browsing experience.
                  {onOpenPrivacyPolicy && (
                    <button
                      type="button"
                      className="cookie-privacy-link-btn"
                      onClick={() => {
                        setModalOpen(false);
                        onOpenPrivacyPolicy();
                      }}
                    >
                      Read full Privacy Policy.
                    </button>
                  )}
                </p>
              )}

              {/* Categories Accordion List */}
              <div className="cookie-categories-list">
                {categories.map((cat) => {
                  const isExpanded = expandedCategories[cat.key];
                  const isChecked = preferences[cat.key];

                  return (
                    <div key={cat.key} className="cookie-category-item">
                      <div className="cookie-category-header">
                        <button
                          type="button"
                          className="cookie-category-toggle-btn"
                          onClick={() => toggleCategoryExpand(cat.key)}
                          aria-expanded={isExpanded}
                        >
                          <span className="category-arrow">
                            {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                          </span>
                          <span className="category-title">{cat.title}</span>
                        </button>

                        <div className="cookie-category-control">
                          {cat.alwaysActive ? (
                            <span className="badge-always-active">Always Active</span>
                          ) : (
                            <label className="cookie-switch" aria-label={`Toggle ${cat.title} cookies`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePreference(cat.key)}
                              />
                              <span className="cookie-slider"></span>
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Expandable Description */}
                      <div className={`cookie-category-desc ${isExpanded ? 'open' : ''}`}>
                        <p>{cat.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="cookie-modal-footer">
              <div className="cookie-footer-buttons">
                <button
                  type="button"
                  className="btn-modal-reject"
                  onClick={handleRejectAll}
                >
                  Reject All
                </button>
                <button
                  type="button"
                  className="btn-modal-save"
                  onClick={handleSavePreferences}
                >
                  Save My Preferences
                </button>
                <button
                  type="button"
                  className="btn-modal-accept"
                  onClick={handleAcceptAll}
                >
                  Accept All
                </button>
              </div>

              <div className="cookie-modal-brand">
                <span>Powered by</span>
                <strong>heyprince.in</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discreet floating Cookie Badge to re-open preferences at any time */}
      {!bannerVisible && !modalOpen && (
        <button
          type="button"
          className="cookie-floating-trigger"
          onClick={() => setModalOpen(true)}
          title="Manage Cookie Preferences"
          aria-label="Manage Cookie Preferences"
        >
          <FaCookieBite size={18} />
          <span className="floating-trigger-tooltip">Cookies</span>
        </button>
      )}
    </>
  );
};

export default CookieConsent;

