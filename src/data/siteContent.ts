import htmlImg from '../assets/techs/html.webp';
import cssImg from '../assets/techs/css.webp';
import jsImg from '../assets/techs/javascript.webp';
import reactjsImg from '../assets/techs/reactjs.webp';
import nodejsImg from '../assets/techs/nodejs.webp';
import pythonImg from '../assets/techs/python.webp';
import phpImg from '../assets/techs/php.webp';
import wordpressImg from '../assets/techs/wordpres.webp';
import shopifyImg from '../assets/techs/shopify.webp';
import jqueryImg from '../assets/techs/jquery.webp';

export interface Milestone {
  pos: number;
  year: string;
  left: string;
  text: string;
}

export const timelineMilestones: Milestone[] = [
  {
    pos: 1,
    year: '2010',
    left: '0%',
    text: 'The spark ignited — fascinated by how computers and websites worked, exploring the digital world, and taking my very first steps into technology.',
  },
  {
    pos: 2,
    year: '2014',
    left: 'calc(100% - (8 * 9%))',
    text: 'Curiosity & searching for direction — tinkering with computers and hardware, exploring different fields, and trying to understand what path to pursue in life.',
  },
  {
    pos: 3,
    year: '2015',
    left: 'calc(100% - (7 * 9%))',
    text: 'Exploring the future & discovering code — actively trying to explore what to do in the future, testing different paths until I found web design, realizing code was my true calling.',
  },
  {
    pos: 4,
    year: '2016',
    left: 'calc(100% - (6 * 9%))',
    text: 'Balancing studies with passion — along with my academic studies, I was up late every night learning new technologies, web fundamentals, and modern developer tools.',
  },
  {
    pos: 5,
    year: '2017',
    left: 'calc(100% - (5 * 9%))',
    text: 'Building real projects from scratch — diving deeper into JavaScript, experimenting with CSS animations, and turning static concepts into functional digital pages.',
  },
  {
    pos: 6,
    year: '2018',
    left: 'calc(100% - (4 * 9%))',
    text: 'Kickstarted my career in IT — writing my very first production code with HTML, CSS & JavaScript, turning my passion into a full-fledged profession in tech.',
  },
  {
    pos: 7,
    year: '2019',
    left: 'calc(100% - (3 * 9%))',
    text: 'Accelerating as a web engineer — mastering frontend workflows, building dynamic web solutions, custom themes, and solving complex client challenges.',
  },
  {
    pos: 8,
    year: '2021',
    left: 'calc(100% - (2 * 9%))',
    text: 'Leveling up modern UI/UX — crafting ultra-smooth, animated web experiences with React, GSAP motion, interactive components, and lightning-fast speed.',
  },
  {
    pos: 9,
    year: '2023',
    left: 'calc(100% - (1 * 9%))',
    text: 'Architecting scalable digital products — designing full-featured web applications, optimizing performance, and integrating modern workflows with creative engineering.',
  },
  {
    pos: 10,
    year: '2026',
    left: 'calc(100% - (0 * 9%))',
    text: 'Senior Full Stack IT Consultant & AI Innovator — empowering founders and enterprises with high-performance Next.js apps, bespoke CMS engineering, autonomous AI workflows, and sub-second web experiences.',
  },
];

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  bulletPoints?: string[];
  quote?: string;
  proTip?: string;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  readMins: string;
  image: string;
  url: string;
  date: string;
  category: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  tags: string[];
  sections: ArticleSection[];
}

export const articlesList: Article[] = [
  {
    slug: 'freelancing-tips-it-professionals-2026',
    title: 'Essential Freelancing Tips for IT Professionals in 2026',
    description:
      'Actionable freelancing tips for IT professionals in 2026: AI-augmented workflows, domain specialization, value-based pricing, and scalable client retention.',
    readMins: '5 min',
    image: '/assets/blog/photo1.webp',
    url: '/freelancing-tips-it-professionals-2026/',
    date: 'January 18, 2026',
    category: 'Freelancing & Career',
    author: {
      name: 'Prince',
      role: 'Senior Full Stack Engineer & IT Consultant',
      avatar: 'https://heyprince.in/wp-content/uploads/2025/09/cropped-prince-profile.webp',
    },
    tags: ['Freelancing Tips', 'IT Freelancing 2026', 'Career Growth', 'Remote Tech Partner', 'Value Pricing', 'Full Stack Consultant'],
    sections: [
      {
        heading: '1. The Shifting Landscape of IT Freelancing in 2026',
        paragraphs: [
          'The tech freelance economy has completely reinvented itself over the past two years. In 2026, clients are no longer just hiring extra pairs of hands to write boilerplate code. With AI coding assistants automating basic tasks, the demand has pivoted violently toward engineers who understand product architecture, business outcomes, and high-performance user experience.',
          'To command premium rates, freelancers must shift from selling hours to selling outcomes. A client does not care if a feature took 4 hours or 40 hours; they care whether it increases conversion, reduces churn, and loads instantaneously across global networks.',
        ],
        quote: 'In 2026, you are not paid for the code you type; you are paid for the problems you prevent and the revenue you generate.',
      },
      {
        heading: '2. Master AI-Augmented Development Workflows',
        paragraphs: [
          'The biggest mistake a modern developer can make is resisting AI. Top-earning freelancers use AI as a force multiplier to draft unit tests, optimize queries, explore architectural patterns, and refactor legacy code in minutes rather than days.',
          'When you deliver a project 3x faster with 0 regressions, your clients view you as an indispensable strategic partner rather than a replaceable contractor.',
        ],
        bulletPoints: [
          'Integrate intelligent CLI workflows for instant automated audits and test generation.',
          'Focus your intellectual energy on high-level architecture, user experience, and domain logic.',
          'Document code relentlessly — clear documentation is what turns one-off gigs into multi-year retainers.',
        ],
        proTip: 'Always audit AI output with strict manual code reviews. Clients pay premium rates for verified quality, not unvetted generated code.',
      },
      {
        heading: '3. Specialize and Cultivate Deep Domain Expertise',
        paragraphs: [
          'The era of the generic "full-stack developer who does everything" is fading. Clients seek specialists: the engineer who builds buttery-smooth 60fps web animation experiences, the consultant who turns sluggish monolithic apps into sub-second cloud architectures, or the e-commerce mastermind who optimizes checkout conversion.',
          'Whether you are engineering a [high-performance professional website](/professional-website-2026/) or leading enterprise cloud migration, focus on delivering measurable client outcomes. Position yourself around a sharp value proposition.',
        ],
        bulletPoints: [
          'Identify your superpower: motion design, cloud performance, or interactive full-stack systems.',
          'Create in-depth case studies illustrating before-and-after business metrics.',
          'Publish breakdown articles and open-source mini-tools showcasing your engineering taste.',
        ],
      },
      {
        heading: '4. Master Client Communication and Transparent Pricing',
        paragraphs: [
          'Over 80% of client frustrations in freelance engagements stem from poor communication rather than code bugs. Establish a weekly demo rhythm, send proactive asynchronous video updates, and clarify scope assumptions before touching a single line of code.',
          'Understanding the buyer perspective is critical — review our guide on [how businesses choose the right IT services provider](/choose-it-services-provider/) to structure your advisory offerings effectively.',
        ],
        quote: 'Proactive communication turns good developers into legendary partners that clients refuse to lose.',
      },
    ],
  },
  {
    slug: 'choose-it-services-provider',
    title: 'How to Choose the Right IT Services Provider for Your Business',
    description:
      'A strategic guide on choosing the right IT services provider in 2026: evaluate technical depth, avoid costly agency mistakes, and scale with true partners.',
    readMins: '6 min',
    image: '/assets/blog/photo2.webp',
    url: '/choose-it-services-provider/',
    date: 'January 25, 2026',
    category: 'Business Strategy',
    author: {
      name: 'Prince',
      role: 'Senior Full Stack Engineer & IT Consultant',
      avatar: 'https://heyprince.in/wp-content/uploads/2025/09/cropped-prince-profile.webp',
    },
    tags: ['IT Services Provider', 'Vendor Selection', 'Tech Partner', 'Software Development', 'Cloud Architecture', 'IT Consulting'],
    sections: [
      {
        heading: '1. Why Your Choice of Tech Partner Defines Your Trajectory',
        paragraphs: [
          'Technology is no longer a peripheral support department — for virtually every modern enterprise, technology IS the business. Choosing the wrong IT provider leads to bloated budgets, endless delays, security liabilities, and sluggish software that drives customers straight to competitors.',
          'A technology partner must keep your stack aligned with [emerging web development trends](/web-development-trends-2026/), eliminating technical debt before it stalls product momentum.',
        ],
        quote: 'Cheap engineering is the most expensive mistake a growing business can ever make.',
      },
      {
        heading: '2. Technical Depth vs. Problem Understanding',
        paragraphs: [
          'Beware of agencies that immediately say "yes" to every single feature request without asking about your business model, customer journey, or monetization funnel. A competent IT engineer understands that the best code is often the code you never had to write.',
          'Investing in a [modern, professional website](/professional-website-2026/) engineered for conversion yields far higher compounding returns than fragile third-party templates. Look for providers who invest time in discovery sessions and system design.',
        ],
        bulletPoints: [
          'Do they ask deep questions about your target user and business KPIs?',
          'Can they clearly articulate trade-offs between speed-to-market and long-term architectural stability?',
          'Do they recommend modern, maintainable stacks rather than obsolete legacy frameworks?',
        ],
        proTip: 'Ask candidates to explain a past technical mistake and how they resolved it. Genuine experts speak openly about lessons learned.',
      },
      {
        heading: '3. Red Flags to Run Away From',
        paragraphs: [
          'If a vendor provides an exact timeline and quote within 5 minutes without examining your requirements, beware. Similarly, if they refuse to grant full source code ownership or demand proprietary vendor lock-in, walk away immediately.',
          'Ready to audit your technical roadmap? [Connect directly with Prince for a technical consultation](/contact/) to discuss your architecture and execution strategy.',
        ],
        bulletPoints: [
          'Absence of a verifiable portfolio or live production reference projects.',
          'Vague statements regarding who will actually write the code vs. offshore subcontracting.',
          'No post-launch warranty, documentation handover, or maintenance SLAs.',
        ],
      },
    ],
  },
  {
    slug: 'professional-website-2026',
    title: 'Why Every Business Needs a Professional Website in 2026',
    description:
      'Why a high-performance professional website is essential in 2026: boost conversion rates, conquer Google Core Web Vitals, and build lasting customer trust.',
    readMins: '4 min',
    image: '/assets/blog/photo3.webp',
    url: '/professional-website-2026/',
    date: 'February 4, 2026',
    category: 'Web Engineering',
    author: {
      name: 'Prince',
      role: 'Senior Full Stack Engineer & IT Consultant',
      avatar: 'https://heyprince.in/wp-content/uploads/2025/09/cropped-prince-profile.webp',
    },
    tags: ['Professional Website 2026', 'Conversion Rate Optimization', 'Core Web Vitals', 'Modern Web Engineering', 'SEO Strategy', 'Brand Authority'],
    sections: [
      {
        heading: '1. First Impressions Happen in 50 Milliseconds',
        paragraphs: [
          'Research consistently shows that visitors form an opinion about your business within 50 milliseconds of landing on your website. In 2026, a generic, template-cluttered page signals negligence, while a bespoke, ultra-responsive digital experience builds immediate authority and trust.',
          'Adopting [modern web development trends](/web-development-trends-2026/) like fluid motion and zero-trust security transforms a simple portfolio into an engaging brand powerhouse. Your website is the single digital asset that you completely own and control.',
        ],
        quote: 'Your website is working 24 hours a day, 7 days a week, 365 days a year as your hardest-working salesperson. Give it the tools to win.',
      },
      {
        heading: '2. The Direct Correlation Between Performance and Revenue',
        paragraphs: [
          'Google Core Web Vitals are more stringent than ever in 2026. Every 100ms of latency reduction directly correlates with measurable conversion gains. If your page takes 3 seconds to load, over 50% of mobile visitors have already bounced back to the search results.',
          'When selecting an engineering partner to architect your platform, learn [how to choose the right IT services provider](/choose-it-services-provider/) to ensure architectural longevity and clean code ownership.',
        ],
        bulletPoints: [
          'Sub-second First Contentful Paint (FCP) and optimal Interaction to Next Paint (INP).',
          'Responsive layouts that adapt flawlessly from 4K desktop screens to foldables and compact smartphones.',
          'Micro-animations that guide user attention directly toward high-value conversion actions.',
        ],
        proTip: 'Test your site on a real low-end Android device on 4G. If it lags there, you are losing valuable paying customers every day.',
      },
      {
        heading: '3. Conversion-Driven UX vs. Visual Fluff',
        paragraphs: [
          'A gorgeous website that fails to convert visitors into inquiries is an expensive digital paperweight. Exceptional web design blends bold visual aesthetics with razor-sharp copywriting, intuitive navigation, frictionless forms, and unmistakable calls to action.',
          'Looking to build a lightning-fast custom web app? [Schedule an IT consultation with Prince](/contact/) to discuss your technical specifications and launch roadmap.',
        ],
      },
    ],
  },
  {
    slug: 'web-development-trends-2026',
    title: 'Top Web Development Trends Every Business Should Follow in 2026',
    description:
      'Explore top web development trends in 2026: physics-based interfaces, context-aware AI copilots, smooth View Transitions, and zero-trust frontend security.',
    readMins: '7 min',
    image: '/assets/blog/photo4.webp',
    url: '/web-development-trends-2026/',
    date: 'February 12, 2026',
    category: 'Tech Trends & Innovation',
    author: {
      name: 'Prince',
      role: 'Senior Full Stack Engineer & IT Consultant',
      avatar: 'https://heyprince.in/wp-content/uploads/2025/09/cropped-prince-profile.webp',
    },
    tags: ['Web Development Trends 2026', 'Physics UI', 'AI Integration', 'View Transitions', 'Frontend Architecture', 'Zero Trust Security'],
    sections: [
      {
        heading: '1. Physics-Based UI and Tactile Web Interactions',
        paragraphs: [
          'Static, flat interfaces are being superseded by tactile, physics-driven web environments. Users love interacting with elements that exhibit real-world inertia, gravity, elasticity, and spring dynamics (like the bouncing tech capsules on this very site!).',
          'These fluid mechanics are vital when designing a [high-converting professional website](/professional-website-2026/) that commands user attention and elevates brand recall.',
        ],
        quote: 'Great web design is not just what it looks like — it is how it reacts when touched.',
      },
      {
        heading: '2. Context-Aware AI Chat & Generative Assistants',
        paragraphs: [
          'Clunky rule-based chatbots have been replaced by context-aware AI copilots that understand user intent, analyze user browsing history in real time, and deliver customized product recommendations and answers.',
          'Integrating modern LLM APIs directly into your web applications allows businesses to provide 24/7 personalized concierge support without multiplying headcount.',
        ],
        bulletPoints: [
          'Edge-streamed AI responses with zero latency.',
          'Multimodal search allowing customers to query products via images and natural language.',
          'Automated lead qualification and instant meeting scheduling built into the frontend.',
        ],
        proTip: 'Never show a generic robotic chat icon. Anchor your AI assistant in your brand voice and give it a clean, unobtrusive UI.',
      },
      {
        heading: '3. Next-Gen Animation with GSAP, WebGL & View Transitions',
        paragraphs: [
          'Native browser View Transitions API combined with GSAP ScrollTrigger allows single-page applications to morph seamlessly between pages without jarring blank flashes. Elements smoothly animate from card previews into full-screen hero articles, preserving the user mental model.',
          'Partnering with a seasoned consultant who understands [how to choose the right IT services provider](/choose-it-services-provider/) ensures you integrate these capabilities without unnecessary code bloat.',
        ],
      },
      {
        heading: '4. Zero-Trust Web Security and Privacy-First Engineering',
        paragraphs: [
          'With increasing automated web attacks and stricter privacy compliance regulations worldwide, client-side security is paramount. Modern web applications require Content Security Policies (CSP), sanitization pipelines, end-to-end encrypted form handling, and strict token lifecycle management.',
          'Ready to incorporate advanced frontend security and AI capabilities into your product? [Get in touch with Prince for consultation](/contact/) today.',
        ],
      },
    ],
  },
];


export interface MemoryItem {
  image: string;
  speedClass: string;
}

export const memoriesList: MemoryItem[] = [
  { image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74321/paris-cafe-terrace.jpg', speedClass: 'slower' },
  { image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74321/antiquedollboy.jpg', speedClass: 'faster' },
  { image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74321/windowshopclock.jpg', speedClass: 'slower vertical' },
  { image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74321/swanduckriver.jpg', speedClass: 'slower slower-down' },
  { image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74321/cafe-terrace.jpg', speedClass: '' },
  { image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74321/paris-seine-boat.jpg', speedClass: 'slower' },
  { image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74321/old-man-river.jpg', speedClass: 'faster1' },
  { image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74321/cafe-table-street.jpg', speedClass: 'slower slower2' },
  { image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74321/street-scene-people.jpg', speedClass: '' },
  { image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74321/notre-dame-river-boat.jpg', speedClass: 'slower' },
  { image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/74321/shop-window-reflection.jpg', speedClass: 'slower last' },
];

export interface TechPill {
  name: string;
  image: string;
}

const getStaticSrc = (img: any): string => (typeof img === 'object' && img !== null && 'src' in img ? img.src : String(img));

export const bannerTechPills: TechPill[] = [
  { name: 'HTML', image: getStaticSrc(htmlImg) },
  { name: 'PHP', image: getStaticSrc(phpImg) },
  { name: 'CSS', image: getStaticSrc(cssImg) },
  { name: 'JavaScript', image: getStaticSrc(jsImg) },
  { name: 'ReactJS', image: getStaticSrc(reactjsImg) },
  { name: 'Node.js', image: getStaticSrc(nodejsImg) },
  { name: 'WordPress', image: getStaticSrc(wordpressImg) },
  { name: 'Python', image: getStaticSrc(pythonImg) },
  { name: 'Shopify', image: getStaticSrc(shopifyImg) },
  { name: 'jQuery', image: getStaticSrc(jqueryImg) },
];