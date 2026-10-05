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
  SingleServicePage,
  PrivacyPolicyPage,
  ContactPage,
  CookieConsent,
  BackToTop,
  Footer,
} from './components';
import { useWordAnimation } from './hooks/useWordAnimation';
import { articlesList } from './data/siteContent';
import { servicesList } from './data/servicesData';
import { updatePageSeo } from './utils/seo';
import 'lenis/dist/lenis.css';
import { initSmoothScroll, getSmoothScroll, destroySmoothScroll } from './utils/smoothScroll';

export interface RouteState {
  page: 'home' | 'contact' | 'blog' | 'service' | 'privacy';
  slug: string;
}

export const resolveRoute = (): RouteState => {
  if (typeof window === 'undefined') {
    return { page: 'home', slug: '' };
  }

  // 1. Clean pathname (e.g. "/services/ai-automation/" -> "services/ai-automation")
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();

  // 2. Clean hash (e.g. "#/contact" or "#contact" -> "contact")
  const hash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '').toLowerCase();

  // Contact checks
  if (path === 'contact' || hash === 'contact') {
    return { page: 'contact', slug: '' };
  }

  // Privacy Policy checks
  if (path === 'privacy-policy' || path === 'privacy' || hash === 'privacy-policy' || hash === 'privacy') {
    return { page: 'privacy', slug: '' };
  }

  // Services prefixed paths (e.g. /services/ai-automation/ or /service/react-development/)
  if (path.startsWith('services/') || path.startsWith('service/') || path === 'services' || path === 'service') {
    const slug = path.replace(/^(services|service)\/?/, '').trim();
    return { page: 'service', slug: slug || 'ai-automation' };
  }
  if (hash.startsWith('services/') || hash.startsWith('service/') || hash === 'services' || hash === 'service') {
    const slug = hash.replace(/^(services|service)\/?/, '').trim();
    return { page: 'service', slug: slug || 'ai-automation' };
  }

  // Direct service slug in pathname or hash
  if (path) {
    const matchedService = servicesList.find((s) => s.slug.toLowerCase() === path);
    if (matchedService) {
      return { page: 'service', slug: matchedService.slug };
    }
  }
  if (hash) {
    const matchedService = servicesList.find((s) => s.slug.toLowerCase() === hash);
    if (matchedService) {
      return { page: 'service', slug: matchedService.slug };
    }
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
    initSmoothScroll();
    return () => {
      destroySmoothScroll();
    };
  }, []);

  // Pre-paint instant scroll reset on route changes so no previous scroll position flickers
  useLayoutEffect(() => {
    if (
      route.page === 'contact' ||
      route.page === 'blog' ||
      route.page === 'service' ||
      route.page === 'privacy'
    ) {
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
    } else if (route.page === 'privacy') {
      updatePageSeo({
        title: 'Privacy Policy | Prince — Senior IT Consultant & Web Engineer | HeyPrince',
        description:
          'Read the HeyPrince Privacy Policy to understand how we protect your personal data, manage cookie consent preferences, and guarantee transparency.',
        canonicalPath: '/privacy-policy/',
        keywords:
          'Privacy Policy, HeyPrince, Prince IT Consultant, Cookie Consent, GDPR Compliance, Data Protection, User Rights',
        ogType: 'website',
      });
    } else if (route.page === 'service') {
      const service = servicesList.find((s) => s.slug === route.slug) || servicesList[0];
      updatePageSeo({
        title: `${service.metaTitle} | HeyPrince`,
        description: service.metaDescription,
        canonicalPath: `/services/${service.slug}/`,
        keywords: `${service.techStack.join(', ')}, ${service.category}, Prince IT Consultant, HeyPrince Services`,
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
      if (
        parsed.page === 'contact' ||
        parsed.page === 'blog' ||
        parsed.page === 'service' ||
        parsed.page === 'privacy'
      ) {
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

  const handleNavigate = (
    page: 'home' | 'contact' | 'blog' | 'service' | 'privacy',
    slugOrSection?: string
  ) => {
    const lenis = getSmoothScroll();
    if (page === 'contact') {
      window.history.pushState(null, '', '/contact');
      setRoute({ page: 'contact', slug: '' });
      if (lenis) lenis.scrollTo(0, { immediate: true });
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } else if (page === 'privacy') {
      window.history.pushState(null, '', '/privacy-policy');
      setRoute({ page: 'privacy', slug: '' });
      if (lenis) lenis.scrollTo(0, { immediate: true });
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } else if (page === 'service') {
      const slug = slugOrSection || 'ai-automation';
      window.history.pushState(null, '', `/services/${slug}/`);
      setRoute({ page: 'service', slug });
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
    const lenis = getSmoothScroll();
    if (lenis) {
      const handleLenisScroll = (e: any) => {
        if (progressBarRef.current && typeof e.progress === 'number') {
          progressBarRef.current.style.transform = `scaleX(${e.progress})`;
        }
      };
      lenis.on('scroll', handleLenisScroll);
      return () => {
        lenis.off('scroll', handleLenisScroll);
      };
    }

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
          key={
            route.page === 'blog'
              ? `view-blog-${route.slug}`
              : route.page === 'service'
              ? `view-service-${route.slug}`
              : `view-${route.page}`
          }
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

          {route.page === 'service' && (
            <SingleServicePage
              key={route.slug}
              slug={route.slug}
              onNavigateHome={() => handleNavigate('home')}
              onNavigateServices={() => handleNavigate('home', 'footer')}
              onSelectService={(newSlug) => handleNavigate('service', newSlug)}
              onNavigateContact={(serviceTitle) => handleNavigate('contact', serviceTitle)}
            />
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

          {route.page === 'privacy' && (
            <PrivacyPolicyPage
              key="privacy-page"
              onNavigateHome={() => handleNavigate('home')}
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
      <Footer
        onNavigateService={(slug) => handleNavigate('service', slug)}
        onNavigatePrivacy={() => handleNavigate('privacy')}
      />
      {/* Floating Back to Top Button */}
      <BackToTop />
      {/* Cookie Consent Banner & Customise Preferences Modal */}
      <CookieConsent onOpenPrivacyPolicy={() => handleNavigate('privacy')} />
    </div>
  );
};

export default App;

