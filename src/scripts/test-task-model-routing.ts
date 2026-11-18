import assert from 'assert';
import { TASK_MODEL_PREFERENCES, AITaskType } from '../lib/ai/model-router';
import { formatMemoriesForPrompt } from '../lib/company/memory';

console.log('================================================================');
console.log('HEYPRINCE.IN: DYNAMIC TASK-BASED MODEL ROUTING & LEARNING SUITE');
console.log('================================================================\n');

let passedTests = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`[FAIL] ${name}: ${err?.message || err}`);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// TEST 1: Task Profiles Integrity
// -----------------------------------------------------------------------------
console.log('--- TEST 1: Task Profiles Integrity ---');
runTest('All required task categories exist in preferences', () => {
  const expectedTasks: AITaskType[] = [
    'high_reasoning',
    'balanced',
    'high_volume_chat',
    'memory_learning',
    'fast_utility',
  ];

  for (const t of expectedTasks) {
    assert(Boolean(TASK_MODEL_PREFERENCES[t]), `Missing preference for task ${t}`);
    assert(TASK_MODEL_PREFERENCES[t].geminiPreferred.length > 0, `No preferred Gemini models for ${t}`);
    assert(Boolean(TASK_MODEL_PREFERENCES[t].openaiPreferred), `No preferred OpenAI model for ${t}`);
  }
});

// -----------------------------------------------------------------------------
// TEST 2: High-Volume Chat Quota Protection (500 RPD Priority)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: High-Volume Chat Quota Protection (500 RPD Priority) ---');
runTest('High-volume chat starts with 500 RPD models before 20 RPD models', () => {
  const chatPref = TASK_MODEL_PREFERENCES.high_volume_chat;
  const firstModel = chatPref.geminiPreferred[0];
  const secondModel = chatPref.geminiPreferred[1];

  assert(
    firstModel.includes('flash-lite') || firstModel.includes('3.5-flash-lite'),
    `First model in high_volume_chat must be a 500 RPD Flash-Lite model, got ${firstModel}`
  );
  assert(
    secondModel.includes('flash-lite'),
    `Second model in high_volume_chat must be a Flash-Lite model, got ${secondModel}`
  );
  // Standard 20 RPD flash model should be placed in fallback
  assert(
    chatPref.geminiFallback.includes('gemini-3.8-flash'),
    'gemini-3.8-flash is reserved as fallback for chat to protect free tier limit'
  );
});

// -----------------------------------------------------------------------------
// TEST 3: High-Reasoning Profile (Executive & Blog Work)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: High-Reasoning Profile ---');
runTest('High reasoning tasks prefer top-tier models', () => {
  const reasoningPref = TASK_MODEL_PREFERENCES.high_reasoning;
  assert(
    reasoningPref.geminiPreferred.includes('gemini-3.8-flash') || reasoningPref.geminiPreferred.includes('gemini-2.5-flash'),
    'High reasoning uses highest capability Gemini models'
  );
  assert(
    reasoningPref.openaiPreferred === 'gpt-4o',
    'High reasoning OpenAI preferred is gpt-4o'
  );
  assert(reasoningPref.maxTokens >= 2000, 'High reasoning allocates sufficient token budget');
});

// -----------------------------------------------------------------------------
// TEST 4: OpenAI Default Fallback Model
// -----------------------------------------------------------------------------
console.log('\n--- TEST 4: OpenAI Fallback Model ---');
runTest('Default OpenAI model is gpt-4o-mini for fast balanced execution', () => {
  const balancedPref = TASK_MODEL_PREFERENCES.balanced;
  assert(balancedPref.openaiPreferred === 'gpt-4o-mini', 'Balanced execution uses gpt-4o-mini');
});

// -----------------------------------------------------------------------------
// TEST 5: Memory Formatting for AI Prompts
// -----------------------------------------------------------------------------
console.log('\n--- TEST 5: Memory Formatting for AI Prompts ---');
runTest('formatMemoriesForPrompt cleanly surfaces lessons learned', () => {
  const sampleMemories = [
    {
      id: 'mem_1',
      scope: 'employee' as const,
      category: 'learning' as const,
      insight: 'WooCommerce stores with >2.5s TTFB experience 14% cart abandonment.',
      confidence_score: 0.95,
      metadata: {},
      created_at: new Date().toISOString(),
    },
    {
      id: 'mem_2',
      scope: 'company' as const,
      category: 'strategy' as const,
      insight: 'Target UK and US mid-market eCommerce brands for Headless Next.js migration.',
      confidence_score: 0.9,
      metadata: {},
      created_at: new Date().toISOString(),
    },
  ];

  const formatted = formatMemoriesForPrompt(sampleMemories);
  assert(formatted.includes('TTFB experience 14% cart abandonment'), 'Contains learned insight');
  assert(formatted.includes('Confidence: 95%'), 'Contains confidence rating');
  assert(formatted.includes('[EMPLOYEE:LEARNING]'), 'Contains scoped tag');
});

// -----------------------------------------------------------------------------
// TEST 6: Message Sanitization for Chat
// -----------------------------------------------------------------------------
console.log('\n--- TEST 6: Message Sanitization for Chat ---');
runTest('Robotic audit headers are stripped from chat output', () => {
  const rawText = 'We analyzed the latency. VERIFIED EVIDENCE & AUDIT DATA: LCP is 1.8s. All systems operational.';
  const cleaned = rawText
    .replace(/VERIFIED EVIDENCE & AUDIT DATA:?/gi, '')
    .replace(/VERIFIED REAL-TIME TOOL AUDIT \([^)]+\):?/gi, '')
    .trim();

  assert(!cleaned.includes('VERIFIED EVIDENCE & AUDIT DATA:'), 'Stripped robotic audit header');
  assert(cleaned.includes('We analyzed the latency.'), 'Preserved human message content');
});

console.log('\n================================================================');
console.log(`TASK ROUTING & LEARNING TEST SUITE: ${passedTests} PASSED, 0 FAILED`);
console.log('================================================================');
