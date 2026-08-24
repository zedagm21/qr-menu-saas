import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { ImageStorageService } from './ImageStorageService';
import { createError } from '../middleware/errorHandler';

export interface S3CompatibleOptions {
    endpoint?: string;
    region?: string;
    credentials?: { accessKeyId: string; secretAccessKey: string };
    bucketName?: string;
    publicUrl?: string;
    s3Client?: S3Client;
}

/**
 * S3-compatible cloud object storage implementation for Cloudflare R2.
 * Implements ImageStorageService.
 */
export class S3CompatibleImageStorage implements ImageStorageService {
    private s3: S3Client;
    private bucket: string;
    private publicUrl: string;
    private localUploadDir: string;

    constructor(options?: S3CompatibleOptions) {
        this.bucket = options?.bucketName || config.cloudflareR2BucketName;
        this.publicUrl = (options?.publicUrl || config.cloudflareR2PublicUrl || '').replace(/\/+$/, '');
        this.localUploadDir = path.resolve(config.uploadDir);

        if (options?.s3Client) {
            this.s3 = options.s3Client;
        } else {
            const endpoint =
                options?.endpoint ||
                config.cloudflareR2Endpoint ||
                (config.cloudflareAccountId
                    ? `https://${config.cloudflareAccountId}.r2.cloudflarestorage.com`
                    : undefined);

            this.s3 = new S3Client({
                region: options?.region || 'auto',
                endpoint,
                credentials: options?.credentials || {
                    accessKeyId: config.cloudflareAccessKeyId,
                    secretAccessKey: config.cloudflareSecretAccessKey,
                },
            });
        }
    }

    /**
     * Uploads a processed image buffer to Cloudflare R2 using a secure UUID key.
     * Sets proper Content-Type and Cache-Control headers for CDN caching.
     */
    async save(buffer: Buffer, extension: string = 'webp'): Promise<string> {
        const sanitizedExt = extension.replace(/^[.]+/, '').toLowerCase() || 'webp';
        const filename = `${uuid()}.${sanitizedExt}`;
        const key = `uploads/${filename}`;
        const contentType = sanitizedExt === 'webp' ? 'image/webp' : `image/${sanitizedExt}`;

        try {
            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                CacheControl: 'public, max-age=31536000, immutable',
            });

            await this.s3.send(command);
            return this.getPublicUrl(key);
        } catch (error: any) {
            console.error('[S3CompatibleImageStorage] Upload to R2 failed:', error.message || error);
            throw createError('Failed to upload image to object storage.', 500);
        }
    }

    /**
     * Deletes an image from R2 object storage or legacy local disk if given a local path.
     * Handles missing keys idempotently without throwing.
     */
    async delete(url: string): Promise<void> {
        if (!url) return;
        try {
            // Handle legacy local uploads path (/uploads/...)
            if (url.startsWith('/uploads/')) {
                const filename = path.basename(url);
                const localPath = path.join(this.localUploadDir, filename);
                try {
                    await fs.promises.access(localPath);
                    await fs.promises.unlink(localPath);
                } catch (err: any) {
                    if (err.code !== 'ENOENT') {
                        console.warn('[S3CompatibleImageStorage] Failed to unlink legacy local file:', err.message || err);
                    }
                }
                return;
            }

            // Handle Cloudflare R2 object deletion
            const key = this.extractKeyFromUrl(url);
            if (!key) return;

            const command = new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });

            await this.s3.send(command);
        } catch (error: any) {
            console.warn('[S3CompatibleImageStorage] Error during R2 deletion:', error.message || error);
        }
    }

    /**
     * Constructs the public accessible URL for an object key.
     */
    getPublicUrl(keyOrFilename: string): string {
        const cleanKey = keyOrFilename.replace(/^\/+/, '');
        if (this.publicUrl) {
            return `${this.publicUrl}/${cleanKey}`;
        }
        return `/${cleanKey}`;
    }

    /**
     * Extracts the R2 object key from a full URL or pathname.
     */
    private extractKeyFromUrl(url: string): string | null {
        try {
            if (url.startsWith('http://') || url.startsWith('https://')) {
                const parsed = new URL(url);
                return parsed.pathname.replace(/^\/+/, '');
            }
            return url.replace(/^\/+/, '');
        } catch {
            return url.replace(/^\/+/, '');
        }
    }
}
