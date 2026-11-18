import os
import sys
import json
import asyncio
from unittest.mock import AsyncMock, patch

# Add heyprince-ai-backend to path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(current_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.core.config import settings
from app.llm.gemini_client import GeminiError
from app.llm.router import LLMRouter
from app.llm.telemetry import telemetry_tracker
from app.core.r2 import (
    is_r2_configured,
    generate_object_key,
    get_public_url,
    get_r2_endpoint
)

async def run_all_tests():
    print("================================================================")
    print("HEYPRINCE.IN: MULTI-PROVIDER AI ROUTER & R2 TEST SUITE (PYTHON)")
    print("================================================================\n")

    passed = 0
    failed = 0

    def assert_test(condition: bool, description: str):
        nonlocal passed, failed
        if condition:
            print(f"[PASS] {description}")
            passed += 1
        else:
            print(f"[FAIL] {description}")
            failed += 1

    # --------------------------------------------------------------------------
    # TEST 1: Priority 1 - Gemini Primary Success
    # --------------------------------------------------------------------------
    print("--- TEST 1: Gemini Primary Preferred Execution ---")
    router = LLMRouter()
    settings.GEMINI_API_KEY_1 = "AIzaSy_mock_key_primary"
    settings.GEMINI_API_KEY_2 = "AIzaSy_mock_key_backup"
    settings.OPENAI_API_KEY = "sk-mock-openai-key"

    with patch("app.llm.router.gemini_client.generate", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = {
            "text": "Gemini primary response text: verified analysis.",
            "provider": "gemini",
            "model": "gemini-2.5-flash",
            "usage": {"prompt_tokens": 12, "completion_tokens": 18, "total_tokens": 30}
        }

        result = await router.generate(prompt="Analyze market trends")
        assert_test(result["provider"] == "gemini", "Inference fulfilled by Gemini provider.")
        assert_test("Gemini primary" in result["text"], "Result text contains expected payload.")
        assert_test(mock_gemini.call_count == 1, "Gemini Primary called exactly once.")

    # --------------------------------------------------------------------------
    # TEST 2: Priority 1 Quota Failure -> Priority 2 Gemini Backup Success
    # --------------------------------------------------------------------------
    print("\n--- TEST 2: Gemini Primary Quota Exhaustion -> Gemini Backup Fallback ---")
    router2 = LLMRouter()
    with patch("app.llm.router.gemini_client.generate", new_callable=AsyncMock) as mock_gemini:
        # First call (Primary) fails with quota_exhausted; Second call (Backup) succeeds
        mock_gemini.side_effect = [
            GeminiError("Resource exhausted: 429 quota reached", status_code=429, category="quota_exhausted"),
            {
                "text": "Gemini backup response: recovered seamlessly.",
                "provider": "gemini",
                "model": "gemini-2.5-flash",
                "usage": {"prompt_tokens": 15, "completion_tokens": 20, "total_tokens": 35}
            }
        ]

        result = await router2.generate(prompt="Research organic keywords")
        assert_test(result["provider"] == "gemini", "Fell back to Gemini Backup.")
        assert_test("Gemini backup" in result["text"], "Backup payload returned successfully.")
        assert_test(mock_gemini.call_count == 2, "Primary tried then Backup engaged.")

    # --------------------------------------------------------------------------
    # TEST 3: Project-Level Quota Exhaustion -> Skips Backup -> Priority 3 OpenAI
    # --------------------------------------------------------------------------
    print("\n--- TEST 3: Project Quota Rule (Skips Backup, Engages OpenAI) ---")
    router3 = LLMRouter()
    with patch("app.llm.router.gemini_client.generate", new_callable=AsyncMock) as mock_gemini:
        with patch("app.llm.router.openai_client.generate", new_callable=AsyncMock) as mock_openai:
            # Primary raises project_quota_exhausted
            mock_gemini.side_effect = GeminiError(
                "Per-project quota exceeded for Google Cloud project",
                status_code=429,
                category="project_quota_exhausted"
            )
            mock_openai.return_value = {
                "text": "OpenAI fallback response: zero downtime achieved.",
                "provider": "openai",
                "model": "gpt-4o-mini",
                "usage": {"prompt_tokens": 22, "completion_tokens": 30, "total_tokens": 52}
            }

            result = await router3.generate(prompt="Summarize SEO findings")
            assert_test(result["provider"] == "openai", "Router skipped backup and engaged OpenAI.")
            assert_test(mock_gemini.call_count == 1, "Gemini Backup was not redundantly invoked.")
            assert_test(mock_openai.call_count == 1, "OpenAI Fallback called exactly once.")

    # --------------------------------------------------------------------------
    # TEST 4: Both Gemini Providers Fail -> Priority 3 OpenAI Fallback
    # --------------------------------------------------------------------------
    print("\n--- TEST 4: Both Gemini Outages -> OpenAI Fallback ---")
    router4 = LLMRouter()
    with patch("app.llm.router.gemini_client.generate", new_callable=AsyncMock) as mock_gemini:
        with patch("app.llm.router.openai_client.generate", new_callable=AsyncMock) as mock_openai:
            # Both Gemini calls fail with server error
            mock_gemini.side_effect = [
                GeminiError("503 Service Unavailable", status_code=503, category="server_error"),
                GeminiError("503 Service Unavailable", status_code=503, category="server_error")
            ]
            mock_openai.return_value = {
                "text": "OpenAI payload: high-converting technical proposal.",
                "provider": "openai",
                "model": "gpt-4o-mini",
                "usage": {"prompt_tokens": 10, "completion_tokens": 15, "total_tokens": 25}
            }

            result = await router4.generate(prompt="Draft proposal")
            assert_test(result["provider"] == "openai", "OpenAI successfully handled fallback.")

    # --------------------------------------------------------------------------
    # TEST 5: Malformed Request / Invalid Input (No Blind Multi-Provider Retries)
    # --------------------------------------------------------------------------
    print("\n--- TEST 5: Client-Side Invalid Input Guardrail ---")
    router5 = LLMRouter()
    with patch("app.llm.router.gemini_client.generate", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.side_effect = GeminiError("400 Bad Request: Invalid Schema", status_code=400, category="invalid_request")

        caught_val_err = False
        try:
            await router5.generate(prompt="Invalid prompt")
        except ValueError:
            caught_val_err = True

        assert_test(caught_val_err, "Client-side 400 immediately raises ValueError.")
        assert_test(mock_gemini.call_count == 1, "Did not blindly retry invalid request on Backup.")

    # --------------------------------------------------------------------------
    # TEST 6: Structured JSON Output Consistency & Code Fence Extraction
    # --------------------------------------------------------------------------
    print("\n--- TEST 6: Structured Output Formatting & JSON Schema Consistency ---")
    router6 = LLMRouter()
    raw_markdown_json = "```json\n{\n  \"status\": \"approved\",\n  \"confidence\": 0.98\n}\n```"
    parsed = router6._extract_json_payload(raw_markdown_json)
    assert_test(parsed is not None and parsed.get("status") == "approved", "Fenced JSON cleanly parsed into dictionary.")

    # --------------------------------------------------------------------------
    # TEST 7: Telemetry Recording & Aggregation
    # --------------------------------------------------------------------------
    print("\n--- TEST 7: Telemetry Aggregation ---")
    metrics = telemetry_tracker.get_recent_metrics()
    assert_test(metrics["total_calls"] > 0, "Telemetry tracker successfully logged execution attempts.")
    assert_test("success_rate" in metrics, "Success rate metric calculated accurately.")
    assert_test("avg_latency_ms" in metrics, "Latency metrics recorded.")

    # --------------------------------------------------------------------------
    # TEST 8: Python Cloudflare R2 Utility Operations
    # --------------------------------------------------------------------------
    print("\n--- TEST 8: Python R2 Path & Key Generation ---")
    r2_key = generate_object_key("ai-generated", "cover-art.webp")
    assert_test(r2_key.startswith("ai-generated/"), "Python R2 key uses correct directory prefix.")
    assert_test(r2_key.endswith("-cover-art.webp"), "File extension and name preserved.")
    pub_url = get_public_url(r2_key)
    assert_test(r2_key in pub_url, "Python R2 public URL contains generated key.")

    print("\n================================================================")
    print(f"PYTHON TEST SUITE COMPLETE: {passed} PASSED, {failed} FAILED")
    print("================================================================\n")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_all_tests())
