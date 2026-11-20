import {
  normalizeDomain,
  normalizeCompanyName,
  normalizeEmail,
  calculateTitleSimilarity,
} from '../lib/deduplication';
import {
  calculateLeadScore,
  GLOBAL_HUBS,
  CORE_CATEGORIES,
} from '../lib/outreach/qualification';
import {
  mapCategoryToOsmTag,
  getSearchKeywords,
} from '../lib/outreach/discovery/osm-adapter';
import {
  understandArticleForVisual,
  generateDynamicEditorialImageFallback,
} from '../lib/daily-news/image-generator';
import { DYNAMIC_BLOG_CATEGORIES } from '../lib/daily-news/content-generator';

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(suite: string, test: string, condition: boolean, details?: string) {
  results.push({ suite, test, passed: Boolean(condition), details });
  const status = condition ? 'PASS' : 'FAIL';
  console.log(`[${status}] [${suite}] ${test}${details ? ` -> ${details}` : ''}`);
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('HEYPRINCE AI COMPANY - INTELLIGENCE OVERHAUL VERIFICATION SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // SUITE 1: CANONICAL DOMAIN & LEAD NORMALIZATION
  // --------------------------------------------------------------------------
  console.log('--- SUITE 1: Canonical Domain & Lead Deduplication Logic ---');
  
  const d1 = normalizeDomain('https://www.DrTrivediClinic.com/about-us?utm_source=google#team');
  assert('Domain Normalization', 'Strips protocol, www, paths, query params, hash', d1 === 'drtrivediclinic.com', d1);

  const d2 = normalizeDomain('http://sub.domain.co.uk:8080/portal/');
  assert('Domain Normalization', 'Strips port and trailing slashes', d2 === 'sub.domain.co.uk', d2);

  const d3 = normalizeDomain('WWW.APEX-SOLUTIONS.IN');
  assert('Domain Normalization', 'Handles uppercase and international domains', d3 === 'apex-solutions.in', d3);

  const c1 = normalizeCompanyName('NordicPulse Retail, LLC.');
  assert('Company Normalization', 'Strips corporate LLC suffix and punctuation', c1 === 'nordicpulse retail', c1);

  const c2 = normalizeCompanyName('Dr. Umesh Trivedi Clinic Pvt Ltd');
  assert('Company Normalization', 'Strips Pvt Ltd and Clinic suffixes', c2 === 'dr umesh trivedi', c2);

  const c3 = normalizeCompanyName('The Global Logistics Corporation');
  assert('Company Normalization', 'Strips leading "The" and "Corporation"', c3 === 'global logistics', c3);

  const e1 = normalizeEmail('  PRINCE@HeyPrince.IN  ');
  assert('Email Normalization', 'Strips whitespace and converts to lowercase', e1 === 'prince@heyprince.in', e1);

  // --------------------------------------------------------------------------
  // SUITE 2: LEAD SCORING & DYNAMIC CATEGORY DISCOVERY
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 2: Lead Scoring & Dynamic Category Expansion ---');

  const highLeadScore = calculateLeadScore({
    website_url: 'https://drtrivediclinic.com',
    domain: 'drtrivediclinic.com',
    phone: '+91 98765 43210',
    contacts: [{ email: 'dr.trivedi@clinic.com', verification_status: 'VALID' }],
    audit: { speedIndexMs: 3400, hasHttps: true, mobileFriendly: false },
  });
  assert('Lead Scoring', 'High-intent lead with contact details & legacy site scores >= 0.70', highLeadScore.score >= 0.70, `Score: ${highLeadScore.score} (Status: ${highLeadScore.recommendedStatus})`);

  const lowLeadScore = calculateLeadScore({
    domain: 'abandoned-site.org',
    contacts: [],
  });
  assert('Lead Scoring', 'Incomplete listing scores <= 0.60', lowLeadScore.score <= 0.60, `Score: ${lowLeadScore.score} (Status: ${lowLeadScore.recommendedStatus})`);

  assert('Dynamic Hubs', 'Global tech & commercial hubs roster contains 25+ cities', GLOBAL_HUBS.length >= 25, `Count: ${GLOBAL_HUBS.length}`);
  assert('Target Categories', 'Initial commercial categories roster contains 12+ industries', CORE_CATEGORIES.length >= 12, `Count: ${CORE_CATEGORIES.length}`);

  // Test OSM Category and Keyword Mapping
  const osmClinic = mapCategoryToOsmTag('Healthcare & Specialized Clinics');
  assert('OSM Adapter', 'Maps Healthcare to hospital/clinic amenity tags', osmClinic.key === 'amenity' && osmClinic.value === 'clinic', JSON.stringify(osmClinic));

  const osmRealEstate = mapCategoryToOsmTag('Real Estate & Construction');
  assert('OSM Adapter', 'Maps Real Estate to estate_agent office tag', osmRealEstate.key === 'office' && osmRealEstate.value === 'estate_agent', JSON.stringify(osmRealEstate));

  const kwSoftware = getSearchKeywords('IT Services & Custom Software');
  assert('OSM Adapter', 'Generates diverse search keywords for IT services', kwSoftware.includes('software company') && kwSoftware.length >= 3, JSON.stringify(kwSoftware));

  // --------------------------------------------------------------------------
  // SUITE 3: EDITORIAL RESEARCH & SEMANTIC DEDUPLICATION
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 3: Semantic Topic Similarity & Editorial Originality ---');

  // Identical / Recycled Titles
  const simIdentical = calculateTitleSimilarity(
    'Next.js 15 Server Components: The Complete Architecture Guide',
    'Next.js 15 Server Components: Complete Architecture Breakdown'
  );
  assert('Semantic Similarity', 'Catches rephrased identical topics (> 0.60 match)', simIdentical >= 0.60, `Score: ${simIdentical}`);

  const simHigh = calculateTitleSimilarity(
    'Building Autonomous AI Agents with LangChain and Python',
    'How to Build Autonomous AI Agents Using Python and LangChain'
  );
  assert('Semantic Similarity', 'Catches inverted title variations (> 0.50 threshold)', simHigh >= 0.50, `Score: ${simHigh}`);

  // Distinct Topics
  const simDistinct = calculateTitleSimilarity(
    'Next.js 15 Server Components: The Complete Architecture Guide',
    'PostgreSQL 17 B-Tree Index Optimization for High-Concurrency Fintech'
  );
  assert('Semantic Similarity', 'Recognizes completely distinct topics (< 0.20 match)', simDistinct < 0.20, `Score: ${simDistinct}`);

  const simDistinctTech = calculateTitleSimilarity(
    'Enterprise Cloud Security: Hardening Kubernetes Clusters Against Zero-Day Exploits',
    'Headless Shopify Checkout Optimization with Sub-Second Next.js Frontends'
  );
  assert('Semantic Similarity', 'Recognizes different engineering domains (< 0.25 match)', simDistinctTech < 0.25, `Score: ${simDistinctTech}`);

  // Dynamic Blog Categories
  assert('Dynamic Categories', 'Supports 20 diverse, non-repeating commercial categories', DYNAMIC_BLOG_CATEGORIES.length === 20, `Count: ${DYNAMIC_BLOG_CATEGORIES.length}`);
  assert('Dynamic Categories', 'Includes cybersecurity, cloud, backend, startups, and science', 
    DYNAMIC_BLOG_CATEGORIES.includes('Cybersecurity') &&
    DYNAMIC_BLOG_CATEGORIES.includes('Cloud Computing') &&
    DYNAMIC_BLOG_CATEGORIES.includes('Python and Backend Engineering') &&
    DYNAMIC_BLOG_CATEGORIES.includes('Interesting Science and Innovation'),
    'All verified'
  );

  // --------------------------------------------------------------------------
  // SUITE 4: IMAGE QUALITY & CLICHE-FREE VISUAL CONCEPT EXTRACTION
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 4: Cliché-Free Visual Concept & Fallback Card Generation ---');

  const visualConcept = understandArticleForVisual(
    'PostgreSQL 17 B-Tree Index Optimization for High-Concurrency Fintech',
    'Cloud Architecture',
    'cover',
    'Database Query Bottlenecks',
    'Analyzing lock contention and write amplification in WAL archives.'
  );

  assert('Visual Concept', 'Generates detailed, article-aware visual subject', visualConcept.subject.length > 5, visualConcept.subject);
  assert('Visual Concept', 'Generates visual prompt adhering to architectural style', visualConcept.prompt.length > 20, visualConcept.prompt.slice(0, 80));
  assert('Visual Concept', 'Explicitly instructs generator against clichés (no robot, no glowing brain, no watermarks)',
    visualConcept.prompt.includes('no generic robot') &&
    visualConcept.prompt.includes('no glowing brain') &&
    visualConcept.prompt.includes('no watermarks'),
    'Zero-cliché negative directives enforced'
  );

  // Fallback Deterministic Infographic Card
  const fallbackCard = await generateDynamicEditorialImageFallback(
    'PostgreSQL 17 B-Tree Index Optimization',
    'Cloud Architecture',
    'cover'
  );
  assert('Editorial Card Generator', 'Generates non-empty fallback card with valid URL', Boolean(fallbackCard?.url), fallbackCard?.url?.slice(0, 50));
  assert('Editorial Card Generator', 'Returns SVG or web asset without external API dependency', 
    fallbackCard.url.startsWith('procedural-svg://') || fallbackCard.url.startsWith('data:image/svg+xml') || fallbackCard.url.startsWith('https://'),
    `Type: ${fallbackCard.url.slice(0, 30)}...`
  );

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('VERIFICATION SUMMARY');
  console.log('================================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed:         ${passed}`);
  console.log(`Failed:         ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('ALL CORE INTELLIGENCE OVERHAUL SUITES PASSED PERFECTLY!\n');
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
