import React, { useState, useEffect, useRef } from 'react';
import {
  Preloader,
  CustomCursor,
  Header,
  HeroBanner,
  VisionAmbition,
  JourneyTimeline,
  CyberArcade,
  ArticlesSection,
  LetsTalkBanner,
  CapturedMemories,
  SingleBlogPage,
  ContactPage,
  Footer,
} from './components';
import { useWordAnimation } from './hooks/useWordAnimation';

const parseRouteFromHash = (rawHash: string): { page: 'home' | 'contact' | 'blog'; slug: string } => {
  const hash = (rawHash || '').trim();
  const path = hash.replace(/^#\/?/, '').replace(/\/+$/, '');

  if (path === 'contact') {
    return { page: 'contact', slug: '' };
  }
  if (path.startsWith('blog/') || path === 'blog') {
    const slug = path.replace(/^blog\/?/, '').trim();
    return { page: 'blog', slug: slug || 'freelancing-tips-it-professionals-2026' };
  }
  return { page: 'home', slug: '' };
};

export const App: React.FC = () => {
  // Activate animated letter cycles for all .word titles
  useWordAnimation();

  // Disable browser automatic scroll restoration to avoid stuck positions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  const [route, setRoute] = useState<{
    page: 'home' | 'contact' | 'blog';
    slug: string;
  }>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    return parseRouteFromHash(hash);
  });

  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseRouteFromHash(window.location.hash);
      setRoute(parsed);

      if (parsed.page === 'contact' || parsed.page === 'blog') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      } else {
        const rawHash = window.location.hash || '';
        const targetId = rawHash.replace(/^#\/?/, '').replace(/\/+$/, '');
        if (!targetId || targetId === 'home') {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        } else {
          // Section anchor like #articles, #about, #timeline, #memories, #arcade
          setTimeout(() => {
            const el = document.getElementById(targetId);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }, 80);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page: 'home' | 'contact' | 'blog', sectionId?: string) => {
    if (page === 'contact') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.location.hash = '#/contact';
    } else if (page === 'blog') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.location.hash = `#/blog/${sectionId || 'freelancing-tips-it-professionals-2026'}`;
    } else {
      if (sectionId && sectionId !== 'home') {
        if (route.page !== 'home') {
          setRoute({ page: 'home', slug: '' });
          setTimeout(() => {
            const el = document.getElementById(sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 120);
        } else {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
        window.location.hash = `#${sectionId}`;
      } else {
        window.location.hash = '#/';
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    }
  };

  const progressBarRef = useRef<HTMLDivElement>(null);

  // High-performance GPU-accelerated scroll progress tracking (Zero root re-renders)
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
  }, [route.page]);

  return (
    <div id="wrapper">
      <CustomCursor />
      <Preloader />
      {/* Top Scroll Progress Bar for Home Page */}
      {route.page === 'home' && (
        <div
          ref={progressBarRef}
          className="reading-progress-bar"
          aria-hidden="true"
        />
      )}
      <Header onNavigate={handleNavigate} />
      <main id="main" className="main-content">
        {route.page === 'home' && (
          <>
            <HeroBanner />
            <VisionAmbition />
            <JourneyTimeline />
            <CyberArcade />
            <ArticlesSection
              onSelectArticle={(slug) => {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                window.location.hash = `#/blog/${slug}`;
              }}
            />
            <LetsTalkBanner />
            <CapturedMemories />
          </>
        )}

        {route.page === 'blog' && (
          <SingleBlogPage
            slug={route.slug}
            onNavigateHome={() => {
              handleNavigate('home');
            }}
            onNavigateArticles={() => {
              handleNavigate('home', 'articles');
            }}
            onSelectArticle={(newSlug) => {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              window.location.hash = `#/blog/${newSlug}`;
            }}
          />
        )}

        {route.page === 'contact' && (
          <ContactPage
            onNavigateHome={() => {
              handleNavigate('home');
            }}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
