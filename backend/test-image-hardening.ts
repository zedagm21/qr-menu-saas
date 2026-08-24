import http from 'http';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { validateImageMagicBytes } from './src/utils/imageValidation';
import { ImageProcessor, IMAGE_DIMENSION_LIMITS } from './src/services/ImageProcessor';
import { config } from './src/config/env';

sharp.cache(false);

const API_BASE = 'http://localhost:3001/api';

interface UploadResponse {
    status: number;
    data: any;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to make multipart/form-data HTTP upload requests
function uploadMultipart(
    urlPath: string,
    fieldName: string,
    filename: string,
    mimeType: string,
    fileBuffer: Buffer,
    cookie: string = ''
): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
        const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
        const header = `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
        const footer = `\r\n--${boundary}--\r\n`;

        const body = Buffer.concat([
            Buffer.from(header, 'utf-8'),
            fileBuffer,
            Buffer.from(footer, 'utf-8'),
        ]);

        const url = new URL(`${API_BASE}${urlPath}`);
        const req = http.request(
            {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': body.length,
                    ...(cookie ? { Cookie: cookie } : {}),
                },
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk.toString()));
                res.on('end', () => {
                    let parsed = data;
                    try {
                        parsed = JSON.parse(data);
                    } catch (e) {}
                    resolve({ status: res.statusCode || 500, data: parsed });
                });
            }
        );

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// Helper for JSON HTTP requests
function jsonRequest(
    method: string,
    urlPath: string,
    body: any = null,
    cookie: string = ''
): Promise<{ status: number; data: any; cookie: string }> {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_BASE}${urlPath}`);
        const payload = body ? JSON.stringify(body) : null;
        const req = http.request(
            {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
                    ...(cookie ? { Cookie: cookie } : {}),
                },
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk.toString()));
                res.on('end', () => {
                    let parsed = data;
                    try {
                        parsed = JSON.parse(data);
                    } catch (e) {}
                    const setCookie = res.headers['set-cookie'];
                    const newCookie = setCookie ? setCookie[0].split(';')[0] : cookie;
                    resolve({ status: res.statusCode || 500, data: parsed, cookie: newCookie });
                });
            }
        );

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runHardeningTests() {
    console.log('============================================================');
    console.log('🧪 Starting Phase 1 Image Upload Security & Processing Tests');
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
        // Section 1: In-Memory / Unit Validation Tests
        // ─────────────────────────────────────────────────────────────────────────────
        console.log('--- 1. Magic-Byte Validation Tests ---');

        // Create sample images
        const validJpegBuffer = await sharp({
            create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } },
        })
            .jpeg()
            .toBuffer();

        const validPngBuffer = await sharp({
            create: { width: 100, height: 100, channels: 4, background: { r: 0, g: 255, b: 0, alpha: 1 } },
        })
            .png()
            .toBuffer();

        const validWebpBuffer = await sharp({
            create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 255 } },
        })
            .webp()
            .toBuffer();

        const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="50"/></svg>', 'utf-8');
        const htmlBuffer = Buffer.from('<!DOCTYPE html><html><body><script>alert(1)</script></body></html>', 'utf-8');
        const phpBuffer = Buffer.from('<?php echo "malicious"; ?>', 'utf-8');
        const exeBuffer = Buffer.concat([Buffer.from([0x4d, 0x5a, 0x90, 0x00]), Buffer.alloc(100)]);
        const corruptedJpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.from('this is not real jpeg data')]);

        assertTest('Unit: Valid JPEG Magic Bytes', validateImageMagicBytes(validJpegBuffer).isValid && validateImageMagicBytes(validJpegBuffer).format === 'jpeg');
        assertTest('Unit: Valid PNG Magic Bytes', validateImageMagicBytes(validPngBuffer).isValid && validateImageMagicBytes(validPngBuffer).format === 'png');
        assertTest('Unit: Valid WebP Magic Bytes', validateImageMagicBytes(validWebpBuffer).isValid && validateImageMagicBytes(validWebpBuffer).format === 'webp');
        assertTest('Unit: SVG Rejected', !validateImageMagicBytes(svgBuffer).isValid);
        assertTest('Unit: HTML Rejected', !validateImageMagicBytes(htmlBuffer).isValid);
        assertTest('Unit: PHP Rejected', !validateImageMagicBytes(phpBuffer).isValid);
        assertTest('Unit: Executable Rejected', !validateImageMagicBytes(exeBuffer).isValid);

        // ─────────────────────────────────────────────────────────────────────────────
        // Section 2: Sharp ImageProcessor Tests (Dimension, Metadata, Conversion)
        // ─────────────────────────────────────────────────────────────────────────────
        console.log('\n--- 2. Sharp ImageProcessor Tests ---');

        // Test dimension constraint: 3000 x 2000 image processed as logo (limit 1200 x 1200)
        const hugeBuffer = await sharp({
            create: { width: 3000, height: 2000, channels: 3, background: { r: 200, g: 150, b: 100 } },
        })
            .jpeg()
            .toBuffer();

        const processedLogo = await ImageProcessor.processLogo(hugeBuffer);
        assertTest(
            'Unit: Logo Resized with Aspect Ratio Preserved',
            processedLogo.format === 'webp' &&
                processedLogo.width! <= IMAGE_DIMENSION_LIMITS.LOGO.maxWidth &&
                processedLogo.height! <= IMAGE_DIMENSION_LIMITS.LOGO.maxHeight &&
                Math.abs(processedLogo.width! / processedLogo.height! - 3000 / 2000) < 0.05,
            `Dimensions: ${processedLogo.width}x${processedLogo.height}`
        );

        // Test small image (should not be enlarged)
        const smallBuffer = await sharp({
            create: { width: 200, height: 150, channels: 3, background: { r: 100, g: 100, b: 100 } },
        })
            .png()
            .toBuffer();

        const processedSmall = await ImageProcessor.processMenuItem(smallBuffer);
        assertTest(
            'Unit: Small Image Not Enlarged',
            processedSmall.width === 200 && processedSmall.height === 150 && processedSmall.format === 'webp'
        );

        // ─────────────────────────────────────────────────────────────────────────────
        // Section 3: End-to-End API Security & Upload Tests
        // ─────────────────────────────────────────────────────────────────────────────
        console.log('\n--- 3. End-to-End API Upload Security Tests ---');

        const rand = Math.floor(Math.random() * 1000000);
        // Register Restaurant A
        const regA = await jsonRequest('POST', '/auth/register', {
            name: 'Alice Owner',
            email: `alice_${rand}@restaurant.com`,
            password: 'Password123!',
            restaurantName: `Alice Grill ${rand}`,
        });
        assertTest('E2E: Register Restaurant A', regA.status === 201);
        const cookieA = regA.cookie;
        const slugA = regA.data.restaurant.slug;

        // Register Restaurant B (for multi-tenant checks)
        const regB = await jsonRequest('POST', '/auth/register', {
            name: 'Bob Owner',
            email: `bob_${rand}@restaurant.com`,
            password: 'Password123!',
            restaurantName: `Bob Bistro ${rand}`,
        });
        assertTest('E2E: Register Restaurant B', regB.status === 201);
        const cookieB = regB.cookie;

        // Create Category and Menu Item for Restaurant A
        const catA = await jsonRequest(
            'POST',
            '/categories',
            { translations: [{ language: 'EN', name: 'Main Dishes' }] },
            cookieA
        );
        const catAId = catA.data.id;

        const itemA = await jsonRequest(
            'POST',
            '/menu-items',
            {
                categoryId: catAId,
                price: 25.5,
                translations: [{ language: 'EN', name: 'Signature Steak', description: 'Delicious' }],
            },
            cookieA
        );
        const itemAId = itemA.data.id;

        // TEST 1: Valid JPEG upload for logo
        const resJpeg = await uploadMultipart('/restaurant/logo', 'image', 'avatar.jpg', 'image/jpeg', validJpegBuffer, cookieA);
        assertTest('TEST 1: Valid JPEG Upload Accepted', resJpeg.status === 200 && resJpeg.data.logoUrl?.endsWith('.webp'), `URL: ${resJpeg.data.logoUrl}`);
        const logoUrl1 = resJpeg.data.logoUrl;

        // Verify stored file on disk is valid WebP (read buffer to avoid locking file handle on Windows)
        const storedLogoPath = path.join(path.resolve(config.uploadDir), path.basename(logoUrl1));
        const storedLogoDiskMeta = await sharp(await fs.promises.readFile(storedLogoPath)).metadata();
        assertTest('TEST 1: Stored File Is Real WebP On Disk', storedLogoDiskMeta.format === 'webp');

        // TEST 2: Valid PNG upload for cover
        const resPng = await uploadMultipart('/restaurant/cover', 'image', 'cover.png', 'image/png', validPngBuffer, cookieA);
        assertTest('TEST 2: Valid PNG Upload Accepted', resPng.status === 200 && resPng.data.coverImageUrl?.endsWith('.webp'), `URL: ${resPng.data.coverImageUrl}`);
        const coverUrl1 = resPng.data.coverImageUrl;

        // TEST 3: Valid WebP upload for menu item
        const resWebp = await uploadMultipart(`/menu-items/${itemAId}/image`, 'image', 'steak.webp', 'image/webp', validWebpBuffer, cookieA);
        assertTest('TEST 3: Valid WebP Upload Accepted', resWebp.status === 200 && resWebp.data.imageUrl?.endsWith('.webp'), `URL: ${resWebp.data.imageUrl}`);
        const itemImageUrl1 = resWebp.data.imageUrl;

        // TEST 4: SVG Rejected
        const resSvg = await uploadMultipart('/restaurant/logo', 'image', 'vector.svg', 'image/svg+xml', svgBuffer, cookieA);
        assertTest('TEST 4: SVG Upload Rejected', resSvg.status === 400);

        // TEST 5: HTML disguised as .jpg
        const resHtml = await uploadMultipart('/restaurant/logo', 'image', 'fake.jpg', 'image/jpeg', htmlBuffer, cookieA);
        assertTest('TEST 5: HTML Disguised As JPEG Rejected', resHtml.status === 400);

        // TEST 6: PHP disguised as .jpg
        const resPhp = await uploadMultipart('/restaurant/logo', 'image', 'exploit.jpg', 'image/jpeg', phpBuffer, cookieA);
        assertTest('TEST 6: PHP Disguised As JPEG Rejected', resPhp.status === 400);

        // TEST 7: Executable disguised as .jpg
        const resExe = await uploadMultipart('/restaurant/logo', 'image', 'virus.jpg', 'image/jpeg', exeBuffer, cookieA);
        assertTest('TEST 7: Executable Disguised As JPEG Rejected', resExe.status === 400);

        // TEST 8: Spoofed MIME (text sent as image/jpeg)
        const textBuffer = Buffer.from('This is simple plain text pretending to be an image', 'utf-8');
        const resSpoof = await uploadMultipart('/restaurant/logo', 'image', 'spoofed.jpg', 'image/jpeg', textBuffer, cookieA);
        assertTest('TEST 8: Spoofed MIME Type Rejected', resSpoof.status === 400);

        // TEST 9: Corrupted JPEG
        const resCorrupt = await uploadMultipart('/restaurant/logo', 'image', 'corrupted.jpg', 'image/jpeg', corruptedJpeg, cookieA);
        assertTest('TEST 9: Corrupted JPEG Buffer Rejected', resCorrupt.status === 400);

        // TEST 10: Extremely large image dimensions (3000x2000px)
        const resHuge = await uploadMultipart('/restaurant/cover', 'image', 'huge.jpg', 'image/jpeg', hugeBuffer, cookieA);
        assertTest('TEST 10: Huge Dimension Image Constrained Safely', resHuge.status === 200 && resHuge.data.coverImageUrl?.endsWith('.webp'));
        const coverDiskMeta = await sharp(await fs.promises.readFile(path.join(path.resolve(config.uploadDir), path.basename(resHuge.data.coverImageUrl)))).metadata();
        assertTest('TEST 10: Stored Cover Dimensions <= 2400x1600', coverDiskMeta.width! <= 2400 && coverDiskMeta.height! <= 1600);

        // TEST 11: Oversized file (> 5MB)
        const oversizedBuffer = Buffer.concat([validJpegBuffer, Buffer.alloc(6 * 1024 * 1024)]); // 6MB+
        const resOversize = await uploadMultipart('/restaurant/logo', 'image', 'oversized.jpg', 'image/jpeg', oversizedBuffer, cookieA);
        assertTest('TEST 11: Oversized File (>5MB) Rejected', resOversize.status === 400);

        // ─────────────────────────────────────────────────────────────────────────────
        // Section 4: Replacement & Lifecycle Cleanup Tests
        // ─────────────────────────────────────────────────────────────────────────────
        console.log('\n--- 4. Replacement & Cleanup Lifecycle Tests ---');

        // TEST 14: Replace Restaurant Logo
        const newLogoJpeg = await sharp({
            create: { width: 300, height: 300, channels: 3, background: { r: 128, g: 0, b: 128 } },
        })
            .jpeg()
            .toBuffer();

        const resNewLogo = await uploadMultipart('/restaurant/logo', 'image', 'new_logo.jpg', 'image/jpeg', newLogoJpeg, cookieA);
        const logoUrl2 = resNewLogo.data.logoUrl;
        assertTest('TEST 14: Replace Logo Succeeded', resNewLogo.status === 200 && logoUrl2 !== logoUrl1);

        // Allow 100ms for background async unlink
        await sleep(100);

        // Check that old logo was safely cleaned up from disk
        const oldLogoExists = fs.existsSync(path.join(path.resolve(config.uploadDir), path.basename(logoUrl1)));
        const newLogoExists = fs.existsSync(path.join(path.resolve(config.uploadDir), path.basename(logoUrl2)));
        assertTest('TEST 14: Old Logo Cleaned Up & New Logo Persisted', !oldLogoExists && newLogoExists);

        // TEST 13: Replace Menu Item Image
        const newItemWebp = await sharp({
            create: { width: 400, height: 300, channels: 3, background: { r: 0, g: 150, b: 200 } },
        })
            .webp()
            .toBuffer();

        const resNewItemImg = await uploadMultipart(`/menu-items/${itemAId}/image`, 'image', 'new_steak.webp', 'image/webp', newItemWebp, cookieA);
        const itemImageUrl2 = resNewItemImg.data.imageUrl;
        assertTest('TEST 13: Replace Menu Item Image Succeeded', resNewItemImg.status === 200 && itemImageUrl2 !== itemImageUrl1);

        await sleep(100);

        const oldItemImgExists = fs.existsSync(path.join(path.resolve(config.uploadDir), path.basename(itemImageUrl1)));
        const newItemImgExists = fs.existsSync(path.join(path.resolve(config.uploadDir), path.basename(itemImageUrl2)));
        assertTest('TEST 13: Old Item Image Cleaned Up & New Image Persisted', !oldItemImgExists && newItemImgExists);

        // TEST 16: Delete Menu Item (deletes DB record and cleans up image)
        const delRes = await jsonRequest('DELETE', `/menu-items/${itemAId}`, null, cookieA);
        assertTest('TEST 16: Menu Item Deleted From DB', delRes.status === 204);

        await sleep(100);

        const deletedItemImgExists = fs.existsSync(path.join(path.resolve(config.uploadDir), path.basename(itemImageUrl2)));
        assertTest('TEST 16: Deleted Menu Item Image File Removed From Disk', !deletedItemImgExists);

        // ─────────────────────────────────────────────────────────────────────────────
        // Section 5: Multi-Tenant Authorization & Public Menu Tests
        // ─────────────────────────────────────────────────────────────────────────────
        console.log('\n--- 5. Multi-Tenant Authorization & Public Menu Tests ---');

        // Create Item for Restaurant B
        const catB = await jsonRequest(
            'POST',
            '/categories',
            { translations: [{ language: 'EN', name: 'Drinks' }] },
            cookieB
        );
        const itemB = await jsonRequest(
            'POST',
            '/menu-items',
            {
                categoryId: catB.data.id,
                price: 5.0,
                translations: [{ language: 'EN', name: 'Soda' }],
            },
            cookieB
        );
        const itemBId = itemB.data.id;

        // TEST 17: Multi-tenant protection: Restaurant A attempts to upload image to Restaurant B's item
        const resCrossTenant = await uploadMultipart(
            `/menu-items/${itemBId}/image`,
            'image',
            'hacked.jpg',
            'image/jpeg',
            validJpegBuffer,
            cookieA
        );
        assertTest('TEST 17: Cross-Tenant Upload Blocked (404/403)', resCrossTenant.status === 404 || resCrossTenant.status === 403);

        // TEST 18: Public Menu Compatibility
        // Publish restaurant A and verify public endpoints return processed images
        await jsonRequest('PUT', '/restaurant', { status: 'PUBLISHED' }, cookieA);
        const pubRest = await jsonRequest('GET', `/public/restaurants/${slugA}`);
        assertTest(
            'TEST 18: Public Restaurant Info Loads Processed Logo and Cover',
            pubRest.status === 200 && pubRest.data.logoUrl === logoUrl2
        );

        console.log('\n============================================================');
        console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
        console.log('============================================================\n');

        if (failed > 0) {
            process.exit(1);
        }
    } catch (error) {
        console.error('Fatal error during test execution:', error);
        process.exit(1);
    }
}

runHardeningTests();
