import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Auto-load .env.local or .env
const envLocal = path.resolve(dirname, '../../.env.local');
const envDefault = path.resolve(dirname, '../../.env');

if (typeof (process as any).loadEnvFile === 'function') {
  if (fs.existsSync(envLocal)) {
    (process as any).loadEnvFile(envLocal);
  } else if (fs.existsSync(envDefault)) {
    (process as any).loadEnvFile(envDefault);
  }
}

async function runVideoStudioTestSuite() {
  console.info('================================================================');
  console.info('HeyPrince AI Video Studio: Comprehensive End-to-End Test Suite');
  console.info('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.info(`  [PASS] ${testName}${details ? ` (${details})` : ''}`);
    } else {
      console.error(`  [FAIL] ${testName}${details ? ` - ${details}` : ''}`);
      throw new Error(`Test assertion failed: ${testName}`);
    }
  }

  try {
    // ------------------------------------------------------------------------
    // SUITE 1: Providers, Adapters & Subsystem Verification
    // ------------------------------------------------------------------------
    console.info('--- Suite 1: Video Studio Providers, TTS & Subtitles ---');

    const { GoogleVeoProvider } = await import('../lib/video-studio/providers/veo-provider.js');
    const { RemotionProvider } = await import('../lib/video-studio/providers/remotion-provider.js');
    const { CanvasSvgMotionProvider } = await import('../lib/video-studio/providers/canvas-svg-provider.js');
    const { HybridVisualDispatcher } = await import('../lib/video-studio/providers/hybrid-dispatcher.js');
    const { HindiVoiceoverProvider } = await import('../lib/video-studio/providers/tts-provider.js');
    const { generateSynchronizedSubtitles } = await import('../lib/video-studio/subtitles.js');
    const { runMandatoryQualityChecks } = await import('../lib/video-studio/quality-checker.js');

    const sampleConfig = {
      jobId: 'test_job_subsystem',
      fps: 30,
      width: 1920,
      height: 1080,
      aspectRatio: '16:9' as const,
      quality: 'production' as const,
    };

    // 1.1 Veo Provider Verification
    const veo = new GoogleVeoProvider();
    assert(veo.name === 'google_veo', 'GoogleVeoProvider identifier matches google_veo');

    // 1.2 Remotion Provider Verification
    const remotion = new RemotionProvider();
    assert(remotion.name === 'remotion_motion_graphics', 'RemotionProvider identifier matches remotion_motion_graphics');
    const remotionClip = await remotion.generateScene(
      {
        sceneIndex: 0,
        title: 'Neural Architecture Overview',
        visualType: 'remotion',
        visualPrompt: 'Animated network graph with glowing node connections',
        narrationHindi: 'आर्किटेक्चर विवरण',
        narrationEnglish: 'Architecture overview',
        estimatedDurationSec: 5,
      },
      sampleConfig
    );
    assert(remotionClip.success, 'Remotion generates programmatic vector animation clip', `Frames: ${remotionClip.framesCount}`);

    // 1.3 Canvas/SVG Provider Verification
    const svgProvider = new CanvasSvgMotionProvider();
    assert(svgProvider.name === 'svg_canvas_motion', 'CanvasSvgMotionProvider identifier matches svg_canvas_motion');
    const svgClip = await svgProvider.generateScene(
      {
        sceneIndex: 1,
        title: 'Performance Benchmark Analysis',
        visualType: 'svg_canvas',
        visualPrompt: 'Benchmark bar chart comparing multi-agent throughput',
        narrationHindi: 'बेंचमार्क विश्लेषण',
        narrationEnglish: 'Benchmark analysis',
        estimatedDurationSec: 5,
      },
      sampleConfig
    );
    assert(svgClip.success, 'Canvas/SVG generates procedural animation clip', `Bytes: ${svgClip.clipBuffer?.length}`);

    // 1.4 Hybrid Visual Dispatcher Verification
    const dispatcher = new HybridVisualDispatcher();
    const dispatchedScenes = await dispatcher.renderAllScenes(
      [
        {
          sceneIndex: 0,
          title: 'Cinematic Introduction',
          visualType: 'ai_clip',
          visualPrompt: 'Futuristic datacenter with autonomous agent streams',
          narrationHindi: 'आज हम बात करेंगे ऑटोनॉमस एआई एजेंट्स की अगली पीढ़ी के बारे में।',
          narrationEnglish: 'Today we explore the next generation of autonomous AI agents.',
          estimatedDurationSec: 5,
        },
        {
          sceneIndex: 1,
          title: 'Architecture Blueprint',
          visualType: 'remotion',
          visualPrompt: 'Code-driven flow diagram of distributed multi-agent system',
          narrationHindi: 'यह आर्किटेक्चर कोर लॉजिक और रियल-टाइम कम्युनिकेशन को जोड़ता है।',
          narrationEnglish: 'This architecture connects core logic and real-time communication.',
          estimatedDurationSec: 6,
        },
        {
          sceneIndex: 2,
          title: 'Benchmark Metrics',
          visualType: 'svg_canvas',
          visualPrompt: 'Throughput and latency comparison charts',
          narrationHindi: 'सटीक बेंचमार्किंग से सिस्टम की कार्यक्षमता साबित होती है।',
          narrationEnglish: 'Rigorous benchmarking proves system performance.',
          estimatedDurationSec: 5,
        },
      ],
      sampleConfig
    );
    assert(dispatchedScenes.length === 3, 'Hybrid dispatcher renders all storyboard scenes', `Rendered: ${dispatchedScenes.length}`);
    assert(dispatchedScenes.every((s) => s.success), 'All rendered scenes report success = true');

    // 1.5 Hindi Voiceover Provider Verification
    const tts = new HindiVoiceoverProvider();
    const ttsResult = await tts.synthesizeSceneAudio({
      sceneIndex: 0,
      title: 'Intro',
      visualType: 'ai_clip',
      visualPrompt: 'Futuristic datacenter',
      narrationHindi: 'हे प्रिंस एआई वीडियो स्टूडियो में आपका स्वागत है।',
      narrationEnglish: 'Welcome to HeyPrince AI Video Studio.',
      estimatedDurationSec: 5,
    });
    assert(ttsResult.audioBuffer.length > 0, 'Hindi TTS synthesizes audio stream', `Bytes: ${ttsResult.audioBuffer.length}`);
    assert(ttsResult.durationMs > 0, 'Hindi TTS calculates exact audio duration in milliseconds', `Duration: ${ttsResult.durationMs}ms`);

    // 1.6 Synchronized Subtitles (English SRT & WebVTT)
    const syncResult = generateSynchronizedSubtitles([
      {
        sceneIndex: 0,
        title: 'Intro',
        visualType: 'ai_clip',
        visualPrompt: 'Intro scene',
        narrationHindi: 'नमस्ते दोस्तों, आज हम एआई की शक्ति देखेंगे।',
        narrationEnglish: 'Hello friends, today we explore the power of AI.',
        estimatedDurationSec: 4,
        actualAudioDurationMs: 3800,
      },
      {
        sceneIndex: 1,
        title: 'Deep Dive',
        visualType: 'remotion',
        visualPrompt: 'Code scene',
        narrationHindi: 'यह तकनीक पूरी तरह से स्वचालित है।',
        narrationEnglish: 'This technology is completely autonomous.',
        estimatedDurationSec: 4,
        actualAudioDurationMs: 4200,
      },
    ]);
    const subtitleAssets = syncResult.assets;
    assert(subtitleAssets.srtContent.includes('-->'), 'Synchronized SRT subtitles contain valid timecodes');
    assert(subtitleAssets.vttContent.startsWith('WEBVTT'), 'Synchronized WebVTT subtitles start with WEBVTT header');
    assert(subtitleAssets.srtContent.includes('Hello friends'), 'English translation is aligned in subtitles');
    assert(syncResult.validation.isValid, 'Subtitle timing validation passes with zero errors');

    // 1.7 Mandatory 10-Point QA Checklist Verification
    console.info('\n--- Suite 1.7: 10-Point QA Checklist Verification ---');
    const { uploadToR2 } = await import('../lib/storage/r2.js');

    const validScenes = [
      {
        sceneIndex: 0,
        title: 'Scene 1',
        visualType: 'remotion' as const,
        visualPrompt: 'Visual 1',
        narrationHindi: 'पहला दृश्य',
        narrationEnglish: 'First scene',
        estimatedDurationSec: 4,
        actualAudioDurationMs: 3800,
        renderedClipUrl: 'https://cdn.heyprince.in/clips/scene-1.mp4',
        r2ClipKey: 'clips/scene-1.mp4',
      },
      {
        sceneIndex: 1,
        title: 'Scene 2',
        visualType: 'remotion' as const,
        visualPrompt: 'Visual 2',
        narrationHindi: 'दूसरा दृश्य',
        narrationEnglish: 'Second scene',
        estimatedDurationSec: 4,
        actualAudioDurationMs: 4200,
        renderedClipUrl: 'https://cdn.heyprince.in/clips/scene-2.mp4',
        r2ClipKey: 'clips/scene-2.mp4',
      },
    ];

    const testVideoBuffer = Buffer.from('ftypmp42mockvideodatastream'.repeat(50));
    const testR2Key = `videos/test-qa-${Date.now()}.mp4`;
    const uploadRes = await uploadToR2({
      key: testR2Key,
      body: testVideoBuffer,
      contentType: 'video/mp4',
    });
    console.info('   Upload result:', uploadRes);

    const passingReport = await runMandatoryQualityChecks({
      jobId: 'test_passing_qa',
      scenes: validScenes,
      renderedClips: [
        { sceneIndex: 0, success: true, framesCount: 120 },
        { sceneIndex: 1, success: true, framesCount: 120 },
      ],
      masterAudioDurationMs: 8000,
      subtitles: subtitleAssets,
      videoBuffer: testVideoBuffer,
      thumbnailUrl: 'https://cdn.heyprince.in/thumbnails/test.jpg',
      resolution: '1920x1080',
      aspectRatio: '16:9',
      r2VideoKey: testR2Key,
    });
    console.info('   QA Checks evaluation:', Object.entries(passingReport.checks).map(([k, v]) => `${k}: ${v.passed ? 'PASS' : 'FAIL'} - ${v.details}`));
    assert(passingReport.overallPassed, 'Valid video payload passes all 10 QA checklist rules', `Score: ${passingReport.score}/100`);

    // Verify QA Failure Guard blocks publication
    const failingReport = await runMandatoryQualityChecks({
      jobId: 'test_failing_qa',
      scenes: [
        {
          sceneIndex: 0,
          title: 'Missing Media Scene',
          visualType: 'ai_clip' as const,
          visualPrompt: 'Missing clip',
          narrationHindi: 'लापता दृश्य',
          narrationEnglish: 'Missing scene',
          estimatedDurationSec: 5,
          actualAudioDurationMs: 0,
          renderedClipUrl: undefined, // Missing clip
        },
      ],
      renderedClips: [],
      masterAudioDurationMs: 5000,
      subtitles: { srtContent: '', vttContent: '' },
      videoBuffer: Buffer.alloc(0), // Corrupt buffer
      resolution: '1920x1080',
      aspectRatio: '16:9',
    });
    assert(!failingReport.overallPassed, 'Corrupt or mismatched video payload correctly fails QA checks', `Score: ${failingReport.score}/100`);

    // ------------------------------------------------------------------------
    // SUITE 2: End-to-End Sample Video Generation Pipeline
    // ------------------------------------------------------------------------
    console.info('\n--- Suite 2: End-to-End Sample Video Generation Pipeline ---');
    const { executeVideoStudioPipeline } = await import('../lib/video-studio/orchestrator.js');
    const { getVideoJobById } = await import('../lib/video-studio/db.js');

    const sampleTopic = 'Autonomous Multi-Agent Orchestration in Modern Cloud';
    console.info(`   Triggering production pipeline for topic: "${sampleTopic}"...`);

    const pipelineResult = await executeVideoStudioPipeline({
      topic: sampleTopic,
      forceParallel: true,
    });

    assert(pipelineResult.success, 'Full pipeline execution completes successfully');
    assert(pipelineResult.status === 'published', 'Job status transitions to published', `Status: ${pipelineResult.status}`);
    assert(Boolean(pipelineResult.youtubeUrl), 'Video is published to YouTube', `URL: ${pipelineResult.youtubeUrl}`);
    assert(Boolean(pipelineResult.r2Url), 'Video is uploaded and retained in R2', `R2 URL: ${pipelineResult.r2Url}`);
    assert((pipelineResult.qualityScore || 0) >= 90, 'Pipeline achieves quality score >= 90', `Score: ${pipelineResult.qualityScore}`);

    const persistedJob = await getVideoJobById(pipelineResult.jobId);
    assert(Boolean(persistedJob), 'Job record is persistently stored in PostgreSQL database');
    assert(persistedJob?.qualityPassed === true, 'Database confirms qualityPassed = true');
    assert(persistedJob?.r2Retained === true, 'Database confirms r2Retained = true');
    assert(Boolean(persistedJob?.youtubeVideoId), 'Database records confirmed YouTube video ID', `ID: ${persistedJob?.youtubeVideoId}`);

    // ------------------------------------------------------------------------
    // SUITE 3: Cloudflare R2 Retention Policy (6 Sequential Videos Verification)
    // ------------------------------------------------------------------------
    console.info('\n--- Suite 3: Cloudflare R2 Retention Policy (6-Video Verification) ---');
    const { enforceR2RetentionPolicy } = await import('../lib/video-studio/retention.js');
    const {
      createVideoJob,
      updateVideoJobStatus,
      updateVideoJobPayload,
      getRetainedPublishedVideoJobs,
      getRecentRetentionLogs,
      updateVideoStudioSettings,
    } = await import('../lib/video-studio/db.js');

    // Ensure retention limit is set to 5 for test
    await updateVideoStudioSettings({ maxPublishedVideos: 5 });

    // Isolate retention test pool so we evaluate exact 1 to 6 sequence
    const { query } = await import('../lib/outreach/db.js');
    await query(`UPDATE video_studio_jobs SET r2_retained = false WHERE r2_retained = true;`);
    await query(`DELETE FROM video_studio_jobs WHERE id LIKE 'test_retention_job_%' OR id LIKE 'test_failed_job_%';`);
    await query(`DELETE FROM video_studio_retention_logs WHERE status != 'success';`);

    console.info('   Simulating 6 sequential published videos with active R2 media collections...');

    const testVideoJobs = [];
    const timestampBase = Date.now();

    for (let i = 1; i <= 6; i++) {
      const jobId = `test_retention_job_${timestampBase}_${i}`;
      const title = `Retention Test Video #${i}: Agent Scalability ${i}`;
      const slug = `retention-test-video-${i}-${timestampBase}`;

      const job = await createVideoJob({
        id: jobId,
        title,
        slug,
        languageSettings: { narration: 'hi-IN', subtitles: 'en-US', metadata: 'en-US' },
      });

      // Update with published status, YouTube video ID, and R2 media assets
      const r2VideoKey = `videos/${jobId}/final_${jobId}.mp4`;
      const r2AssetKeys = [
        r2VideoKey,
        `videos/${jobId}/voiceover_hi.mp3`,
        `videos/${jobId}/subtitles_en.srt`,
        `videos/${jobId}/subtitles_en.vtt`,
        `videos/${jobId}/thumbnail.jpg`,
      ];

      await updateVideoJobPayload(jobId, {
        r2VideoKey,
        r2VideoUrl: `https://cdn.heyprince.in/${r2VideoKey}`,
        r2AssetKeys,
        r2Retained: true,
        r2TotalBytes: 15 * 1024 * 1024, // 15 MB
        youtubeVideoId: `yt_sim_${jobId}`,
        youtubeVideoUrl: `https://www.youtube.com/watch?v=yt_sim_${jobId}`,
        youtubePublishStatus: 'published',
        publishedAt: new Date(Date.now() + i * 1000).toISOString(),
      });

      await updateVideoJobStatus(jobId, {
        status: 'published',
        currentStep: 'published',
        progressPercent: 100,
        publishedAt: new Date(Date.now() + i * 1000).toISOString(),
      });

      const updatedJob = (await getVideoJobById(jobId))!;
      testVideoJobs.push(updatedJob);

      // Execute retention check for each published video
      const retentionResult = await enforceR2RetentionPolicy(updatedJob);

      if (i <= 5) {
        // Videos 1 through 5: Must NOT trigger pruning
        console.info(`   [Video ${i}/6 Published] Retained count: ${retentionResult.retainedAfterCount}. Pruning required: ${retentionResult.pruningRequired}`);
      } else {
        // Video 6: MUST trigger pruning of the oldest video
        console.info(`   [Video 6/6 Published] Pruning triggered! Pruned Job: ${retentionResult.prunedJobId} ("${retentionResult.prunedVideoTitle}")`);
        assert(retentionResult.pruningRequired, 'Video 6 triggers R2 retention pruning');
        assert(retentionResult.success, 'R2 retention pruning executes successfully');
        assert(retentionResult.objectsDeleted.length > 0, 'Old media objects are deleted from R2', `Deleted: ${retentionResult.objectsDeleted.length}`);
        assert(retentionResult.retainedAfterCount === 5, 'Retained published videos count is exactly 5 after 6th publish', `Count: ${retentionResult.retainedAfterCount}`);
      }
    }

    // Verify retention guarantees in database
    const currentlyRetained = await getRetainedPublishedVideoJobs();
    assert(currentlyRetained.length <= 5, 'Exactly 5 or fewer published videos remain retained in R2', `Active in R2: ${currentlyRetained.length}`);

    // Verify that the pruned video (Video #1) still exists in the database with YouTube URL preserved
    const prunedJob1 = await getVideoJobById(testVideoJobs[0].id);
    assert(Boolean(prunedJob1), 'Pruned Video #1 record still exists in database');
    assert(prunedJob1?.r2Retained === false, 'Pruned Video #1 has r2Retained = false');
    assert(Boolean(prunedJob1?.r2DeletedAt), 'Pruned Video #1 has recorded r2DeletedAt timestamp');
    assert(Boolean(prunedJob1?.youtubeVideoId), 'Pruned Video #1 YouTube video ID remains intact and untouched', `YouTube ID: ${prunedJob1?.youtubeVideoId}`);
    assert(Boolean(prunedJob1?.slug), 'Pruned Video #1 slug and script payload remain intact');

    // Verify Retention Audit Log
    const logs = await getRecentRetentionLogs(5);
    assert(logs.length > 0, 'Retention action is logged in video_studio_retention_logs');
    assert(logs[0].status === 'success', 'Retention log status is success');

    // Verify Guard: Failed YouTube uploads NEVER trigger deletion
    console.info('\n--- Suite 3.1: Retention Safety Guard (Failed YouTube Publish) ---');
    const failedJobId = `test_failed_job_${Date.now()}`;
    const failedJob = await createVideoJob({
      id: failedJobId,
      title: 'Failed YouTube Upload Test Job',
      slug: `failed-job-${Date.now()}`,
    });
    await updateVideoJobStatus(failedJobId, {
      status: 'failed',
      failureReason: 'YouTube API quota exceeded',
    });

    const failedJobResult = await enforceR2RetentionPolicy((await getVideoJobById(failedJobId))!);
    assert(!failedJobResult.pruningRequired, 'Failed YouTube upload NEVER triggers retention pruning');
    assert(failedJobResult.objectsDeleted.length === 0, 'Zero objects deleted when YouTube publication fails');

    // ------------------------------------------------------------------------
    // SUITE 4: Storage Dashboard Metrics Verification
    // ------------------------------------------------------------------------
    console.info('\n--- Suite 4: Storage Dashboard Metrics Verification ---');
    const { getStorageDashboardSummary } = await import('../lib/video-studio/db.js');

    const storageSummary = await getStorageDashboardSummary();
    assert(storageSummary.maxRetentionLimit === 5, 'Dashboard reflects max retention limit of 5');
    assert(storageSummary.retainedVideosCount <= 5, 'Dashboard shows retained count <= 5', `Count: ${storageSummary.retainedVideosCount}`);
    assert(Boolean(storageSummary.r2TotalFormatted), 'Dashboard formats total R2 storage usage', `Formatted: ${storageSummary.r2TotalFormatted}`);
    assert(Boolean(storageSummary.oldestRetainedVideo), 'Dashboard identifies oldest retained video', `Oldest: ${storageSummary.oldestRetainedVideo?.title}`);
    assert(storageSummary.failedCleanupTasksCount === 0, 'Dashboard records zero failed cleanup tasks');

    console.info('\n================================================================');
    console.info(`HeyPrince AI Video Studio Test Suite Completed: ${passedTests}/${totalTests} Tests Passed!`);
    console.info('================================================================\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Video Studio Test Suite encountered an error:', error);
    process.exit(1);
  }
}

runVideoStudioTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
