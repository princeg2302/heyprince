import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Auto-load .env.local
const envLocal = path.resolve(dirname, '../../.env.local');
const envDefault = path.resolve(dirname, '../../.env');
if (typeof (process as any).loadEnvFile === 'function') {
  if (fs.existsSync(envLocal)) {
    (process as any).loadEnvFile(envLocal);
  } else if (fs.existsSync(envDefault)) {
    (process as any).loadEnvFile(envDefault);
  }
}

import {
  getAllEmployees,
  getAllRooms,
  createDiscussion,
  getDiscussionById,
  getDiscussionMessages,
  concludeDiscussion,
  createProposal,
  getCompanyProposals,
  updateProposalStatus,
  createCompanyTask,
  getCompanyTaskById,
  updateTaskStatus,
  recordCompanyMemory,
  queryCompanyMemory,
} from '../lib/company/db';
import { advanceDiscussionTurn, processCompanyTask, executeApprovedProposal } from '../lib/company/orchestrator';

async function runTestSuite() {
  console.info('================================================================');
  console.info('🧪 STARTING HEYPRINCE AI COMPANY SUITE VERIFICATION');
  console.info('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.info(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // ------------------------------------------------------------------------
    // TEST 1: EMPLOYEE REGISTRY
    // ------------------------------------------------------------------------
    console.info('[1/6] Verifying Humanoid Workforce Registry...');
    const employees = await getAllEmployees();
    assert(employees.length >= 6, `Found ${employees.length} employees (expected at least 6)`);
    
    const alex = employees.find((e) => e.id === 'alex_vance');
    assert(Boolean(alex && alex.department === 'Executive'), 'Alex Vance is present as Head of Operations');

    const marcus = employees.find((e) => e.id === 'marcus_sterling');
    assert(Boolean(marcus && marcus.department === 'Editorial'), 'Marcus Sterling is present as Principal Content Creator');

    const david = employees.find((e) => e.id === 'david_chen');
    assert(Boolean(david && david.department === 'Infrastructure'), 'David Chen is present as Site Reliability Sentinel');

    // ------------------------------------------------------------------------
    // TEST 2: VIRTUAL ROOMS
    // ------------------------------------------------------------------------
    console.info('\n[2/6] Verifying Virtual Collaboration Rooms...');
    const rooms = await getAllRooms();
    assert(rooms.length >= 5, `Found ${rooms.length} rooms (expected 5 corporate rooms)`);
    const devRoom = rooms.find((r) => r.id === 'dev_room');
    assert(Boolean(devRoom), 'dev_room is accessible');

    // ------------------------------------------------------------------------
    // TEST 3: COLLABORATIVE MEETING & ADVANCE TURN
    // ------------------------------------------------------------------------
    console.info('\n[3/6] Testing Autonomous Meeting Lifecycle...');
    const disc = await createDiscussion({
      roomId: 'dev_room',
      title: 'Automated Test: Next.js 16 TTFB Optimization Sweep',
      objective: 'Profile edge cache hit ratios and verify sub-300ms mobile TTFB targets.',
      participantIds: ['alex_vance', 'david_chen'],
      maxTurns: 3,
    });
    assert(Boolean(disc && disc.id), `Created test discussion: ${disc.id}`);

    // Turn 1
    const turn1 = await advanceDiscussionTurn(disc.id);
    assert(turn1.success && Boolean(turn1.message), 'Turn 1 executed (opening statement)');

    // Turn 2
    const turn2 = await advanceDiscussionTurn(disc.id);
    assert(turn2.success && Boolean(turn2.message), 'Turn 2 executed (specialist argumentation)');

    // Turn 3 (Reaches maxTurns -> concludes)
    const turn3 = await advanceDiscussionTurn(disc.id);
    assert(turn3.status === 'concluded', 'Meeting successfully reached consensus and adjourned');

    const msgs = await getDiscussionMessages(disc.id);
    assert(msgs.length >= 3, `Discussion recorded ${msgs.length} messages`);

    // ------------------------------------------------------------------------
    // TEST 4: CEO APPROVAL GATE & PROPOSAL PIPELINE
    // ------------------------------------------------------------------------
    console.info('\n[4/6] Testing CEO Approval Engine...');
    const testProp = await createProposal({
      discussionId: disc.id,
      sponsoredBy: 'david_chen',
      title: 'Test Optimization: Edge CDN Cache Invalidation',
      proposalType: 'site_modification',
      businessJustification: 'Purges stale assets and enforces stale-while-revalidate for sub-second performance.',
      actionPayload: { targetUrls: ['/services'] },
    });
    assert(Boolean(testProp && testProp.status === 'pending_approval'), 'Proposal created with status=pending_approval');

    // Approve Proposal
    const approved = await updateProposalStatus(testProp.id, 'approved', 'Approved by CEO via test suite.');
    assert(approved?.status === 'approved', 'Proposal updated to status=approved');

    // Execute Approved Proposal
    const execRes = await executeApprovedProposal(testProp.id);
    assert(execRes.success, `Approved proposal executed: ${execRes.message}`);

    // ------------------------------------------------------------------------
    // TEST 5: TASK ORCHESTRATION & INDEPENDENT VERIFICATION
    // ------------------------------------------------------------------------
    console.info('\n[5/6] Testing Task Orchestration & Review...');
    const task = await createCompanyTask({
      discussionId: disc.id,
      assignedTo: 'david_chen',
      reviewerId: 'alex_vance',
      title: 'Automated Verification: Synthetic Lighthouse Audit',
      description: 'Profile homepage TTFB and accessibility scores.',
      acceptanceCriteria: ['Lighthouse score >= 90', 'No 404 errors encountered'],
      priority: 'high',
    });
    assert(Boolean(task && task.status === 'pending'), 'Task queued with status=pending');

    const processed = await processCompanyTask(task.id);
    assert(processed.success && processed.task?.status === 'completed', 'Task completed and independently verified');
    assert(Boolean(processed.task?.verification_notes), 'Verification notes recorded by reviewer');

    // ------------------------------------------------------------------------
    // TEST 6: CORPORATE MEMORY STORE
    // ------------------------------------------------------------------------
    console.info('\n[6/6] Testing Tiered Corporate Memory...');
    const memory = await recordCompanyMemory({
      scope: 'company',
      category: 'learning',
      insight: 'Edge stale-while-revalidate headers reduced global TTFB from 1800ms to 180ms.',
      metadata: { suiteTest: true },
    });
    assert(Boolean(memory && memory.id), 'Memory entry recorded into company_memory');

    const queried = await queryCompanyMemory({ scope: 'company', limit: 5 });
    assert(queried.length > 0, `Successfully queried ${queried.length} company memory records`);

    // Clean up test records
    console.info('\n🧹 Cleaning up test artifacts...');
    const { query } = await import('../lib/outreach/db');
    await query(`DELETE FROM company_messages WHERE discussion_id = $1;`, [disc.id]);
    await query(`DELETE FROM company_tasks WHERE id = $1;`, [task.id]);
    await query(`DELETE FROM company_proposals WHERE id = $1;`, [testProp.id]);
    await query(`DELETE FROM company_discussions WHERE id = $1;`, [disc.id]);
    await query(`DELETE FROM company_memory WHERE id = $1;`, [memory.id]);
    console.info('Test cleanup complete.');

  } catch (err: any) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.info('\n================================================================');
  console.info(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.info('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
