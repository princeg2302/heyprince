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
import { articlesList } from './data/siteContent';

export interface RouteState {
  page: 'home' | 'contact' | 'blog';
  slug: string;
}

export const resolveRoute = (): RouteState => {
  if (typeof window === 'undefined') {
    return { page: 'home', slug: '' };
  }

  // 1. Clean pathname (e.g. "/choose-it-services-provider/" -> "choose-it-services-provider")
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();

  // 2. Clean hash (e.g. "#/contact" or "#contact" -> "contact")
  const hash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '').toLowerCase();

  // Contact checks
  if (path === 'contact' || hash === 'contact') {
    return { page: 'contact', slug: '' };
  }

  // Blog prefixed paths (e.g. /blog/choose-it-services-provider/)
  if (path.startsWith('blog/') || path === 'blog') {
    const slug = path.replace(/^blog\/?/, '').trim();
    return { page: 'blog', slug: slug || 'freelancing-tips-it-professionals-2026' };
  }
  if (hash.startsWith('blog/') || hash === 'blog') {
    const slug = hash.replace(/^blog\/?/, '').trim();
    return { page: 'blog', slug: slug || 'freelancing-tips-it-professionals-2026' };
  }

  // Direct article slug in pathname (e.g. /choose-it-services-provider/)
  if (path) {
    const matched = articlesList.find((a) => a.slug.toLowerCase() === path);
    if (matched) {
      return { page: 'blog', slug: matched.slug };
    }
  }

  // Direct article slug in hash
  if (hash) {
    const matched = articlesList.find((a) => a.slug.toLowerCase() === hash);
    if (matched) {
      return { page: 'blog', slug: matched.slug };
    }
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

  const [route, setRoute] = useState<RouteState>(() => resolveRoute());

  useEffect(() => {
    const handleLocationChange = () => {
      const parsed = resolveRoute();
      setRoute(parsed);

      if (parsed.page === 'contact' || parsed.page === 'blog') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      } else {
        const hash = (window.location.hash || '').replace(/^#\/?/, '').replace(/\/+$/, '');
        if (hash && hash !== 'home') {
          setTimeout(() => {
            const el = document.getElementById(hash);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 80);
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleNavigate = (page: 'home' | 'contact' | 'blog', slugOrSection?: string) => {
    if (page === 'contact') {
      window.history.pushState(null, '', '/contact');
      setRoute({ page: 'contact', slug: '' });
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } else if (page === 'blog') {
      const slug = slugOrSection || 'freelancing-tips-it-professionals-2026';
      window.history.pushState(null, '', `/${slug}/`);
      setRoute({ page: 'blog', slug });
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } else {
      if (slugOrSection && slugOrSection !== 'home') {
        if (route.page !== 'home') {
          window.history.pushState(null, '', `/#${slugOrSection}`);
          setRoute({ page: 'home', slug: '' });
          setTimeout(() => {
            const el = document.getElementById(slugOrSection);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else {
          window.history.pushState(null, '', `/#${slugOrSection}`);
          const el = document.getElementById(slugOrSection);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        window.history.pushState(null, '', '/');
        setRoute({ page: 'home', slug: '' });
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
              onSelectArticle={(slug) => handleNavigate('blog', slug)}
            />
            <LetsTalkBanner onNavigateContact={() => handleNavigate('contact')} />
            <CapturedMemories />
          </>
        )}

        {route.page === 'blog' && (
          <SingleBlogPage
            slug={route.slug}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateArticles={() => handleNavigate('home', 'articles')}
            onSelectArticle={(newSlug) => handleNavigate('blog', newSlug)}
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
