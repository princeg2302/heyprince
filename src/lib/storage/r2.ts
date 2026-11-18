import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

/**
 * Cloudflare R2 S3-Compatible Object Storage Service
 *
 * Provides resilient, secure, multi-folder storage operations for Next.js APIs,
 * Media Vault, Daily AI News, and AI Company documents.
 */

// Permitted folder categories for asset organization
export const R2_FOLDERS = [
  'blogs',
  'ai-generated',
  'company/avatars',
  'company/assets',
  'documents/proposals',
  'documents/reports',
  'clients',
  'media-vault',
  'projects',
] as const;

export type R2Folder = typeof R2_FOLDERS[number] | string;

export interface R2UploadOptions {
  key?: string;
  folder?: R2Folder;
  filename?: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
  visibility?: 'public' | 'private';
  metadata?: Record<string, string>;
  maxSizeBytes?: number;
}

export interface R2UploadResult {
  success: boolean;
  key: string;
  url: string;
  bucket: string;
  etag?: string;
  visibility: 'public' | 'private';
  sizeBytes: number;
  contentType: string;
  error?: string;
}

export interface R2FileMetadata {
  exists: boolean;
  size?: number;
  contentType?: string;
  etag?: string;
  lastModified?: Date;
  metadata?: Record<string, string>;
}

// Maximum upload limits
export const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// Allowed MIME types
export const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'image/x-icon',
  // Documents
  'application/pdf',
  'text/markdown',
  'text/plain',
  'application/json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
]);

/**
 * Checks whether required Cloudflare R2 environment variables are configured.
 */
export function isR2Configured(): boolean {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName);
}

/**
 * Resolves the S3 API endpoint for Cloudflare R2.
 */
export function getR2Endpoint(): string {
  if (process.env.R2_S3_ENDPOINT && process.env.R2_S3_ENDPOINT.trim() !== '') {
    return process.env.R2_S3_ENDPOINT.replace(/\/+$/, '');
  }
  const accountId = process.env.R2_ACCOUNT_ID || '';
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

/**
 * Resolves the public base URL for public assets.
 */
export function getR2PublicBaseUrl(): string {
  if (process.env.R2_PUBLIC_BASE_URL && process.env.R2_PUBLIC_BASE_URL.trim() !== '') {
    return process.env.R2_PUBLIC_BASE_URL.replace(/\/+$/, '');
  }
  const bucketName = process.env.R2_BUCKET_NAME || '';
  const accountId = process.env.R2_ACCOUNT_ID || '';
  return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`;
}

let cachedS3Client: S3Client | null = null;

/**
 * Returns a singleton instance of the S3Client configured for Cloudflare R2.
 */
export function getR2Client(): S3Client {
  if (cachedS3Client) {
    return cachedS3Client;
  }

  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials missing: R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY not set.');
  }

  cachedS3Client = new S3Client({
    region: 'auto',
    endpoint: getR2Endpoint(),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    // Force path style is recommended for Cloudflare R2
    forcePathStyle: true,
  });

  return cachedS3Client;
}

/**
 * Generates a clean, unique object key preventing collision and directory traversal.
 */
export function generateR2ObjectKey(folder: R2Folder, filename: string): string {
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
  const baseName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueId = crypto.randomBytes(6).toString('hex');
  const timestamp = Date.now();

  return `${cleanFolder}/${timestamp}-${uniqueId}-${baseName}`;
}

/**
 * Resolves public URL for a given object key.
 */
export function getR2PublicUrl(key: string): string {
  const cleanKey = key.replace(/^\/+/, '');
  const baseUrl = getR2PublicBaseUrl();
  return `${baseUrl}/${cleanKey}`;
}

/**
 * Uploads a file buffer or string directly to Cloudflare R2.
 */
export async function uploadToR2(options: R2UploadOptions): Promise<R2UploadResult> {
  const bucket = process.env.R2_BUCKET_NAME || '';
  const buffer = Buffer.isBuffer(options.body)
    ? options.body
    : Buffer.from(options.body);

  const sizeBytes = buffer.length;

  // Validation 1: Maximum file size limit
  const maxLimit = options.maxSizeBytes || (options.contentType.startsWith('image/') ? MAX_IMAGE_SIZE_BYTES : MAX_DOCUMENT_SIZE_BYTES);
  if (sizeBytes > maxLimit) {
    return {
      success: false,
      key: '',
      url: '',
      bucket,
      visibility: options.visibility || 'public',
      sizeBytes,
      contentType: options.contentType,
      error: `File size (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds allowed limit of ${(maxLimit / (1024 * 1024)).toFixed(0)} MB.`,
    };
  }

  // Validation 2: MIME type whitelist
  if (options.contentType && !ALLOWED_MIME_TYPES.has(options.contentType)) {
    return {
      success: false,
      key: '',
      url: '',
      bucket,
      visibility: options.visibility || 'public',
      sizeBytes,
      contentType: options.contentType,
      error: `File type '${options.contentType}' is not permitted.`,
    };
  }

  if (!bucket || !isR2Configured()) {
    return {
      success: false,
      key: '',
      url: '',
      bucket,
      visibility: options.visibility || 'public',
      sizeBytes,
      contentType: options.contentType,
      error: 'Cloudflare R2 is not configured in environment variables.',
    };
  }

  const visibility = options.visibility || 'public';
  const folder = options.folder || 'media-vault';
  const filename = options.filename || 'asset.bin';
  const objectKey = options.key || generateR2ObjectKey(folder, filename);

  try {
    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: options.contentType,
      Metadata: {
        ...(options.metadata || {}),
        visibility,
        uploadedAt: new Date().toISOString(),
      },
    });

    const response = await client.send(command);

    let url = '';
    if (visibility === 'public') {
      url = getR2PublicUrl(objectKey);
    } else {
      // Private assets use a presigned download URL by default
      const presignedRes = await getR2PresignedDownloadUrl({ key: objectKey, expiresInSeconds: 3600 });
      url = presignedRes.downloadUrl;
    }

    return {
      success: true,
      key: objectKey,
      url,
      bucket,
      etag: response.ETag,
      visibility,
      sizeBytes,
      contentType: options.contentType,
    };
  } catch (err: any) {
    return {
      success: false,
      key: objectKey,
      url: '',
      bucket,
      visibility,
      sizeBytes,
      contentType: options.contentType,
      error: err?.message || 'Failed to upload object to Cloudflare R2.',
    };
  }
}

/**
 * Downloads an object from Cloudflare R2 into a Buffer.
 */
export async function downloadFromR2(key: string): Promise<{
  success: boolean;
  body?: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
  error?: string;
}> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket || !isR2Configured()) {
    return { success: false, error: 'Cloudflare R2 is not configured.' };
  }

  try {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await client.send(command);
    if (!response.Body) {
      return { success: false, error: 'Empty response body from R2.' };
    }

    const byteArray = await response.Body.transformToByteArray();
    const buffer = Buffer.from(byteArray);

    return {
      success: true,
      body: buffer,
      contentType: response.ContentType,
      metadata: response.Metadata,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to download object from Cloudflare R2.',
    };
  }
}

/**
 * Deletes an object from Cloudflare R2.
 */
export async function deleteFromR2(key: string): Promise<{ success: boolean; error?: string }> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket || !isR2Configured()) {
    return { success: false, error: 'Cloudflare R2 is not configured.' };
  }

  try {
    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete object from Cloudflare R2.' };
  }
}

/**
 * Checks whether an object exists in Cloudflare R2.
 */
export async function checkR2FileExists(key: string): Promise<boolean> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket || !isR2Configured()) {
    return false;
  }

  try {
    const client = getR2Client();
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves metadata for an object in Cloudflare R2.
 */
export async function getR2FileMetadata(key: string): Promise<R2FileMetadata> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket || !isR2Configured()) {
    return { exists: false };
  }

  try {
    const client = getR2Client();
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const res = await client.send(command);

    return {
      exists: true,
      size: res.ContentLength,
      contentType: res.ContentType,
      etag: res.ETag,
      lastModified: res.LastModified,
      metadata: res.Metadata,
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Generates a presigned PUT URL for client-side uploads directly to Cloudflare R2.
 */
export async function getR2PresignedUploadUrl(options: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ success: boolean; uploadUrl: string; key: string; publicUrl?: string; error?: string }> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket || !isR2Configured()) {
    return { success: false, uploadUrl: '', key: options.key, error: 'Cloudflare R2 is not configured.' };
  }

  try {
    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: options.key,
      ContentType: options.contentType,
    });

    const expiresIn = options.expiresInSeconds || 900; // default 15 minutes
    const uploadUrl = await getSignedUrl(client, command, { expiresIn });

    return {
      success: true,
      uploadUrl,
      key: options.key,
      publicUrl: getR2PublicUrl(options.key),
    };
  } catch (err: any) {
    return {
      success: false,
      uploadUrl: '',
      key: options.key,
      error: err?.message || 'Failed to generate presigned upload URL.',
    };
  }
}

/**
 * Generates a presigned GET URL for secure downloading of private assets.
 */
export async function getR2PresignedDownloadUrl(options: {
  key: string;
  expiresInSeconds?: number;
}): Promise<{ success: boolean; downloadUrl: string; error?: string }> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket || !isR2Configured()) {
    return { success: false, downloadUrl: '', error: 'Cloudflare R2 is not configured.' };
  }

  try {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: options.key,
    });

    const expiresIn = options.expiresInSeconds || 3600; // default 1 hour
    const downloadUrl = await getSignedUrl(client, command, { expiresIn });

    return {
      success: true,
      downloadUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      downloadUrl: '',
      error: err?.message || 'Failed to generate presigned download URL.',
    };
  }
}
