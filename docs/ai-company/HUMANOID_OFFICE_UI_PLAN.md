# HeyPrince AI Company: Humanoid Virtual Office UI & Experience Plan

**Project:** Autonomous AI Workforce Platform  
**Document:** `HUMANOID_OFFICE_UI_PLAN.md`  
**Date:** November 8, 2026  
**Status:** Architecture Blueprint (Phase 0 Audit)  

---

## 1. Design Philosophy & Technology Evaluation

The Humanoid Virtual Office is the visual and interactive heart of the AI Company. It must give the CEO the immediate feeling of walking onto an active corporate trading floor where AI employees are visibly working, thinking, collaborating, and delivering results.

### Frontend Technology Evaluation
- **Three.js / React Three Fiber Evaluation:**
  - *Current Repo Reality:* `package.json` uses React 19 (`react: ^19.3.0`, `next: ^16.3.8`). Three.js / R3F packages have known peer-dependency collisions with React 19 and introduce a 600KB+ WebGL bundle, shader compilation latency, and battery drain on mobile devices.
  - *Recommendation:* **Reject heavy WebGL 3D**. In accordance with the prompt's explicit instruction:
    > *"Use lightweight 3D technology where appropriate, but first evaluate existing frontend stack... The avatars are visual representations. Do not require continuous video generation... Build functional collaboration and task execution before spending time on advanced 3D visuals."*
- **The Selected Approach: Ultra-High-Performance 2.5D Isometric Virtual Office:**
  - Built using **Tailwind CSS**, **Lucide React icons**, **GSAP micro-animations** (already installed in `package.json`), and **SVG / WebP humanoid avatars**.
  - Renders at a silky 60 FPS on any laptop or smartphone.
  - Zero hydration overhead; 100% accessible; responsive.

---

## 2. Master Virtual Office Floorplan Layout

```
+---------------------------------------------------------------------------------------------------------------+
|  HEYPRINCE AI ENTERPRISE HQ — EXECUTIVE SUITE                                                  [CEO: Prince]  |
+---------------------------------------------------------------------------------------------------------------+
|  NAV: [🏢 Virtual Floorplan]  [💬 Live Meeting Room]  [📋 Task Kanban]  [⚖️ CEO Approvals (3)]  [📊 Metrics]   |
+---------------------------------------------------------------------------------------------------------------+
|                                                                                                               |
|  +-----------------------------+  +-------------------------------+  +-----------------------------+          |
|  |  EXECUTIVE WING             |  |  CENTRAL CONFERENCE ROOM      |  |  GROWTH & REVENUE POD       |          |
|  |  Desk: Alex Vance (CoS)     |  |  [Status: Meeting in Progress]|  |  Desk: Elena Rostova (SEO)  |          |
|  |  Status: [🟢 Moderating]    |  |  Topic: "Q4 High-Intent Topics|  |  Status: [🔵 Analyzing SERP]|          |
|  |  Active Task: Standup Sync  |  |  In Room: Alex, Elena, Marcus |  |  Desk: Liam Thorne (Sales)  |          |
|  +-----------------------------+  +-------------------------------+  +-----------------------------+          |
|                                                                                                               |
|  +-----------------------------+  +-------------------------------+  +-----------------------------+          |
|  |  EDITORIAL & MEDIA LAB      |  |  INNOVATION & R&D LOUNGE      |  |  SRE & INFRASTRUCTURE VAULT |          |
|  |  Desk: Marcus Sterling      |  |  Desk: Aria Nakamura (Product)|  |  Desk: David Chen (SRE)     |          |
|  |  Status: [🟡 Writing Draft] |  |  Status: [💡 R&D Blueprint]   |  |  Status: [🟢 Latency: 180ms]|          |
|  |  Word Count: 1,420 words    |  |  Desk: Devon Brooks (Analytics|  |  Checks: All Routes Online  |          |
|  +-----------------------------+  +-------------------------------+  +-----------------------------+          |
|                                                                                                               |
+---------------------------------------------------------------------------------------------------------------+
|  LIVE COMPANY CHIEF DISPATCH TICKER:                                                                         |
|  [09:14 AM] Alex Vance adjourned Daily Standup -> Generated CEO Proposal #39 (Publish Nov 9 Insight Article)   |
+---------------------------------------------------------------------------------------------------------------+
```

---

## 3. Core UI Views & Component Hierarchy

### View 1: Interactive Office Floorplan (`/admin/company/office`)
- **Floorplan Grid:** 6 dedicated corporate zones (Executive, Conference Room, Growth, Editorial, R&D, SRE).
- **Employee Desk Cards:**
  - Humanoid headshot avatar with dynamic status glow (Green = Active/Working, Amber = Thinking/Drafting, Blue = In Meeting, Gray = Idle).
  - Floating activity pill (e.g. `"Auditing Canonical Tags"`, `"Synthesizing 8K Cover Art"`).
  - One-click action: `"Inspect Task History"`, `"Summon to Chat"`.

### View 2: Live Collaborative Meeting Room (`/admin/company/rooms/[roomId]`)
- **Room Header:** Room title (e.g. *Daily Standup*), Moderator badge (*Alex Vance*), Live Token Gauge (`1,840 / 4,000 tokens`), Active Agenda.
- **Turn-by-Turn Speech Stream:**
  - Messages formatted as corporate dialogue bubbles with employee avatar, full name, role, and message type badge (`PROPOSAL`, `CHALLENGE`, `EVIDENCE`, `CONSENSUS`).
  - Evidence cards expandable to view raw latency numbers, keyword volume, or code diffs.
- **Meeting Synthesis Panel (Right Sidebar):**
  - Live auto-generated meeting notes.
  - Deliverable tracker: shows proposed tasks or CEO approvals emerging from the discussion in real time.
- **Powered By:** Supabase Realtime CDC (`company_messages`). Zero page refreshes.

### View 3: CEO Sovereign Approval Center (`/admin/ai-approvals`)
- **Unified Review Queue:** Grouped by priority and risk level.
- **Side-by-Side Asset Inspection:**
  - For articles: Full rich-text preview, reading time, word count counter, meta description, and Pollinations AI cover art preview.
  - For outbound pitches: Target domain audit scorecard, email subject, WhatsApp pitch, and estimated conversion fit score.
- **Action Controls:**
  - Large Green `"Authorize & Deploy"` button (executes HMAC-signed worker call).
  - Red `"Reject with Feedback"` button with quick-tag feedback buttons (*"Refocus on Enterprise ROI"*, *"Too speculative"*, *"Wrong industry"*).
  - Amber `"Request Revisions"` button with inline comment field.

### View 4: Employee Dossier Modal (`/admin/company/employees/[id]`)
- High-resolution humanoid portrait.
- Biography, department, personality archetype (e.g. *ENTJ Strategic Orchestrator*).
- Real-time performance scorecard:
  - Tasks completed vs failed.
  - CEO approval rate (% of proposals accepted by Prince).
  - Total token consumption and estimated inference cost (USD).
  - Average execution latency.
- Direct override controls: Pause employee, adjust daily task limit, change model preference tier.

---

## 4. Design Aesthetics & Visual Tokens

- **Palette:** Dark executive theme matching current HeyPrince brand guidelines (`#0b0b0f` background, `#12121a` cards, `#e11d48` / `#f43f5e` crimson primary accents, `#3b82f6` cyan secondary accents).
- **Typography:** Inter / Outfit font family for clean corporate readability.
- **Micro-Interactions:**
  - Smooth GSAP status transitions when an agent transitions from `idle` to `thinking`.
  - Audio subtle chime (configurable) when a new CEO approval arrives or a meeting adjourns.
