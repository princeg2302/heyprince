# Shared Memory and Task Architecture
**Unified Multi-Tier Knowledge & Task Execution Pipeline**  
*HeyPrince.in Autonomous Workforce Platform*

---

## 1. Unified Task Engine Architecture

Tasks in the HeyPrince platform originate from multiple sources but must execute through a **single unified task lifecycle**.

```
                   ORIGINATING SOURCES
  ┌─────────────────────────────────────────────────────────┐
  │  1. Individual Assignment (from AI Chief of Staff)     │
  │  2. Company Floor Consensus (from AI Company)           │
  │  3. Autonomous Opportunity Detection (Background Cron)  │
  │  4. CEO Direct Directive (Prince)                       │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │              UNIFIED TASK RECORD (company_tasks)        │
  │  - id: UUID                                             │
  │  - assigned_to: company_employees(id)                  │
  │  - assigned_by: prince_ceo | alex_vance | specialist    │
  │  - title & description                                  │
  │  - acceptance_criteria: TEXT[]                          │
  │  - status: pending -> in_progress -> review -> completed│
  │  - priority: low | medium | high | urgent               │
  │  - execution_payload & output_result: JSONB             │
  │  - reviewer_id: company_employees(id)                  │
  └────────────────────────────┬────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [Automated Routine]             [Generative LLM]
      Existing Agent Scripts         Individual / Specialist
      - seo-growth.ts                - Task execution plan
      - content-researcher.ts        - Evidence gathering
      - website-guardian.ts          - Output artifact
      - lead-scout.ts
               │                               │
               └───────────────┬───────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │         INDEPENDENT PEER REVIEW & VERIFICATION          │
  │  - Reviewer verifies criteria against actual output     │
  │  - David Chen reviews technical/speed implications      │
  │  - Alex Vance verifies operational completion           │
  └────────────────────────────┬────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   [Internal Operation]               [Requires CEO Approval?]
   Directly applied to                - Publishing Content
   persistent memory & docs           - Modifying Site Code
                                      - External Communications
                                                  │
                                                  ▼
                                      ┌───────────────────────┐
                                      │   CEO APPROVAL GATE   │
                                      │  (company_proposals)  │
                                      └───────────────────────┘
```

---

## 2. Multi-Tier Shared Memory Store

The `company_memory` table maintains persistent knowledge across all operational modes, ensuring no context is lost when an agent moves from a 1-on-1 dialogue to a group meeting.

### 2.1 Scope Hierarchy

1. **`scope = 'company'`**:
   * Global business goals, brand standards, pricing rules, and corporate consensus agreements.
   * Accessible by all employees.
   * *Example*: *"All public articles must strictly avoid em-dashes and focus on senior architectural audiences."*

2. **`scope = 'department'`**:
   * Department-specific technical standards, competitor benchmarks, and active campaign rules.
   * Filtered by department (`Growth`, `Editorial`, `Infrastructure`, `Sales`, `Client Solutions`).
   * *Example (Growth)*: *"Next.js 16 Edge Rendering keywords show 28% higher conversion intent than generic CMS terms."*

3. **`scope = 'employee'`**:
   * Direct CEO instructions, feedback, and learned preferences given to a specific employee in Individual Mode.
   * *Example (Elena)*: *"Prince instructed on 2026-11-09 to prioritize local service pages for Pune and Mumbai software companies."*

4. **`scope = 'meeting'`**:
   * Synthesis notes and action items generated from specific Company Floor sessions.

---

## 3. Context Injection Pipeline

When an agent is called—whether responding to a CEO directive in Individual Mode or participating in an all-hands meeting on the Company Floor—context is dynamically assembled:

```typescript
export async function buildUnifiedAgentContext(employeeId: string): Promise<string> {
  const employee = await getEmployeeById(employeeId);
  const memoryRecords = await query(`
    SELECT category, insight 
    FROM company_memory 
    WHERE employee_id = $1 
       OR scope = 'company' 
       OR (scope = 'department' AND department = $2)
    ORDER BY created_at DESC 
    LIMIT 10;
  `, [employeeId, employee.department]);

  const activeTasks = await query(`
    SELECT title, status, priority, acceptance_criteria 
    FROM company_tasks 
    WHERE assigned_to = $1 AND status IN ('pending', 'in_progress')
    ORDER BY priority DESC LIMIT 5;
  `, [employeeId]);

  return formatContextPrompt({ employee, memoryRecords, activeTasks });
}
```

This guarantees:
1. Elena immediately recalls what Prince told her in 1-on-1 chat when she speaks on the Company Floor.
2. Marcus never generates a draft that contradicts a corporate editorial guideline recorded in memory.
3. David always evaluates deployments against verified historical TTFB baselines.
