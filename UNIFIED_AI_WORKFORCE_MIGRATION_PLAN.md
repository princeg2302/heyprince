# Unified AI Workforce Migration Plan
**HeyPrince.in Autonomous AI Workforce Architecture (V3)**  
*Author: Antigravity AI Architecture Team*  
*Target Environment: Next.js 16 + Supabase PostgreSQL + FastAPI AI Backend*

---

## 1. Executive Summary

Prince (CEO) has issued a master architectural directive: **AI Company** and **AI Chief of Staff** must not exist as two disconnected AI agent systems with duplicate identities or fragmented task queues. Instead, they must serve as **two specialized interfaces of ONE unified, sovereign AI Workforce System**.

* **AI Company (`/admin/company`)**: Serves as the **Company Collaboration Floor (HQ)** for all-hands strategic debates, multi-agent brainstorms, opportunity evaluations, and collective consensus building.
* **AI Chief of Staff (`/admin/chief-of-staff`)**: Serves as the **Executive Management & Individual Workstation**, where Prince can open any employee individually to chat 1-on-1, assign direct tasks, inspect deep operational telemetry, and trigger specific backend agent routines.

This document outlines the inspection findings, root causes of fragmentation, target schema and code unification, and a strict, non-destructive step-by-step migration plan.

---

## 2. Current Architecture Inspection & Comparative Audit

Our comprehensive audit of the repository reveals the following two existing implementations:

### 2.1 AI Chief of Staff (`src/lib/chief-of-staff`)
* **Registry Table**: `chief_agents`
* **Current Agents**: `content_researcher`, `website_guardian`, `seo_growth`, `lead_scout`, `inbound_responder`.
* **Execution Engines**: Dedicated procedural agent scripts in `src/lib/chief-of-staff/agents/`:
  * `content-researcher.ts` (Generates technical blog posts)
  * `website-guardian.ts` (Audits Core Web Vitals, security, TTFB)
  * `seo-growth.ts` (Evaluates sitemaps, missing tags, keyword opportunities)
  * `lead-scout.ts` (Scans business registries and prospect sites)
  * `inbound-responder.ts` (Drafts proposal responses for inbound inquiries)
* **Task Storage**: `chief_tasks` (stores procedural execution records).
* **Draft Storage**: `chief_content_drafts` (stores articles, proposals, site fixes awaiting CEO approval).
* **Limitations**:
  * Agents are presented with generic robotic icons and titles rather than humanoid personas.
  * No individual 1-on-1 natural language conversation interface for each agent.
  * Isolated from all-hands discussions; cannot participate in cross-departmental debates or take directives from the Company Floor.

### 2.2 AI Company (`src/lib/company`)
* **Registry Table**: `company_employees`
* **Current Employees**:
  * `prince_ceo` (Prince - Chief Executive Officer)
  * `alex_vance` (Alex Vance - Chief of Staff & Head of Operations)
  * `elena_rostova` (Elena Rostova - Head of Search & Semantic Intelligence)
  * `marcus_sterling` (Marcus Sterling - Principal Content Creator & Lead Writer)
  * `liam_thorne` (Liam Thorne - Lead Intelligence & Growth Scout)
  * `david_chen` (David Chen - Site Reliability Sentinel & SRE)
  * `sophia_reynolds` (Sophia Reynolds - Client Solutions Partner)
* **Collaboration Engine**: `company_rooms`, `company_discussions`, `company_messages`.
* **Task Storage**: `company_tasks` (supports assignment, review, dependencies, verification).
* **Proposal Storage**: `company_proposals` (CEO Approval Gate).
* **Memory Store**: `company_memory` (supports company, department, employee, and meeting scopes).
* **Strengths**: High-fidelity humanoid identities, continuous all-hands chat timeline, rich multi-agent routing.
* **Limitations**: Lacked a direct individual 1-on-1 workspace outside of the group floor; tasks assigned in group meetings were not synchronized into the Chief of Staff agent view.

---

## 3. The Unified Agent Mapping (Zero Duplication)

The `company_employees` table was designed with a `legacy_agent_id` column. We will make `company_employees` the **Single Source of Truth** for all agent identities.

| Unified Employee ID | Legacy Agent ID | Humanoid Name | Display Title | Department | Primary Specialization | Backend Routine |
|---|---|---|---|---|---|---|
| `alex_vance` | *(orchestrator)* | **Alex Vance** | Chief of Staff & Head of Operations | Executive | Company orchestration, standups, agenda setting, proposal synthesis | Multi-agent orchestrator |
| `elena_rostova` | `seo_growth` | **Elena Rostova** | Head of Search & Semantic Intelligence | Growth | Search intent, keyword clusters, technical SEO audits, sitemap integrity | `seo-growth.ts` |
| `marcus_sterling` | `content_researcher` | **Marcus Sterling** | Principal Content Creator & Lead Writer | Editorial | 1,500+ word engineering insights, technical guides, zero em-dashes | `content-researcher.ts` |
| `liam_thorne` | `lead_scout` | **Liam Thorne** | Lead Intelligence & Growth Scout | Sales | Prospect discovery, architecture audits, conversion upside analysis | `lead-scout.ts` |
| `david_chen` | `website_guardian` | **David Chen** | Site Reliability Sentinel & SRE | Infrastructure | 100% uptime, sub-200ms TTFB, Core Web Vitals, zero-downtime security | `website-guardian.ts` |
| `sophia_reynolds` | `inbound_responder` | **Sophia Reynolds** | Client Solutions Partner | Client Solutions | Commercial discovery, proposal drafting, client deliverables | `inbound-responder.ts` |
| `prince_ceo` | *(executive)* | **Prince** | Chief Executive Officer & Founder | Executive | Ultimate strategic authority, business direction, final approval | Human CEO |

---

## 4. Multi-Mode Operating Architecture

Every registered employee will seamlessly operate across three integrated modes:

```
                          ┌─────────────────────────────┐
                          │   PRINCE (CEO & FOUNDER)    │
                          └──────────────┬──────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │                                           │
         [Mode A: Individual]                        [Mode B: Collaboration]
     AI Chief of Staff Workspace                    AI Company Floor (HQ)
     - 1-on-1 direct conversational chat            - All-Hands live discussion
     - Specific task assignments                    - Cross-department debate
     - Immediate agent routine trigger              - CEO strategic directives
     - Individual memory & task history             - Consensus & proposal synthesis
                   │                                           │
                   └─────────────────────┬─────────────────────┘
                                         │
                                [Mode C: Autonomous]
                             Background Workers & Cron
                             - Proactive responsibility review
                             - Opportunity & problem discovery
                             - Internal task creation & execution
                             - Shared memory & live status update
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │       UNIFIED DATA & EXECUTION CORE       │
                   ├───────────────────────────────────────────┤
                   │ • Unified Employee Registry               │
                   │ • Unified Task Execution Engine           │
                   │ • Shared Multi-Tier Memory Store          │
                   │ • Shared CEO Approval Gate                │
                   └───────────────────────────────────────────┘
```

### Mode A: Individual Workstation (in AI Chief of Staff)
When Prince opens AI Chief of Staff (`/admin/chief-of-staff`):
1. The employee grid displays the exact humanoid employees from `company_employees` with their official avatars, department titles, live statuses, and performance ratings.
2. Clicking any employee opens their **Individual Workspace Drawer / View**:
   * **Direct 1-on-1 Chat**: Speak directly to Elena, Marcus, David, Liam, or Sophia.
   * **Direct Task Assignment**: Issue a direct mandate (e.g., "Research new service keywords and prepare a 30-day SEO growth plan").
   * **Immediate Routine Execution**: Click "Run Routine" to execute their specific backend script (`runAgent`).
   * **Active Tasks & History**: Shows all tasks assigned to this employee (whether assigned individually or created on the Company Floor).
   * **Personal Memory & Directives**: Shows CEO instructions and learned rules specific to this employee.

### Mode B: Company Collaboration Floor (in AI Company)
When Prince opens AI Company (`/admin/company`):
1. All 6 specialists collaborate on the **Unified Company Floor (`company_hq`)**.
2. When Prince posts a directive on the floor, Chief of Staff Alex Vance responds, followed immediately by relevant specialists sharing domain perspectives.
3. Relevant personal context learned in Individual Mode is automatically available to the specialist when discussing matters on the Company Floor.

### Mode C: Autonomous Background Mode
1. Background workers (`autonomous-worker.ts` and `/api/cron/chief-of-staff`) run cycles continuously.
2. If an employee is executing a background task or routine, their live status updates to `working` in `company_employees`, reflecting instantaneously across both interfaces.

---

## 5. Shared Memory & Context Architecture

A unified memory layer prevents conversation fragmentation:

1. **Scoped Storage**:
   * `scope = 'employee'`: Stores direct instructions and 1-on-1 dialogue insights given to a specific employee (e.g. Elena).
   * `scope = 'department'`: Stores domain knowledge (e.g. SEO benchmarks for Growth, CWV budgets for Infrastructure).
   * `scope = 'company'`: Stores corporate decisions and strategic roadmaps made on the Company Floor.
2. **Intelligent Context Retrieval**:
   * When Elena Rostova participates on the Company Floor, the system queries:
     `SELECT insight FROM company_memory WHERE (employee_id = 'elena_rostova' OR scope = 'company' OR department = 'Growth') ORDER BY created_at DESC LIMIT 5;`
   * This guarantees Elena remembers Prince's individual directives while in a group meeting.

---

## 6. Unified Task Execution Engine

* All tasks are consolidated into `company_tasks`.
* When a task is assigned individually in Chief of Staff, a record is inserted into `company_tasks` with `assigned_to = employee.id` and `assigned_by = 'prince_ceo'`.
* When a meeting concludes with action items in AI Company, tasks are inserted into `company_tasks` with `assigned_to = specialist.id` and `discussion_id = activeDiscussion.id`.
* Both interfaces query `company_tasks`, ensuring zero task duplication and synchronized status tracking.

---

## 7. Migration Steps & Execution Plan

```
Step 1: Unify Agent Status API (`/api/admin/chief-of-staff/status`)
  - Join `chief_agents` with `company_employees`
  - Return humanoid identities, avatars, live statuses, and metrics to Chief of Staff

Step 2: Implement Individual Employee Workspace Modal in Chief of Staff
  - Add 1-on-1 chat interface
  - Add "Assign Task" interface linked to `company_tasks`
  - Add "Trigger Routine" button linked to `runAgent`
  - Add task history and memory tab

Step 3: Unify Task Dispatcher
  - Route individual task creation to `createCompanyTask`
  - Link routine execution results to task completion records

Step 4: Connect Shared Context Pipeline
  - When saving 1-on-1 chat directives, record into `company_memory` with `scope = 'employee'`
  - Expose individual memory to all-hands meeting context prompt

Step 5: Verify Acceptance Scenarios (Tests 1 to 8)
  - Run verification test script ensuring complete data coherence
```

---

## 8. Non-Destructive Safeguards

* No tables will be dropped.
* Existing IDs in `chief_agents` remain valid and map 1:1 to `company_employees`.
* Existing drafts, SEO recommendations, and audits are fully preserved.
* The CEO Approval Gate remains strictly enforced across all execution modes.
