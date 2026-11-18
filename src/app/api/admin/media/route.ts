import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, getMediaList, createMediaRecord, deleteMediaBulk, supabase } from '@/lib/admin-db';
import { uploadToR2, deleteFromR2, isR2Configured, generateR2ObjectKey } from '@/lib/storage/r2';
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
      const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      let publicUrl = '';
      let storageEngine = 'supabase';
      let storedKey = safeFilename;

      // 1. Primary: If Cloudflare R2 is configured, upload to R2
      if (isR2Configured()) {
        const r2Key = generateR2ObjectKey('media-vault', file.name);
        const r2Res = await uploadToR2({
          key: r2Key,
          body: buffer,
          contentType: file.type || 'image/jpeg',
          visibility: 'public',
          metadata: {
            originalName: file.name,
            uploader: user.email || 'admin',
          },
        });

        if (r2Res.success) {
          publicUrl = r2Res.url;
          storageEngine = 'cloudflare-r2';
          storedKey = r2Key;
        }
      }

      // 2. Secondary fallback: Supabase Storage "media" bucket
      if (!publicUrl) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(safeFilename, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(safeFilename);
          publicUrl = urlData.publicUrl;
        } else {
          // Local filesystem fallback for dev server if applicable
          try {
            const uploadDir = path.resolve(process.cwd(), 'public/media');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.join(uploadDir, safeFilename);
            fs.writeFileSync(filePath, buffer);
            publicUrl = `/media/${safeFilename}`;
          } catch {
            return NextResponse.json(
              { error: uploadError?.message || 'Storage upload failed.' },
              { status: 500 }
            );
          }
        }
      }

      const result = await createMediaRecord({
        alt: alt || file.name,
        filename: storedKey,
        mime_type: file.type,
        filesize: file.size,
        url: publicUrl,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, storageEngine, media: result.media });
    }

    // JSON upload (for registering external or existing URL)
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

export async function DELETE(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const ids: number[] = Array.isArray(body.ids) ? body.ids : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required.' }, { status: 400 });
    }

    // Also attempt R2 cleanup for any items deleted
    if (isR2Configured()) {
      try {
        const { data: items } = await supabase.from('media').select('filename').in('id', ids);
        if (items) {
          for (const item of items) {
            if (item.filename && item.filename.includes('/')) {
              await deleteFromR2(item.filename).catch(() => {});
            }
          }
        }
      } catch {}
    }

    const result = await deleteMediaBulk(ids);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: result.count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
