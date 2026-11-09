# Lead Intelligence and Client Discovery Integration Plan

## Executive Objective

HeyPrince.in possesses a fully built Lead Intelligence and Outreach Engine capable of discovering local businesses, auditing their websites for performance defects, and drafting high-converting technical proposals.

This plan details how Liam Thorne (Lead Intelligence & Growth Scout) and Sophia Reynolds (Client Solutions Partner) take complete ownership of this existing subsystem, collaborating to discover, qualify, and package high-value client opportunities for Prince (CEO) without duplicating records or sending unauthorized outreach emails.

---

## 1. Subsystem Architecture & Existing Assets Reused

The integration directly leverages the existing production code in `src/lib/outreach/`:

* **Discovery Engine**: `src/lib/outreach/discovery/service.ts`
  - Utilizes OpenStreetMap (OSM) Overpass API and Google Places API to find live businesses.
  - Ingests company name, website domain, phone, physical location, and industry vertical.
* **Database Models**: `src/lib/outreach/db.ts`
  - Tables: `businesses`, `discovery_jobs`, `contacts`, `outreach_campaigns`, `outreach_events`.
* **Lead Qualification Matrix**: `src/lib/outreach/qualification.ts`
  - Rotates across target verticals (`LEAD_SCOUT_TARGET_ROTATION`) including B2B SaaS, D2C E-commerce, Real Estate, and Digital Agencies across high-value markets (US, UK, Germany, Canada, Australia, India).
* **Proposal Drafter**: `src/lib/outreach/proposal-generator.ts`
  - Synthesizes bespoke engineering proposals addressing website speed issues, headless migrations, and modern web architectures.

---

## 2. End-to-End Collaborative Lifecycle

```
[Liam Thorne: Lead Scout]
  1. Executes scheduled discovery job (OSM / Places)
  2. Crawls prospect website & benchmarks TTFB / CWV
  3. Identifies technical debt (e.g. slow WooCommerce, legacy PHP, missing mobile viewport)
  4. Qualifies prospect fit based on revenue potential
            |
            v
[Sophia Reynolds: Client Solutions]
  5. Ingests qualified dossier from Liam
  6. Structures commercial proposal with milestones, timeline, and ROI justification
  7. Formulates cold outreach email draft tailored to the business owner
            |
            v
[Alex Vance: Chief of Staff]
  8. Consolidates proposal into company_proposals
  9. Alerts Prince of high-fit client opportunity
            |
            v
[Prince: CEO Approval Gate]
  10. Reviews business dossier and proposal draft
  11. One-click sign-off or custom edit
            |
            v
[Authorized Outreach]
  12. Dispatches verified email to prospect via outreach engine
```

---

## 3. Detailed Employee Roles & Responsibilities

### A. Liam Thorne (Lead Intelligence & Growth Scout)
* **Trigger**: Scheduled cron run or ad-hoc directive from Prince ("Find 5 e-commerce stores in London with slow mobile checkout").
* **Execution**:
  - Triggers `discoveryService.executeJob()`.
  - Audits candidate website headers, technology stack, and Core Web Vitals.
  - Records metrics: TTFB, page weight, mobile layout shift, CMS platform (WordPress, Shopify, custom).
  - Filters out unreachable domains, parked domains, or businesses without active websites.
  - Updates the `businesses` table with qualification scores (`qualification_score: 85+`).
  - Emits a notification to Sophia Reynolds in the Growth & Revenue Room.

### B. Sophia Reynolds (Client Solutions Partner)
* **Dual Ingestion**:
  1. **Outbound Prospects**: Receives high-scoring leads from Liam Thorne.
  2. **Inbound Inquiries**: Receives customer contact form submissions from `client_leads` via `processInboundLead()`.
* **Execution**:
  - Translates technical defects identified by Liam into tangible commercial losses (e.g., "A 1.8s TTFB results in an estimated 14% cart abandonment for your store").
  - Outlines a fixed-price, milestone-based engineering solution (e.g., "Headless Next.js storefront cutover in 3 weeks").
  - Drafts an outreach email or tailored proposal and writes it to `chief_content_drafts` (type `client_proposal` or `outreach_draft`).
  - Forwards the drafted action to `company_proposals` under Alex Vance's oversight.

---

## 4. CEO Oversight and Zero Unauthorized Communication

To protect HeyPrince.in's brand reputation and ensure 100% compliance:

1. **Strict Approval Requirement**: Under no circumstances does the system send external emails without Prince's explicit sign-off in the CEO Approval Gate.
2. **Preview Before Dispatch**: Prince can view the exact email subject, recipient address, audit evidence cited, and proposed pricing before clicking "Approve & Send".
3. **Idempotency and Anti-Spam Safeguards**:
   - Normalized domain checks prevent contacting the same company twice within 90 days.
   - Suppression lists automatically block unsubscribed or non-responsive prospects.
   - Every email contains standard one-click opt-out footers.

---

## 5. Storage and Cross-Module Synchronization

* **Lead Dossiers**: Stored in `businesses` and indexed by domain.
* **Proposals & Action Drafts**: Stored in `chief_content_drafts` and mirrored in `company_proposals`.
* **Activity & Audit Trail**: Logged to `chief_activity_logs` and shared to `company_memory` under the `Sales` department.
* **Executive Summary**: Appears in `/admin/lead-intelligence/` for aggregate metrics and in `/admin/company` under Tab 4 (CEO Approval Gate) for pending client actions.
