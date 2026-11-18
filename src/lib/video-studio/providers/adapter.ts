import { StoryboardScene, VisualType } from '../types';

export interface VisualRenderConfig {
  jobId: string;
  fps: number;
  width: number;
  height: number;
  aspectRatio: '16:9' | '9:16';
  quality: 'draft' | 'production' | 'cinematic';
}

export interface SceneRenderResult {
  sceneIndex: number;
  provider: string;
  success: boolean;
  clipLocalPath?: string;
  clipBuffer?: Buffer;
  clipUrl?: string;
  r2ClipKey?: string;
  durationSeconds: number;
  framesCount: number;
  error?: string;
}

export interface VisualSceneProvider {
  name: string;
  visualType: VisualType;
  isAvailable(): Promise<boolean>;
  generateScene(scene: StoryboardScene, config: VisualRenderConfig): Promise<SceneRenderResult>;
}
