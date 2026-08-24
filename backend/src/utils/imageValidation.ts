/**
 * Utility for magic-byte / file signature detection and image validation.
 * Protects against MIME-type spoofing, extension spoofing, and malicious file uploads (e.g. SVG XSS, HTML, PHP, executables).
 */

export type AllowedImageFormat = 'jpeg' | 'png' | 'webp';

export interface ImageValidationResult {
    isValid: boolean;
    format?: AllowedImageFormat;
    error?: string;
}

/**
 * Validates an image buffer using its magic bytes (file signature).
 * Explicitly allows only JPEG, PNG, and WebP raster images.
 * Rejects SVG, GIF, HTML, scripts, executables, and unrecognized formats.
 */
export function validateImageMagicBytes(buffer: Buffer): ImageValidationResult {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 12) {
        return {
            isValid: false,
            error: 'Invalid file: buffer is empty or too small to be a valid image.',
        };
    }

    // 1. Check for SVG / XML indicators (Security: SVG can execute JavaScript/XSS)
    const headerSnippet = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('utf-8').toLowerCase();
    if (
        headerSnippet.includes('<svg') ||
        headerSnippet.includes('<?xml') ||
        headerSnippet.includes('<!doctype svg') ||
        headerSnippet.includes('xmlns="http://www.w3.org/2000/svg"')
    ) {
        return {
            isValid: false,
            error: 'SVG image format is not supported for security reasons.',
        };
    }

    // 2. Check for HTML / PHP / Script / Executable payloads
    if (
        headerSnippet.includes('<html') ||
        headerSnippet.includes('<!doctype html') ||
        headerSnippet.includes('<script') ||
        headerSnippet.includes('<?php')
    ) {
        return {
            isValid: false,
            error: 'Uploaded file contains invalid script or HTML content.',
        };
    }

    // Check for Windows executable (MZ header)
    if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
        return {
            isValid: false,
            error: 'Executable files are not allowed.',
        };
    }

    // Check for Linux ELF executable (\x7fELF)
    if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
        return {
            isValid: false,
            error: 'Executable files are not allowed.',
        };
    }

    // 3. Check for GIF (starts with GIF87a or GIF89a - explicitly rejected in Phase 1)
    if (
        buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38 &&
        (buffer[4] === 0x37 || buffer[4] === 0x39) &&
        buffer[5] === 0x61
    ) {
        return {
            isValid: false,
            error: 'GIF image format is not supported. Allowed formats: JPEG, PNG, WebP.',
        };
    }

    // 4. Check for JPEG (starts with 0xFF, 0xD8, 0xFF)
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return {
            isValid: true,
            format: 'jpeg',
        };
    }

    // 5. Check for PNG (starts with 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
    if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
    ) {
        return {
            isValid: true,
            format: 'png',
        };
    }

    // 6. Check for WebP:
    // Offset 0..3 = 'RIFF' (0x52, 0x49, 0x46, 0x46)
    // Offset 8..11 = 'WEBP' (0x57, 0x45, 0x42, 0x50)
    if (
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
    ) {
        return {
            isValid: true,
            format: 'webp',
        };
    }

    return {
        isValid: false,
        error: 'Unsupported image format. Allowed formats: JPEG, PNG, WebP.',
    };
}
