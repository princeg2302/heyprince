# CEO Approval and Notification Workflow Plan

## Executive Governance Principle

HeyPrince.in maintains a strict security and quality perimeter:
* **Internal Planning is 100% Autonomous**: Employees freely research topics, conduct SEO audits, benchmark performance, discover leads, debate technical architectures, and prepare deliverables without asking for permission.
* **External and Production Impact Requires CEO Sign-Off**: No article goes live, no LinkedIn post is published, no outreach email is sent, and no production code or database mutation occurs without explicit approval from Prince (CEO).

---

## 1. Permitted vs. Gated Action Boundaries

| Action Category | Permitted Autonomously | Strictly Requires CEO Approval |
|---|---|---|
| **Content & Editorial** | RSS research, trend analysis, article drafting, SEO keyword optimization, cover image synthesis, proofreading | Publishing to live blog (`posts`), updating published articles, publishing to LinkedIn |
| **Search & SEO** | Title/meta audits, search intent scoring, internal link mapping, competitor research, schema generation | Applying bulk meta tag patches to production pages, deleting or redirecting URLs |
| **Lead Discovery & Sales** | Business discovery via OSM/Places, website TTFB audits, lead scoring, proposal drafting, contact finding | Sending cold outreach emails, booking meetings, offering discounted pricing |
| **Site Reliability & SRE** | Synthetic uptime checks, CWV profiling, Lighthouse audits, broken link scanning, latency alerts | Modifying production routing, deploying hotfixes, modifying environment variables |
| **Workforce & Operations** | Starting room discussions, creating internal tasks, assigning subtasks, recording memory insights | Activating new AI agents, modifying employee tool permissions, incurring paid API costs |

---

## 2. Structure of an Executive Approval Dossier

Every proposal placed before Prince must be complete, verified, and self-contained. The system rejects incomplete or placeholder proposals.

Each proposal in `company_proposals` contains:

1. **Title & Type**: Clear title and classified type (`publish_content`, `outreach_campaign`, `site_modification`, `new_agent_activation`, `financial_expense`).
2. **Executive Justification**: 2 to 3 sentences explaining why this action is recommended now and what business goal it serves.
3. **Participating Employees**: Explicit list of which specialists participated and their sign-offs (e.g., Marcus Sterling drafted, Elena Rostova optimized SEO, David Chen certified CWV).
4. **Verified Research & Evidence**: Real citations, keyword search intent metrics, prospect website speed benchmarks, or Lighthouse scores.
5. **Complete Proposed Deliverable**:
   - For an article: full markdown body (1,500+ words), meta tags, cover image URL, and LinkedIn companion text.
   - For a client proposal: audited business URL, identified technical defects, proposed scope of work, timeline, and email text.
6. **Expected Business Impact**: Estimated search impression gain, client contract value, or conversion rate improvement.
7. **Risks and Dependencies**: Potential risks (e.g. email deliverability, cache invalidation) and mitigation strategies.
8. **Explicit Action Requested**: The exact action Prince is asked to authorize (e.g. "Click Approve to publish article #26 to live site and dispatch to LinkedIn").

---

## 3. Multi-Channel Notification Dispatch

When a proposal is packaged by Alex Vance, the notification system alerts Prince through three coordinated channels:

### A. Real-Time In-App Alert
* In-app badge count updates on the Navigation sidebar (`AI Approvals (1)` and `AI Company`).
* Real-time toast alert appears if Prince is actively in the admin portal.

### B. Mobile Web Push Notification (`web-push`)
* Uses `src/lib/push/push-service.ts` via `sendPushToAllAdmins()`.
* Dispatches a push notification directly to Prince's mobile or desktop browser:
  - *Title*: "HeyPrince AI Company: New Approval Required"
  - *Body*: "Marcus Sterling & team completed '[Article Title]'. Verified for SEO and CWV. Ready for review."
  - *Action*: Tapping opens `/admin/approvals` directly.

### C. Executive Email Digest (`resend` / `nodemailer`)
* For high-priority proposals or daily summary digests, an email is dispatched via Resend or Nodemailer with direct one-click review links.

---

## 4. CEO Decision Flow and Feedback Loop

```
                     +----------------------------+
                     |  Alex Vance Submits Dossier |
                     |   to company_proposals     |
                     +--------------+-------------+
                                    |
                                    v
                     +----------------------------+
                     | Prince Reviews in Portal   |
                     | (/admin/approvals)         |
                     +--------------+-------------+
                                    |
           +------------------------+------------------------+
           |                                                 |
           v                                                 v
   [Click: "Approve"]                                [Click: "Reject / Edit"]
           |                                                 |
           v                                                 v
+----------------------------+                     +----------------------------+
| Executed Immediately:      |                     | Feedback Recorded into     |
| 1. DB Record Created       |                     | company_memory.            |
| 2. LinkedIn Post Sent      |                     | Responsible employee       |
| 3. Proposal status =       |                     | revises draft based on     |
|    'approved'              |                     | Prince's instructions.     |
+----------------------------+                     +----------------------------+
```

### Self-Correction Mechanism
When Prince rejects a proposal or enters feedback (e.g., *"Make the code example focus on App Router parallel routes instead of server actions"*):
1. The feedback is stored in `company_memory` under scope `employee` for the author.
2. The author's personal task matrix marks the item as `in_progress` with high priority.
3. The revised deliverable incorporates Prince's specific directives before re-submission.
