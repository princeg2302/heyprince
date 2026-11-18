# Multi-Provider AI Router Implementation Report

## Executive Summary

The central AI router in `heyprince-ai-backend` has been enhanced to orchestrate multiple AI providers with automatic fallback, rate limit protection, Google Cloud project-level quota tracking, bounded exponential backoff with jitter, structured output consistency, and telemetry recording.

## Provider Priority Hierarchy

Requests are dispatched in the following preferred order:

1. Priority 0 (Optional Local Dev): Local PC Ollama GPU (if explicitly requested or online on local workstation).
2. Priority 1 (Primary Cloud): Google Gemini Primary (`GEMINI_API_KEY_1` or fallback `GEMINI_API_KEY`). Default model: `GEMINI_MODEL` (`gemini-2.5-flash`).
3. Priority 2 (Backup Cloud): Google Gemini Backup (`GEMINI_API_KEY_2`). Default model: `GEMINI_FALLBACK_MODEL`.
4. Priority 3 (Final Cloud Fallback): OpenAI API (`OPENAI_API_KEY`). Default model: `OPENAI_MODEL` (`gpt-4o-mini`).

## Environment Variables Configuration

```env
# Gemini Primary
GEMINI_API_KEY_1=AIzaSy...
GEMINI_API_KEY=AIzaSy...  # Legacy fallback alias
GEMINI_MODEL=gemini-2.5-flash
GEMINI_PROJECT_ID_1=google-project-id-1

# Gemini Backup
GEMINI_API_KEY_2=AIzaSy...
GEMINI_FALLBACK_MODEL=gemini-2.5-flash
GEMINI_PROJECT_ID_2=google-project-id-2

# OpenAI Fallback
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Credentials are kept server-side only.

## Key Technical Features

### 1. Project-Level Quota Awareness
Google Gemini quotas are enforced at the Google Cloud project level, not only at the API key level.
- When Gemini Primary returns HTTP 429 with `RESOURCE_EXHAUSTED` or per-project quota messages (`project_quota_exhausted`), the router marks the project quota as exhausted.
- If `GEMINI_PROJECT_ID_1 == GEMINI_PROJECT_ID_2` (or project quota exhaustion was flagged), the router skips Gemini Backup to prevent redundant quota rejections and immediately engages OpenAI.

### 2. Bounded Exponential Backoff with Jitter
For transient errors (HTTP 500, 502, 503, 504, connection resets, timeouts):
- Delay: `min(0.4 * (2 ** attempt) + random.uniform(0.1, 0.3), 3.0)` seconds.
- Maximum retries per provider slot: 2.
- Respects `Retry-After` headers when provided by the upstream API.

### 3. Fail-Fast on Client Errors
If a provider rejects a prompt with HTTP 400 (malformed schema, invalid prompt structure), the router raises a `ValueError` immediately. It does not blindly retry the identical broken request against secondary providers.

### 4. Structured Output Consistency
All providers (Gemini Primary, Gemini Backup, OpenAI) return a uniform internal response dictionary:
```python
{
    "text": "Clean response content without em-dashes",
    "provider": "gemini | openai | ollama",
    "model": "active-model-name",
    "usage": {
        "prompt_tokens": 120,
        "completion_tokens": 340,
        "total_tokens": 460
    },
    "json": { ... }  # Populated when format_json=True
}
```
When `format_json=True` is requested:
- Cleans markdown code fences (` ```json ... ``` `).
- Validates JSON parse.
- Never silently saves corrupted text.

### 5. Automated No-Em-Dash Rule Enforcement
Every call automatically appends `NO_EM_DASH_INSTRUCTION` to the system prompt and sanitizes the returned text through `sanitize_em_dashes()`, converting any em-dashes into hyphens, colons, or commas.

### 6. Telemetry and Metrics Tracker (`app/llm/telemetry.py`)
Tracks every attempt in an in-memory rolling buffer:
- Records: `provider`, `model`, `attempt_number`, `duration_ms`, `success`, `error_category`, `tokens_in`, `tokens_out`, `estimated_cost_usd`.
- Exposes `get_recent_metrics()` for monitoring total calls, success rates, and average latency.
- Never records raw API keys, authorization headers, or sensitive user inputs.

## Dual-Engine Parity: TypeScript Router Mirroring

In `src/lib/company/gemini.ts`, the Next.js server actions mirror the Python router's fallback order:
1. Iterates through configured Gemini keys (`GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY`).
2. If all Gemini keys fail or encounter quota restrictions, automatically dispatches to OpenAI (`https://api.openai.com/v1/chat/completions`) with `gpt-4o-mini` and `response_format: { type: 'json_object' }`.
3. If OpenAI is unavailable, activates the verified dynamic fallback `generateDynamicFallback()`.
