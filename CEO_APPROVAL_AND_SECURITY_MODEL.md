# CEO Approval & Security Model
**HeyPrince Autonomous AI Workforce Platform**
*Audit Date: 2026-11-08*

---

## 1. Principles of Security & Non-Destructive Operation

The HeyPrince AI Workforce is designed with strict isolation guarantees:
1. **CEO Sovereignty:** The human owner (Prince) has ultimate authority. Agents cannot unilaterally take external, financial, production-altering, or irreversible actions.
2. **Backend Enforcement:** Tool authorization is verified at the server/database layer, never relying purely on frontend visibility.
3. **No Secret Leakage:** Production database connection strings, third-party API keys (Resend, Gemini, Hostinger SMTP), and internal tokens are never transmitted to LLM context prompts or exposed in public API responses.
4. **Sandboxed Execution:** Untrusted code execution or third-party scrapers run inside isolated containerized routines with strict timeouts.

---

## 2. Action Authorization Matrix

| Action Category | Target Resource | Authorization Level | Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **Internal Planning & Ideation** | Virtual Room Discussions | **Automatic** | Validated in Python backend |
| **Draft Creation** | `chief_content_drafts` / `company_tasks` | **Automatic** | Agent role check |
| **Read-Only Diagnostics** | HTTP Health Probe, Lighthouse, SEO Scan | **Automatic** | Rate-limited outgoing client |
| **Blog Publishing** | Production `posts` table / Live Blog | **CEO Approval Required** | Backend checks `company_proposals.status = 'approved'` |
| **Social Media Sharing** | LinkedIn REST API (`publishArticleToLinkedIn`) | **CEO Approval Required** | Requires verified proposal and explicit option flag |
| **Cold Outreach Sending** | Hostinger SMTP / Resend Email Engine | **CEO Approval Required** | Global kill-switch + individual campaign approval |
| **Production Code Modification** | Git repository / Live server scripts | **CEO Approval Required** | Strict file-write lock |
| **New Employee Activation** | `company_employees` table | **CEO Approval Required** | Draft configuration must pass sandbox test |
| **Financial / Cloud Expense** | Paid APIs or infrastructure scaling | **CEO Approval Required** | Token and expense quotas enforced |

---

## 3. Approval Token & Execution Protocol

When Prince (CEO) clicks **Approve** in `/admin/company` or approves via iPhone Web Push:
1. The server updates `company_proposals` to `status = 'approved'` and sets `approved_at = NOW()`.
2. The server signs a short-lived execution nonce or verifies the approval directly in the database transaction.
3. The server executes the specified `action_payload` within a try/catch transaction block:
   - If publishing an article: Inserts into CMS `posts`, schedules canonical URL, optionally triggers LinkedIn post.
   - If sending outreach: Queues verified contact in `outreach_queue`.
   - If activating new employee: Flips employee status from `offline` to `idle`.
4. The server marks `executed_at = NOW()` and logs the outcome in `chief_activity_logs`.
5. If the proposal has expired (`expires_at < NOW()`), execution is strictly rejected with HTTP 410 Gone.
