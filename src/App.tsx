import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
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
import { updatePageSeo } from './utils/seo';
import 'lenis/dist/lenis.css';
import { initSmoothScroll, getSmoothScroll, destroySmoothScroll } from './utils/smoothScroll';

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
  const [route, setRoute] = useState<RouteState>(() => resolveRoute());

  // Activate animated letter cycles for all .word titles on every route transition
  useWordAnimation(route);

  // Initialize Lenis smooth momentum scrolling with GSAP ticker sync
  useEffect(() => {
    const lenis = initSmoothScroll();
    return () => {
      destroySmoothScroll();
    };
  }, []);

  // Pre-paint instant scroll reset on route changes so no previous scroll position flickers
  useLayoutEffect(() => {
    if (route.page === 'contact' || route.page === 'blog') {
      const lenis = getSmoothScroll();
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      }
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [route.page, route.slug]);

  // Synchronize SEO meta tags, title, Open Graph, and Structured Data
  useEffect(() => {
    if (route.page === 'contact') {
      updatePageSeo({
        title: 'Contact Prince — Senior IT Consultant & Full Stack Web Engineer | HeyPrince',
        description:
          'Get in touch with Prince for senior IT consulting, full-stack React engineering, custom web applications, performance audits, and high-conversion software architecture.',
        canonicalPath: '/contact/',
        keywords:
          'Contact Prince, Hire IT Consultant, Full Stack React Developer, Web Engineer India, Remote Tech Partner, Senior Software Architect, HeyPrince Contact, Custom Web Solutions',
        ogType: 'website',
      });
    } else if (route.page === 'blog') {
      const article = articlesList.find((a) => a.slug === route.slug) || articlesList[0];
      const absoluteImage = article.image.startsWith('http')
        ? article.image
        : `https://heyprince.in${article.image.startsWith('/') ? '' : '/'}${article.image}`;
      updatePageSeo({
        title: `${article.title} | Prince — Tech Partner`,
        description: article.description,
        canonicalPath: `/${article.slug}/`,
        keywords: `${article.tags.join(', ')}, Web Development, IT Engineering, Prince, Software Architecture, Full Stack Consultant`,
        ogType: 'article',
        ogImage: absoluteImage,
        publishedDate: article.date,
        authorName: article.author?.name || 'Prince',
      });
    } else {
      updatePageSeo({
        title: 'Prince — Senior Full Stack IT Consultant & Web Engineer | HeyPrince',
        description:
          'Prince is a Senior Full Stack Engineer & IT Consultant specializing in high-performance React web apps, scalable cloud architecture, and custom IT solutions.',
        canonicalPath: '/',
        keywords:
          'Prince, HeyPrince, IT Consultant, Full Stack Engineer, React Developer, Web Engineering, Custom Software Development, Cloud Architecture, Node.js, UI/UX Design, IT Services India',
        ogType: 'website',
      });
    }
  }, [route]);

  useEffect(() => {
    const handleLocationChange = () => {
      const parsed = resolveRoute();
      setRoute(parsed);

      const lenis = getSmoothScroll();
      if (parsed.page === 'contact' || parsed.page === 'blog') {
        if (lenis) {
          lenis.scrollTo(0, { immediate: true });
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      } else {
        const hash = (window.location.hash || '').replace(/^#\/?/, '').replace(/\/+$/, '');
        if (hash && hash !== 'home') {
          setTimeout(() => {
            const el = document.getElementById(hash);
            if (el) {
              if (lenis) {
                lenis.scrollTo(el, { duration: 1.2, offset: -20 });
              } else {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }, 80);
        } else {
          if (lenis) {
            lenis.scrollTo(0, { duration: 1.2 });
          } else {
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          }
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
    const lenis = getSmoothScroll();
    if (page === 'contact') {
      window.history.pushState(null, '', '/contact');
      setRoute({ page: 'contact', slug: '' });
      if (lenis) lenis.scrollTo(0, { immediate: true });
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } else if (page === 'blog') {
      const slug = slugOrSection || 'freelancing-tips-it-professionals-2026';
      window.history.pushState(null, '', `/${slug}/`);
      setRoute({ page: 'blog', slug });
      if (lenis) lenis.scrollTo(0, { immediate: true });
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
            if (el) {
              if (lenis) {
                lenis.scrollTo(el, { duration: 1.2, offset: -20 });
              } else {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }, 100);
        } else {
          window.history.pushState(null, '', `/#${slugOrSection}`);
          const el = document.getElementById(slugOrSection);
          if (el) {
            if (lenis) {
              lenis.scrollTo(el, { duration: 1.2, offset: -20 });
            } else {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }
      } else {
        window.history.pushState(null, '', '/');
        setRoute({ page: 'home', slug: '' });
        if (lenis) {
          lenis.scrollTo(0, { duration: 1.2 });
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
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
        <div
          key={route.page === 'blog' ? `view-blog-${route.slug}` : `view-${route.page}`}
          className={route.page === 'home' ? 'home-view-container' : 'page-view-wrapper'}
        >
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
              key={route.slug}
              slug={route.slug}
              onNavigateHome={() => handleNavigate('home')}
              onNavigateArticles={() => handleNavigate('home', 'articles')}
              onSelectArticle={(newSlug) => handleNavigate('blog', newSlug)}
              onNavigateContact={() => handleNavigate('contact')}
            />
          )}

          {route.page === 'contact' && (
            <ContactPage
              key="contact-page"
              onNavigateHome={() => {
                handleNavigate('home');
              }}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
