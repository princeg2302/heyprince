import assert from 'assert';
import { sanitizeEmDashes, sanitizeAiContent } from '../lib/ai-content-sanitizer';
import { extractCleanSpokenText } from '../lib/jarvis/cleaner';

async function runE2ETests() {
  console.log('=== RUNNING COMPREHENSIVE END-TO-END AI SANITIZER VERIFICATION ===\n');

  // 1. Blog Post & Sections Simulation
  const mockRawArticle = {
    title: 'Modern Cloud Architecture — Building Resilient Systems',
    excerpt: 'Engineering systems for high availability — key trade-offs and patterns.',
    seoTitle: 'Modern Cloud Architecture — Building Resilient Systems | HeyPrince',
    seoDescription: 'High availability architecture — trade-offs and patterns.',
    sections: [
      {
        heading: 'The Microservices Paradox — When to Decouple',
        paragraphs: [
          'Splitting services prematurely leads to latency cascades — network overhead is real.',
          'Consider database locking — distributed transactions degrade throughput.',
        ],
        quote: 'Premature optimization is the root of all evil. — Donald Knuth',
        proTip: 'Always benchmark P99 latency — tail latency defines user experience.',
        bulletPoints: [
          '— First rule: Keep domain boundaries clean.',
          '— Second rule: Use asynchronous message queues.',
        ],
      },
    ],
    tags: ['Cloud Architecture — Microservices', 'Next.js — Performance'],
    linkedinPost: 'Modern Cloud Architecture — Building Resilient Systems\n\nHigh availability is critical — here is what you need to know.\n\nRead more at https://heyprince.in/insights/modern-cloud-architecture/\n\n#Architecture #Cloud #HeyPrince',
  };

  const sanitizedArticle = sanitizeAiContent(mockRawArticle);
  const articleJson = JSON.stringify(sanitizedArticle);
  assert.ok(!articleJson.includes('—'), 'No em dashes allowed in entire article payload');
  assert.strictEqual(sanitizedArticle.title, 'Modern Cloud Architecture: Building Resilient Systems');
  assert.strictEqual(sanitizedArticle.sections[0].heading, 'The Microservices Paradox: When to Decouple');
  assert.strictEqual(sanitizedArticle.sections[0].quote, 'Premature optimization is the root of all evil. - Donald Knuth');
  console.log('✓ Path 1 Verified: Blog Articles, Headings, Paragraphs, Quotes, Pro-tips, Tags');

  // 2. JARVIS Chat & Voice Synthesis Simulation
  const jarvisRawReply = 'Good morning Prince — all 5 agents are active and running — surveillance status is green.';
  const spoken = extractCleanSpokenText(jarvisRawReply);
  assert.ok(!spoken.includes('—'), 'JARVIS spoken text must have zero em dashes');
  assert.strictEqual(spoken, 'Good morning Prince, all 5 agents are active and running, surveillance status is green.');
  console.log('✓ Path 2 Verified: JARVIS Conversational Chat and Voice Output');

  // 3. Lead Intelligence & Outreach Draft Simulation
  const rawOutreachPayload = {
    businessSummary: 'Boutique hospitality firm — managing 12 premium properties.',
    observedDigitalOpportunity: 'Direct reservation flow is absent — relying entirely on OTA commissions.',
    recommendedService: 'Booking & Reservation System',
    evidence: 'No booking widget detected on primary landing page.',
    suggestedSubject: 'Digital guest booking for 2026 — HeyPrince inquiry',
    personalizedDraft: 'Hi Sarah — Prince from HeyPrince here. We noticed your direct reservation portal is absent — causing OTA fee leakage. To stop receiving updates, unsubscribe here:\n{{UNSUBSCRIBE_URL}}',
    unsupportedClaimWarnings: [],
  };

  const cleanOutreach = sanitizeAiContent(rawOutreachPayload);
  const outreachJson = JSON.stringify(cleanOutreach);
  assert.ok(!outreachJson.includes('—'), 'No em dashes allowed in Lead Intelligence outreach');
  assert.strictEqual(cleanOutreach.businessSummary, 'Boutique hospitality firm, managing 12 premium properties.');
  console.log('✓ Path 3 Verified: Lead Scout Outreach & Personalized Cold Email Proposals');

  // 4. Code Block & URL Immunity Verification
  const mixedContent = `Here is our curl endpoint:
\`\`\`bash
curl -X POST https://heyprince.in/api/v1/test—slug \\
  -H "Authorization: Bearer my—secret—token"
\`\`\`
Notice that this prose — an explanatory remark — surrounds the block.`;

  const cleanMixed = sanitizeEmDashes(mixedContent);
  assert.ok(cleanMixed.includes('test—slug'), 'URLs and tokens in code blocks must remain intact');
  assert.ok(cleanMixed.includes('my—secret—token'), 'Tokens in code blocks must remain intact');
  assert.ok(cleanMixed.includes('Notice that this prose, an explanatory remark, surrounds the block.'), 'Prose must be cleanly sanitized');
  console.log('✓ Path 4 Verified: Code Blocks, Flags, and Technical Tokens Preserved');

  // 5. LinkedIn Commentary Simulation
  const rawLinkedInCommentary = 'Tech teams across India are migrating to Next.js — here is the complete 2026 engineering guide.';
  const cleanLinkedIn = sanitizeEmDashes(rawLinkedInCommentary);
  assert.ok(!cleanLinkedIn.includes('—'), 'LinkedIn commentary must not contain em dashes');
  assert.strictEqual(cleanLinkedIn, 'Tech teams across India are migrating to Next.js, here is the complete 2026 engineering guide.');
  console.log('✓ Path 5 Verified: LinkedIn Publishing Commentary');

  console.log('\n=== ALL END-TO-END SANITIZER TESTS PASSED (100%) ===');
}

runE2ETests().catch((err) => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
