import { StoryboardScene } from '../types';
import { VisualSceneProvider, VisualRenderConfig, SceneRenderResult } from './adapter';

/**
 * Google Veo Provider Adapter
 *
 * Programmatic integration for Google Veo 2.0 generative video capabilities
 * via the official Google Gen AI developer platform.
 */
export class GoogleVeoProvider implements VisualSceneProvider {
  name = 'google_veo';
  visualType = 'ai_clip' as const;

  private apiKey: string;
  private modelName: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_VEO_API_KEY || process.env.GEMINI_API_KEY || '';
    this.modelName = process.env.GOOGLE_VEO_MODEL || 'veo-2.0-generate-001';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    // Check if explicitly enabled in environment
    const isExplicitlyDisabled = process.env.ENABLE_GOOGLE_VEO === 'false';
    return !isExplicitlyDisabled;
  }

  async generateScene(
    scene: StoryboardScene,
    config: VisualRenderConfig
  ): Promise<SceneRenderResult> {
    const startTime = Date.now();
    const duration = Math.max(3, Math.round(scene.estimatedDurationSec || 5));

    console.log(`[Google Veo Provider] Initiating generation for Scene #${scene.sceneIndex}: "${scene.title}"...`);

    if (!this.apiKey) {
      return {
        sceneIndex: scene.sceneIndex,
        provider: this.name,
        success: false,
        durationSeconds: 0,
        framesCount: 0,
        error: 'Google Veo API key not configured (GEMINI_API_KEY or GOOGLE_VEO_API_KEY missing).',
      };
    }

    // Exponential backoff configuration
    const maxRetries = 2;
    let attempt = 0;
    let lastError = '';

    while (attempt <= maxRetries) {
      try {
        attempt++;
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:predictLongRunning?key=${this.apiKey}`;

        const promptText = `${scene.visualPrompt}. Cinematic 4k, hyper-detailed, smooth motion, high visual fidelity, professional lighting, tech documentary style.`;

        const requestBody = {
          instances: [
            {
              prompt: promptText,
            },
          ],
          parameters: {
            aspectRatio: config.aspectRatio === '9:16' ? '9:16' : '16:9',
            sampleCount: 1,
            durationSeconds: duration,
            personGeneration: 'allow_adult',
          },
        };

        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;
          lastError = `Veo API error (${errMsg})`;

          // Quota or model access limitations
          if (res.status === 404 || res.status === 403 || res.status === 429) {
            console.warn(`[Google Veo Provider] Scene #${scene.sceneIndex} unavailable on current tier: ${lastError}`);
            break; // Break loop to allow immediate graceful fallback
          }

          // Backoff before retry
          if (attempt <= maxRetries) {
            const delayMs = Math.pow(2, attempt) * 1000;
            console.log(`[Google Veo Provider] Backoff retry ${attempt}/${maxRetries} after ${delayMs}ms...`);
            await new Promise((r) => setTimeout(r, delayMs));
          }
          continue;
        }

        const operation = await res.json();
        console.log(`[Google Veo Provider] Operation initiated: ${operation.name || 'pending'}`);

        // If synchronous video URI was returned directly or if long-running
        if (operation.response?.generatedVideos?.[0]?.videoUri) {
          const videoUri = operation.response.generatedVideos[0].videoUri;
          return {
            sceneIndex: scene.sceneIndex,
            provider: this.name,
            success: true,
            clipUrl: videoUri,
            durationSeconds: duration,
            framesCount: duration * config.fps,
          };
        }

        // Return error for polling if no immediate payload
        lastError = 'Veo operation queued in async polling state.';
        break;
      } catch (err: any) {
        lastError = err?.message || 'Network exception contacting Google Veo API.';
        if (attempt <= maxRetries) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    return {
      sceneIndex: scene.sceneIndex,
      provider: this.name,
      success: false,
      durationSeconds: 0,
      framesCount: 0,
      error: lastError,
    };
  }
}
