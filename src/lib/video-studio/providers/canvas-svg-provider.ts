import { StoryboardScene } from '../types';
import { VisualSceneProvider, VisualRenderConfig, SceneRenderResult } from './adapter';

/**
 * SVG / Canvas Motion Animation Provider
 *
 * Specializes in technical architecture flowcharts, network node connection
 * topologies, and animated benchmark comparison graphs.
 */
export class CanvasSvgMotionProvider implements VisualSceneProvider {
  name = 'svg_canvas_motion';
  visualType = 'svg_canvas' as const;

  async isAvailable(): Promise<boolean> {
    return true; // Always available pure-Node implementation
  }

  async generateScene(
    scene: StoryboardScene,
    config: VisualRenderConfig
  ): Promise<SceneRenderResult> {
    const duration = Math.max(3, Math.round(scene.estimatedDurationSec || 5));
    const totalFrames = duration * config.fps;

    console.log(`[SVG/Canvas Provider] Generating vector diagram animation for Scene #${scene.sceneIndex}: "${scene.title}"...`);

    try {
      const svgContent = this.generateArchitectureDiagram(scene, config);
      const clipBuffer = Buffer.from(svgContent, 'utf8');

      return {
        sceneIndex: scene.sceneIndex,
        provider: this.name,
        success: true,
        clipBuffer,
        durationSeconds: duration,
        framesCount: totalFrames,
      };
    } catch (err: any) {
      return {
        sceneIndex: scene.sceneIndex,
        provider: this.name,
        success: false,
        durationSeconds: 0,
        framesCount: 0,
        error: err?.message || 'Failed to render Canvas/SVG diagram.',
      };
    }
  }

  private generateArchitectureDiagram(scene: StoryboardScene, config: VisualRenderConfig): string {
    const w = config.width;
    const h = config.height;

    const safeTitle = (scene.title || 'Technical Architecture').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safePrompt = (scene.visualPrompt || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return `
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="meshGradient" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#161829"/>
      <stop offset="100%" stop-color="#07080d"/>
    </radialGradient>
    <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Deep Tech Canvas -->
  <rect width="${w}" height="${h}" fill="url(#meshGradient)"/>

  <!-- Subtle Radial Grid -->
  <g stroke="rgba(99, 102, 241, 0.08)" stroke-width="1.5" fill="none">
    <circle cx="${w * 0.5}" cy="${h * 0.5}" r="150"/>
    <circle cx="${w * 0.5}" cy="${h * 0.5}" r="300"/>
    <circle cx="${w * 0.5}" cy="${h * 0.5}" r="450"/>
  </g>

  <!-- Header Banner -->
  <rect x="40" y="40" width="320" height="40" rx="8" fill="rgba(30, 41, 59, 0.8)" stroke="rgba(99, 102, 241, 0.4)" stroke-width="1.5"/>
  <text x="60" y="65" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="700">ARCHITECTURE DIAGRAM</text>
  <circle cx="340" cy="60" r="5" fill="#22c55e"/>

  <text x="40" y="130" fill="#ffffff" font-family="system-ui, sans-serif" font-size="38" font-weight="800">${safeTitle}</text>
  <text x="40" y="165" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="18">${safePrompt.slice(0, 85)}...</text>

  <!-- Topology Node 1: Ingestion / Client -->
  <g transform="translate(${w * 0.15}, ${h * 0.42})">
    <rect width="240" height="130" rx="16" fill="rgba(15, 23, 42, 0.9)" stroke="#6366f1" stroke-width="2" filter="url(#nodeGlow)"/>
    <text x="30" y="45" fill="#c7d2fe" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Client / Gateway</text>
    <text x="30" y="75" fill="#64748b" font-family="monospace" font-size="12">Next.js Edge Proxy</text>
    <text x="30" y="100" fill="#22c55e" font-family="monospace" font-size="13">200 OK - 18ms</text>
  </g>

  <!-- Connecting Bus 1 -->
  <path d="M ${w * 0.15 + 240} ${h * 0.42 + 65} L ${w * 0.4} ${h * 0.42 + 65}" stroke="#818cf8" stroke-width="3" stroke-dasharray="6 4"/>
  <circle cx="${w * 0.32}" cy="${h * 0.42 + 65}" r="6" fill="#38bdf8"/>

  <!-- Topology Node 2: Core Processing / AI Engine -->
  <g transform="translate(${w * 0.4}, ${h * 0.35})">
    <rect width="280" height="170" rx="20" fill="rgba(30, 27, 75, 0.9)" stroke="#ec4899" stroke-width="2.5" filter="url(#nodeGlow)"/>
    <text x="30" y="45" fill="#fbcfe8" font-family="system-ui, sans-serif" font-size="20" font-weight="800">AI Neural Engine</text>
    <text x="30" y="75" fill="#cbd5e1" font-family="monospace" font-size="13">Hindi TTS + Subtitles</text>
    <text x="30" y="105" fill="#ec4899" font-family="monospace" font-size="13">Veo / Remotion Sync</text>
    <rect x="30" y="125" width="220" height="20" rx="6" fill="rgba(236, 72, 153, 0.2)"/>
    <rect x="30" y="125" width="175" height="20" rx="6" fill="#ec4899"/>
    <text x="140" y="140" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="700" text-anchor="middle">Processing: 82%</text>
  </g>

  <!-- Connecting Bus 2 -->
  <path d="M ${w * 0.4 + 280} ${h * 0.42 + 65} L ${w * 0.72} ${h * 0.42 + 65}" stroke="#818cf8" stroke-width="3" stroke-dasharray="6 4"/>
  <circle cx="${w * 0.64}" cy="${h * 0.42 + 65}" r="6" fill="#a855f7"/>

  <!-- Topology Node 3: Cloudflare R2 & Storage Hub -->
  <g transform="translate(${w * 0.72}, ${h * 0.42})">
    <rect width="240" height="130" rx="16" fill="rgba(15, 23, 42, 0.9)" stroke="#06b6d4" stroke-width="2" filter="url(#nodeGlow)"/>
    <text x="30" y="45" fill="#a5f3fc" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Cloudflare R2</text>
    <text x="30" y="75" fill="#64748b" font-family="monospace" font-size="12">5 Published Collections</text>
    <text x="30" y="100" fill="#38bdf8" font-family="monospace" font-size="13">Zero Egress Retained</text>
  </g>

  <!-- Bottom Terminal Bar -->
  <rect x="40" y="${h - 90}" width="${w - 80}" height="50" rx="12" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1"/>
  <text x="65" y="${h - 59}" fill="#38bdf8" font-family="monospace" font-size="14">&gt; HEYPRINCE_AI_ENGINE: Active pipeline verified across 3 distributed execution stages</text>
</svg>
    `.trim();
  }
}
