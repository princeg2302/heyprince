# Security Architecture & Vulnerability Audit

## 1. Authentication & Session Security
* **Password Hashing**: Implements standard PBKDF2-SHA256 with 600,000 iterations and 32-byte cryptographically secure random salts (`src/lib/admin-db.ts`).
* **Session Tokens**: Custom HMAC-SHA256 signed tokens (`payload.signature`) stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies (`hp_admin_session`).
* **Timing-Safe Comparison**: Uses `crypto.timingSafeEqual` during session signature validation, mitigating timing attack vectors.

---

## 2. Internal Service-to-Service Security
* **Next.js <-> Python Communication**: Authenticated via HMAC-SHA256 request headers (`X-AI-Signature`, `X-AI-Timestamp`).
* **Replay Window**: Python backend strictly enforces a 300-second timestamp freshness check (`abs(current_time - timestamp) <= 300`).

---

## 3. SQL Injection Immunity
* Direct PostgreSQL operations utilize parameterized queries (`$1, $2, ...`) via `pg` and `asyncpg`. No raw string interpolation is present in SQL statements.

---

## 4. Security Considerations & Recommendations
| Area | Observation | Severity | Recommendation |
| :--- | :--- | :--- | :--- |
| **CORS Origins** | Python backend default allows `*` in dev | Low | Enforce explicit origins (`https://heyprince.in`) in production `.env` |
| **Rate Limiting** | Contact form uses Captcha + rate table | Informational | Captcha challenge expires in 120s; robust against automated scrapers |
| **API Error Leaks** | Some Next.js routes output `err.message` in 500 responses | Low | Sanitize internal error messages in production mode |
