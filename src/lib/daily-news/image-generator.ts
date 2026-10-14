import { supabase, createMediaRecord } from '@/lib/admin-db';
import { GeneratedArticleSection } from './types';

export interface GeneratedBlogImage {
  type: 'cover' | 'section';
  url: string;
  alt: string;
  caption: string;
  filename: string;
  mediaId?: number;
}

export interface BlogImagesPackage {
  coverImage: GeneratedBlogImage;
  sectionImages: GeneratedBlogImage[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .slice(0, 40)
    .replace(/^-+|-+$/g, '');
}

/**
 * Curated high-resolution tech photography fallbacks categorized by domain.
 * Used if AI generation encounters network or timeout constraints.
 */
const CURATED_TECH_FALLBACKS: Record<string, string[]> = {
  ai: [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  ],
  cloud: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
  ],
  security: [
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1200&q=80',
  ],
  general: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80',
  ],
};

function getCuratedFallback(category: string, index: number): string {
  const cat = category.toLowerCase();
  let pool = CURATED_TECH_FALLBACKS.general;
  if (cat.includes('ai') || cat.includes('intelligence')) {
    pool = CURATED_TECH_FALLBACKS.ai;
  } else if (cat.includes('cloud') || cat.includes('architecture') || cat.includes('web')) {
    pool = CURATED_TECH_FALLBACKS.cloud;
  } else if (cat.includes('security') || cat.includes('cyber')) {
    pool = CURATED_TECH_FALLBACKS.security;
  }
  return pool[index % pool.length];
}

/**
 * Downloads image buffer from a URL with timeout protection
 */
async function fetchImageBuffer(url: string, timeoutMs = 12000): Promise<{ buffer: Buffer; contentType: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'HeyPrince-DailyNews-Bot/1.0 (+https://heyprince.in)',
      },
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return { buffer, contentType };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Tries AI image generation via Pollinations Flux, fallback to curated high-res tech source
 */
async function generateOrFetchImage(prompt: string, fallbackUrl: string): Promise<{ buffer: Buffer; contentType: string; usedUrl: string }> {
  const cleanPrompt = encodeURIComponent(
    `hyperrealistic 8k cinematic 3d render, dark tech aesthetic, modern software engineering: ${prompt}`
  );
  const seed = Math.floor(Math.random() * 999999);
  const aiImageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1200&height=675&model=flux&nologo=true&seed=${seed}`;

  // Attempt 1: Pollinations AI Generation
  const aiResult = await fetchImageBuffer(aiImageUrl, 14000);
  if (aiResult && aiResult.buffer.length > 5000) {
    return { buffer: aiResult.buffer, contentType: aiResult.contentType, usedUrl: aiImageUrl };
  }

  // Attempt 2: High-resolution curated developer photo
  const fallbackResult = await fetchImageBuffer(fallbackUrl, 8000);
  if (fallbackResult && fallbackResult.buffer.length > 1000) {
    return { buffer: fallbackResult.buffer, contentType: fallbackResult.contentType, usedUrl: fallbackUrl };
  }

  throw new Error('Failed to generate or fetch image buffer.');
}

/**
 * Saves image to Supabase Storage bucket ('media') and registers it in the 'media' table
 */
async function uploadAndRecordMedia(
  buffer: Buffer,
  filename: string,
  alt: string,
  caption: string,
  contentType: string,
  fallbackExternalUrl: string
): Promise<{ url: string; mediaId?: number }> {
  let publicUrl = fallbackExternalUrl;

  try {
    // 1. Upload to Supabase Storage
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('media')
      .upload(filename, buffer, {
        contentType,
        upsert: true,
      });

    if (!uploadErr && uploadData) {
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filename);
      if (urlData?.publicUrl) {
        publicUrl = urlData.publicUrl;
      }
    }
  } catch (storageErr) {
    console.warn('[image-generator] Supabase storage upload warning:', storageErr);
  }

  // 2. Insert into Supabase 'media' table for Media Vault cataloging
  let mediaId: number | undefined;
  try {
    const mediaRecordRes = await createMediaRecord({
      alt,
      caption,
      filename,
      mime_type: contentType,
      filesize: buffer.length,
      width: 1200,
      height: 675,
      url: publicUrl,
    });

    if (mediaRecordRes.success && mediaRecordRes.media) {
      mediaId = mediaRecordRes.media.id;
    }
  } catch (dbErr) {
    console.warn('[image-generator] Could not create media record in database:', dbErr);
  }

  return { url: publicUrl, mediaId };
}

/**
 * Generates 1 Cover Image and 2 Section Content Images for the daily article,
 * uploads them into Supabase Storage, and registers them in the Media Vault.
 */
export async function generateDailyBlogImages(
  articleTitle: string,
  categoryName: string,
  sections: GeneratedArticleSection[]
): Promise<BlogImagesPackage> {
  const baseSlug = slugify(articleTitle) || 'daily-tech';
  const timestamp = Date.now();

  const sec1Heading = sections[0]?.heading || 'Technical Overview';
  const sec2Heading = sections[1]?.heading || 'Engineering Architecture & Impact';

  // 1. Cover Image Specification
  const coverPrompt = `${articleTitle}, abstract futuristic glowing computing elements, obsidian dark backdrop, neon highlights, ultra clean minimal tech concept`;
  const coverAlt = `${articleTitle} - Feature Cover Illustration`;
  const coverCaption = `Executive Analysis: ${articleTitle}`;
  const coverFilename = `blog-cover-${timestamp}-${baseSlug}.webp`;

  // 2. Section 1 Image Specification
  const sec1Prompt = `${sec1Heading}, software architecture schematic, cybernetic nodes, data flow visualization, dark background, isometric detail`;
  const sec1Alt = `${sec1Heading} - Architectural Overview`;
  const sec1Caption = `Architectural Breakdown: Key system components and implementation flow.`;
  const sec1Filename = `blog-section1-${timestamp}-${baseSlug}.webp`;

  // 3. Section 2 Image Specification
  const sec2Prompt = `${sec2Heading}, modern developer telemetry dashboard, real-time code analytics, high-contrast cyan and amber accents`;
  const sec2Alt = `${sec2Heading} - Engineering Impact Diagram`;
  const sec2Caption = `Production Impact: Performance benchmarks, reliability metrics, and developer workflow.`;
  const sec2Filename = `blog-section2-${timestamp}-${baseSlug}.webp`;

  // Parallel generation of all 3 images with graceful fault-tolerance
  const [coverRes, sec1Res, sec2Res] = await Promise.allSettled([
    (async () => {
      const fallback = getCuratedFallback(categoryName, 0);
      const { buffer, contentType, usedUrl } = await generateOrFetchImage(coverPrompt, fallback);
      const { url, mediaId } = await uploadAndRecordMedia(buffer, coverFilename, coverAlt, coverCaption, contentType, usedUrl);
      return {
        type: 'cover' as const,
        url,
        alt: coverAlt,
        caption: coverCaption,
        filename: coverFilename,
        mediaId,
      };
    })(),

    (async () => {
      const fallback = getCuratedFallback(categoryName, 1);
      const { buffer, contentType, usedUrl } = await generateOrFetchImage(sec1Prompt, fallback);
      const { url, mediaId } = await uploadAndRecordMedia(buffer, sec1Filename, sec1Alt, sec1Caption, contentType, usedUrl);
      return {
        type: 'section' as const,
        url,
        alt: sec1Alt,
        caption: sec1Caption,
        filename: sec1Filename,
        mediaId,
      };
    })(),

    (async () => {
      const fallback = getCuratedFallback(categoryName, 2);
      const { buffer, contentType, usedUrl } = await generateOrFetchImage(sec2Prompt, fallback);
      const { url, mediaId } = await uploadAndRecordMedia(buffer, sec2Filename, sec2Alt, sec2Caption, contentType, usedUrl);
      return {
        type: 'section' as const,
        url,
        alt: sec2Alt,
        caption: sec2Caption,
        filename: sec2Filename,
        mediaId,
      };
    })(),
  ]);

  // Extract successful images or use reliable static fallbacks
  const coverImage: GeneratedBlogImage =
    coverRes.status === 'fulfilled'
      ? coverRes.value
      : {
          type: 'cover',
          url: getCuratedFallback(categoryName, 0),
          alt: coverAlt,
          caption: coverCaption,
          filename: coverFilename,
        };

  const sectionImages: GeneratedBlogImage[] = [];

  if (sec1Res.status === 'fulfilled') {
    sectionImages.push(sec1Res.value);
  } else {
    sectionImages.push({
      type: 'section',
      url: getCuratedFallback(categoryName, 1),
      alt: sec1Alt,
      caption: sec1Caption,
      filename: sec1Filename,
    });
  }

  if (sec2Res.status === 'fulfilled') {
    sectionImages.push(sec2Res.value);
  } else {
    sectionImages.push({
      type: 'section',
      url: getCuratedFallback(categoryName, 2),
      alt: sec2Alt,
      caption: sec2Caption,
      filename: sec2Filename,
    });
  }

  return {
    coverImage,
    sectionImages,
  };
}

