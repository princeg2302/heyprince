import { NextRequest, NextResponse } from 'next/server';
import { downloadFromR2, isR2Configured } from '@/lib/storage/r2';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: keySegments } = await params;
  if (!keySegments || keySegments.length === 0) {
    return new NextResponse('Asset key required', { status: 400 });
  }

  const rawKey = keySegments.join('/').replace(/\/+$/, '');
  const objectKey = decodeURIComponent(rawKey);

  // If a valid custom public domain is configured (not the private S3 endpoint), redirect to CDN
  const customBase = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (customBase && !customBase.includes('.r2.cloudflarestorage.com')) {
    const targetUrl = `${customBase.replace(/\/+$/, '')}/${objectKey}`;
    return NextResponse.redirect(targetUrl, 307);
  }

  // 1. Primary: Download object from Cloudflare R2 via authenticated S3 client
  if (isR2Configured()) {
    try {
      const result = await downloadFromR2(objectKey);
      if (result.success && result.body) {
        const contentType =
          result.contentType ||
          (objectKey.endsWith('.svg')
            ? 'image/svg+xml'
            : objectKey.endsWith('.webp')
            ? 'image/webp'
            : objectKey.endsWith('.png')
            ? 'image/png'
            : objectKey.endsWith('.jpg') || objectKey.endsWith('.jpeg')
            ? 'image/jpeg'
            : objectKey.endsWith('.gif')
            ? 'image/gif'
            : objectKey.endsWith('.avif')
            ? 'image/avif'
            : objectKey.endsWith('.pdf')
            ? 'application/pdf'
            : 'application/octet-stream');

        return new NextResponse(new Uint8Array(result.body), {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (r2Err) {
      console.warn(`[api/media] R2 download exception for key "${objectKey}":`, r2Err);
    }
  }

  return new NextResponse('Asset not found', { status: 404 });
}
