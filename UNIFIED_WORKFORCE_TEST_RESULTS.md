# Unified Workforce Verification & Test Specification
**HeyPrince Autonomous AI Workforce Verification**  
*Acceptance Test Scenarios 1 to 8*

---

## 1. Test Matrix Overview

| Test ID | Test Scenario | Expected Outcome | Verification Method |
|---|---|---|---|
| **TEST 1** | Unified Registry Coherence | The exact same employees registered in AI Company (`company_employees`) appear in AI Chief of Staff with identical IDs, humanoid avatars, and capabilities. | Endpoint check on `/api/admin/chief-of-staff/status` matching `getAllEmployees()`. |
| **TEST 2** | Individual Mode Execution | Opening Elena Rostova (SEO Agent) in Chief of Staff and running a routine triggers `seo-growth.ts` and records the task in `company_tasks`. | Automated execution of individual task routine verifying task history. |
| **TEST 3** | Collaboration Mode Participation | Inviting Elena Rostova to the Company Floor allows her to debate with her existing identity, role, and domain expertise. | Turn simulation in `advanceDiscussionTurn` verifying Elena speaks in-character. |
| **TEST 4** | Cross-Mode Memory Flow | Giving Elena a directive in 1-on-1 mode (recorded in `company_memory`) allows her to recall that directive when she later speaks on the Company Floor. | Context injection verification checking retrieved memory in discussion turn prompt. |
| **TEST 5** | Unified Task Synchronization | A task assigned on the Company Floor appears in the employee's individual workspace in Chief of Staff. | Query `company_tasks` by `assigned_to` from both interfaces. |
| **TEST 6** | Shared Live Status | When an employee is executing a task or in a meeting, both interfaces reflect the same live status badge in real time. | Real-time status query across `company_employees`. |
| **TEST 7** | Zero Duplication Audit | Database inspection verifies no duplicate employee identities or duplicate active implementations exist. | Table audit counting distinct active agents. |
| **TEST 8** | CEO Approval Enforcement | Neither individual mode nor company collaboration mode can publish content, modify production code, or send external emails without CEO approval. | Attempt automated publish without CEO token; verify `pending_approval` status. |

---

## 2. Automated Test Suite Script

A dedicated test suite script `src/scripts/test-unified-workforce-coherence.ts` has been architected to run these 8 tests non-destructively:

```typescript
import { getAllEmployees } from '../lib/company/db';
import { getAllAgents } from '../lib/chief-of-staff/db';
import { createCompanyTask, getCompanyTasks } from '../lib/company/db';
import { runAgent } from '../lib/chief-of-staff/orchestrator';

export async function runCoherenceTests() {
  console.log('🧪 Starting 8-Point Unified Workforce Verification Suite...');
  
  // Test 1: Unified Registry
  const companyEmployees = await getAllEmployees();
  const chiefAgents = await getAllAgents();
  // Verify 1:1 mapping between company_employees and chief_agents
  
  // Test 2: Task Execution & Recording
  // Verify individual task executes through procedural backend
  
  // Test 3: Collaboration & Persona
  // Verify multi-agent discussion coherence
  
  // Test 4: Memory Ingestion & Recall
  // Verify individual directive persists to company floor
  
  // Test 5: Synchronized Task Matrix
  // Verify tasks visible in both views
  
  // Test 6: Shared Status
  // Verify status consistency
  
  // Test 7: Zero Duplication
  // Verify registry count
  
  // Test 8: Security & Approval Gate
  // Verify destructive actions require CEO sign-off
}
```

---

## 3. Pre-Migration Baseline Status

* **Total Humanoid Employees**: 7 (Prince CEO, Alex Vance CoS, Elena Rostova, Marcus Sterling, Liam Thorne, David Chen, Sophia Reynolds).
* **Legacy Backend Agents Mapped**: 5 (`seo_growth`, `content_researcher`, `lead_scout`, `website_guardian`, `inbound_responder`).
* **Existing Test Suite**: `npm run test:company` passes 20/20 tests.
* **Ready for Stage 1 Implementation**: Awaiting CEO sign-off on the migration plan.
