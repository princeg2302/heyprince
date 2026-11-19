import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import ffmpegStatic from 'ffmpeg-static';
import { StoryboardScene } from './types';
import { MasterAudioResult } from './providers/tts-provider';

const execFileAsync = promisify(execFile);

export interface VideoComposerConfig {
  jobId: string;
  width?: number;
  height?: number;
  fps?: number;
  aspectRatio?: '16:9' | '9:16';
  quality?: 'fast' | 'production';
}

export interface ComposedVideoResult {
  videoBuffer: Buffer;
  thumbnailBuffer: Buffer;
  totalDurationSec: number;
  width: number;
  height: number;
  mimeType: string;
}

/**
 * Escapes strings safely for FFmpeg drawtext filter arguments.
 */
function escapeDrawText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/;/g, '\\;')
    .replace(/%/g, '\\%')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

/**
 * Truncates text cleanly at word boundaries.
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '...';
}

/**
 * Ensures audio buffer possesses a valid WAV/MP3 container header for FFmpeg demuxer.
 * If header is missing, builds a standard RIFF/WAVE 44.1kHz container.
 */
function writeValidatedAudioFile(filePath: string, buffer: Buffer | undefined, durationSec: number): string {
  if (buffer && buffer.length >= 44) {
    const isWav = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
    const isMp3 = buffer.subarray(0, 3).toString('ascii') === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    if (isWav || isMp3) {
      fs.writeFileSync(filePath, buffer);
      return filePath;
    }
  }

  const sampleRate = 44100;
  const numSamples = Math.floor(durationSec * sampleRate);
  const dataSize = numSamples * 2;
  const wavBuf = Buffer.alloc(44 + dataSize);
  wavBuf.write('RIFF', 0, 'ascii');
  wavBuf.writeUInt32LE(36 + dataSize, 4);
  wavBuf.write('WAVE', 8, 'ascii');
  wavBuf.write('fmt ', 12, 'ascii');
  wavBuf.writeUInt32LE(16, 16);
  wavBuf.writeUInt16LE(1, 20); // PCM
  wavBuf.writeUInt16LE(1, 22); // Mono
  wavBuf.writeUInt32LE(sampleRate, 24);
  wavBuf.writeUInt32LE(sampleRate * 2, 28);
  wavBuf.writeUInt16LE(2, 32);
  wavBuf.writeUInt16LE(16, 34);
  wavBuf.write('data', 36, 'ascii');
  wavBuf.writeUInt32LE(dataSize, 40);

  if (buffer && buffer.length > 0) {
    buffer.copy(wavBuf, 44, 0, Math.min(buffer.length, dataSize));
  }
  fs.writeFileSync(filePath, wavBuf);
  return filePath;
}

/**
 * Video Composer
 *
 * Assembles genuine, broadcast-grade H.264 / AAC MP4 video files using FFmpeg.
 * Renders high-definition motion graphics per scene, reactive audio waveforms,
 * burnt English subtitles, and accurate timing synchronized to the voiceover.
 */
export class VideoComposer {
  private ffmpegPath: string;

  constructor() {
    this.ffmpegPath = (ffmpegStatic as any) || 'ffmpeg';
  }

  /**
   * Composes a complete multi-scene MP4 video and high-resolution thumbnail.
   */
  async composeVideo(
    scenes: StoryboardScene[],
    masterAudio: MasterAudioResult,
    config: VideoComposerConfig
  ): Promise<ComposedVideoResult> {
    const isPortrait = config.aspectRatio === '9:16';
    const width = config.width || (isPortrait ? 1080 : 1920);
    const height = config.height || (isPortrait ? 1920 : 1080);
    const fps = config.fps || 25;
    const workDir = path.join(os.tmpdir(), `vstudio-${config.jobId}-${Date.now()}`);

    fs.mkdirSync(workDir, { recursive: true });
    console.log(`[Video Composer] Initializing composition in ${workDir} (${width}x${height} @ ${fps}fps)`);

    const clipPaths: string[] = [];
    const totalScenes = scenes.length;
    let totalDurationSec = 0;

    try {
      // 1. Render each scene clip with visual cards, audio visualizer, and subtitle overlay
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const sceneAudio = masterAudio.sceneAudios[i];
        const audioBuffer = sceneAudio?.audioBuffer || masterAudio.combinedBuffer;
        const durationMs = scene.actualAudioDurationMs || sceneAudio?.durationMs || 5000;
        const durationSec = Math.max(2, Math.round(durationMs / 100) / 10);
        totalDurationSec += durationSec;

        const sceneAudioFile = path.join(workDir, `audio_${i}.wav`);
        writeValidatedAudioFile(sceneAudioFile, audioBuffer, durationSec);

        const sceneVideoFile = path.join(workDir, `scene_${i}.mp4`);
        clipPaths.push(sceneVideoFile);

        // Vibrant tech background color palette cycling
        const bgColors = ['0x0b0f19', '0x0d1527', '0x13112c', '0x09141f', '0x150f24'];
        const currentBg = bgColors[i % bgColors.length];

        const sceneNumberLabel = escapeDrawText(`SCENE ${i + 1} OF ${totalScenes}`);
        const sceneTitle = escapeDrawText(truncateText(scene.title || `Segment ${i + 1}`, 45));
        const subtitleText = escapeDrawText(truncateText(scene.narrationEnglish || scene.narrationHindi || '', 90));

        // Layout measurements depending on aspect ratio (Landscape 16:9 vs Portrait 9:16)
        const waveW = width - 120;
        const waveH = isPortrait ? 220 : 140;
        const waveX = 60;
        const waveY = isPortrait ? height - 520 : height - 260;

        const badgeY = isPortrait ? 140 : 80;
        const titleY = isPortrait ? 210 : 140;
        const subY = isPortrait ? height - 200 : height - 90;

        const filterGraph = [
          `[1:a] showwaves=s=${waveW}x${waveH}:mode=line:colors=0x38bdf8|0x818cf8:scale=sqrt [wave]`,
          `[0:v][wave] overlay=x=${waveX}:y=${waveY} [v_wave]`,
          `[v_wave] drawtext=text='${sceneNumberLabel}':fontsize=${isPortrait ? 30 : 22}:fontcolor=0x38bdf8:x=60:y=${badgeY}, drawtext=text='${sceneTitle}':fontsize=${isPortrait ? 52 : 38}:fontcolor=white:x=60:y=${titleY}, drawtext=text='${subtitleText}':fontsize=${isPortrait ? 36 : 24}:fontcolor=0xe2e8f0:box=1:boxcolor=0x000000@0.65:boxborderw=10:x=(w-text_w)/2:y=${subY} [outv]`,
        ].join('; ');

        const ffmpegArgs = [
          '-y',
          '-f', 'lavfi',
          '-i', `color=c=${currentBg}:s=${width}x${height}:r=${fps}:d=${durationSec}`,
          '-i', sceneAudioFile,
          '-filter_complex', filterGraph,
          '-map', '[outv]',
          '-map', '1:a',
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '22',
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-shortest',
          sceneVideoFile,
        ];

        console.log(`[Video Composer] Encoding Scene #${i + 1} (${durationSec}s)...`);
        await execFileAsync(this.ffmpegPath, ffmpegArgs);
      }

      // 2. Concatenate individual scene clips into continuous master MP4
      const listFilePath = path.join(workDir, 'concat_manifest.txt');
      const manifestBody = clipPaths
        .map((p) => `file '${p.replace(/\\/g, '/')}'`)
        .join('\n');
      fs.writeFileSync(listFilePath, manifestBody);

      const finalVideoPath = path.join(workDir, 'master_output.mp4');
      const concatArgs = [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', listFilePath,
        '-c', 'copy',
        finalVideoPath,
      ];

      console.log('[Video Composer] Assembling master video package...');
      await execFileAsync(this.ffmpegPath, concatArgs);

      // 3. Extract high-resolution thumbnail from frame 1
      const thumbPath = path.join(workDir, 'thumbnail.jpg');
      const thumbArgs = [
        '-y',
        '-i', finalVideoPath,
        '-ss', '00:00:01',
        '-vframes', '1',
        '-q:v', '2',
        thumbPath,
      ];
      await execFileAsync(this.ffmpegPath, thumbArgs);

      const videoBuffer = fs.readFileSync(finalVideoPath);
      const thumbnailBuffer = fs.existsSync(thumbPath)
        ? fs.readFileSync(thumbPath)
        : Buffer.from([]);

      console.log(`[Video Composer] Video composition complete: ${videoBuffer.length} bytes, duration: ${totalDurationSec.toFixed(1)}s`);

      return {
        videoBuffer,
        thumbnailBuffer,
        totalDurationSec,
        width,
        height,
        mimeType: 'video/mp4',
      };
    } finally {
      // Safe cleanup of temporary working directory
      try {
        fs.rmSync(workDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.warn('[Video Composer] Temp cleanup notice:', cleanupErr);
      }
    }
  }
}
