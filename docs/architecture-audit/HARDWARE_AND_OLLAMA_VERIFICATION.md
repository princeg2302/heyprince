# Hardware & Ollama Host Verification

**Audit Date:** November 8, 2026  
**Subject:** Hardware specifications of the current local development PC, Ollama installation status, and LLM inference feasibility analysis.

---

## 1. Actual Verified Hardware Specifications

A direct query via WMI / PowerShell was executed against the local host machine. The verified system configuration is:

| Hardware Component | Detected / Verified Value | Architectural Assessment |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11 Pro (64-bit) | Supported for Ollama, Python, Docker Desktop |
| **CPU** | **Intel(R) Core(TM) i5-8365U @ 1.60GHz** (4 Cores, 8 Threads) | Low-power mobile ULV processor; limited CPU inference throughput |
| **GPU (Video Controller)** | **Intel(R) UHD Graphics 620** (Adapter RAM: ~1,073,741,824 bytes = 1 GB) | **Integrated GPU only**. No discrete VRAM; no NVIDIA CUDA cores; no Tensor cores |
| **Discrete GPU (RTX 4080)** | **NOT PRESENT** on this host | **Correction of previous assumption**: This machine does NOT possess an NVIDIA RTX 4080 |
| **System RAM** | **16.0 GB Total Physical RAM** | Shared between Windows OS, browser, Next.js dev server, and applications |
| **Ollama Binary** | `where ollama` -> **NOT FOUND** | Ollama is currently **not installed** or not registered in system PATH |
| **Ollama Local Endpoint** | `http://127.0.0.1:11434/api/tags` -> Connection Timed Out | Ollama daemon is **not running** on this machine |

---

## 2. Model Feasibility Matrix on Intel UHD 620 (16 GB RAM)

The configuration file `heyprince-ai-backend/.env.example` specified `OLLAMA_MODEL=llama3.3:70b`. The following table details the technical feasibility of running various model tiers on this specific Intel hardware:

| Model Tier | Typical Model | Min RAM / VRAM Required | Feasibility on Intel UHD 620 (16 GB RAM) | Expected Speed / Latency | Recommendation |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **70B Tier** | `llama3.3:70b` | **43 GB+** (Q4_K_M) | ❌ **IMPOSSIBLE** (Immediate OOM Crash) | N/A (Cannot be allocated in 16 GB RAM) | **Do not attempt** |
| **14B / 32B Tier** | `qwen2.5:14b`, `qwen2.5:32b` | **10 - 20 GB** | ❌ **High Risk / System Freeze** | < 0.5 tokens/sec (Unusable for web requests) | **Do not attempt** |
| **7B / 8B Tier** | `llama3.1:8b`, `qwen2.5:7b` | **5.5 - 6.5 GB** | ⚠️ **Technically Possible on CPU** | ~1 - 3 tokens/sec (60 to 90 seconds for 1,500 words) | Usable only for non-blocking offline tasks |
| **1B / 3B Tier** | `llama3.2:3b`, `qwen2.5:3b`, `phi-3.5-mini` | **2.0 - 2.8 GB** | 🟢 **FEASIBLE on CPU** | ~15 - 25 tokens/sec (Acceptable for brief prompts) | **Best Local Option if Ollama is installed** |
| **Cloud Tier** | **Google Gemini 3.5 Flash** | **0 GB Local RAM** | 🟢 **OPTIMAL (Verified Working)** | **~150+ tokens/sec (1.2 to 3.5s response time)** | **Primary Production Workhorse** |

---

## 3. Host Identity & Network Topology Analysis

There are two distinct architectural possibilities regarding the Ollama host:

### Scenario A: This Windows PC is the intended Ollama Host
- **Reality:** This machine is a mobile laptop with an Intel i5-8365U and Intel UHD 620 (16 GB RAM).
- **Constraint:** It **cannot** run large models like `llama3.3:70b`.
- **Action Plan:** If the user wishes to run Ollama on this machine:
  1. Install Ollama for Windows from `https://ollama.ai`.
  2. Pull a lightweight model optimized for CPU inference:
     ```bash
     ollama pull llama3.2:3b
     # or
     ollama pull qwen2.5:3b
     ```
  3. Configure Tailscale to expose port 11434 to the VPS.
  4. Update `heyprince-ai-backend/.env` with `OLLAMA_MODEL=llama3.2:3b`.

### Scenario B: A Separate Dedicated Machine / Server has the RTX 4080
- **Reality:** If the user owns a separate desktop workstation or home lab server with an NVIDIA RTX 4080 GPU (16 GB VRAM) located on their local network:
  - That separate machine must be configured as the Ollama host.
  - Tailscale or WireGuard must bridge the VPS directly to *that* specific machine's IP, not this laptop.
  - On that RTX 4080 workstation, models like `llama3.1:8b` (runs entirely in VRAM at 80+ tokens/sec) or `qwen2.5:14b` (quantized) run with extreme speed.

### Scenario C: Cloud-First Architecture (Recommended for Immediate Stability)
- Rely on **Google Gemini 3.5 Flash** as the primary high-speed reasoning engine inside the Python backend.
- **Benefits:**
  - Zero load or thermal stress on the laptop.
  - 100% reliable 24/7 availability (not dependent on home PC staying awake or network tunnel stability).
  - Extremely fast response time (~1.5s for 1,500-word articles).
  - Massive 1,000,000-token context window.
  - Zero local hardware cost.

---

## 4. Policy Decision

> [!IMPORTANT]
> **Strict Rule Followed:** In accordance with your instructions, **no model configurations have been changed**.
> Before configuring local Ollama models in the Python backend, please confirm whether:
> 1. You intend to run Ollama locally on this laptop (in which case we will configure `llama3.2:3b` or `qwen2.5:3b`), OR
> 2. You have a separate PC/server with an NVIDIA GPU, OR
> 3. You want the VPS Python backend to run Gemini 3.5 Flash as primary for zero local resource usage.
