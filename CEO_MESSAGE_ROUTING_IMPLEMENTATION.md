# CEO Message Routing and Intent Classification Implementation

## Executive Overview

The HeyPrince AI Workforce features an executive-grade intent routing engine in `src/lib/company/ceo-router.ts`. 

Whenever Prince (CEO) sends a message into any virtual collaboration room (via `sendCeoDirective`), the system no longer executes blind round-robin modulo alternation. Instead, it classifies the CEO's directive, updates the room's participant registry, and routes the response to the optimal executive or specialist.

---

## 1. Intent Classification Taxonomy

Every message sent by Prince is parsed and mapped into one of nine distinct intent categories:

| Intent Category | Trigger Patterns & Semantics | Primary Responder | Supporting Specialists | Operational Action |
| :--- | :--- | :--- | :--- | :--- |
| `language_query` | Hindi, language, bhasha, "kis kis ko aati hai" | `alex_vance` | `elena_rostova`, `liam_thorne`, `sophia_reynolds` | Summarize language capability matrix, followed by in-character bilingual responses in Hindi/Hinglish. |
| `urgent_issue` | Down, 500, error, broken, latency, crash | `david_chen` | `alex_vance` | Run live HTTP latency audit on core routes; flag TTFB bottlenecks. |
| `approval_rejection` | Approved, reject, proceed, go ahead, stop | `alex_vance` | Open proposal sponsors | Update proposal state; trigger immediate backend execution or mark changes requested. |
| `direct_instruction` | Stop working on this, pivot, switch focus | `alex_vance` | Department heads | Re-align active discussions, cancel obsolete goals, pivot team focus. |
| `business_strategy` | Grow, revenue, 30 days, commercial, clients | `alex_vance` | `elena_rostova`, `liam_thorne`, `sophia_reynolds` | Synthesize commercial opportunities using live business data and services catalog. |
| `task_assignment` | Specific research (e.g. SEO, leads, audit) | Specific domain agent (`elena`, `liam`, `david`) | `alex_vance` | Execute domain tool, verify acceptance criteria, and generate internal task. |
| `new_idea` | Launch, new service, experimental feature | `alex_vance` | `marcus_sterling`, `sophia_reynolds` | Open feasibility analysis in Innovation Lab; structure scope and ROI. |
| `feedback` | Revisions, pricing changes, critique | Proposal sponsor | `alex_vance` | Incorporate feedback into proposal payload. |
| `general_question` | General status update, architecture queries | `alex_vance` | All specialists | Executive overview grounded in verified database metrics. |

---

## 2. Language Capability Matrix

In accordance with user directives, the workforce possesses explicit, realistic linguistic capabilities:

- **Prince (CEO)**: Native Hindi and English.
- **Alex Vance (Chief of Staff)**: Native/fluent English; fully comprehends Hindi directives, acknowledges executive decorum respectfully in English/Hinglish ("Namaste Prince..."), and orchestrates the bilingual team.
- **Elena Rostova (Head of Search & Growth)**: Fluent in English and conversational Hindi/Hinglish; leads keyword discovery for regional Indian search queries and localized commercial intent.
- **Liam Thorne (Lead Intelligence Scout)**: Fluent in English and conversational Hindi/Hinglish; interfaces directly with domestic Indian businesses and regional merchants.
- **Sophia Reynolds (Client Solutions)**: Fluent in English and Hindi; translates business requirements into tailored client scopes.
- **Marcus Sterling (Editorial)**: Authoritative English writer; formulates bilingual and Hinglish technical content strategies.
- **David Chen (Infrastructure Sentinel)**: English technical lead; comprehends Hindi context while maintaining rigorous Core Web Vitals telemetry.

---

## 3. End-to-End Execution Sequence

```
Prince submits directive in UI: "Hindi kis kis ko aati hai?"
                               │
                               ▼
            POST /api/admin/company/discussions/[id]/message
                               │
                               ▼
        orchestrator.ts -> sendCeoDirective({ directive })
                               │
                               ▼
      ceo-router.ts -> classifyAndRouteCeoMessage(directive)
          Result: { category: 'language_query', primaryResponderId: 'alex_vance', ... }
                               │
                               ▼
      insertCompanyMessage(senderId: 'prince_ceo', content)
                               │
                               ▼
      advanceDiscussionTurn(discussionId, { forcedSpeakerId: 'alex_vance' })
                               │
                               ▼
      gemini.ts generates in-character response with live tool metrics
                               │
                               ▼
      Live WebSocket broadcast & DB record inserted
                               │
                               ▼
      Subsequent turn advances to Elena Rostova or Liam Thorne for Hindi dialogue
```
