import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, createMediaRecord } from '@/lib/admin-db';
import {
  uploadToR2,
  isR2Configured,
  generateR2ObjectKey,
  R2Folder,
  R2_FOLDERS,
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_DOCUMENT_SIZE_BYTES,
} from '@/lib/storage/r2';

export async function POST(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data.' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folderInput = (formData.get('folder') as string) || 'media-vault';
    const alt = (formData.get('alt') as string) || '';
    const visibilityInput = (formData.get('visibility') as string) || 'public';
    const relatedPostId = formData.get('related_post_id') ? String(formData.get('related_post_id')) : undefined;
    const relatedAgentId = formData.get('related_agent_id') ? String(formData.get('related_agent_id')) : undefined;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data.' }, { status: 400 });
    }

    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json({ error: `File type '${mimeType}' is not permitted.` }, { status: 400 });
    }

    const maxLimit = mimeType.startsWith('image/') ? MAX_IMAGE_SIZE_BYTES : MAX_DOCUMENT_SIZE_BYTES;
    if (file.size > maxLimit) {
      return NextResponse.json(
        { error: `File size exceeds ${(maxLimit / (1024 * 1024)).toFixed(0)} MB limit.` },
        { status: 400 }
      );
    }

    const visibility: 'public' | 'private' = visibilityInput === 'private' ? 'private' : 'public';
    const folder: R2Folder = (R2_FOLDERS as readonly string[]).includes(folderInput)
      ? (folderInput as R2Folder)
      : 'media-vault';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const objectKey = generateR2ObjectKey(folder, file.name);

    if (isR2Configured()) {
      const uploadResult = await uploadToR2({
        key: objectKey,
        body: buffer,
        contentType: mimeType,
        visibility,
        metadata: {
          originalFilename: file.name,
          uploader: user.email || 'admin',
          relatedPostId: relatedPostId || '',
          relatedAgentId: relatedAgentId || '',
        },
      });

      if (!uploadResult.success) {
        return NextResponse.json({ error: uploadResult.error || 'R2 upload failed.' }, { status: 500 });
      }

      // Catalog in Supabase Media Vault
      const mediaRecord = await createMediaRecord({
        alt: alt || file.name,
        caption: visibility === 'private' ? 'Private Document' : undefined,
        filename: objectKey,
        mime_type: mimeType,
        filesize: file.size,
        url: uploadResult.url,
      });

      return NextResponse.json({
        success: true,
        storage: 'cloudflare-r2',
        key: objectKey,
        url: uploadResult.url,
        visibility,
        size: file.size,
        mimeType,
        media: mediaRecord.media,
      });
    } else {
      // Fallback response if R2 is not configured
      return NextResponse.json(
        {
          error: 'Cloudflare R2 is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.',
        },
        { status: 503 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal upload error.' }, { status: 500 });
  }
}
