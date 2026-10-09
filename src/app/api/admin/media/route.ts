import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, getMediaList, createMediaRecord } from '@/lib/admin-db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const media = await getMediaList();
  return NextResponse.json({ media });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const alt = (formData.get('alt') as string) || '';

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Clean filename
      const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const uploadDir = path.resolve(process.cwd(), 'public/media');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, safeFilename);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/media/${safeFilename}`;

      const result = await createMediaRecord({
        alt: alt || file.name,
        filename: safeFilename,
        mime_type: file.type,
        filesize: file.size,
        url: publicUrl,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, media: result.media });
    }

    // JSON upload (for registering external / existing URL)
    const body = await request.json();
    if (!body.url) {
      return NextResponse.json({ error: 'Image URL is required.' }, { status: 400 });
    }

    const result = await createMediaRecord({
      alt: body.alt || 'Media asset',
      filename: body.filename || path.basename(body.url),
      mime_type: body.mime_type || 'image/webp',
      filesize: body.filesize || 0,
      url: body.url,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, media: result.media });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
