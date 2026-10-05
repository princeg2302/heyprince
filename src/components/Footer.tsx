'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaLinkedinIn, FaInstagram, FaWhatsapp, FaBolt } from 'react-icons/fa6';
import { servicesList } from '../data/servicesData';

export interface FooterProps {
  onNavigateService?: (slug: string) => void;
  onNavigateContact?: () => void;
  onNavigatePrivacy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateService,
  onNavigatePrivacy,
}) => {
  const router = useRouter();

  const handleServiceClick = (slug: string, e?: React.MouseEvent) => {
    if (onNavigateService) {
      if (e) e.preventDefault();
      onNavigateService(slug);
    } else {
      router.push(`/services/${slug}/`);
    }
  };

  const handlePrivacyClick = (e?: React.MouseEvent) => {
    if (onNavigatePrivacy) {
      if (e) e.preventDefault();
      onNavigatePrivacy();
    } else {
      router.push('/privacy-policy/');
    }
  };

  return (
    <footer id="footer" className="footer-main">
      <div className="footer-content">
        <div className="container">
          <h2>
            Caffeine + Code = <span className="text-red">Catch up?</span>
          </h2>
          <a href="mailto:it@heyprince.in" className="footer-mailto">
            it@heyprince.in
          </a>
          <div className="footer-row justify-content-end row">
            <div className="col-md-8">
              <img
                className="cards-indicator d-none d-md-block"
                src="https://heyprince.in/wp-content/uploads/2025/02/card-indicate.png"
                alt="Interactive service cards indicator"
                loading="lazy"
                decoding="async"
                width="170"
                height="80"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="mobile-cards-hint d-md-none">
                <span>← Swipe cards to explore services →</span>
              </div>

              {/* 7 Interactive Stacked Service Cards (Exact IDs mapped with CSS) */}
              <div className="footer-cards-container" id="services">
                {servicesList.map((service, index) => {
                  const cardId = `footer-card-${index + 1}`;
                  const themeClass =
                    service.cardTheme === 'featured'
                      ? 'card-featured'
                      : service.cardTheme === 'white'
                      ? 'card-white'
                      : service.cardTheme === 'red'
                      ? 'card-red'
                      : 'card-black';

                  return (
                    <div
                      key={service.id}
                      className={`footer-card ${themeClass}`}
                      id={cardId}
                      onClick={() => handleServiceClick(service.slug)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleServiceClick(service.slug);
                        }
                      }}
                      title={`Explore ${service.title} Details`}
                    >
                      {service.isFeatured && (
                        <span className="card-featured-pill">
                          <FaBolt size={10} /> FEATURED // AI AUTOMATIONS
                        </span>
                      )}
                      <div className="card-heading">
                        <span className="card-category-tag">{service.category}</span>
                        <h3>{service.title}</h3>
                        <p className="card-author">Prince</p>
                      </div>
                      <Link
                        className="card-btn"
                        href={`/services/${service.slug}/`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServiceClick(service.slug, e);
                        }}
                      >
                        Explore Service
                        <svg
                          className="card-btn-icn"
                          width="40"
                          height="40"
                          viewBox="0 0 40 40"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="20" cy="20" r="20" fill="white"></circle>
                          <path
                            d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                            fill="#000"
                          ></path>
                        </svg>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="col-lg-3 col-md-4 footer-col-social">
              <div className="social-links">
                <a
                  href="https://www.linkedin.com/in/mr-goyal/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="social-link-icon"
                >
                  <FaLinkedinIn size={24} color="#fff" />
                </a>
                <a
                  href="https://www.instagram.com/heyprince.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="social-link-icon"
                >
                  <FaInstagram size={24} color="#fff" />
                </a>
                <a
                  href="https://wa.me/919120900010"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="social-link-icon"
                >
                  <FaWhatsapp size={24} color="#fff" />
                </a>
              </div>
              <div className="foot-copyright-wrap">
                <p className="foot-copyright">
                  &copy; 2026{' '}
                  <a
                    href="https://www.heyprince.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="foot-brand-link"
                  >
                    heyprince.in
                  </a>
                  <span className="foot-sep">&nbsp;&bull;&nbsp;</span>
                  <span>All Rights Reserved</span>
                </p>
                <div className="foot-legal-links">
                  <Link
                    href="/privacy-policy/"
                    className="foot-legal-link"
                    onClick={(e) => handlePrivacyClick(e)}
                  >
                    Privacy Policy
                  </Link>
                  <span className="foot-sep">&bull;</span>
                  <button
                    type="button"
                    className="foot-cookie-trigger-btn"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('open_cookie_preferences'));
                      }
                    }}
                  >
                    Cookies
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

