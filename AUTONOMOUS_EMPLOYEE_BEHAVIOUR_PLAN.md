# Autonomous Employee Behaviour and Intelligence Plan

## Problem Diagnosis: Root Causes of "Meeting Simulator" Symptoms

Detailed inspection of previous meeting transcripts and screenshots revealed three fundamental architectural flaws that caused the workforce to resemble a meeting simulator rather than real employees:

1. **Repetitive Turn-Filling Prompts**: The discussion advancement loop invoked Alex Vance with a generic template prompt that repeated phrases like *"Let us evaluate the specific implementation trade-offs for '{objective}'"* regardless of what the user actually said (e.g., repeating it 5 times for a simple greeting like "hello").
2. **Canned Evidence Placeholders**: Agents lacked access to real runtime database queries during meetings, causing the LLM to invent placeholder JSON evidence blocks (`{"organicIntent": "Commercial High-Intent", "searchGainTarget": "+28%"}`) instead of citing real metrics.
3. **Absence of Intent Routing**: The system treated every message from Prince identically as a meeting topic rather than classifying it as a casual greeting, a direct question, an operational instruction, or a strategic pivot.

---

## 1. CEO Directive Classification and Natural Routing

When Prince sends a message to the workforce, it passes through an intent classifier before any model responds:

| Message Category | Intent Trigger | Workforce Response Protocol |
|---|---|---|
| **Informal Greeting / Check-in** | "Hello", "Hey team", "Who is here?", "Hindi kis kis ko aati hai?" | Casual, brief, humanoid response from the relevant employee or Alex Vance. Does NOT start an 8-turn formal strategic meeting. |
| **Direct Question** | "What are we doing to grow HeyPrince this month?", "Why has organic traffic dropped?" | Alex Vance or the relevant specialist answers directly with verified facts and active tasks from the database. |
| **Operational Directive** | "Stop working on this topic and focus on Headless Next.js migration" | Alex immediately pauses existing tasks, acknowledges the change of direction, and creates new tasks in the Task Matrix. |
| **Strategic Brainstorm** | "Can we launch a new AI automation service for dental clinics?" | Alex initiates a targeted discussion in the Innovation & R&D Lab with Elena Rostova (SEO) and Liam Thorne (Market Fit). |
| **Task Delegation** | "Marcus, write a deep dive on React 19 compiler internals" | Assigned directly to Marcus Sterling as a high-priority task with clear deliverables and acceptance criteria. |

---

## 2. Dynamic Real-World Context Injection

Every agent prompt is constructed dynamically at runtime with verified data from the HeyPrince.in database:

* **Live Business Metrics**:
  - Total published articles in `posts` and latest publish date.
  - Recent Core Web Vitals audit scores (LCP, CLS, TTFB) from `chief_health_audits`.
  - Number of qualified business leads in `businesses`.
  - Pending approval count from `company_proposals`.
* **Personal & Departmental Memory**:
  - The employee's specific memory entries from `company_memory`.
  - Previous feedback given by Prince.
* **Active Tasks**:
  - What the employee is currently working on.
  - Completed deliverables and active dependencies.

With this context, an agent never hallucinates generic platitudes. If asked *"What is our organic search status?"*, Elena Rostova cites the actual number of published articles, audited meta descriptions, and indexed pages.

---

## 3. Humanoid Conversational Decorum & Professional Rigor

To prevent robotic and repetitive dialogue:

1. **Personality Preservation**:
   - Marcus Sterling writes with architectural depth and technical eloquence, adhering strictly to the zero em-dash rule.
   - Elena Rostova insists on empirical keyword data and search volume evidence before endorsing content topics.
   - David Chen is cautious, demanding Core Web Vitals guarantees and sub-200ms TTFB clearances.
   - Liam Thorne is commercial, assessing prospect budget and willingness to pay.
   - Sophia Reynolds is consultative and structured, focusing on client deliverables.
2. **Debate and Challenge**:
   - Agents do not blindly agree. Elena may challenge Marcus's proposed topic if search volume is negligible, suggesting a more commercial keyword cluster.
   - David Chen may challenge an aggressive feature launch if it risks bloating bundle size.
3. **Turn Economy**:
   - Conversations terminate when a consensus or task is formulated. Meetings do not artificially pad turns to reach an arbitrary quota.

---

## 4. Spontaneous Event-Driven Collaboration

Employees initiate discussions autonomously without waiting for manual CEO clicks when real business triggers occur:

* **Trigger 1: Fresh Tech News Discovered**
  - Marcus Sterling discovers a major architectural release (e.g. Next.js major version).
  - Marcus pings Elena in the Innovation Lab to confirm keyword demand before beginning the draft.
* **Trigger 2: Performance Degradation Detected**
  - David Chen detects that a route's TTFB exceeded 350ms during a synthetic health audit.
  - David opens a thread in the Engineering & SRE Room with actionable remediation steps and creates an internal fix task.
* **Trigger 3: High-Value Client Prospect Identified**
  - Liam Thorne qualifies an e-commerce brand with a 2.5s mobile checkout delay.
  - Liam pings Sophia Reynolds in the Growth & Revenue Room to review the lead and draft a proposal outline.

---

## 5. 24/7 Server-Side Autonomous Background Execution

The sovereign AI workforce operates continuously on the server regardless of whether Prince has the admin portal open in his browser:

* **Vercel Cron Architecture**:
  - `src/app/api/cron/company-workforce/route.ts` runs on a scheduled cadence (`*/15 * * * *` or hourly).
  - Operates server-side with `CRON_SECRET` authentication.
* **Autonomous Background Checklist**:
  1. Inspects assigned tasks in `company_tasks` with status `pending` or `in_progress`.
  2. Executes permitted research, audits, and draft preparation.
  3. Updates employee status (`idle` -> `researching` -> `working` -> `reviewing`).
  4. Records outputs into `output_result` and creates approval proposals in `company_proposals` when deliverables are ready.
  5. Updates `company_memory` with key learnings.
* **Zero Browser Dependency**: Work is saved directly to PostgreSQL. When Prince opens the admin portal, completed deliverables and pending approvals are ready for inspection.
