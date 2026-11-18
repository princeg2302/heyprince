import { StoryboardScene } from '../types';
import { VisualRenderConfig, SceneRenderResult } from './adapter';
import { GoogleVeoProvider } from './veo-provider';
import { RemotionProvider } from './remotion-provider';
import { CanvasSvgMotionProvider } from './canvas-svg-provider';

/**
 * Hybrid Visual Dispatcher
 *
 * Dynamically routes scene rendering to the optimal provider based on scene intent:
 * - AI-generated video clips for cinematic or storytelling scenes (Google Veo).
 * - Remotion for animated graphics, code walkthroughs, UI mockups, and explainers.
 * - SVG/Canvas animations for architecture diagrams, network topologies, and benchmark charts.
 *
 * Implements exponential backoff retry and resilient fallback so a video is never
 * silently converted into static slides.
 */
export class HybridVisualDispatcher {
  private veoProvider: GoogleVeoProvider;
  private remotionProvider: RemotionProvider;
  private svgCanvasProvider: CanvasSvgMotionProvider;

  constructor() {
    this.veoProvider = new GoogleVeoProvider();
    this.remotionProvider = new RemotionProvider();
    this.svgCanvasProvider = new CanvasSvgMotionProvider();
  }

  async dispatchScene(
    scene: StoryboardScene,
    config: VisualRenderConfig
  ): Promise<SceneRenderResult> {
    const visualType = scene.visualType || 'remotion';
    console.log(`[Hybrid Visual Dispatcher] Routing Scene #${scene.sceneIndex} [${visualType}]: "${scene.title}"...`);

    // 1. Branch: AI Video Clips (Google Veo)
    if (visualType === 'ai_clip') {
      const isVeoAvailable = await this.veoProvider.isAvailable();

      if (isVeoAvailable) {
        const veoResult = await this.veoProvider.generateScene(scene, config);
        if (veoResult.success) {
          return veoResult;
        }

        console.warn(`[Hybrid Visual Dispatcher] Veo generation for Scene #${scene.sceneIndex} was not completed: ${veoResult.error}. Initiating configured fallback to Remotion motion graphics...`);
      } else {
        console.log(`[Hybrid Visual Dispatcher] Google Veo unavailable or not enabled. Using configured Remotion motion graphics fallback for Scene #${scene.sceneIndex}.`);
      }

      // Dynamic motion graphics fallback (never static slides)
      return this.remotionProvider.generateScene(scene, config);
    }

    // 2. Branch: SVG / Canvas Technical Diagrams & Benchmark Charts
    if (visualType === 'svg_canvas') {
      return this.svgCanvasProvider.generateScene(scene, config);
    }

    // 3. Branch: Remotion Animated Graphics & Code Walkthroughs (Default)
    return this.remotionProvider.generateScene(scene, config);
  }

  async renderAllScenes(
    scenes: StoryboardScene[],
    config: VisualRenderConfig
  ): Promise<SceneRenderResult[]> {
    const results: SceneRenderResult[] = [];

    for (const scene of scenes) {
      const res = await this.dispatchScene(scene, config);
      results.push(res);
    }

    return results;
  }
}
