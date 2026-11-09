# HeyPrince AI Company: Workforce Behavior Root Cause Diagnosis

## Executive Summary

An exhaustive audit of the HeyPrince AI Company platform was conducted across the database, LLM provider configurations, orchestration logic, tool integration, and meeting turn generation. 

The investigation confirmed that the system was exhibiting **simulator-like behavior, hardcoded dialogue loops, irrelevant responses to CEO directives, and artificial evidence metrics**.

The primary root cause was an **unhandled Gemini API 404 failure loop** in `src/lib/company/gemini.ts`. Deprecated model identifiers (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`) failed silently on every request, triggering a static fallback switch-statement that injected hardcoded canned phrases and synthetic JSON evidence into the live database. Coupled with mechanical round-robin speaker selection and the absence of CEO message classification, the workforce was incapable of genuine reasoning, tool usage, or contextual dialogue.

---

## 1. Architectural Component Diagnosis

### 1.1 LLM Provider and Routing Failure (Primary Trigger)
- **File**: `src/lib/company/gemini.ts` (lines 23-27)
- **Defect**: The candidate model list was configured as:
  ```typescript
  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];
  ```
- **Observed Behavior**:
  - `gemini-2.5-flash`: HTTP 404 (`"This model models/gemini-2.5-flash is no longer available to new users."`)
  - `gemini-2.0-flash`: HTTP 404
  - `gemini-1.5-flash`: HTTP 404 (`"models/gemini-1.5-flash is not found for API version v1beta"`)
- **Impact**: Every single call to Google Gemini failed silently in the `try...catch` loop and fell through to line 99: `return generateContextualFallback(params)`.
- **Verified Working Model**: `gemini-3.5-flash` and `gemini-3.8-flash` return HTTP 200 OK with sub-second response times on the configured `GEMINI_API_KEY`.

### 1.2 Hardcoded Fallback Templates (The "Simulator" Artifact)
- **File**: `src/lib/company/gemini.ts` (lines 102-185)
- **Defect**: When the LLM failed, `generateContextualFallback()` returned verbatim hardcoded strings per department:
  - *Growth (Elena Rostova)*: `"From a search visibility standpoint, targeting high-intent long-tail keywords in this cluster allows us to dominate commercial queries without competing against generic aggregators."` with evidence `{"organicIntent": "Commercial High-Intent", "searchGainTarget": "+28%"}`.
  - *Infrastructure (David Chen)*: `"I have audited our latency baselines. Any new deployment must strictly respect our sub-250ms mobile TTFB threshold and preserve perfect 100% Core Web Vitals pass rates."` with evidence `{"ttfbMaxMs": 250, "cwvScoreTarget": 98}`.
  - *Executive (Alex Vance)*: `"Let us examine the critical milestones for [topic]. What are our immediate technical risks and delivery trade-offs?"`
- **Impact**: The UI displayed identical dialogue blocks repeatedly, regardless of what the CEO or other agents had stated.

### 1.3 CEO Message Handling & Directive Routing
- **File**: `src/lib/company/orchestrator.ts` (`sendCeoDirective`)
- **Defect**: When Prince submitted a message:
  1. The message was inserted with `senderId: 'prince_ceo'`.
  2. The function immediately called `advanceDiscussionTurn(discussionId)` without analyzing the CEO's intent.
  3. In `advanceDiscussionTurn`, speaker selection evaluated:
     `else if (lastSpeakerId === 'prince_ceo') { nextSpeakerId = MODERATOR_ID; }`
  4. Alex Vance was invoked with the broken Gemini model, which triggered the canned fallback: *"Let us examine the critical milestones for [topic]..."*
- **Impact**: Questions like *"Hindi kis kis ko aati hai?"* or *"What are we doing to grow HeyPrince this month?"* were completely ignored, and Alex Vance produced generic agenda filler.

### 1.4 Meeting Speaker Selection & Flow
- **File**: `src/lib/company/orchestrator.ts` (lines 96-105)
- **Defect**:
  ```typescript
  const turnIndex = discussion.turn_count % availableSpecialists.length;
  nextSpeakerId = availableSpecialists[turnIndex];
  ```
- **Impact**: Speakers took turns based solely on modulo arithmetic. Specialist agents were called in fixed alphabetical order rather than based on conversational relevance, department domain, or explicit mentions.

### 1.5 Grounding & Tool Execution
- **Observation**: Existing tools (`runWebsiteGuardianAudit`, `runSeoGrowthAudit`, `runLeadScoutDiscovery`, `discoveryService`) existed in `src/lib/chief-of-staff/agents/`, but were never connected to `src/lib/company/`.
- **Impact**: Evidence cards displayed synthetic mock numbers (e.g., `searchGainTarget: "+28%"`), leading the CEO to believe data was being fabricated.

### 1.6 Company Memory Utilization
- **Observation**: A PostgreSQL table `company_memory` existed in `schema.sql`, but `orchestrator.ts` and `gemini.ts` never queried or persisted entries to it during discussions.
- **Impact**: Agents had zero cross-meeting memory, no recollection of previous CEO directives, and no persistent knowledge of previous architectural decisions.

### 1.7 Autonomous Scheduling & Background Execution
- **Observation**: Meeting turns and agent tasks only executed when triggered by interactive UI clicks (`Advance Turn` or `Send Directive`).
- **Impact**: The platform was an on-demand UI loop rather than a self-initiating, 24/7 autonomous workforce.

---

## 2. End-to-End Trace of the Previous Broken Flow

```
[Prince (CEO) sends message: "Hindi kis kis ko aati hai?"]
                         │
                         ▼
        [API: /api/company/discussions/[id]/directive]
                         │
                         ▼
        [insertCompanyMessage: prince_ceo]
                         │
                         ▼
        [advanceDiscussionTurn() invoked]
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[Check lastSpeakerId: 'prince_ceo']  [Next speaker forced to MODERATOR: 'alex_vance']
                         │
                         ▼
        [generateAgentTurnResponse()]
                         │
        ┌────────────────┴─────────────────────────────────────────┐
        ▼                                                         ▼
[Try 'gemini-2.5-flash' -> 404]                       [Try 'gemini-2.0-flash' -> 404]
        │                                                         │
        └────────────────────────┬────────────────────────────────┘
                                 ▼
                    [Try 'gemini-1.5-flash' -> 404]
                                 │
                                 ▼
                  [generateContextualFallback()]
                                 │
                                 ▼
      [Returns hardcoded string: "Let us examine the critical milestones..."]
                                 │
                                 ▼
           [Inserted into company_messages and rendered in UI]
```

---

## 3. Mandatory Remediation Architecture

| Subsystem | Previous State | Target Autonomous Architecture |
| :--- | :--- | :--- |
| **Model Engine** | Dead 404 models (`gemini-2.5-flash`, etc.) | Verified `gemini-3.5-flash`, `gemini-3.8-flash`, with multi-provider fallbacks. |
| **Fallbacks** | Hardcoded canned dialogues with fake stats | Strict dynamic error propagation or zero-fill structured recovery; no canned transcripts. |
| **CEO Router** | Modulo pass-through | Intent classifier (`language_query`, `business_strategy`, `direct_instruction`, etc.) with targeted speaker assignment. |
| **Tool Grounding** | None (fabricated JSON) | Live HTTP audit, live DB post metadata check, live OpenStreetMap discovery queries. |
| **Speaker Selection** | Round-robin modulo | Context-aware router matching discussion agenda and CEO question to agent expertise. |
| **Memory** | Unused table | Multi-tier vector/relational memory retrieved per turn and stored on discussion conclusion. |
| **Autonomy** | Browser-dependent UI clicks | Headless background runner (`/api/cron/company-workforce`) evaluating proactive goals. |
