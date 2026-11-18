import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCurrentAdmin } from '@/lib/admin-db';
import {
  getRecentVideoJobs,
  getActiveVideoJob,
  getVideoStudioSettings,
  createVideoJob,
} from '@/lib/video-studio/db';
import { executeVideoStudioPipeline } from '@/lib/video-studio/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const [recentJobs, activeJob, settings] = await Promise.all([
      getRecentVideoJobs(limit),
      getActiveVideoJob(),
      getVideoStudioSettings(),
    ]);

    return NextResponse.json({
      success: true,
      activeJob,
      recentJobs,
      settings,
    });
  } catch (error: any) {
    console.error('[API /api/admin/video-studio/jobs GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch video jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { topic, postId, forceParallel } = body;

    const settings = await getVideoStudioSettings();

    // Check concurrency unless explicitly forced
    if (!forceParallel) {
      const activeJob = await getActiveVideoJob();
      if (activeJob) {
        return NextResponse.json(
          {
            success: false,
            error: `Another video production job is already active (${activeJob.title || activeJob.id}). Concurrency lock is active.`,
            activeJobId: activeJob.id,
          },
          { status: 409 }
        );
      }
    }

    const defaultTitle = topic
      ? `AI Video: ${topic}`
      : 'Autonomous AI Insights Deep-Dive';

    const jobId = `job_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const slug = defaultTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `video-${Date.now()}`;

    const newJob = await createVideoJob({
      id: jobId,
      title: defaultTitle,
      slug,
      languageSettings: {
        narration: settings.defaultNarrationLang || 'hi-IN',
        subtitles: settings.defaultSubtitleLang || 'en-US',
        metadata: 'en-US',
      },
      postId: postId ? Number(postId) : undefined,
    });

    // Fire orchestrator pipeline asynchronously in background
    executeVideoStudioPipeline({
      jobId: newJob.id,
      topic: topic || newJob.title,
      postId: newJob.postId || undefined,
      forceParallel: Boolean(forceParallel),
    }).catch((err) => {
      console.error(`[VideoStudio Background Worker] Unhandled execution error for job ${newJob.id}:`, err);
    });

    return NextResponse.json({
      success: true,
      message: 'Video production job queued successfully and is executing asynchronously.',
      jobId: newJob.id,
      job: newJob,
    });
  } catch (error: any) {
    console.error('[API /api/admin/video-studio/jobs POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create video job' },
      { status: 500 }
    );
  }
}
