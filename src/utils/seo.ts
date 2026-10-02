/**
 * Universal SEO & Meta Tag Management Helper
 * Dynamically updates document title, canonical link, Open Graph, Twitter Cards,
 * and JSON-LD structured data on client-side route transitions.
 */

export interface PageSeoOptions {
  title: string;
  description: string;
  canonicalPath?: string;
  keywords?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  publishedDate?: string;
  authorName?: string;
  schema?: Record<string, unknown>;
}

const DEFAULT_ORIGIN = 'https://heyprince.in';
const DEFAULT_IMAGE = 'https://heyprince.in/wp-content/uploads/2025/09/cropped-prince-profile.webp';

function setMetaTag(selector: string, attributeName: string, attributeValue: string, content: string): void {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonicalLink(href: string): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function updatePageSeo(options: PageSeoOptions): void {
  if (typeof window === 'undefined') return;

  const {
    title,
    description,
    canonicalPath = window.location.pathname,
    keywords = 'Prince, HeyPrince, IT Consultant, Full Stack Engineer, React Developer, Web Engineering, Custom Software Development, Cloud Architecture, Node.js, UI/UX Design, IT Services India',
    ogType = 'website',
    ogImage = DEFAULT_IMAGE,
    publishedDate,
    authorName = 'Prince',
    schema,
  } = options;

  // 1. Update Document Title
  document.title = title;

  // 2. Standard Meta Tags
  setMetaTag('meta[name="description"]', 'name', 'description', description);
  setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
  setMetaTag('meta[name="author"]', 'name', 'author', authorName);
  setMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // 3. Canonical URL
  const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  const fullCanonicalUrl = `${DEFAULT_ORIGIN}${cleanPath}`;
  setCanonicalLink(fullCanonicalUrl);

  // 4. Open Graph Tags
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', fullCanonicalUrl);
  setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'HeyPrince');
  setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'en_US');

  // 5. Twitter Card Tags (for crawler preview rich cards)
  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

  // 6. Dynamic JSON-LD Schema
  let schemaScript = document.getElementById('dynamic-page-schema') as HTMLScriptElement | null;
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'dynamic-page-schema';
    schemaScript.type = 'application/ld+json';
    document.head.appendChild(schemaScript);
  }

  if (schema) {
    schemaScript.textContent = JSON.stringify(schema, null, 2);
  } else if (ogType === 'article') {
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description,
      image: [ogImage],
      datePublished: publishedDate || '2026-01-18',
      dateModified: publishedDate || '2026-10-02',
      author: {
        '@type': 'Person',
        name: authorName,
        url: 'https://heyprince.in/',
        jobTitle: 'Senior Full Stack Engineer & IT Consultant',
      },
      publisher: {
        '@type': 'Person',
        name: 'Prince',
        logo: {
          '@type': 'ImageObject',
          url: 'https://heyprince.in/assets/heyprince-logo.svg',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': fullCanonicalUrl,
      },
    };
    schemaScript.textContent = JSON.stringify(articleSchema, null, 2);
  } else {
    // Default WebSite + Person Schema
    const baseSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          '@id': 'https://heyprince.in/#person',
          name: 'Prince',
          jobTitle: 'Senior Full Stack Engineer & IT Consultant',
          url: 'https://heyprince.in/',
          image: DEFAULT_IMAGE,
          email: 'it@heyprince.in',
          sameAs: [
            'https://www.linkedin.com/in/mr-goyal/',
            'https://www.instagram.com/heyprince.in/',
            'https://wa.me/',
          ],
          knowsAbout: [
            'React.js',
            'Full Stack Web Development',
            'Cloud Solutions',
            'TypeScript',
            'Node.js',
            'UI/UX Engineering',
            'IT Consulting',
          ],
        },
        {
          '@type': 'WebSite',
          '@id': 'https://heyprince.in/#website',
          url: 'https://heyprince.in/',
          name: 'HeyPrince',
          description,
          publisher: {
            '@id': 'https://heyprince.in/#person',
          },
          inLanguage: 'en-US',
        },
        {
          '@type': 'ProfessionalService',
          '@id': 'https://heyprince.in/#service',
          name: 'Prince IT Consulting & Web Engineering',
          url: 'https://heyprince.in/',
          email: 'it@heyprince.in',
          priceRange: '$$$$',
          areaServed: ['Global Remote', 'India', 'United States', 'Europe'],
          provider: {
            '@id': 'https://heyprince.in/#person',
          },
        },
      ],
    };
    schemaScript.textContent = JSON.stringify(baseSchema, null, 2);
  }
}
