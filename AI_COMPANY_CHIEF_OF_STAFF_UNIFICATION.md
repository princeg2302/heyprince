# AI Company and AI Chief of Staff Unification Architecture

## Core Architectural Premise

The AI Company and AI Chief of Staff are NOT two separate AI systems or competing sets of bots. They are two distinct, complementary interfaces of **ONE unified sovereign AI workforce**.

* **AI Chief of Staff (`/admin/chief-of-staff`)**: The Executive Management Console. Designed for Prince (CEO) to supervise the company, hold private 1-on-1 desk conversations with individual employees, assign direct specialist tasks, inspect individual memory logs, and manage agent operating modes.
* **AI Company (`/admin/company`)**: The Collaborative Corporate Office. Designed as the shared open-floor workspace where employees collaborate in virtual rooms, conduct spontaneous cross-department debates, execute group projects, and build consensus around strategic decisions.

---

## 1. Single Canonical Source of Truth

Both interfaces read from and write to the same authoritative database substrate:

```
                      +-----------------------------+
                      |   Canonical Employee Hub    |
                      |    (company_employees)      |
                      +--------------+--------------+
                                     |
             +-----------------------+-----------------------+
             |                                               |
             v                                               v
+--------------------------+                   +--------------------------+
|    AI Chief of Staff     |                   |        AI Company        |
|  (/admin/chief-of-staff) |                   |     (/admin/company)     |
|                          |                   |                          |
| - Individual Desk Chat   |                   | - Virtual Office Rooms   |
| - Direct Task Delegation |                   | - Spontaneous Discussions|
| - Mode Toggles           |                   | - Multi-Agent Debates    |
| - Individual Telemetry   |                   | - Unified Task Matrix    |
+------------+-------------+                   +-------------+------------+
             |                                               |
             +-----------------------+-----------------------+
                                     |
                      +--------------v--------------+
                      |    Shared Corporate State   |
                      |                             |
                      |  * company_memory           |
                      |  * company_tasks            |
                      |  * company_proposals        |
                      +-----------------------------+
```

---

## 2. Canonical Identity Synchronization

Every AI employee has exactly ONE permanent ID in `company_employees`. For full backward compatibility with existing services, each record maintains a `legacy_agent_id` pointer:

1. **Marcus Sterling** (`marcus_sterling`): Editorial Lead & Principal Writer. Maps to legacy `content_researcher`.
2. **Elena Rostova** (`elena_rostova`): Head of Search & Semantic Intelligence. Maps to legacy `seo_growth`.
3. **David Chen** (`david_chen`): Site Reliability Sentinel & Performance Engineer. Maps to legacy `website_guardian`.
4. **Liam Thorne** (`liam_thorne`): Lead Intelligence & Growth Scout. Maps to legacy `lead_scout`.
5. **Sophia Reynolds** (`sophia_reynolds`): Client Solutions Partner. Maps to legacy `inbound_responder`.
6. **Alex Vance** (`alex_vance`): Chief of Staff & Head of Operations. Executive Orchestrator.
7. **Prince** (`prince_ceo`): Founder & Chief Executive Officer.

No code in either interface will create duplicate agents or instantiate independent bot personalities.

---

## 3. Interface Feature Allocation

### A. AI Chief of Staff (`/admin/chief-of-staff`)
1. **Executive Overview Banner**: System health, active workforce count, pending approval counter, token usage, and daily run status.
2. **Humanoid Employee Grid**:
   - Displays real employee avatars (`/assets/avatars/*.webp`), display titles, department tags, and live presence status (`idle`, `thinking`, `working`, `in_meeting`).
   - Mode toggles: `observe`, `prepare`, `auto`.
   - Action buttons: "Open Private Desk" (1-on-1 direct conversation), "Assign Task", "Run Discovery Audit".
3. **1-on-1 Private Desk Drawer / Modal**:
   - Prince can chat privately with any individual employee.
   - The employee responds strictly within their professional domain and personality archetype, referencing their personal memory and active tasks.
   - Chat history is persisted in `company_memory` under scope `employee`.
4. **Executive Direct Task Delegation**:
   - Prince can assign a priority task directly to the employee.
   - The task is written to `company_tasks` and reflected immediately across both interfaces.

### B. AI Company (`/admin/company`)
1. **Virtual Collaboration Rooms**:
   - Company War Room, Daily 9:00 AM Standup, Innovation & R&D Lab, Growth & Revenue Room, Engineering & SRE Room.
   - Real-time room status, active participant avatars, and live message feeds.
2. **Spontaneous and Moderated Discussions**:
   - Employees initiate relevant discussions based on real business telemetry (not scripted canned text).
   - Alex Vance moderates, enforces turn limits, and synthesizes consensus.
3. **Unified Task Matrix**:
   - Kanban / table view showing all active corporate tasks, assigned owners, dependencies, acceptance criteria, and verification statuses.
4. **CEO Approval Gate**:
   - Central holding queue for proposals awaiting Prince's authorization.

---

## 4. Shared Corporate State Integration

### Corporate Memory (`company_memory`)
Memory is partitioned into four distinct scopes to prevent context pollution:
* **Company Scope (`company`)**: Strategic directives from Prince, quarterly milestones, company-wide guidelines (e.g., zero em-dash rule).
* **Department Scope (`department`)**: Editorial style guides, SEO keyword clusters, target outreach verticals, CWV thresholds.
* **Employee Scope (`employee`)**: Individual learnings, task execution history, specific feedback from Prince.
* **Meeting Scope (`meeting`)**: Discussion transcripts, consensus outcomes, action items.

### Task Matrix (`company_tasks`)
* Tasks assigned from either interface are stored in `company_tasks`.
* When an employee completes a task, the output is recorded in `output_result`, and Alex Vance is notified to verify deliverables.

### Approval Proposals (`company_proposals`)
* When an employee produces a high-impact deliverable (blog post, client outreach, SEO patch, site fix), a proposal is created in `company_proposals`.
* Both interfaces display the pending approval count and link directly to the approval review modal.
