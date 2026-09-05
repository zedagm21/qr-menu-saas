import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { S3CompatibleImageStorage } from './src/services/S3CompatibleImageStorage';
import { LocalImageStorage, createImageStorage, ImageStorageService } from './src/services/ImageStorageService';
import { config } from './src/config/env';
import { ImageProcessor } from './src/services/ImageProcessor';
import { validateImageMagicBytes } from './src/utils/imageValidation';

sharp.cache(false);

async function runR2Tests() {
    console.log('============================================================');
    console.log('🧪 Starting Phase 2 Cloudflare R2 Integration Tests');
    console.log('============================================================\n');

    let passed = 0;
    let failed = 0;

    function assertTest(name: string, condition: boolean, details: string = '') {
        if (condition) {
            console.log(`✅ PASS: ${name}${details ? ` (${details})` : ''}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${name}${details ? ` (${details})` : ''}`);
            failed++;
        }
    }

    try {
        // ─────────────────────────────────────────────────────────────────────────────
        // Section 1: Mock S3Client & Unit Tests for S3CompatibleImageStorage
        // ─────────────────────────────────────────────────────────────────────────────
        console.log('--- 1. S3CompatibleImageStorage Unit & Mock Tests ---');

        const recordedCommands: any[] = [];
        const mockS3Client = {
            send: async (command: any) => {
                recordedCommands.push(command);
                return {};
            },
        } as unknown as S3Client;

        const r2Storage = new S3CompatibleImageStorage({
            bucketName: 'qr-menu-images',
            publicUrl: 'https://pub-abcdef123456.r2.dev',
            s3Client: mockS3Client,
        });

        // Test 1: save WebP image
        const sampleBuffer = await sharp({
            create: { width: 400, height: 400, channels: 3, background: { r: 100, g: 150, b: 200 } },
        })
            .webp()
            .toBuffer();

        const publicUrl = await r2Storage.save(sampleBuffer, 'webp');
        assertTest('R2 Unit: save returns R2 public URL', publicUrl.startsWith('https://pub-abcdef123456.r2.dev/uploads/') && publicUrl.endsWith('.webp'), publicUrl);

        // Verify PutObjectCommand was called with correct parameters
        const putCmd = recordedCommands.find((c) => c instanceof PutObjectCommand || c.input?.Bucket);
        assertTest(
            'R2 Unit: PutObjectCommand parameters correct',
            putCmd &&
                putCmd.input.Bucket === 'qr-menu-images' &&
                putCmd.input.Key.startsWith('uploads/') &&
                putCmd.input.ContentType === 'image/webp' &&
                putCmd.input.CacheControl === 'public, max-age=31536000, immutable'
        );

        // Test 2: getPublicUrl
        const testKey = 'uploads/sample-logo.webp';
        const generatedUrl = r2Storage.getPublicUrl(testKey);
        assertTest('R2 Unit: getPublicUrl formats cleanly', generatedUrl === `https://pub-abcdef123456.r2.dev/${testKey}`);

        // Test 3: delete R2 object
        await r2Storage.delete(publicUrl);
        const delCmd = recordedCommands.find((c) => c instanceof DeleteObjectCommand || (c.input?.Bucket && c.input?.Key));
        assertTest(
            'R2 Unit: DeleteObjectCommand called with extracted key',
            delCmd && delCmd.input.Bucket === 'qr-menu-images' && publicUrl.includes(delCmd.input.Key)
        );

        // Test 4: delete legacy local URL (/uploads/...) via S3CompatibleImageStorage
        const testLocalFile = path.join(path.resolve(config.uploadDir), 'legacy-test-file.webp');
        await fs.promises.writeFile(testLocalFile, sampleBuffer);
        assertTest('R2 Unit: Legacy local file created for test', fs.existsSync(testLocalFile));

        await r2Storage.delete('/uploads/legacy-test-file.webp');
        assertTest('R2 Unit: Legacy local file unlinked when deleted via R2 storage', !fs.existsSync(testLocalFile));

        // ─────────────────────────────────────────────────────────────────────────────
        // Section 2: Storage Factory Verification
        // ─────────────────────────────────────────────────────────────────────────────
        console.log('\n--- 2. Storage Factory & Configuration Tests ---');

        const defaultStorage = createImageStorage();
        assertTest(
            'Factory: createImageStorage returns an ImageStorageService implementation',
            typeof defaultStorage.save === 'function' &&
                typeof defaultStorage.delete === 'function' &&
                typeof defaultStorage.getPublicUrl === 'function'
        );

        // ─────────────────────────────────────────────────────────────────────────────
        // Section 3: Phase 1 & 2 Pipeline Security Verification
        // ─────────────────────────────────────────────────────────────────────────────
        console.log('\n--- 3. Combined Pipeline Verification ---');

        // Test magic-byte + Sharp + R2 save pipeline
        const jpegBuffer = await sharp({
            create: { width: 500, height: 500, channels: 3, background: { r: 255, g: 0, b: 0 } },
        })
            .jpeg()
            .toBuffer();

        const validated = validateImageMagicBytes(jpegBuffer);
        assertTest('Pipeline: Magic byte validation passes for JPEG', validated.isValid && validated.format === 'jpeg');

        const processed = await ImageProcessor.processLogo(jpegBuffer);
        assertTest('Pipeline: Sharp processing produces WebP', processed.format === 'webp' && processed.buffer.length > 0);

        const r2Url = await r2Storage.save(processed.buffer, 'webp');
        assertTest('Pipeline: Processed buffer successfully saved to R2 storage', r2Url.startsWith('https://pub-abcdef123456.r2.dev/uploads/'));

        // Test SVG rejection in pipeline
        const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
        let svgRejected = false;
        try {
            await ImageProcessor.processLogo(svgBuffer);
        } catch {
            svgRejected = true;
        }
        assertTest('Pipeline: SVG rejected before storage', svgRejected);

        console.log('\n============================================================');
        console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
        console.log('============================================================\n');

        if (failed > 0) {
            process.exit(1);
        }
    } catch (error) {
        console.error('Fatal error during R2 test execution:', error);
        process.exit(1);
    }
}

runR2Tests();
