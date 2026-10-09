import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaRocket,
  FaCode,
  FaLaptopCode,
  FaBrain,
  FaMugHot,
  FaGamepad,
  FaArrowRight,
  FaLinkedinIn,
  FaInstagram,
  FaWhatsapp,
} from 'react-icons/fa6';
import { timelineMilestones } from '@/data/siteContent';

export const metadata: Metadata = {
  title: 'Unfiltered Me — About Prince | Senior Full Stack IT Consultant',
  description:
    'Get to know Prince — Senior Full Stack Engineer & IT Consultant. Behind the code: philosophy, background, engineering principles, and passion for high-speed digital products.',
  keywords: [
    'About Prince',
    'Unfiltered Me',
    'Senior IT Consultant',
    'Full Stack Engineer',
    'Next.js Specialist',
    'Prince Background',
    'HeyPrince About',
    'Web Architecture Specialist',
  ],
  alternates: {
    canonical: 'https://heyprince.in/about/',
  },
  openGraph: {
    title: 'Unfiltered Me — About Prince | Senior Full Stack IT Consultant',
    description:
      'Get to know Prince — Senior Full Stack Engineer & IT Consultant. Behind the code: philosophy, background, and engineering principles.',
    url: 'https://heyprince.in/about/',
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unfiltered Me — About Prince | Senior Full Stack IT Consultant',
    description:
      'Get to know Prince — Senior Full Stack Engineer & IT Consultant. Behind the code: philosophy, background, and engineering principles.',
  },
};

export default function AboutPage() {
  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Unfiltered Me — About Prince',
    description:
      'Personal story, technical background, and engineering philosophy of Prince, Senior Full Stack IT Consultant.',
    url: 'https://heyprince.in/about/',
    mainEntity: {
      '@type': 'Person',
      name: 'Prince',
      jobTitle: 'Senior Full Stack Engineer & IT Consultant',
      url: 'https://heyprince.in/',
      image: 'https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/1791537029941-author.jpg',
      sameAs: [
        'https://www.linkedin.com/in/mr-goyal/',
        'https://www.instagram.com/heyprince.in/',
        'https://wa.me/919120900010',
      ],
    },
  };

  return (
    <div className="page-view-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      <article className="single-service-view" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
        <div className="container">
          {/* Top Navigation & Breadcrumb */}
          <div className="blog-header-nav">
            <Link href="/" className="btn-back-home" aria-label="Back to Home">
              <FaArrowLeft />
              <span>Back to Home</span>
            </Link>

            <nav className="blog-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Unfiltered Me</span>
            </nav>
          </div>

          {/* Hero Header */}
          <header className="service-hero-content text-center mb-5">
            <div className="featured-service-pill">
              <span className="live-pulse-dot"></span>
              <span>BEHIND THE CODE // UNFILTERED STORY</span>
            </div>

            <div className="service-category-tag">Senior Full Stack Engineer &amp; IT Consultant</div>

            <h1 className="service-main-title">
              Code, Curiosity &amp;{' '}
              <span className="word text-red" suppressHydrationWarning>
                <span suppressHydrationWarning>C</span>
                <span suppressHydrationWarning>o</span>
                <span suppressHydrationWarning>f</span>
                <span suppressHydrationWarning>f</span>
                <span suppressHydrationWarning>e</span>
                <span suppressHydrationWarning>e</span>
              </span>
            </h1>

            <p className="service-tagline-lead" style={{ maxWidth: '820px' }}>
              I’m not here to sound corporate — I’m here to build software that works. I engineer high-speed web apps, eliminate digital bottlenecks, and obsess over performance. Some days it’s clean architectural design... some days it’s just coffee and sheer determination 😄
            </p>
          </header>

          {/* Core Personas Section */}
          <div className="row g-4 justify-content-center mb-5">
            <div className="col-md-4 col-12 d-flex">
              <div
                className="w-100 p-4"
                style={{
                  background: '#0e1017',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(212, 0, 39, 0.15)',
                    color: '#d40027',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '18px',
                  }}
                >
                  <FaLaptopCode size={24} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                  Gadget Hoarder
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6, margin: 0 }}>
                  Fascinated by computing hardware, tactile mechanical setups, high-refresh displays, and testing developer tools to their limits.
                </p>
              </div>
            </div>

            <div className="col-md-4 col-12 d-flex">
              <div
                className="w-100 p-4"
                style={{
                  background: 'radial-gradient(circle at top right, #1b2030 0%, #0d0f15 100%)',
                  border: '1.5px solid rgba(0, 242, 254, 0.45)',
                  borderRadius: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 8px 30px rgba(0, 242, 254, 0.12)',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(0, 242, 254, 0.15)',
                    color: '#00f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '18px',
                  }}
                >
                  <FaCode size={24} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                  Code Whisperer
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6, margin: 0 }}>
                  Translating complex enterprise requirements into clean, scalable TypeScript, React, Next.js, and server-side systems that load in sub-seconds.
                </p>
              </div>
            </div>

            <div className="col-md-4 col-12 d-flex">
              <div
                className="w-100 p-4"
                style={{
                  background: '#0e1017',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(212, 0, 39, 0.15)',
                    color: '#d40027',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '18px',
                  }}
                >
                  <FaBrain size={24} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                  AI Dreamer
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6, margin: 0 }}>
                  Pioneering autonomous multi-agent systems, deterministic LLM reasoning chains, and smart data automations that save hundreds of engineering hours.
                </p>
              </div>
            </div>
          </div>

          {/* Deep Dive Philosophy Section */}
          <div
            className="p-md-5 p-4 my-5"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
            }}
          >
            <div className="row align-items-center g-4">
              <div className="col-lg-6">
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#d40027',
                    fontWeight: 700,
                    fontSize: '12px',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                  }}
                >
                  <FaMugHot />
                  <span>The Engineering Code</span>
                </div>
                <h2
                  style={{
                    fontSize: 'clamp(28px, 4vw, 42px)',
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: 1.25,
                    marginBottom: '20px',
                  }}
                >
                  If (awake) → &#123; <br />
                  &nbsp;&nbsp;code(); <br />
                  &#125; else &#123; <br />
                  &nbsp;&nbsp;coffee(); <br />
                  &#125;
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.7, fontSize: '15px' }}>
                  I bridge the gap between creative visual design and scalable engineering architecture. Every line of code is structured for sub-second performance, rock-solid security, and measurable ROI. Whether launching a custom React/Next.js application, scaling a WordPress platform, or deploying automated AI workflows — I build digital products designed to win.
                </p>
              </div>

              <div className="col-lg-6">
                <div
                  style={{
                    background: '#090a0f',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '28px',
                  }}
                >
                  <h4 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>
                    What Sets My Approach Apart:
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li className="d-flex align-items-start gap-3 mb-3">
                      <span style={{ color: '#d40027', fontWeight: 800, fontSize: '16px' }}>✓</span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', lineHeight: 1.6 }}>
                        <strong>Zero Template Bloat:</strong> Hand-crafted architectures engineered specifically for your business goals without drag-and-drop baggage.
                      </span>
                    </li>
                    <li className="d-flex align-items-start gap-3 mb-3">
                      <span style={{ color: '#d40027', fontWeight: 800, fontSize: '16px' }}>✓</span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', lineHeight: 1.6 }}>
                        <strong>Sub-Second Speed:</strong> Core Web Vitals 95+ scores optimized through server-side rendering, asset compression, and clean DOM trees.
                      </span>
                    </li>
                    <li className="d-flex align-items-start gap-3 mb-3">
                      <span style={{ color: '#d40027', fontWeight: 800, fontSize: '16px' }}>✓</span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', lineHeight: 1.6 }}>
                        <strong>Async Transparency:</strong> Flexible overlapping hours across US, European, and Australian timezones with clear, direct communication.
                      </span>
                    </li>
                    <li className="d-flex align-items-start gap-3">
                      <span style={{ color: '#d40027', fontWeight: 800, fontSize: '16px' }}>✓</span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', lineHeight: 1.6 }}>
                        <strong>Tactile Interactions:</strong> Engaging physics-based animations, micro-interactions, and game logic that keep users immersed.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Milestones Preview */}
          <div className="my-5">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    color: '#d40027',
                    textTransform: 'uppercase',
                  }}
                >
                  From Spark to Senior Consultant
                </span>
                <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Career Milestones At A Glance
                </h3>
              </div>
              <Link href="/#journey" className="btn-back-home">
                <span>View Full Journey Timeline</span>
                <FaArrowRight size={13} />
              </Link>
            </div>

            <div className="row g-3">
              {timelineMilestones.slice(-4).map((m) => (
                <div key={m.pos} className="col-lg-3 col-sm-6 col-12">
                  <div
                    style={{
                      background: '#0d0f15',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '22px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '24px',
                        fontFamily: 'Futuru, sans-serif',
                        fontWeight: 900,
                        color: '#d40027',
                        marginBottom: '8px',
                        display: 'block',
                      }}
                    >
                      {m.year}
                    </span>
                    <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5, margin: 0 }}>
                      {m.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cyber Arcade Teaser */}
          <div
            className="p-4 my-5 d-flex align-items-center justify-content-between flex-wrap gap-3"
            style={{
              background: 'radial-gradient(circle at left, rgba(0, 242, 254, 0.1) 0%, rgba(13, 15, 21, 0.9) 100%)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              borderRadius: '16px',
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(0, 242, 254, 0.15)',
                  color: '#00f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FaGamepad size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Need a brain workout?
                </h4>
                <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', margin: 0 }}>
                  Jump into Cyber Arcade to squash bugs or solve the Cyber Sudoku matrix.
                </p>
              </div>
            </div>
            <Link href="/#arcade" className="btn-back-home" style={{ borderColor: 'rgba(0, 242, 254, 0.4)', color: '#00f2fe' }}>
              <span>Play Cyber Arcade 🎮</span>
            </Link>
          </div>

          {/* Direct Connect & Socials */}
          <div className="text-center mt-5 pt-3">
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
              Let’s Connect &amp; Build Something Legendary
            </h2>
            <p style={{ maxWidth: '600px', margin: '0 auto 28px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Got an engineering dilemma, custom project concept, or just want to geek out over tech? Reach out directly.
            </p>

            <div className="d-flex justify-content-center gap-3 mb-4">
              <a
                href="https://www.linkedin.com/in/mr-goyal/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link-icon linkedin"
                aria-label="LinkedIn"
                style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.06)', color: '#fff' }}
              >
                <FaLinkedinIn size={18} />
              </a>
              <a
                href="https://www.instagram.com/heyprince.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link-icon instagram"
                aria-label="Instagram"
                style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.06)', color: '#fff' }}
              >
                <FaInstagram size={18} />
              </a>
              <a
                href="https://wa.me/919120900010"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link-icon whatsapp"
                aria-label="WhatsApp"
                style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.06)', color: '#fff' }}
              >
                <FaWhatsapp size={18} />
              </a>
            </div>

            <Link className="portal-btn mx-auto" href="/contact/">
              <span className="mr-right">Drop Me A Line</span>
              <span className="arrow">
                <FaRocket size={18} color="#000" />
              </span>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

