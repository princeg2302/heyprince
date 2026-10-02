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
    year: '2025',
    left: 'calc(100% - (0 * 9%))',
    text: 'Frontend Pro & Creative Innovator — bringing bold, fresh ideas to life with elite modern UI/UX, seamless animations, robust code, and next-gen web technologies.',
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
      'Freelancing tips for IT professionals are more important than ever in 2026 because the market is growing fast, but the competition is growing even faster.',
    readMins: '5 min',
    image: 'https://heyprince.in/wp-content/uploads/2026/01/Screenshot_1-1024x590.jpg',
    url: '#/blog/freelancing-tips-it-professionals-2026',
    date: 'January 18, 2026',
    category: 'Freelancing & Career',
    author: {
      name: 'Prince',
      role: 'Creative Web Engineer & IT Consultant',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    tags: ['Freelancing', 'Career Growth', 'IT Industry', 'Remote Work', 'Value Pricing'],
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
          'Position yourself around a sharp value proposition. When a client encounters a high-stakes problem, you want to be the obvious, undisputed specialist they call first.',
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
          'Structure your pricing around value or tiered milestones with clear deliverables. Retainers providing ongoing advisory and continuous optimization provide reliable baseline income while giving clients peace of mind.',
        ],
        quote: 'Proactive communication turns good developers into legendary partners that clients refuse to lose.',
      },
    ],
  },
  {
    slug: 'choose-it-services-provider',
    title: 'How to Choose the Right IT Services Provider for Your Business',
    description:
      'Choosing the right IT services provider is one of the most important decisions your business can make.',
    readMins: '6 min',
    image: 'https://heyprince.in/wp-content/uploads/2026/01/Screenshot_2-1024x614.jpg',
    url: '#/blog/choose-it-services-provider',
    date: 'January 25, 2026',
    category: 'Business Strategy',
    author: {
      name: 'Prince',
      role: 'Creative Web Engineer & IT Consultant',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    tags: ['IT Services', 'Vendor Selection', 'Business Growth', 'Tech Partner', 'Architecture'],
    sections: [
      {
        heading: '1. Why Your Choice of Tech Partner Defines Your Trajectory',
        paragraphs: [
          'Technology is no longer a peripheral support department — for virtually every modern enterprise, technology IS the business. Choosing the wrong IT provider leads to bloated budgets, endless delays, security liabilities, and sluggish software that drives customers straight to competitors.',
          'A true IT partner acts as an extension of your leadership team: challenging flawed assumptions, identifying edge cases early, and choosing technologies that scale cost-effectively as your transaction volume multiplies.',
        ],
        quote: 'Cheap engineering is the most expensive mistake a growing business can ever make.',
      },
      {
        heading: '2. Technical Depth vs. Problem Understanding',
        paragraphs: [
          'Beware of agencies that immediately say "yes" to every single feature request without asking about your business model, customer journey, or monetization funnel. A competent IT engineer understands that the best code is often the code you never had to write.',
          'Look for providers who invest time in discovery sessions, interactive prototyping, and system design before jumping into implementation.',
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
          'Demand clean Git version control, continuous integration pipelines, automated test suites, and transparent communication channels throughout development.',
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
      'A professional website is one of the most important assets for any business that wants to grow, build trust, and attract customers.',
    readMins: '4 min',
    image: 'https://heyprince.in/wp-content/uploads/2026/01/Screenshot_3-1024x590.jpg',
    url: '#/blog/professional-website-2026',
    date: 'February 4, 2026',
    category: 'Web Engineering',
    author: {
      name: 'Prince',
      role: 'Creative Web Engineer & IT Consultant',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    tags: ['Web Design', 'Conversion Rate', 'UI/UX', 'SEO', 'Brand Trust'],
    sections: [
      {
        heading: '1. First Impressions Happen in 50 Milliseconds',
        paragraphs: [
          'Research consistently shows that visitors form an opinion about your business within 50 milliseconds of landing on your website. In 2026, a generic, template-cluttered page signals negligence, while a bespoke, ultra-responsive digital experience builds immediate authority and trust.',
          'Your website is the single digital asset that you completely own and control — unaffected by social media algorithm changes, ad platform bans, or third-party fee increases.',
        ],
        quote: 'Your website is working 24 hours a day, 7 days a week, 365 days a year as your hardest-working salesperson. Give it the tools to win.',
      },
      {
        heading: '2. The Direct Correlation Between Performance and Revenue',
        paragraphs: [
          'Google Core Web Vitals are more stringent than ever in 2026. Every 100ms of latency reduction directly correlates with measurable conversion gains. If your page takes 3 seconds to load, over 50% of mobile visitors have already bounced back to the search results.',
          'Professional engineering ensures clean semantic HTML, optimized asset pipelines, modern responsive imagery, and minimal JavaScript overhead so your pages render instantly on any connection.',
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
          'When you invest in a professional website, you are not buying pixels — you are engineering a customer acquisition engine that compounds in value over time.',
        ],
      },
    ],
  },
  {
    slug: 'web-development-trends-2026',
    title: 'Top Web Development Trends Every Business Should Follow in 2026',
    description:
      'Understand the web development trends shaping modern digital experiences, from AI-powered websites to enhanced security.',
    readMins: '7 min',
    image: 'https://heyprince.in/wp-content/uploads/2026/01/Screenshot_4-1024x591.jpg',
    url: '#/blog/web-development-trends-2026',
    date: 'February 12, 2026',
    category: 'Tech Trends & Innovation',
    author: {
      name: 'Prince',
      role: 'Creative Web Engineer & IT Consultant',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    tags: ['Web Trends', 'AI Integrations', 'Fluid Motion', 'Physics UI', 'Cyber Security'],
    sections: [
      {
        heading: '1. Physics-Based UI and Tactile Web Interactions',
        paragraphs: [
          'Static, flat interfaces are being superseded by tactile, physics-driven web environments. Users love interacting with elements that exhibit real-world inertia, gravity, elasticity, and spring dynamics (like the bouncing tech capsules on this very site!).',
          'When digital interfaces respond with organic weight and feedback, engagement times skyrocket and brand recall reaches unprecedented heights.',
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
          'Forward-thinking brands are leveraging lightweight 3D assets, custom shaders, and particle physics to build unforgettable storytelling experiences.',
        ],
      },
      {
        heading: '4. Zero-Trust Web Security and Privacy-First Engineering',
        paragraphs: [
          'With increasing automated web attacks and stricter privacy compliance regulations worldwide, client-side security is paramount. Modern web applications require Content Security Policies (CSP), sanitization pipelines, end-to-end encrypted form handling, and strict token lifecycle management.',
          'A modern web architecture guarantees peace of mind for both you and your users.',
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

export const bannerTechPills: TechPill[] = [
  { name: 'HTML', image: htmlImg },
  { name: 'CSS', image: cssImg },
  { name: 'JavaScript', image: jsImg },
  { name: 'ReactJS', image: reactjsImg },
  { name: 'Node.js', image: nodejsImg },
  { name: 'Python', image: pythonImg },
  { name: 'PHP', image: phpImg },
  { name: 'WordPress', image: wordpressImg },
  { name: 'Shopify', image: shopifyImg },
  { name: 'jQuery', image: jqueryImg },
];

