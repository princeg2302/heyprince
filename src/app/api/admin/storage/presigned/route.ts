import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-db';
import {
  getR2PresignedUploadUrl,
  getR2PresignedDownloadUrl,
  generateR2ObjectKey,
  isR2Configured,
  R2Folder,
  R2_FOLDERS,
  ALLOWED_MIME_TYPES,
} from '@/lib/storage/r2';

export async function POST(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json({ error: 'Cloudflare R2 is not configured.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const action = body.action || 'upload'; // 'upload' or 'download'

    if (action === 'upload') {
      const filename = body.filename || 'asset.bin';
      const contentType = body.contentType || 'image/webp';
      const folderInput = body.folder || 'media-vault';

      if (!ALLOWED_MIME_TYPES.has(contentType)) {
        return NextResponse.json({ error: `Content-Type '${contentType}' is not permitted.` }, { status: 400 });
      }

      const folder: R2Folder = (R2_FOLDERS as readonly string[]).includes(folderInput)
        ? (folderInput as R2Folder)
        : 'media-vault';

      const key = body.key || generateR2ObjectKey(folder, filename);
      const expiresInSeconds = body.expiresInSeconds ? Number(body.expiresInSeconds) : 900;

      const presigned = await getR2PresignedUploadUrl({
        key,
        contentType,
        expiresInSeconds,
      });

      if (!presigned.success) {
        return NextResponse.json({ error: presigned.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'upload',
        key,
        uploadUrl: presigned.uploadUrl,
        publicUrl: presigned.publicUrl,
        expiresInSeconds,
      });
    } else if (action === 'download') {
      const key = body.key;
      if (!key) {
        return NextResponse.json({ error: 'Object key is required for presigned download.' }, { status: 400 });
      }

      const expiresInSeconds = body.expiresInSeconds ? Number(body.expiresInSeconds) : 3600;
      const presigned = await getR2PresignedDownloadUrl({
        key,
        expiresInSeconds,
      });

      if (!presigned.success) {
        return NextResponse.json({ error: presigned.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'download',
        key,
        downloadUrl: presigned.downloadUrl,
        expiresInSeconds,
      });
    } else {
      return NextResponse.json({ error: "Invalid action. Supported: 'upload', 'download'." }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error processing presigned URL request.' }, { status: 500 });
  }
}
