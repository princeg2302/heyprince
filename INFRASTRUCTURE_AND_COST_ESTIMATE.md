# Infrastructure & Cost Estimate
**HeyPrince Autonomous AI Workforce Platform**
*Audit Date: 2026-11-08*

---

## 1. Hosting Architecture & Sizing

The HeyPrince AI Company runs on a hybrid sovereign architecture engineered for ultra-low operating cost, high reliability, and zero vendor lock-in:

```
+-----------------------------------+-----------------------------------+
| Component                         | Hosting & Infrastructure          |
| :---                              | :---                              |
| Next.js 16 Web Application        | Vercel Edge / Hostinger VPS       |
| Supabase PostgreSQL Database      | Supabase Managed (Transaction 6543)|
| Python AI Backend (FastAPI)       | Ubuntu VPS (Dedicated / Docker)   |
| Primary LLM Inference (Local PC)  | Local RTX GPU Rig via Ollama 70B  |
| Cloud LLM Fallback (Gemini)       | Google Cloud / Gemini 3.5 Flash   |
| Static Assets & Avatars           | Next.js Public Folder / Edge CDN  |
+-----------------------------------+-----------------------------------+
```

---

## 2. Monthly Operating Cost Breakdown

| Resource | Service Provider | Allocation / Plan | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | Supabase | Free Tier / Pro ($25/mo pooled) | $0.00 – $25.00 |
| **Next.js Frontend Hosting** | Vercel | Hobby / Pro ($20/mo) | $0.00 – $20.00 |
| **Python AI Backend VPS** | Hostinger / Hetzner VPS | 4 vCPU, 8 GB RAM, 100 GB NVMe | ~$9.50 – $14.00 |
| **Primary LLM (Ollama 70B)**| Sovereign PC Bridge | Local electricity | ~$5.00 (amortized) |
| **Gemini 3.5 Flash Fallback** | Google AI Studio | ~150,000 tokens/day (~$0.075/1M) | ~$0.35 – $1.50 |
| **Transactional Email (SMTP)**| Hostinger Business Email | Included in hosting plan | $0.00 |
| **Push Notifications (VAPID)**| Web Push API (iOS / Web) | Zero third-party fees | $0.00 |
| **TOTAL ESTIMATED MONTHLY COST** | | | **~$15.00 – $45.00 / month** |

---

## 3. Cost Control & Guardrails

1. **Token Budgets Per Meeting:** Hard cap of 4,000 tokens per discussion. Meetings automatically terminate if this cap is approached.
2. **Turn Limits:** Every meeting is limited to a maximum of 8 turns.
3. **Local-First Routing:** The LLM router defaults to the local Ollama instance on your home/office rig; it only falls back to Gemini 3.5 Flash if Ollama is unreachable, keeping external API spend to pocket change.
4. **Idempotent Background Jobs:** Cron tasks check deduplication hashes prior to executing model generation, preventing duplicate runs.
