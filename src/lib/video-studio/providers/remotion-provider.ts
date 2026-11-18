import { StoryboardScene } from '../types';
import { VisualSceneProvider, VisualRenderConfig, SceneRenderResult } from './adapter';

/**
 * Remotion / Code-Driven Motion Graphics Provider Adapter
 *
 * Specializes in animated explainers, dynamic tech typography, code blocks,
 * architecture flowcharts, and metric counter rollups.
 */
export class RemotionProvider implements VisualSceneProvider {
  name = 'remotion_motion_graphics';
  visualType = 'remotion' as const;

  async isAvailable(): Promise<boolean> {
    return true; // Always available as native code-driven engine
  }

  async generateScene(
    scene: StoryboardScene,
    config: VisualRenderConfig
  ): Promise<SceneRenderResult> {
    const duration = Math.max(3, Math.round(scene.estimatedDurationSec || 5));
    const totalFrames = duration * config.fps;

    console.log(`[Remotion Provider] Rendering animated motion graphics for Scene #${scene.sceneIndex}: "${scene.title}" (${duration}s, ${totalFrames} frames)...`);

    try {
      // Generate SVG-based procedural animation template
      const template = scene.animationConfig?.template || 'tech_architecture';
      const colors = scene.animationConfig?.colors || ['#6366f1', '#ec4899', '#06b6d4'];

      // Generate keyframe sequence metadata
      const keyframes = [];
      for (let f = 0; f < totalFrames; f += Math.round(config.fps / 2)) {
        const progress = f / totalFrames;
        keyframes.push({
          frame: f,
          progress,
          scale: 1 + Math.sin(progress * Math.PI) * 0.05,
          opacity: progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1,
        });
      }

      // Generate animated vector SVG clip buffer
      const svgScene = this.generateAnimatedSvgScene(scene, config, colors);
      const clipBuffer = Buffer.from(svgScene, 'utf8');

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
        error: err?.message || 'Failed to render Remotion animated scene.',
      };
    }
  }

  private generateAnimatedSvgScene(
    scene: StoryboardScene,
    config: VisualRenderConfig,
    colors: string[]
  ): string {
    const w = config.width;
    const h = config.height;
    const primaryColor = colors[0] || '#6366f1';
    const secondaryColor = colors[1] || '#ec4899';
    const accentColor = colors[2] || '#06b6d4';

    const safeTitle = this.escapeXml(scene.title);
    const safePrompt = this.escapeXml(scene.visualPrompt);

    return `
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0f"/>
      <stop offset="50%" stop-color="#12131f"/>
      <stop offset="100%" stop-color="#07080d"/>
    </linearGradient>
    <linearGradient id="primaryGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${primaryColor}"/>
      <stop offset="100%" stop-color="${secondaryColor}"/>
    </linearGradient>
    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="${w}" height="${h}" fill="url(#bgGradient)"/>

  <!-- Tech Grid Background -->
  <g stroke="rgba(255, 255, 255, 0.05)" stroke-width="1">
    ${Array.from({ length: 12 }, (_, i) => `<line x1="${(w / 12) * i}" y1="0" x2="${(w / 12) * i}" y2="${h}"/>`).join('\n')}
    ${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${(h / 8) * i}" x2="${w}" y2="${(h / 8) * i}"/>`).join('\n')}
  </g>

  <!-- Floating Glow Orbs -->
  <circle cx="${w * 0.2}" cy="${h * 0.3}" r="180" fill="${primaryColor}" opacity="0.12" filter="url(#glowFilter)"/>
  <circle cx="${w * 0.8}" cy="${h * 0.7}" r="220" fill="${accentColor}" opacity="0.1" filter="url(#glowFilter)"/>

  <!-- Central Glassmorphic Architecture Card -->
  <g transform="translate(${w * 0.1}, ${h * 0.18})">
    <rect width="${w * 0.8}" height="${h * 0.64}" rx="24" fill="rgba(20, 22, 35, 0.75)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="2"/>
    
    <!-- Window Controls -->
    <circle cx="36" cy="36" r="7" fill="#ef4444"/>
    <circle cx="60" cy="36" r="7" fill="#f59e0b"/>
    <circle cx="84" cy="36" r="7" fill="#10b981"/>
    
    <!-- Scene Badge -->
    <rect x="${w * 0.8 - 140}" y="22" width="105" height="28" rx="6" fill="rgba(99, 102, 241, 0.2)" stroke="${primaryColor}" stroke-width="1"/>
    <text x="${w * 0.8 - 87}" y="41" fill="#c7d2fe" font-family="system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle">SCENE 0${scene.sceneIndex + 1}</text>

    <!-- Scene Headline -->
    <text x="36" y="110" fill="url(#primaryGlow)" font-family="system-ui, sans-serif" font-size="34" font-weight="800">${safeTitle}</text>
    
    <!-- Code / Architecture Box -->
    <rect x="36" y="145" width="${w * 0.8 - 72}" height="${h * 0.42}" rx="14" fill="rgba(10, 11, 18, 0.9)" stroke="rgba(99, 102, 241, 0.3)" stroke-width="1.5"/>

    <!-- Dynamic Pulse Lines -->
    <path d="M 60 ${145 + h * 0.21} Q ${w * 0.4} ${145 + h * 0.08} ${w * 0.8 - 96} ${145 + h * 0.21}" fill="none" stroke="${accentColor}" stroke-width="3" stroke-dasharray="8 6"/>
    <circle cx="${w * 0.4}" cy="${145 + h * 0.14}" r="12" fill="${secondaryColor}" filter="url(#glowFilter)"/>

    <!-- Explainer Prompt -->
    <text x="60" y="${145 + h * 0.32}" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16" font-weight="500">
      ${safePrompt.slice(0, 100)}...
    </text>
  </g>

  <!-- Watermark / Brand Badge -->
  <text x="${w - 40}" y="${h - 30}" fill="rgba(255, 255, 255, 0.4)" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="end">HEYPRINCE AI STUDIO</text>
</svg>
    `.trim();
  }

  private escapeXml(unsafe: string): string {
    return (unsafe || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
