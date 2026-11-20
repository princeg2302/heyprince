export interface ServiceDeliverable {
  title: string;
  desc: string;
}

export interface ServiceProcessStep {
  step: string;
  title: string;
  desc: string;
}

export interface ServiceFaq {
  q: string;
  a: string;
}

export interface ServiceProblemSolution {
  problem: string;
  solution: string;
}

export interface ServiceUseCase {
  title: string;
  scenario: string;
  outcome: string;
}

export interface ServiceComparisonItem {
  metric: string;
  heyprince: string;
  traditionalAgency: string;
  offTheShelf: string;
}

export interface ServicePricingMilestone {
  phase: string;
  focus: string;
  turnaround: string;
}

export interface ServiceArchitectureStep {
  step: string;
  layer: string;
  desc: string;
}

export interface ServiceIndustryApp {
  name: string;
  impact: string;
}

export interface ServiceData {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  tagline: string;
  category: string;
  cardTheme: 'black' | 'white' | 'red' | 'featured';
  isFeatured?: boolean;
  featuredBadge?: string;
  iconName: string;
  heroDescription: string;
  overview: string[];
  deliverables: ServiceDeliverable[];
  techStack: string[];
  process: ServiceProcessStep[];
  highlights: string[];
  faqs: ServiceFaq[];
  metaTitle: string;
  metaDescription: string;

  // Extended 20-Section Architecture Fields
  problemsSolved?: ServiceProblemSolution[];
  whoNeedsThis?: string[];
  capabilities?: { title: string; desc: string }[];
  architectureWorkflow?: ServiceArchitectureStep[];
  integrations?: string[];
  securityStandards?: string[];
  useCases?: ServiceUseCase[];
  industries?: ServiceIndustryApp[];
  comparison?: ServiceComparisonItem[];
  pricingMilestones?: ServicePricingMilestone[];
}

export const servicesList: ServiceData[] = [
  {
    id: 'ai-automation',
    slug: 'ai-automation',
    title: 'AI Services & Project Automations',
    shortTitle: 'AI & Smart Automations',
    tagline: 'Supercharge your workflows with custom AI agents, LLM pipelines, and automated intelligence.',
    category: 'AI & Automation',
    cardTheme: 'featured',
    isFeatured: true,
    featuredBadge: '★ FEATURED // NEXT-GEN TECH',
    iconName: 'FaBrain',
    heroDescription:
      'We design and deploy production-grade AI automations, intelligent autonomous agents, custom LLM reasoning pipelines, and smart workflow orchestrations that save hundreds of engineering hours.',
    overview: [
      'Modern businesses cannot afford repetitive manual friction. We bridge cutting-edge artificial intelligence models (Gemini, Claude, GPT-4o, DeepSeek) into practical, revenue-generating automated pipelines.',
      'From custom document analysis and automated customer routing to intelligent data extraction and autonomous multi-agent task chains, we build AI solutions that seamlessly plug into your existing databases and APIs.',
      'Every automation is hardened with zero-hallucination validation guards, deterministic fallbacks, rigorous latency optimization, and enterprise data privacy protections.',
    ],
    deliverables: [
      {
        title: 'Custom Autonomous AI Agents',
        desc: 'Goal-driven agents that interact with your internal APIs, query databases, execute multi-step workflows, and report clean results.',
      },
      {
        title: 'Intelligent Workflow Automations',
        desc: 'End-to-end event-driven triggers connecting CRM, emails, payment gateways, webhooks, and third-party SaaS tools.',
      },
      {
        title: 'Private LLM & RAG Pipelines',
        desc: 'Retrieval-Augmented Generation connecting your internal knowledge base with vector embeddings (Pinecone, pgvector) for instant contextual answers.',
      },
      {
        title: 'Automated Document & Data Extractors',
        desc: 'Vision and OCR pipelines that ingest PDFs, invoices, contracts, and receipts into structured JSON schemas automatically.',
      },
    ],
    techStack: [
      'Gemini 1.5/2.0 API',
      'Claude 3.5 Sonnet',
      'OpenAI API',
      'LangChain & LlamaIndex',
      'Python / FastAPI',
      'Vector Databases (pgvector, Pinecone)',
      'Node.js Automations',
      'n8n / Webhooks / Celery',
    ],
    process: [
      {
        step: '01',
        title: 'Workflow Audit & Bottleneck Mapping',
        desc: 'We analyze your team’s existing workflows to isolate high-friction, repetitive tasks where AI yields maximum 10x ROI.',
      },
      {
        step: '02',
        title: 'Prompt Architecture & RAG Schema',
        desc: 'Designing structured system prompts, deterministic schemas, and retrieval logic with grounding controls.',
      },
      {
        step: '03',
        title: 'Integration & Automated Pipelines',
        desc: 'Writing production microservices and connecting webhooks, background queues, and API gateways.',
      },
      {
        step: '04',
        title: 'Stress Testing & Guardrail Audits',
        desc: 'Adversarial testing against hallucination, token efficiency optimizations, rate-limit resilience, and security checks.',
      },
    ],
    highlights: [
      'Save 15+ hours weekly per team member',
      'Deterministic structured outputs (Pydantic / Zod)',
      'Sub-second latency with streaming responses',
      'Enterprise-grade API key and data isolation',
    ],
    faqs: [
      {
        q: 'How do you prevent the AI from hallucinating or making errors?',
        a: 'We use structured JSON output enforcement (Pydantic / Zod validation), grounded RAG contexts, and programmatic fallback chains so that any invalid model output is automatically caught and retried or escalated.',
      },
      {
        q: 'Can these AI automations connect to our custom SQL database or CRM?',
        a: 'Yes! We build secure REST or GraphQL microservices that interface directly with PostgreSQL, MySQL, Supabase, HubSpot, Salesforce, Stripe, and any webhook-enabled service.',
      },
      {
        q: 'Is our proprietary company data used to train public models?',
        a: 'Never. We exclusively use commercial enterprise API agreements (like Google Gemini API and Anthropic Claude) which strictly guarantee zero retention for model training.',
      },
    ],
    metaTitle: 'AI Services & Project Automations | Prince: Senior IT Consultant',
    metaDescription:
      'Custom autonomous AI agents, LLM pipelines, RAG systems, and smart workflow automations built for high-performance scale by Prince.',
  },
  {
    id: 'cms-development',
    slug: 'cms-development',
    title: 'CMS Development (WordPress, Shopify, Webflow, Squarespace)',
    shortTitle: 'CMS Solutions',
    tagline: 'Bespoke custom CMS architecture engineered for blisteringly fast speed, custom controls, and effortless content publishing.',
    category: 'Content Management Systems',
    cardTheme: 'black',
    iconName: 'FaWordpress',
    heroDescription:
      'We craft tailored, zero-bloat CMS websites on WordPress, Shopify, Webflow, and Squarespace with custom themes, lightning-fast Core Web Vitals, and intuitive editing panels.',
    overview: [
      'Off-the-shelf templates and bloated page builders slow down your business and compromise your Google rankings. We build clean, high-performance CMS platforms with semantic code, lightning loading speeds, and robust security.',
      'Whether you need a high-converting Shopify e-commerce store with custom Liquid sections, a customized WordPress ACF architecture, or a bespoke Webflow/Squarespace build, you get pixel-perfect design and uncompromised speed.',
      'Every build gives your marketing team total freedom to update content without needing a developer for every single image or text swap.',
    ],
    deliverables: [
      {
        title: 'WordPress Custom Theme & Plugin Engineering',
        desc: 'Lightweight PHP/Twig themes using Advanced Custom Fields (ACF Pro) and block architectures with 95+ PageSpeed scores.',
      },
      {
        title: 'Shopify Store & Custom Liquid Development',
        desc: 'Bespoke Shopify Online Store 2.0 themes, custom cart drawers, conversion-optimized checkout funnels, and app integrations.',
      },
      {
        title: 'Webflow & Squarespace Builds',
        desc: 'Flawless visual implementation with clean CSS class naming, fluid responsive scaling, and smooth CMS collections.',
      },
      {
        title: 'CMS Migration & Speed Auditing',
        desc: 'Seamless zero-downtime platform migrations preserving SEO URLs, metadata, redirects, and media assets.',
      },
    ],
    techStack: [
      'WordPress & ACF Pro',
      'Shopify 2.0 & Liquid',
      'Webflow CMS',
      'Squarespace Developer Mode',
      'WooCommerce',
      'HTML5 / SCSS / Tailwind',
      'WP Engine / Hostinger / Kinsta',
      'LiteSpeed & Cloudflare Cache',
    ],
    process: [
      {
        step: '01',
        title: 'Information Architecture & Field Mapping',
        desc: 'Structuring modular content blocks and custom fields tailored precisely to your brand assets and editorial workflow.',
      },
      {
        step: '02',
        title: 'Clean Handcrafted Code',
        desc: 'Writing clean, semantic templates without heavy 3rd-party theme junk or sluggish multi-megabyte bundle dependencies.',
      },
      {
        step: '03',
        title: 'E-Commerce & Form Integrations',
        desc: 'Wiring payment gateways, dynamic carts, inventory sync, newsletter hooks, and CRM notifications.',
      },
      {
        step: '04',
        title: 'PageSpeed & SEO Hardening',
        desc: 'Asset minification, WebP image conversion, lazy-loading, and comprehensive schema markup.',
      },
    ],
    highlights: [
      'Sub-1.2s Page Load Speed Guaranteed',
      'Custom ACF visual editing without broken page builders',
      'Zero monthly plugin license traps',
      'Full SEO schema & OpenGraph parity',
    ],
    faqs: [
      {
        q: 'Do you use heavy page builders like Elementor or Divi?',
        a: 'No. We build with lightweight, bespoke ACF modules and native blocks. This ensures your site loads under 1 second, gets 95+ Google PageSpeed scores, and never breaks during WordPress core updates.',
      },
      {
        q: 'Can you migrate our existing store to Shopify without losing SEO rankings?',
        a: 'Yes. We map every single product, collection, blog post, and customer account with 1:1 301 redirects to ensure zero loss in search engine rankings.',
      },
    ],
    metaTitle: 'Custom CMS Development (WordPress, Shopify, Webflow) | HeyPrince',
    metaDescription:
      'High-speed, bespoke CMS development on WordPress, Shopify, Webflow, and Squarespace with zero bloat and custom theme engineering by Prince.',
  },
  {
    id: 'react-development',
    slug: 'react-development',
    title: 'React & Next.js Web Development',
    shortTitle: 'React Development',
    tagline: 'High-performance React 19 and Next.js applications engineered with fluid motion, TypeScript, and modern web architecture.',
    category: 'Frontend Engineering',
    cardTheme: 'red',
    iconName: 'FaReact',
    heroDescription:
      'We build scalable, modular React and Next.js web applications, dynamic interactive platforms, and single-page apps (SPAs) optimized for 60fps animations and instant interactions.',
    overview: [
      'React is the gold standard for dynamic, app-like web experiences. We build reactive, component-driven web software using React 19, Next.js App Router, Vite, and TypeScript.',
      'From custom micro-interactions and smooth kinetic scrolling to complex state management and multi-view applications, our React code is clean, typed, modular, and built for team scalability.',
      'We obsess over frontend performance: zero layout shift (CLS), sub-50ms Input Delay (INP), and lightning-fast virtual DOM rendering.',
    ],
    deliverables: [
      {
        title: 'Next.js Full-Stack Web Apps',
        desc: 'Server-Side Rendering (SSR), Static Site Generation (SSG), and Server Actions for ultra-fast, SEO-dominant applications.',
      },
      {
        title: 'Interactive React SPAs & Dashboards',
        desc: 'Responsive, highly interactive dashboards, analytics suites, and SaaS portals with real-time state synchronization.',
      },
      {
        title: 'Kinetic Motion & Micro-Interactions',
        desc: 'GSAP, Lenis smooth scrolling, Matter.js physics engines, and smooth layout animations that set your brand apart.',
      },
      {
        title: 'TypeScript Design Systems',
        desc: 'Reusable component libraries documented with Storybook or clean design tokens for engineering velocity.',
      },
    ],
    techStack: [
      'React 19 & React DOM',
      'Next.js 15 (App Router)',
      'TypeScript 5.x',
      'Vite & Rolldown',
      'GSAP & ScrollTrigger',
      'Lenis Smooth Scroll',
      'Zustand / Redux Toolkit',
      'Tailwind CSS / Vanilla SCSS',
    ],
    process: [
      {
        step: '01',
        title: 'Architecture & Component Hierarchy',
        desc: 'Establishing strict TypeScript interfaces, routing models, state trees, and lazy chunking boundaries.',
      },
      {
        step: '02',
        title: 'Interactive Frontend Implementation',
        desc: 'Writing modular functional components with hooks, strict error boundaries, and accessible ARIA attributes.',
      },
      {
        step: '03',
        title: 'Motion & Animation Fine-Tuning',
        desc: 'Synchronizing scroll momentum, entrance transitions, and physics animations without dropped frames.',
      },
      {
        step: '04',
        title: 'Build Optimization & Lighthouse Audit',
        desc: 'Dynamic code splitting, asset tree-shaking, and performance optimization targeting perfect 100/100 scores.',
      },
    ],
    highlights: [
      '60 FPS silky smooth animations',
      'Strict TypeScript safety across all props & payloads',
      'Mobile-first responsive across all breakpoints',
      'Instant client-side routing with pre-paint resets',
    ],
    faqs: [
      {
        q: 'Why choose React or Next.js over traditional CMS platforms?',
        a: 'React offers unmatched interactive flexibility, zero-delay page transitions, offline capabilities, and component reuse that traditional monolithic CMS platforms simply cannot match.',
      },
      {
        q: 'How do you handle SEO with Single Page Applications?',
        a: 'We use Next.js for server-rendered HTML or configure prerendering with comprehensive meta tags, dynamic canonicals, and JSON-LD schema graphs so search engine crawlers index every route instantly.',
      },
    ],
    metaTitle: 'React & Next.js Web Development | Prince: Senior Full Stack Engineer',
    metaDescription:
      'Senior React & Next.js frontend development. High-performance, motion-rich, TypeScript web applications crafted by Prince.',
  },
  {
    id: 'php-development',
    slug: 'php-development',
    title: 'Enterprise PHP & Backend Engineering',
    shortTitle: 'PHP Development',
    tagline: 'Robust, secure, and performant PHP 8.x backend solutions, custom REST APIs, and database engineering.',
    category: 'Backend Architecture',
    cardTheme: 'white',
    iconName: 'FaPhp',
    heroDescription:
      'We engineer dependable, modern PHP applications, custom RESTful endpoints, secure payment hooks, database architectures, and high-load backend integrations.',
    overview: [
      'PHP powers over 75% of the web. Modern PHP 8.x is fast, type-safe, and incredibly versatile when written with clean object-oriented architecture and strict design patterns.',
      'We build custom PHP backend services, high-throughput webhook consumers, custom WordPress plugin cores, and Laravel microservices that handle high traffic effortlessly.',
      'Security is paramount: every endpoint is defended against SQL injection, CSRF attacks, authentication exploits, and malicious payload tampering.',
    ],
    deliverables: [
      {
        title: 'Custom RESTful APIs & Microservices',
        desc: 'Secure, fast JSON API endpoints for mobile apps, SPAs, and third-party partner integrations.',
      },
      {
        title: 'Custom WordPress Core Extensions',
        desc: 'Bespoke plugins, custom database tables, cron jobs, and background workers without plugin bloat.',
      },
      {
        title: 'Database Schema & Query Optimization',
        desc: 'MySQL and PostgreSQL index tuning, connection pooling, and caching layer implementation (Redis / Memcached).',
      },
      {
        title: 'Legacy Codebase Modernization',
        desc: 'Refactoring antiquated PHP 5/7 codebases up to PHP 8.3 with strict typing, composer packaging, and PSR standards.',
      },
    ],
    techStack: [
      'PHP 8.2 / 8.3 (Strict Types)',
      'Laravel & Lumen',
      'MySQL / MariaDB / PostgreSQL',
      'Redis & Memcached',
      'Composer Dependency Management',
      'cURL & Guzzle HTTP',
      'PHPUnit & Static Analysis',
      'Docker & Nginx Optimization',
    ],
    process: [
      {
        step: '01',
        title: 'Data Modeling & API Contract',
        desc: 'Defining normalized database schemas, endpoints, payload validation rules, and authentication scopes.',
      },
      {
        step: '02',
        title: 'Controller & Service Implementation',
        desc: 'Writing clean separation of concerns: models, service layers, repositories, and request validators.',
      },
      {
        step: '03',
        title: 'Caching & Query Optimization',
        desc: 'Eliminating N+1 queries, establishing Redis object caching, and benchmarking execution times under 50ms.',
      },
      {
        step: '04',
        title: 'Security Hardening & Deployment',
        desc: 'Implementing rate limiting, parameterized queries, SSL enforcement, and automated backup routines.',
      },
    ],
    highlights: [
      'Sub-50ms server response times',
      'PSR-12 compliant modern PHP code',
      'Robust SQL injection and XSS defenses',
      'Scalable to millions of monthly requests',
    ],
    faqs: [
      {
        q: 'Is PHP still a good choice for modern web backends in 2026?',
        a: 'Absolutely. PHP 8.3 with JIT compilation, OPcache, and strict typing is faster and more cost-efficient than many Node.js or Python alternatives for content and transaction-heavy platforms.',
      },
      {
        q: 'Can you optimize our existing slow database queries?',
        a: 'Yes. We profile slow queries using EXPLAIN plans, build missing composite indexes, and implement Redis caching to dramatically reduce database CPU loads.',
      },
    ],
    metaTitle: 'PHP & Backend Engineering Services | Prince IT Consultant',
    metaDescription:
      'Custom PHP 8 backend development, REST APIs, database optimization, and secure web application engineering by Prince.',
  },
  {
    id: 'python-engineering',
    slug: 'python-engineering',
    title: 'Python Engineering & Data Automation',
    shortTitle: 'Python Engineering',
    tagline: 'Intelligent automation scripts, high-throughput scrapers, robust FastAPI backends, and data transformation pipelines.',
    category: 'Data & Backend Automation',
    cardTheme: 'black',
    iconName: 'FaPython',
    heroDescription:
      'We write high-performance Python solutions for automated data extraction, background process orchestration, intelligent bots, and resilient microservices.',
    overview: [
      'Python is the premier language for automation, data processing, and machine learning integration. We build reliable, asynchronous Python scripts and web backends that solve real operational bottlenecks.',
      'From scraping competitor pricing and orchestrating cloud data synchronization to building custom FastAPI services and automated reporting bots, we deliver clean, maintainable Python code.',
      'Every script is built with robust error handling, automated retry logic, logging, and packaging ready for Docker or serverless cloud execution.',
    ],
    deliverables: [
      {
        title: 'FastAPI & Flask Web Services',
        desc: 'Asynchronous, high-speed microservices with auto-generated OpenAPI documentation and Pydantic validation.',
      },
      {
        title: 'Automated Web Scraping & Extractors',
        desc: 'Resilient scrapers utilizing Playwright, BeautifulSoup, and proxy rotation to extract complex multi-page data.',
      },
      {
        title: 'Data Transformation & ETL Pipelines',
        desc: 'Automated processing of CSV, JSON, Excel, and SQL data into clean, normalized business intelligence feeds.',
      },
      {
        title: 'Scheduled Automation Bots & Alerting',
        desc: 'Cron jobs and cloud functions delivering automated email summaries, Slack/WhatsApp alerts, and synchronization.',
      },
    ],
    techStack: [
      'Python 3.12 (asyncio)',
      'FastAPI & Pydantic',
      'Playwright & BeautifulSoup4',
      'Pandas & NumPy',
      'Celery & Redis',
      'SQLAlchemy & Alembic',
      'Docker & Docker Compose',
      'AWS Lambda / Google Cloud Run',
    ],
    process: [
      {
        step: '01',
        title: 'Data Flow & Logic Architecture',
        desc: 'Mapping input sources, transformation rules, error failure modes, and target data destinations.',
      },
      {
        step: '02',
        title: 'Asynchronous Script & API Build',
        desc: 'Writing non-blocking async code to handle multiple network requests and data streams concurrently.',
      },
      {
        step: '03',
        title: 'Resilience & Proxy Hardening',
        desc: 'Implementing exponential backoff retries, CAPTCHA bypass hooks, and structural integrity checks.',
      },
      {
        step: '04',
        title: 'Automated Scheduling & Alerts',
        desc: 'Deploying to cloud containers with automated health checks, uptime monitors, and error notification webhooks.',
      },
    ],
    highlights: [
      'Asyncio concurrency for 10x faster execution',
      'Zero manual data entry after deployment',
      'Dockerized for one-click cross-platform deployment',
      'Comprehensive error alerts via Telegram, Slack, or Email',
    ],
    faqs: [
      {
        q: 'Can you scrape websites that require logins or dynamic JavaScript rendering?',
        a: 'Yes. We utilize headless browser automation with Playwright and Puppeteer, session cookie persistence, and proxy rotation to reliably extract JavaScript-rendered content.',
      },
      {
        q: 'Where do you host the Python scripts once built?',
        a: 'We deploy them to low-cost, scalable cloud environments like Google Cloud Run, AWS Lambda, DigitalOcean, or your existing Linux VPS with automated crons.',
      },
    ],
    metaTitle: 'Python Engineering & Automation Services | Prince',
    metaDescription:
      'Custom Python development, web scraping, FastAPI microservices, and automated data pipelines engineered by Prince.',
  },
  {
    id: 'seo-services',
    slug: 'seo-services',
    title: 'Technical SEO & Performance Optimization',
    shortTitle: 'Technical SEO',
    tagline: 'Dominate Google search results with perfect Core Web Vitals, rich Schema graphs, and architectural SEO audits.',
    category: 'Search Engine Optimization',
    cardTheme: 'red',
    iconName: 'FaMagnifyingGlass',
    heroDescription:
      'We optimize your website’s structural foundation to achieve 100/100 Google PageSpeed scores, flawless crawlability, rich snippet schema, and top search engine rankings.',
    overview: [
      'Content is critical, but if Google cannot crawl your site fast, or if your pages take 4 seconds to load on mobile devices, your rankings will suffer. We specialize in deep technical SEO and speed engineering.',
      'We eliminate render-blocking CSS/JS, optimize Largest Contentful Paint (LCP), fix cumulative layout shifts (CLS), and configure comprehensive JSON-LD semantic schema markup.',
      'Our clients regularly see dramatic reductions in bounce rates and significant organic traffic surges after our technical audits and structural overhauls.',
    ],
    deliverables: [
      {
        title: '100/100 Core Web Vitals Overhaul',
        desc: 'Minifying bundles, eliminating main-thread bottlenecks, implementing modern WebP/AVIF formats, and sub-1s LCP.',
      },
      {
        title: 'Semantic JSON-LD Structured Data',
        desc: 'Rich schema markup for ProfessionalService, FAQPage, Article, Product, Breadcrumbs, and Person entities.',
      },
      {
        title: 'Crawl Budget & Indexing Optimization',
        desc: 'Configuring XML sitemaps, robots.txt directives, canonical link chains, and fixing broken redirect loops.',
      },
      {
        title: 'On-Page SEO & Keyword Architecture',
        desc: 'Header hierarchy audits (H1-H4), metadata rewriting, internal anchor link mapping, and image alt optimization.',
      },
    ],
    techStack: [
      'Google Search Console',
      'Lighthouse & PageSpeed Insights',
      'Schema.org (JSON-LD)',
      'Screaming Frog SEO Spider',
      'Open Graph & Twitter Meta',
      'Server-Side Caching & Cloudflare',
      'Vite Code Splitting & Minification',
      'Modern Image Formats (WebP, SVG)',
    ],
    process: [
      {
        step: '01',
        title: 'Comprehensive Technical Audit',
        desc: 'Crawling every URL to isolate 404 errors, duplicate titles, indexation issues, and slow assets.',
      },
      {
        step: '02',
        title: 'Code-Level Speed Engineering',
        desc: 'Restructuring script execution order, deferring non-critical CSS, and caching static assets at the CDN edge.',
      },
      {
        step: '03',
        title: 'Schema & Semantic Data Injection',
        desc: 'Embedding valid JSON-LD graph models that earn Google Knowledge Graph features and rich search snippets.',
      },
      {
        step: '04',
        title: 'Search Console Re-indexing',
        desc: 'Validating fixes in Google Search Console, inspecting live URLs, and monitoring indexation progress.',
      },
    ],
    highlights: [
      'Guaranteed 90+ Mobile & Desktop PageSpeed score',
      'Rich Google search results with valid Schema',
      'Instant crawler discovery via optimized sitemaps',
      'Zero render-blocking asset traps',
    ],
    faqs: [
      {
        q: 'How fast can we see improvements after technical SEO fixes?',
        a: 'Google typically recrawls updated sitemaps within 3 to 14 days. Core Web Vitals score improvements are reflected in Search Console within 28 days of live deployment.',
      },
      {
        q: 'Do you provide reports of what was changed?',
        a: 'Yes. Every project includes a before-and-after Lighthouse audit, a full changelog of code optimizations, and Search Console validation reports.',
      },
    ],
    metaTitle: 'Technical SEO & PageSpeed Optimization Services | Prince',
    metaDescription:
      'Boost your Google rankings with technical SEO audits, 100/100 Core Web Vitals, and rich JSON-LD schema graphs by Prince.',
  },
  {
    id: 'ui-ux-design',
    slug: 'ui-ux-design',
    title: 'UI/UX Design & Brand Graphics',
    shortTitle: 'UI/UX & Graphics',
    tagline: 'Distinctive, memorable digital design systems, high-converting interfaces, and brand graphic assets.',
    category: 'Design & Visual Strategy',
    cardTheme: 'white',
    iconName: 'FaPalette',
    heroDescription:
      'We design high-impact UI/UX interfaces, design systems, and bespoke graphic identities that mesmerize users and drive business conversions.',
    overview: [
      'In a sea of generic, cookie-cutter templates, world-class design is your most unfair competitive advantage. We create unforgettable visual identities, high-contrast dark modes, and intuitive user experiences.',
      'Every button, font choice, micro-interaction, and layout hierarchy is meticulously chosen to balance raw artistic elegance with frictionless usability.',
      'We bridge design and engineering seamlessly: our designs are delivered as production-ready Figma files with design tokens that developers can implement without friction.',
    ],
    deliverables: [
      {
        title: 'Figma UI/UX Interface Design',
        desc: 'Pixel-perfect web and mobile application prototypes with interactive component states, variants, and auto-layout.',
      },
      {
        title: 'Design Systems & Component Kits',
        desc: 'Comprehensive color palettes, typography scales, spacing tokens, and form components for brand consistency.',
      },
      {
        title: 'Brand Graphics & Vector Assets',
        desc: 'Custom SVG icons, illustrations, badges, hero graphic assets, and social media branding kits.',
      },
      {
        title: 'UX Flow & Conversion Optimization',
        desc: 'User journey mapping, wireframing, reduced cognitive friction, and high-converting checkout and contact funnels.',
      },
    ],
    techStack: [
      'Figma & FigJam',
      'Adobe Illustrator & Photoshop',
      'SVG Vector Engineering',
      'Design Tokens & Typography',
      'Interactive Prototyping',
      'Micro-Interactions & Motion Design',
      'WCAG 2.1 Accessibility Auditing',
    ],
    process: [
      {
        step: '01',
        title: 'Discovery & Brand Aesthetic Direction',
        desc: 'Uncovering your brand’s core personality, competitive landscape, target audience, and mood boards.',
      },
      {
        step: '02',
        title: 'Wireframing & Information Hierarchy',
        desc: 'Structuring UX wireframes focused on clear visual progression, key CTAs, and frictionless user flows.',
      },
      {
        step: '03',
        title: 'High-Fidelity Visual Design & System',
        desc: 'Crafting pixel-perfect screens in Figma with rich typography, dark-mode contrasts, and interactive states.',
      },
      {
        step: '04',
        title: 'Developer Handoff & Asset Export',
        desc: 'Providing organized component tokens, exported SVGs, and direct guidance for flawless code translation.',
      },
    ],
    highlights: [
      'Bespoke, non-template visual aesthetics',
      'High-contrast WCAG-compliant color accessibility',
      'Production-ready Figma files with auto-layout',
      'Interactive prototypes you can click and test',
    ],
    faqs: [
      {
        q: 'Do you design in Figma?',
        a: 'Yes! All UI/UX interfaces are built in Figma using modern auto-layout, component variants, and global design tokens for seamless developer collaboration.',
      },
      {
        q: 'Can you also develop the designs into real code?',
        a: 'Yes, that is our greatest superpower. Because Prince is both a senior designer and full-stack engineer, there is zero friction or compromise between visual design and the final code.',
      },
    ],
    metaTitle: 'UI/UX Design & Brand Graphics Services | Prince',
    metaDescription:
      'Elevate your brand with bespoke UI/UX interface design, Figma design systems, and digital graphic assets crafted by Prince.',
  },
  {
    id: 'ecommerce-solutions',
    slug: 'ecommerce-solutions',
    title: 'Headless E-Commerce & Custom Online Stores',
    shortTitle: 'Headless E-Commerce',
    tagline: 'Blisteringly fast headless storefronts, custom checkout funnels, and enterprise Shopify or Next.js architectures.',
    category: 'E-Commerce & Digital Sales',
    cardTheme: 'featured',
    isFeatured: true,
    featuredBadge: '★ HIGH CONVERSION // SUB-SECOND CHECKOUT',
    iconName: 'FaRocket',
    heroDescription:
      'We engineer headless e-commerce architectures combining Next.js, Shopify Storefront API, Stripe, and global edge CDNs for instantaneous product loading and increased checkout conversions.',
    overview: [
      'Every 100ms delay in page load time costs e-commerce businesses up to 7% in sales conversions. Traditional monolithic storefronts burdened by heavy themes and third-party apps frequently fail Google Core Web Vitals.',
      'We build decoupled, headless e-commerce engines that separate the frontend presentation from backend inventory and order management. Your catalog loads instantly from edge caches, and your cart experiences zero layout shift.',
      'From custom product configurators and multi-currency checkouts to automated CRM inventory syncs, we build high-converting storefronts engineered for maximum revenue per session.',
    ],
    deliverables: [
      {
        title: 'Headless Next.js Storefront',
        desc: 'Sub-second catalog browsing, server-side rendered product pages, dynamic filtering, and zero-flicker cart drawers.',
      },
      {
        title: 'Shopify Storefront API Integration',
        desc: 'Leverage Shopify’s rock-solid checkout and inventory engine while delivering a 100% custom, bespoke frontend design.',
      },
      {
        title: 'Custom Stripe & Payment Gateway Flows',
        desc: 'Optimized checkout sequences with Apple Pay, Google Pay, localized currencies, and subscription billing.',
      },
      {
        title: 'Automated Order & Inventory Webhooks',
        desc: 'Real-time synchronization between your storefront, warehouse fulfillment systems, ERP, and customer marketing automation.',
      },
    ],
    techStack: [
      'Next.js 16 Commerce',
      'Shopify Storefront API',
      'Stripe Billing & Checkout',
      'Tailwind CSS & Framer Motion',
      'Supabase PostgreSQL',
      'Cloudflare Edge & CDN',
      'Redis Distributed Caching',
      'Algolia InstantSearch',
    ],
    process: [
      {
        step: '01',
        title: 'Catalog Architecture & UX Audit',
        desc: 'Analyzing your product taxonomy, checkout drop-off points, and technical performance bottlenecks.',
      },
      {
        step: '02',
        title: 'Storefront Design & Component System',
        desc: 'Designing high-contrast, tactile product pages, sticky add-to-cart interactions, and friction-free mobile flows.',
      },
      {
        step: '03',
        title: 'Headless API Wiring & Edge Caching',
        desc: 'Connecting Shopify or custom database backends with ISR (Incremental Static Regeneration) for instant page loads.',
      },
      {
        step: '04',
        title: 'Conversion QA & Payment Stress Testing',
        desc: 'Validating end-to-end checkout, tax calculations, shipping rule webhooks, and analytics tracking.',
      },
    ],
    highlights: [
      'Sub-500ms product page load times',
      'Zero layout shifts (CLS < 0.05)',
      '100% bespoke design without theme limitations',
      'Seamless multi-currency and global tax support',
    ],
    faqs: [
      {
        q: 'Why should I switch from standard Shopify to Headless Next.js?',
        a: 'Standard Shopify themes load tens of JavaScript apps that cripple mobile load speeds. Headless separates your frontend, yielding 95+ Core Web Vitals, instantaneous transitions, and 15-30% higher mobile checkout conversions.',
      },
      {
        q: 'Do I still manage products and orders in Shopify admin?',
        a: 'Yes! Your marketing and operations teams continue using the standard Shopify dashboard for orders, refunds, inventory, and customer records. Only the customer-facing frontend is modernized.',
      },
      {
        q: 'Can you migrate our existing store data safely?',
        a: 'Yes. We run lossless database migrations for all existing customer accounts, order history, SEO URLs with 301 redirects, and product variants without downtime.',
      },
    ],
    metaTitle: 'Headless E-Commerce Development | Prince: Senior IT Consultant',
    metaDescription:
      'High-converting headless Shopify and Next.js e-commerce development with sub-second page loads, custom Stripe checkouts, and edge caching by Prince.',
  },
  {
    id: 'web-performance-optimization',
    slug: 'web-performance-optimization',
    title: 'Core Web Vitals & Web Performance Engineering',
    shortTitle: 'Speed & Performance',
    tagline: 'Sub-500ms TTFB, 95+ PageSpeed scores, zero layout shifts, and precision runtime bottleneck remediation.',
    category: 'Performance & Infrastructure',
    cardTheme: 'black',
    iconName: 'FaBolt',
    heroDescription:
      'We audit, de-bloat, and re-engineer sluggish websites to achieve 95+ Core Web Vitals, eliminating server bottlenecks, DOM bloat, uncompressed media, and render-blocking scripts.',
    overview: [
      'Google explicitly penalizes slow websites in organic search rankings. When Largest Contentful Paint (LCP) exceeds 2.5 seconds or Cumulative Layout Shift (CLS) causes jumpy layouts, bounce rates double and revenue evaporates.',
      'We do not simply install caching plugins: we diagnose performance at the browser rendering engine, HTTP network, and server runtime levels. We analyze flame charts, optimize V8 execution time, and eliminate render-blocking JavaScript.',
      'From legacy WordPress speed rehabilitations to complex React hydration optimizations, we deliver measurable, verifiable speed scores across both mobile and desktop devices.',
    ],
    deliverables: [
      {
        title: 'Deep Performance & Flame Chart Audit',
        desc: 'Identifying CPU bottlenecks, main-thread blocking JavaScript, excessive DOM depth, and redundant network requests.',
      },
      {
        title: 'Core Web Vitals Remediation (LCP, CLS, INP)',
        desc: 'Engineering sub-2.5s LCP, zero Cumulative Layout Shift, and Interaction to Next Paint (INP) under 100ms.',
      },
      {
        title: 'Media Pipeline & Next-Gen Formats',
        desc: 'Automating WebP/AVIF conversions, responsive image srcsets, and adaptive loading for mobile cellular networks.',
      },
      {
        title: 'Server-Side & Edge Caching Architecture',
        desc: 'Configuring Cloudflare caching rules, stale-while-revalidate headers, Redis object caching, and database query indexation.',
      },
    ],
    techStack: [
      'Chrome DevTools Profiler',
      'Google Lighthouse CI',
      'WebPageTest Private Agents',
      'Next.js Dynamic Imports & Streaming',
      'Cloudflare Edge Cache & Workers',
      'Redis Query Caching',
      'Brotli & Gzip Compression',
      'Critical CSS Inlining',
    ],
    process: [
      {
        step: '01',
        title: 'Baseline Profiling & Waterfall Capture',
        desc: 'Capturing real-user monitoring metrics, throttling tests on 4G networks, and mapping third-party script overhead.',
      },
      {
        step: '02',
        title: 'Script De-bloating & Critical Path Inlining',
        desc: 'Removing dead JavaScript bundles, deferring analytics trackers, and inlining critical CSS above the fold.',
      },
      {
        step: '03',
        title: 'Server TTFB & Database Indexing',
        desc: 'Optimizing SQL query execution times, activating bytecode opcache, and routing traffic through edge networks.',
      },
      {
        step: '04',
        title: 'Verification & CI Regression Prevention',
        desc: 'Running before-and-after benchmark reports and setting performance budgets in automated deployment pipelines.',
      },
    ],
    highlights: [
      'Guaranteed 90+ mobile PageSpeed scores',
      'Sub-500ms Time To First Byte (TTFB)',
      'Zero layout shifts (CLS < 0.05)',
      'Detailed before-and-after Lighthouse verification reports',
    ],
    faqs: [
      {
        q: 'Can you speed up our WordPress website without breaking existing features?',
        a: 'Yes! We audit every active plugin, de-queue unneeded scripts on pages where they are not used, optimize images and database tables, and configure server-level caching without modifying your core content.',
      },
      {
        q: 'How does web speed affect our Google organic rankings?',
        a: 'Google uses Core Web Vitals as an official ranking factor. Passing the Core Web Vitals assessment directly improves search ranking eligibility, lowers bounce rates, and boosts Google Ads Quality Scores, reducing cost per click.',
      },
      {
        q: 'What is the turnaround time for a performance remediation project?',
        a: 'Most performance audits and remediations are completed within 3 to 7 business days, with immediate observable speed improvements after deployment.',
      },
    ],
    metaTitle: 'Web Performance Optimization & Core Web Vitals | Prince: Senior IT Consultant',
    metaDescription:
      'Sub-500ms TTFB, 95+ PageSpeed scores, and zero layout shift engineering for Next.js, React, and WordPress websites by Prince.',
  },
];

/**
 * Resolves comprehensive data for all 20 landing page sections for any service.
 * Ensures consistent, high-converting technical copy across static and Supabase-loaded services.
 */
export function resolveService20Sections(service: ServiceData) {
  const isAi = service.slug.includes('ai') || service.category.toLowerCase().includes('ai');
  const isCms = service.slug.includes('cms') || service.category.toLowerCase().includes('cms') || service.slug.includes('wordpress');
  const isPerf = service.slug.includes('performance') || service.slug.includes('speed');
  const isEcom = service.slug.includes('ecommerce') || service.slug.includes('commerce');
  const isSeo = service.slug.includes('seo') || service.category.toLowerCase().includes('seo');
  const isDesign = service.slug.includes('ui-ux') || service.category.toLowerCase().includes('design');

  const problemsSolved: ServiceProblemSolution[] = service.problemsSolved || [
    {
      problem: 'Sluggish performance, bloated legacy codebases, and poor user retention.',
      solution: 'Clean, hand-crafted architectural engineering delivering sub-second response times and rock-solid reliability.',
    },
    {
      problem: 'High agency fees, junior staff delegation, and communication delays.',
      solution: 'Direct collaboration with a senior systems engineer who writes production code and takes personal accountability.',
    },
    {
      problem: 'Friction in scaling, vendor lock-in, and opaque proprietary code.',
      solution: 'Strictly typed, open-standard modular codebases with 100% intellectual property ownership transferred to you.',
    },
    {
      problem: 'Disjointed toolchains and manual operational overhead.',
      solution: 'Automated, event-driven integrations connecting your frontend, APIs, databases, and third-party SaaS tools.',
    },
  ];

  const whoNeedsThis: string[] = service.whoNeedsThis || [
    'Fast-growing tech companies and startups needing enterprise-grade technical execution without agency overhead.',
    'Established businesses struggling with legacy codebase bloat, slow page loads, and fragile architecture.',
    'Product and marketing leaders who require sub-second Core Web Vitals and high-converting conversion funnels.',
    'Founders looking for a dependable senior technical partner to design, build, and deploy production software.',
  ];

  const capabilities: { title: string; desc: string }[] = service.capabilities || service.deliverables.map((d) => ({
    title: d.title,
    desc: d.desc,
  }));

  const architectureWorkflow: ServiceArchitectureStep[] = service.architectureWorkflow || [
    {
      step: 'Layer 1',
      layer: 'Edge Presentation & Client Layer',
      desc: 'Next.js 16 server components, static generation, asset streaming, and edge caching for sub-500ms initial page delivery.',
    },
    {
      step: 'Layer 2',
      layer: 'API & Business Logic Microservices',
      desc: 'Strictly typed TypeScript or Python endpoints validating payloads against deterministic schemas with zero-trust token auth.',
    },
    {
      step: 'Layer 3',
      layer: 'Data Persistence & Caching Tier',
      desc: 'Normalized Supabase PostgreSQL tables, Redis in-memory session caching, and secure cloud blob storage via Cloudflare R2.',
    },
    {
      step: 'Layer 4',
      layer: 'Telemetry & Guardrail Monitoring',
      desc: 'Automated health endpoints, structured error telemetry, rate limiting, and continuous performance regression testing.',
    },
  ];

  const integrations: string[] = service.integrations || [
    'Supabase & PostgreSQL',
    'Stripe & Razorpay Billing',
    'Cloudflare Edge & R2',
    'HubSpot & Salesforce CRM',
    'OpenAI & Google Gemini APIs',
    'GitHub CI/CD Pipelines',
    'Redis Distributed Caching',
    'Webhook Automation Endpoints',
  ];

  const securityStandards: string[] = service.securityStandards || [
    'Zero-trust cryptographic API authentication and role-based access control.',
    'Complete sanitization of all request inputs with Zod/Pydantic schemas.',
    'Strict HTTP security headers: Content-Security-Policy, HSTS, and CORS enforcement.',
    'Automated rate-limiting on all public endpoints to prevent abuse and DDoS attacks.',
    'Zero plain-text secret storage with strict cloud environment isolation.',
  ];

  const useCases: ServiceUseCase[] = service.useCases || [
    {
      title: 'High-Growth Platform Launch',
      scenario: 'A company needs a scalable, high-converting digital platform deployed in weeks with sub-second page loads.',
      outcome: 'Engineered a bespoke system with 98+ PageSpeed scores, seamless payment integrations, and zero maintenance headaches.',
    },
    {
      title: 'Legacy System Modernization',
      scenario: 'An existing application is sluggish, crashes under load, and suffers from bloated technical debt.',
      outcome: 'Refactored architecture into modular services, cutting latency by 70% and slashing server infrastructure costs.',
    },
    {
      title: 'Automated Operations & Workflow Scaling',
      scenario: 'A business is losing hours daily on manual data entry, customer routing, and disconnected toolchains.',
      outcome: 'Deployed event-driven autonomous pipelines that save 20+ team hours weekly with zero data entry errors.',
    },
  ];

  const industries: ServiceIndustryApp[] = service.industries || [
    { name: 'SaaS & Technology Startups', impact: 'Sub-second onboarding flows, API integrations, and scalable multi-tenant backends.' },
    { name: 'E-Commerce & D2C Brands', impact: 'Frictionless checkout pipelines, instant catalog browsing, and conversion rate optimization.' },
    { name: 'Professional & Legal Services', impact: 'Secure client portals, automated document intake, and high-trust digital presentation.' },
    { name: 'Healthcare & Local Clinics', impact: 'HIPAA-conscious appointment booking, local search dominance, and responsive mobile UX.' },
  ];

  const comparison: ServiceComparisonItem[] = service.comparison || [
    {
      metric: 'Source Code Ownership',
      heyprince: '100% full intellectual property ownership transferred to client on day one.',
      traditionalAgency: 'Proprietary lock-in or licensing agreements requiring recurring retainers.',
      offTheShelf: 'Rented platform with zero ownership and constant monthly price hikes.',
    },
    {
      metric: 'Engineering Point of Contact',
      heyprince: 'Direct access to senior systems engineer who writes the production code.',
      traditionalAgency: 'Junior developers routed through non-technical account managers.',
      offTheShelf: 'Automated chatbots and community ticket forums with delayed support.',
    },
    {
      metric: 'Page Speed & Core Web Vitals',
      heyprince: 'Sub-500ms TTFB, 95+ mobile Lighthouse score, and zero layout shift.',
      traditionalAgency: 'Bloated themes with 30+ plugins averaging 35-55 speed scores.',
      offTheShelf: 'Unpredictable speed constrained by shared platform infrastructure.',
    },
    {
      metric: 'Architecture & Scalability',
      heyprince: 'Strictly typed TypeScript/Python, normalized databases, and modular architecture.',
      traditionalAgency: 'Spaghetti code copied across projects without documentation.',
      offTheShelf: 'Rigid walled-garden architecture impossible to customize deeply.',
    },
    {
      metric: 'Communication Velocity',
      heyprince: 'Asynchronous updates via WhatsApp/Slack with same-day turnaround.',
      traditionalAgency: 'Endless status meetings, change order bureaucracy, and scope creep.',
      offTheShelf: 'Self-serve documentation with zero customized advisory.',
    },
  ];

  const pricingMilestones: ServicePricingMilestone[] = service.pricingMilestones || [
    {
      phase: 'Phase 1: Architecture & Technical Discovery',
      focus: 'System mapping, database schema design, wireframes, and fixed milestone scope.',
      turnaround: 'Days 1 to 3',
    },
    {
      phase: 'Phase 2: Core Engineering & Integrations',
      focus: 'Full-stack development, API wiring, database migrations, and UI implementation.',
      turnaround: 'Days 4 to 12',
    },
    {
      phase: 'Phase 3: Security Audits & Performance Tuning',
      focus: 'Lighthouse 95+ optimization, stress testing, edge caching, and mobile QA.',
      turnaround: 'Days 13 to 16',
    },
    {
      phase: 'Phase 4: Production Launch & Senior Handover',
      focus: 'Zero-downtime DNS deployment, SSL provisioning, git repo transfer, and documentation.',
      turnaround: 'Day 17 onwards',
    },
  ];

  return {
    hero: {
      title: service.title,
      shortTitle: service.shortTitle,
      tagline: service.tagline,
      category: service.category,
      isFeatured: Boolean(service.isFeatured),
      featuredBadge: service.featuredBadge,
      heroDescription: service.heroDescription,
      iconName: service.iconName,
    },
    overview: service.overview,
    problemsSolved,
    whoNeedsThis,
    coreScope: service.deliverables,
    capabilities,
    architectureWorkflow,
    techStack: service.techStack,
    process: service.process,
    deliverables: service.deliverables,
    integrations,
    securityStandards,
    useCases,
    industries,
    comparison,
    pricingMilestones,
    faqs: service.faqs,
    highlights: service.highlights,
  };
}

