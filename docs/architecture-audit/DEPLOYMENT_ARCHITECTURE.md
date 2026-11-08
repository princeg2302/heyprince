# Deployment & Infrastructure Topology

## 1. Multi-Tier Hybrid Infrastructure

```mermaid
flowchart TD
    subgraph GitHub["Source Control (GitHub)"]
        A["main branch (Single Source of Truth)"]
    end

    subgraph VercelEdge["Vercel Edge Platform"]
        B["Next.js Web Frontend & Edge APIs"]
        C["Environment Variables & Edge Crons"]
    end

    subgraph SelfHostedVPS["Self-Managed VPS (Ubuntu Linux)"]
        D["Docker Engine"]
        E["heyprince-ai-backend (FastAPI Container)"]
    end

    subgraph HomePC["Workstation / GPU Node"]
        F["RTX 4080 GPU"]
        G["Ollama Daemon (Port 11434)"]
        H["Tailscale Secure Mesh VPN"]
    end

    subgraph ManagedCloud["Managed Cloud Services"]
        I[("Supabase PostgreSQL & Storage")]
        J["Google Gemini API Cloud"]
    end

    A -->|Git Push Hook| B
    B -->|HMAC Authenticated HTTPS| E
    B <--> I
    E <--> I
    E -->|Tailscale VPN| H
    H --> G
    G --> F
    E -->|Cloud Fallback| J
```

---

## 2. Deployment Workflows
1. **Frontend & Application Tier (Vercel)**:
   * Commits pushed to `main` automatically trigger Vercel preview/production builds (`next build`).
   * Edge cron triggers fire `/api/cron/*` on schedule.
2. **Dedicated AI Backend (VPS)**:
   * Containerized via `Dockerfile` and `docker-compose.yml`.
   * Bootstrapped with `docker compose up -d --build`.
   * Exposes port `8000` mapped to internal Uvicorn server.
