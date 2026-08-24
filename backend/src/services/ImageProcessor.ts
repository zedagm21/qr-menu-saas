import sharp from 'sharp';
import { validateImageMagicBytes } from '../utils/imageValidation';
import { createError } from '../middleware/errorHandler';

// Disable Sharp / libvips internal file-handle caching to prevent Windows EBUSY file-lock issues during deletion
sharp.cache(false);

export interface ProcessedImageResult {
    buffer: Buffer;
    format: 'webp';
    width?: number;
    height?: number;
    size: number;
}

export interface ImageDimensionOptions {
    maxWidth: number;
    maxHeight: number;
}

// Dimension limits tailored for the restaurant SaaS application
export const IMAGE_DIMENSION_LIMITS = {
    LOGO: { maxWidth: 1200, maxHeight: 1200 },
    COVER: { maxWidth: 2400, maxHeight: 1600 },
    MENU_ITEM: { maxWidth: 1600, maxHeight: 1600 },
} as const;

// Decompression bomb protection: reject raw images claiming more than 50 million pixels
const MAX_INPUT_PIXELS = 50_000_000;
// WebP quality optimized for food photography and responsive loading
const WEBP_QUALITY = 80;

export class ImageProcessor {
    /**
     * Common processing pipeline:
     * 1. Magic-byte signature verification
     * 2. Sharp decoding & pixel limit check
     * 3. EXIF Auto-orientation
     * 4. Metadata / EXIF stripping
     * 5. Dimension constraint (aspect ratio preserved, no upscaling)
     * 6. WebP conversion (quality 80)
     */
    static async processImage(
        buffer: Buffer,
        options: ImageDimensionOptions
    ): Promise<ProcessedImageResult> {
        // 1. Verify actual file signature / magic bytes
        const validation = validateImageMagicBytes(buffer);
        if (!validation.isValid) {
            throw createError(validation.error || 'Unsupported image format.', 400);
        }

        try {
            // 2. Initialize Sharp with decompression bomb protection
            const image = sharp(buffer, {
                failOn: 'error',
                limitInputPixels: MAX_INPUT_PIXELS,
            });

            // 3. Inspect metadata to confirm decoding
            const metadata = await image.metadata();
            if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format)) {
                throw createError('Unsupported image format. Allowed formats: JPEG, PNG, WebP.', 400);
            }

            // 4. Process image: auto-orient, resize within bounds, convert to WebP, strip metadata
            const processedBuffer = await image
                .rotate() // Auto-orient based on EXIF orientation
                .resize({
                    width: options.maxWidth,
                    height: options.maxHeight,
                    fit: 'inside', // Preserve aspect ratio, never crop or stretch
                    withoutEnlargement: true, // Never upscale small images
                })
                .webp({
                    quality: WEBP_QUALITY,
                    effort: 4, // Good balance of compression speed and compression ratio
                })
                .toBuffer(); // Does not retain metadata unless .withMetadata() is called

            // Inspect output dimensions
            const outputMeta = await sharp(processedBuffer).metadata();

            return {
                buffer: processedBuffer,
                format: 'webp',
                width: outputMeta.width,
                height: outputMeta.height,
                size: processedBuffer.length,
            };
        } catch (error: any) {
            // If it's already an operational AppError, re-throw it
            if (error.isOperational) {
                throw error;
            }

            // Decompression bomb or pixel limit error
            if (error.message && error.message.includes('Input image exceeds pixel limit')) {
                throw createError('Image pixel dimensions are too large.', 400);
            }

            // Corrupted or un-decodable image
            console.error('Image processing failure:', error.message || error);
            throw createError('Invalid or corrupted image file.', 400);
        }
    }

    /**
     * Process restaurant logo: max 1200 x 1200
     */
    static async processLogo(buffer: Buffer): Promise<ProcessedImageResult> {
        return this.processImage(buffer, IMAGE_DIMENSION_LIMITS.LOGO);
    }

    /**
     * Process restaurant cover image: max 2400 x 1600
     */
    static async processCover(buffer: Buffer): Promise<ProcessedImageResult> {
        return this.processImage(buffer, IMAGE_DIMENSION_LIMITS.COVER);
    }

    /**
     * Process menu item food/beverage image: max 1600 x 1600
     */
    static async processMenuItem(buffer: Buffer): Promise<ProcessedImageResult> {
        return this.processImage(buffer, IMAGE_DIMENSION_LIMITS.MENU_ITEM);
    }
}
