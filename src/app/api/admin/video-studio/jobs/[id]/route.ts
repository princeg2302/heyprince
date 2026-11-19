import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import {
  getVideoJobById,
  updateVideoJobStatus,
  getVideoStudioSettings,
  getActiveVideoJob,
  deleteVideoJob,
} from '@/lib/video-studio/db';
import { executeVideoStudioPipeline } from '@/lib/video-studio/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 });
    }

    const job = await getVideoJobById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error: any) {
    console.error('[API /api/admin/video-studio/jobs/[id] GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 });
    }

    const job = await getVideoJobById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Check concurrency if retry is attempted while another job is active
    const activeJob = await getActiveVideoJob();
    if (activeJob && activeJob.id !== id) {
      return NextResponse.json(
        {
          success: false,
          error: `Another video production job is currently active (${activeJob.title || activeJob.id}). Concurrency lock is active.`,
          activeJobId: activeJob.id,
        },
        { status: 409 }
      );
    }

    // Reset status to queued for retry
    await updateVideoJobStatus(id, {
      status: 'queued',
      currentStep: 'queued',
      progressPercent: 0,
      failureReason: null,
      retryCount: (job.retryCount || 0) + 1,
    });

    // Fire pipeline asynchronously
    executeVideoStudioPipeline({
      jobId: id,
      topic: job.title,
      postId: job.postId || undefined,
      forceParallel: true,
    }).catch((err) => {
      console.error(`[VideoStudio Background Worker] Unhandled retry error for job ${id}:`, err);
    });

    return NextResponse.json({
      success: true,
      message: 'Video job retry initiated successfully.',
      jobId: id,
    });
  } catch (error: any) {
    console.error('[API /api/admin/video-studio/jobs/[id] POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retry video job' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 });
    }

    const job = await getVideoJobById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    await deleteVideoJob(id);

    return NextResponse.json({
      success: true,
      message: `Video job ${id} deleted successfully.`,
      jobId: id,
    });
  } catch (error: any) {
    console.error('[API /api/admin/video-studio/jobs/[id] DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete video job' },
      { status: 500 }
    );
  }
}

