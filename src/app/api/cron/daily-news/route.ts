import { NextRequest, NextResponse } from 'next/server';
import { executeDailyNewsAutomation } from '@/lib/daily-news/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max allowed serverless function execution time

/**
 * Vercel Cron Daily Endpoint
 * Triggered daily at 9:00 AM IST (3:30 AM UTC: "30 3 * * *")
 * Securely protected by CRON_SECRET
 */
export async function GET(request: NextRequest) {
  return handleCronTrigger(request);
}

export async function POST(request: NextRequest) {
  return handleCronTrigger(request);
}

async function handleCronTrigger(request: NextRequest) {
  // 1. Verify Authorization Header (Vercel Cron automatically sends Bearer <CRON_SECRET>)
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get('authorization');
  const customHeader = request.headers.get('x-cron-secret');

  if (cronSecret) {
    const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const providedSecret = bearerSecret || customHeader;

    if (!providedSecret || providedSecret !== cronSecret) {
      console.warn('[Cron Daily News] Unauthorized access attempt blocked.');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Invalid or missing CRON_SECRET authentication.',
        },
        { status: 401 }
      );
    }
  } else if (process.env.NODE_ENV === 'production') {
    // In production, CRON_SECRET is required to prevent unauthenticated public triggers
    console.error('[Cron Daily News] CRON_SECRET environment variable is missing in production.');
    return NextResponse.json(
      {
        success: false,
        error:
          'CRON_SECRET is not configured on the server. Please set CRON_SECRET in your Vercel project environment variables.',
      },
      { status: 500 }
    );
  }

  // 2. Prevent execution on Vercel Preview deployments if configured
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== 'production' && !request.nextUrl.searchParams.has('force')) {
    console.info(`[Cron Daily News] Skipped on non-production environment: ${vercelEnv}`);
    return NextResponse.json({
      success: true,
      message: `Cron automation is restricted to production. Current environment: ${vercelEnv}`,
    });
  }

  console.info('[Cron Daily News] Initiating scheduled daily tech news automation run...');

  try {
    const result = await executeDailyNewsAutomation({
      triggerType: 'scheduled',
    });

    console.info(
      `[Cron Daily News] Scheduled run finished with status: ${result.status} (Website: ${result.websiteStatus}, LinkedIn: ${result.linkedinStatus})`
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Cron Daily News] Execution failure:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Unhandled exception in daily news cron',
      },
      { status: 500 }
    );
  }
}

