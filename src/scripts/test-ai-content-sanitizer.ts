import assert from 'assert';
import {
  sanitizeEmDashes,
  sanitizeAiContent,
  NO_EM_DASH_INSTRUCTION,
} from '../lib/ai-content-sanitizer';

async function runTests() {
  console.log('--- RUNNING AI CONTENT SANITIZER TEST SUITE ---');

  // Test 1: Single and multiple em dashes in standard prose
  const text1 = 'Artificial intelligence is accelerating rapidly — creating new architectural paradigms across the cloud.';
  const sanitized1 = sanitizeEmDashes(text1);
  assert.ok(!sanitized1.includes('—'), 'Should not contain em dash');
  assert.strictEqual(sanitized1, 'Artificial intelligence is accelerating rapidly, creating new architectural paradigms across the cloud.');
  console.log('✓ Test 1: Clause separation em dash replaced with comma');

  // Test 2: Parenthetical clause with two em dashes
  const text2 = 'The system — which had not been tested under peak load — performed admirably.';
  const sanitized2 = sanitizeEmDashes(text2);
  assert.ok(!sanitized2.includes('—'), 'Should not contain em dash');
  assert.strictEqual(sanitized2, 'The system, which had not been tested under peak load, performed admirably.');
  console.log('✓ Test 2: Parenthetical em dash pair converted to natural comma pair');

  // Test 3: Title and Subtitle pattern
  const text3 = 'Autonomous AI Agents — Engineering Architecture for Production';
  const sanitized3 = sanitizeEmDashes(text3);
  assert.ok(!sanitized3.includes('—'), 'Should not contain em dash');
  assert.strictEqual(sanitized3, 'Autonomous AI Agents: Engineering Architecture for Production');
  console.log('✓ Test 3: Title/subtitle pattern converted to colon');

  // Test 4: Attribution and quotes
  const text4 = '"Simplicity is prerequisite for reliability." — Edsger W. Dijkstra';
  const sanitized4 = sanitizeEmDashes(text4);
  assert.ok(!sanitized4.includes('—'), 'Should not contain em dash');
  assert.strictEqual(sanitized4, '"Simplicity is prerequisite for reliability." - Edsger W. Dijkstra');
  console.log('✓ Test 4: Quote attribution converted to hyphen');

  // Test 5: Number / Year ranges
  const text5 = 'During the 2024—2026 enterprise cycle, adoption increased.';
  const sanitized5 = sanitizeEmDashes(text5);
  assert.ok(!sanitized5.includes('—'), 'Should not contain em dash');
  assert.strictEqual(sanitized5, 'During the 2024-2026 enterprise cycle, adoption increased.');
  console.log('✓ Test 5: Number ranges converted to standard hyphen');

  // Test 6: Preservation of Code blocks and inline code
  const text6 = 'Here is code:\n```javascript\nconst msg = "foo—bar"; // preserve—this\n```\nAnd inline `code—block` here.';
  const sanitized6 = sanitizeEmDashes(text6);
  assert.ok(sanitized6.includes('```javascript\nconst msg = "foo—bar"; // preserve—this\n```'), 'Code block must be untouched');
  assert.ok(sanitized6.includes('`code—block`'), 'Inline code must be untouched');
  console.log('✓ Test 6: Code blocks and inline code preserved perfectly');

  // Test 7: Preservation of URLs and HTML tags
  const text7 = 'Visit <a href="https://heyprince.in/test—slug">HeyPrince</a> for details — contact us today.';
  const sanitized7 = sanitizeEmDashes(text7);
  assert.ok(sanitized7.includes('https://heyprince.in/test—slug'), 'URL must be untouched');
  assert.ok(sanitized7.includes('<a href="https://heyprince.in/test—slug">'), 'HTML tag must be untouched');
  assert.ok(sanitized7.includes('details, contact us today'), 'Prose outside tag must be sanitized');
  console.log('✓ Test 7: URLs and HTML tags preserved');

  // Test 8: Universal Recursive Deep Sanitization on Objects & Arrays
  const complexPayload = {
    title: 'Enterprise AI Strategy — 2026 Roadmap',
    summary: 'Cloud costs are surging — optimization is mandatory.',
    sections: [
      {
        heading: 'The Migration Dilemma — Monoliths to Headless',
        paragraphs: [
          'Legacy setups create bottlenecks — engineering teams lose velocity.',
          'Consider Next.js — a sub-second edge framework.',
        ],
        bulletPoints: [
          '— First critical insight: Edge rendering matters.',
          '— Second critical insight: Memory limits must be monitored.',
        ],
      },
    ],
    metadata: {
      tags: ['AI — Agents', 'Next.js — Architecture'],
      wordCount: 450,
      active: true,
    },
  };

  const cleanPayload = sanitizeAiContent(complexPayload);
  const jsonStr = JSON.stringify(cleanPayload);
  assert.ok(!jsonStr.includes('—'), 'Complete JSON tree must have zero em dashes');
  assert.strictEqual(cleanPayload.title, 'Enterprise AI Strategy: 2026 Roadmap');
  assert.strictEqual(cleanPayload.summary, 'Cloud costs are surging, optimization is mandatory.');
  assert.strictEqual(cleanPayload.sections[0].heading, 'The Migration Dilemma: Monoliths to Headless');
  assert.strictEqual(cleanPayload.metadata.tags[0], 'AI, Agents');
  assert.strictEqual(cleanPayload.metadata.tags[1], 'Next.js, Architecture');
  console.log('✓ Test 8: Deep recursive object and array sanitization passed');

  console.log('\n--- ALL AI CONTENT SANITIZER TESTS PASSED (100%) ---');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});

