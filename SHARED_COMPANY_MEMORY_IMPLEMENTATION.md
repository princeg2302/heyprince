# Shared Company Memory Implementation & Retrieval Architecture

## Executive Overview

The HeyPrince AI Workforce implements a multi-tiered corporate memory store in PostgreSQL via the `company_memory` table and runtime operations in `src/lib/company/memory.ts`.

This persistent memory architecture ensures that AI employees retain cross-meeting memory, remember CEO strategic decisions, recall previous architectural benchmarks, and learn from past experiments without context loss across browser refreshes or sessions.

---

## 1. Multi-Tiered Memory Scopes

| Scope | Storage Key | Persistence Target | Typical Insights |
| :--- | :--- | :--- | :--- |
| **`company`** | Global | Company-wide strategic direction | High-level business pivots, CEO directives, quarterly growth targets, 30-day goals. |
| **`department`** | `department` column | Departmental priorities and baselines | Infrastructure latency thresholds (<500ms TTFB), SEO title standards (40-60 chars), target B2B industries. |
| **`employee`** | `employee_id` column | Individual agent identity and learnings | Individual task execution history, linguistic specialties, specialized skills. |
| **`meeting`** | `discussion_id` column | Room-level agreements & transcripts | Consensus summaries, action deliverables, approved architectural trade-offs. |

---

## 2. Memory Categories

Each recorded memory is indexed under one of six structured categories:
1. `strategy`: Long-term commercial or technological roadmap decisions.
2. `decision`: Formal agreements reached in meetings or approved proposals.
3. `learning`: Empirical findings from tool runs or content performance.
4. `performance_benchmark`: Recorded TTFB latency, SERP impressions, lead conversion stats.
5. `market_intelligence`: Competitor observations and regional B2B opportunities.
6. `failed_experiment`: Bottlenecks or rejected strategies retained to avoid repeating errors.

---

## 3. Dynamic Retrieval and Context Injection

When an agent turn is initiated in `advanceDiscussionTurn`, the orchestrator queries `company_memory` for memories relevant to the speaker's department and personal identity:

```typescript
const memories = await getRelevantCompanyMemories({
  department: speaker.department,
  employeeId: speaker.id,
  limit: 5,
});
const historicalMemories = formatMemoriesForPrompt(memories);
```

The formatted memories are injected into the Gemini system prompt:
```
COMPANY MEMORY & STRATEGY:
- [COMPANY:PERFORMANCE_BENCHMARK] Autonomous company audit cycle executed: Latency avg 235ms, 20 prospect accounts monitored. (Confidence: 100%)
- [COMPANY:DECISION] Executive consensus reached on "Production Core Web Vitals Optimization": Execute Initiative: Production Core Web Vitals Optimization (Confidence: 95%)
```

---

## 4. Verification and Persistence Guarantee

Every concluded discussion automatically generates a synthesized memory record with `confidenceScore: 0.95`. During autonomous background cycles, operational benchmarks are saved directly to `company_memory`, creating a cumulative, self-improving knowledge base.
