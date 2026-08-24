import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { config } from '../config/env';
import { S3CompatibleImageStorage } from './S3CompatibleImageStorage';

/**
 * Abstraction interface for image storage.
 * Phase 1: LocalImageStorage writes processed WebP files to local disk.
 * Phase 2: S3CompatibleImageStorage uploads processed WebP files to Cloudflare R2 object storage.
 */
export interface ImageStorageService {
    save(buffer: Buffer, extension?: string): Promise<string>;
    delete(url: string): Promise<void>;
    getPublicUrl(filename: string): string;
}

/**
 * Local filesystem image storage.
 * Stores processed files in the configured upload directory and serves them statically.
 */
export class LocalImageStorage implements ImageStorageService {
    private uploadDir: string;

    constructor() {
        this.uploadDir = path.resolve(config.uploadDir);
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Saves a processed image buffer to disk using a secure random UUID filename.
     * Original client filename and extension are completely ignored.
     */
    async save(buffer: Buffer, extension: string = 'webp'): Promise<string> {
        const sanitizedExt = extension.replace(/^[.]+/, '').toLowerCase() || 'webp';
        const filename = `${uuid()}.${sanitizedExt}`;
        const filePath = path.join(this.uploadDir, filename);

        await fs.promises.writeFile(filePath, buffer);
        return this.getPublicUrl(filename);
    }

    /**
     * Deletes an image from disk given its public URL or path.
     * Silently handles non-existent files to ensure idempotent cleanup.
     */
    async delete(url: string): Promise<void> {
        if (!url) return;
        try {
            // Extract the filename safely to prevent directory traversal
            const filename = path.basename(url);
            const filePath = path.join(this.uploadDir, filename);

            try {
                await fs.promises.access(filePath);
                await fs.promises.unlink(filePath);
            } catch (err: any) {
                // If file does not exist (ENOENT), ignore silently
                if (err.code !== 'ENOENT') {
                    console.warn(`[LocalImageStorage] Failed to delete image ${filename}:`, err.message || err);
                }
            }
        } catch (error: any) {
            console.warn('[LocalImageStorage] Error during file deletion:', error.message || error);
        }
    }

    /**
     * Returns the relative public URL for an uploaded file.
     */
    getPublicUrl(filename: string): string {
        return `/uploads/${filename}`;
    }
}

/**
 * Factory creating the active ImageStorageService.
 * Returns S3CompatibleImageStorage when Cloudflare R2 credentials are configured,
 * otherwise defaults to LocalImageStorage for offline local environments.
 */
export function createImageStorage(): ImageStorageService {
    if (config.cloudflareAccessKeyId && config.cloudflareR2BucketName) {
        return new S3CompatibleImageStorage();
    }
    return new LocalImageStorage();
}

export const imageStorage: ImageStorageService = createImageStorage();
