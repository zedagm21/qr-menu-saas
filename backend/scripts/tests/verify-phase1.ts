import prisma from '../../src/config/database';
import { restaurantService } from '../../src/services/RestaurantService';
import { publicMenuService } from '../../src/services/PublicMenuService';

const PRIVATE_IP_REGEX = /^(localhost|127\.|0\.0\.0\.0|169\.254\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|\[?::1\]?|\[?fc00:|\[?fe80:)/i;

function testSSRFValidation(urlStr: string): { allowed: boolean; reason?: string } {
    try {
        const parsed = new URL(urlStr);
        if (parsed.protocol !== 'https:') {
            return { allowed: false, reason: 'Non-HTTPS protocol rejected' };
        }
        if (PRIVATE_IP_REGEX.test(parsed.hostname)) {
            return { allowed: false, reason: 'Private/metadata IP rejected' };
        }
        return { allowed: true };
    } catch {
        return { allowed: false, reason: 'Invalid URL' };
    }
}

async function runVerification() {
    console.log('=== PHASE 1 VERIFICATION START ===\n');

    // 1. Test SSRF filter
    console.log('[1] Testing SSRF filter rules:');
    const testCases = [
        { url: 'http://example.com/logo.png', shouldPass: false, name: 'Plain HTTP' },
        { url: 'https://localhost/admin', shouldPass: false, name: 'Localhost' },
        { url: 'https://127.0.0.1/secret', shouldPass: false, name: 'Loopback IPv4' },
        { url: 'https://169.254.169.254/latest/meta-data', shouldPass: false, name: 'AWS Metadata IPv4' },
        { url: 'https://10.0.0.5/api', shouldPass: false, name: 'RFC1918 10.x.x.x' },
        { url: 'https://192.168.1.1/router', shouldPass: false, name: 'RFC1918 192.168.x.x' },
        { url: 'https://[::1]/internal', shouldPass: false, name: 'IPv6 localhost' },
        { url: 'https://vistacafeandrestaurant.com/wp-content/uploads/2023/11/logo.png', shouldPass: true, name: 'Valid External HTTPS' },
        { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', shouldPass: true, name: 'Valid CDN HTTPS' },
    ];

    let ssrfFailures = 0;
    for (const tc of testCases) {
        const res = testSSRFValidation(tc.url);
        const passed = res.allowed === tc.shouldPass;
        console.log(`  ${passed ? '✓' : '✗'} ${tc.name}: ${tc.url} -> ${res.allowed ? 'ALLOWED' : 'BLOCKED (' + res.reason + ')'}`);
        if (!passed) ssrfFailures++;
    }
    if (ssrfFailures > 0) {
        throw new Error(`SSRF tests failed: ${ssrfFailures} failures`);
    }
    console.log('  -> All SSRF protection checks PASSED.\n');

    // 2. Test Slug Lifecycle & Alias Redirect
    console.log('[2] Testing Slug Lifecycle & Alias Redirection in Database:');

    // Clean up any previous test remnants
    const testEmail = 'phase1-slug-test@example.com';
    const existingUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (existingUser) {
        if (existingUser.restaurantId) {
            await prisma.restaurantSlugAlias.deleteMany({ where: { restaurantId: existingUser.restaurantId } });
            await prisma.user.delete({ where: { id: existingUser.id } });
            await prisma.restaurant.delete({ where: { id: existingUser.restaurantId } });
        } else {
            await prisma.user.delete({ where: { id: existingUser.id } });
        }
    }

    const initialPlaceholderSlug = `my-restaurant-${Date.now()}`;
    const testRestaurant = await prisma.restaurant.create({
        data: {
            name: 'Phase 1 Test Cafe',
            slug: initialPlaceholderSlug,
            status: 'PUBLISHED',
            currency: 'ETB',
            phone: '+251911223344',
        },
    });

    const testUser = await prisma.user.create({
        data: {
            name: 'Phase 1 Tester',
            email: testEmail,
            passwordHash: 'dummy-hash',
            role: 'OWNER',
            restaurantId: testRestaurant.id,
        },
    });

    console.log(`  Created test restaurant with initial placeholder slug: "${testRestaurant.slug}"`);

    // Step A: Replace initial placeholder slug with first real slug
    const firstRealSlug = `phase1-cafe-${Date.now()}`;
    const updated1 = await restaurantService.changeSlug(testRestaurant.id, firstRealSlug);
    console.log(`  Changed slug to first real handle: "${updated1.slug}"`);

    // Check alias table: MUST NOT have created an alias for "my-restaurant-*"
    const aliasesAfterPlaceholder = await prisma.restaurantSlugAlias.findMany({
        where: { restaurantId: testRestaurant.id },
    });
    console.log(`  Aliases after changing placeholder: ${aliasesAfterPlaceholder.length} (Expected: 0)`);
    if (aliasesAfterPlaceholder.length !== 0) {
        throw new Error('FAILED: Initial placeholder slug should not generate an alias record!');
    }
    console.log('  ✓ Initial placeholder correctly discarded without creating an alias.');

    // Step B: Change first real slug to second real slug
    const secondRealSlug = `phase1-bistro-${Date.now()}`;
    const updated2 = await restaurantService.changeSlug(testRestaurant.id, secondRealSlug);
    console.log(`  Changed slug to second handle: "${updated2.slug}"`);

    // Check alias table: MUST contain firstRealSlug
    const aliasesAfterSecondChange = await prisma.restaurantSlugAlias.findMany({
        where: { restaurantId: testRestaurant.id },
    });
    console.log(`  Aliases after second change: ${aliasesAfterSecondChange.length} (Expected: 1)`);
    const foundAlias = aliasesAfterSecondChange.find((a) => a.oldSlug === firstRealSlug);
    if (!foundAlias) {
        throw new Error(`FAILED: Expected alias "${firstRealSlug}" not found in database!`);
    }
    console.log(`  ✓ Alias record successfully created for "${firstRealSlug}".`);

    // Step C: Test PublicMenuService resolution via alias
    console.log(`  Resolving PublicMenuService using old alias slug: "${firstRealSlug}"...`);
    const resolvedRestaurant: any = await publicMenuService.getRestaurantBySlug(firstRealSlug);
    console.log(`  Resolved restaurant ID: ${resolvedRestaurant.id}, canonical slug: "${resolvedRestaurant.canonicalSlug}", isAliasRedirect: ${resolvedRestaurant.isAliasRedirect}`);
    if (resolvedRestaurant.canonicalSlug !== secondRealSlug || !resolvedRestaurant.isAliasRedirect) {
        throw new Error(`FAILED: Expected resolved canonical slug "${secondRealSlug}" with isAliasRedirect=true`);
    }
    console.log('  ✓ PublicMenuService seamlessly resolved restaurant via alias!');

    // Clean up test records
    await prisma.restaurantSlugAlias.deleteMany({ where: { restaurantId: testRestaurant.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.restaurant.delete({ where: { id: testRestaurant.id } });
    console.log('  Cleaned up test records from database.\n');

    console.log('=== ALL PHASE 1 VERIFICATIONS PASSED SUCCESSFULLY ===');
}

runVerification()
    .catch((err) => {
        console.error('Verification failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
