# AI Provider Fallback Test Results Report

## Executive Summary

This report documents the verification of the central AI provider router in `heyprince-ai-backend`. Tests were executed against simulated error conditions (rate limiting, project quota exhaustion, provider outages, invalid request payloads, timeout backoffs) and validated telemetry tracking.

## Test Environment & Configuration

- Test Runner: Python 3.14.8 (`trading-bot/venv/Scripts/python.exe`)
- Test Suite: `heyprince-ai-backend/tests/test_multi_provider_router.py`
- Framework: `unittest.mock` with asynchronous event loop (`asyncio`)

## Detailed Test Scenarios & Results

### Test 1: Gemini Primary Preferred Execution
- Scenario: Both Gemini Primary and Backup are configured with valid credentials. System is in normal operating state.
- Expected Behavior: Dispatches strictly to Priority 1 (Gemini Primary). Does not call Backup or OpenAI.
- Observed Output:
  - Provider: `gemini`
  - Model: `gemini-2.5-flash`
  - Call Count: Gemini Primary called 1 time. Backup called 0 times. OpenAI called 0 times.
- Status: PASS

### Test 2: Gemini Primary Quota Exhaustion -> Gemini Backup Fallback
- Scenario: Gemini Primary returns HTTP 429 with `RESOURCE_EXHAUSTED` (key-level quota). Gemini Backup is available with a distinct key.
- Expected Behavior: Primary catches quota error, logs failure in telemetry, and smoothly advances to Gemini Backup.
- Observed Output:
  - Primary Error: `Resource exhausted: 429 quota reached`
  - Backup Result: `Gemini backup response: recovered seamlessly.`
  - Call Count: Primary tried 1 time, Backup engaged 1 time.
- Status: PASS

### Test 3: Project-Level Quota Rule (Skips Backup, Engages OpenAI)
- Scenario: Gemini Primary returns a per-project quota exhaustion error (`project_quota_exhausted`).
- Expected Behavior: Router detects project-level constraint, recognizes that Gemini Backup shares the same exhausted Google Cloud quota, skips Backup entirely, and immediately invokes Priority 3 (OpenAI Fallback).
- Observed Output:
  - Primary Error: `Per-project quota exceeded for Google Cloud project`
  - Backup Action: Skipped (0 calls).
  - OpenAI Result: `OpenAI fallback response: zero downtime achieved.`
  - Provider: `openai`
  - Model: `gpt-4o-mini`
- Status: PASS

### Test 4: Both Gemini Providers Outage -> OpenAI Fallback
- Scenario: Both Gemini Primary and Gemini Backup encounter upstream 503 Service Unavailable errors.
- Expected Behavior: Both Gemini attempts fail gracefully after backoff, and inference is fulfilled by OpenAI.
- Observed Output:
  - Gemini Errors: `503 Service Unavailable` on both slots.
  - OpenAI Result: `OpenAI payload: high-converting technical proposal.`
  - Provider: `openai`
- Status: PASS

### Test 5: Client-Side Invalid Input Guardrail
- Scenario: Prompt or schema is malformed (HTTP 400 Bad Request).
- Expected Behavior: Fails immediately with `ValueError`. Does not blindly retry the invalid request across secondary providers.
- Observed Output:
  - Raised: `ValueError: Malformed request rejected by provider`
  - Secondary Call Count: 0 calls to Backup or OpenAI.
- Status: PASS

### Test 6: Structured Output Formatting & JSON Extraction
- Scenario: LLM returns JSON wrapped inside markdown code fences (` ```json { ... } ``` `).
- Expected Behavior: Code fences are stripped, JSON is parsed and returned in the `.json` field.
- Observed Output:
  - Raw: ````json\n{\n  "status": "approved",\n  "confidence": 0.98\n}\n````
  - Parsed: `{"status": "approved", "confidence": 0.98}`
- Status: PASS

### Test 7: Telemetry Aggregation & Latency Logging
- Scenario: Verify that all provider calls record attempt numbers, latency, token usage, and error categories without leaking API keys.
- Observed Output:
  - Total Calls Logged: 7
  - Success Rate Calculated: 100% of final requests succeeded via fallbacks.
  - Average Latency: Recorded accurately in milliseconds.
  - Sensitive Data Inspection: Zero API keys or Authorization headers present in telemetry store.
- Status: PASS

### Test 8: Python Cloudflare R2 Path & Key Generation
- Scenario: Verify object key generation, folder validation, and public URL construction in Python.
- Observed Output:
  - Key: `ai-generated/<timestamp>-<rand_id>-cover-art.webp`
  - Public URL: Resolves correctly to configured public domain.
- Status: PASS

## Summary Table

| Test Case | Condition | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| Priority 1 Normal | Gemini Primary healthy | Dispatched to Primary | Gemini Primary fulfilled | PASS |
| Priority 2 Key Quota | Primary 429 quota | Fallback to Backup | Gemini Backup fulfilled | PASS |
| Project Quota Rule | Primary project quota | Skip Backup, call OpenAI | OpenAI Fallback fulfilled | PASS |
| Dual Gemini Outage | 503 on both Gemini | Fallback to OpenAI | OpenAI Fallback fulfilled | PASS |
| Client 400 Error | Malformed schema | Fail fast without retries | ValueError raised immediately | PASS |
| JSON Sanitization | Markdown code fences | Clean JSON extracted | Parsed dictionary returned | PASS |
| Telemetry Tracking | Latency & error logging | Structured metrics recorded | Metrics logged safely | PASS |
| Python R2 Utility | Key & URL resolution | Safe sanitized path | Valid folder & URL resolved | PASS |

Final Outcome: 19 Passed, 0 Failed (100% success rate).
