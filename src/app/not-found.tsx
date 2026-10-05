import Link from 'next/link';
import React from 'react';

export const metadata = {
  title: '404 — Page Not Found | HeyPrince',
  description: 'The page you are looking for does not exist or has been moved.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <section className="not-found-section" style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '120px 20px',
      position: 'relative',
    }}>
      <div className="container">
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '999px',
              border: '1px solid rgba(212, 0, 39, 0.4)',
              background: 'rgba(212, 0, 39, 0.12)',
              color: '#d40027',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '20px',
            }}
          >
            404 // ROUTE NOT FOUND
          </span>

          <h1
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(70px, 14vw, 140px)',
              lineHeight: 0.95,
              color: '#fff',
              margin: '0 0 20px 0',
              letterSpacing: '-1px',
            }}
          >
            LOST IN <span style={{ color: '#d40027' }}>SPACE</span>
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: '#a0a0a8',
              lineHeight: 1.6,
              marginBottom: '36px',
            }}
          >
            The digital coordinates you requested don&apos;t exist or have been redirected to a newer architecture. Let&apos;s get you back on track.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/"
              className="portal-btn"
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              <span className="mr-right">Return to Base</span>
              <span className="arrow">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="20" fill="white" />
                  <path
                    d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                    fill="#000"
                  />
                </svg>
              </span>
            </Link>

            <Link
              href="/contact"
              className="portal-btn"
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              <span className="mr-right">Contact Prince</span>
              <span className="arrow">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="20" fill="white" />
                  <path
                    d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                    fill="#000"
                  />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
