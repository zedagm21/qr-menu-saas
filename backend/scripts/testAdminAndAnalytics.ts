import prisma from '../src/config/database';
import { adminService } from '../src/services/AdminService';
import { analyticsService } from '../src/services/AnalyticsService';
import { publicMenuService } from '../src/services/PublicMenuService';
import { authService } from '../src/services/AuthService';

async function runTests() {
    console.log('🚀 Starting SaaS Super Admin & Analytics Integration Test Suite...\n');

    // 1. Setup & identify test restaurant and admin user
    const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@bluenile.et' },
        include: { restaurant: true },
    });

    if (!adminUser || !adminUser.restaurant) {
        throw new Error('Admin user or restaurant not found in database. Please run seed first.');
    }

    console.log(`✅ Step 1: Loaded Admin User: ${adminUser.name} (${adminUser.email}) with restaurant ${adminUser.restaurant.name}`);

    // 2. Test Admin Overview Metrics
    console.log('Testing Admin Overview Metrics...');
    const overview = await adminService.getOverviewMetrics();
    console.log(`✅ Step 2: Overview metrics fetched:`, {
        totalRestaurants: overview.restaurants.total,
        totalUsers: overview.users.total,
        totalItems: overview.catalog.totalItems,
        totalScans: overview.scans.total,
    });

    // 3. Test Diner Tracking on Public Menu
    console.log('\nTesting Diner QR Scan & Interaction Tracking...');
    const restaurantId = adminUser.restaurant.id;
    const slug = adminUser.restaurant.slug;

    // Simulate 3 scans (2 iOS, 1 Android)
    await analyticsService.recordScan(restaurantId, {
        tableNumber: 'Table 4',
        language: 'EN',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
        ip: '196.188.10.1',
    });

    await analyticsService.recordScan(restaurantId, {
        tableNumber: 'Table 7',
        language: 'AM',
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 Mobile Safari/537.36',
        ip: '196.188.10.2',
    });

    await analyticsService.recordScan(restaurantId, {
        tableNumber: 'Table 4',
        language: 'EN',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
        ip: '196.188.10.3',
    });

    // Simulate Menu Item Clicks
    const items = await prisma.menuItem.findMany({ where: { restaurantId }, take: 2 });
    if (items.length > 0) {
        await analyticsService.recordItemClick(restaurantId, items[0].id);
        await analyticsService.recordItemClick(restaurantId, items[0].id);
        if (items[1]) {
            await analyticsService.recordItemClick(restaurantId, items[1].id);
        }
    }

    // Simulate Search queries
    await analyticsService.recordSearchQuery(restaurantId, 'Tibs', 3);
    await analyticsService.recordSearchQuery(restaurantId, 'Tibs', 3);
    await analyticsService.recordSearchQuery(restaurantId, 'Kitfo', 2);
    await analyticsService.recordSearchQuery(restaurantId, 'Shiro', 1);

    // Simulate Profile & Social media link clicks
    await analyticsService.recordInteraction(restaurantId, 'PROFILE_VIEW');
    await analyticsService.recordInteraction(restaurantId, 'SOCIAL_CLICK', 'Instagram');
    await analyticsService.recordInteraction(restaurantId, 'SOCIAL_CLICK', 'Telegram');
    await analyticsService.recordInteraction(restaurantId, 'CALL_CLICK');
    await analyticsService.recordInteraction(restaurantId, 'DIRECTIONS_CLICK');

    console.log('✅ Step 3: Simulated diner scans, item views, searches, and social clicks successfully.');

    // 4. Verify Analytics Aggregation
    console.log('\nVerifying Analytics Service Output...');
    const analytics = await analyticsService.getRestaurantAnalytics(restaurantId, '7d');
    console.log('Summary metrics:', analytics.summary);
    console.log('Devices split:', analytics.devices);
    console.log('Languages split:', analytics.languages);
    console.log('Interactions:', analytics.interactions);
    console.log('Top Searches:', analytics.topSearches);
    console.log('Top Dishes:', analytics.topDishes.map(d => ({ name: d.name, clicks: d.clicks, sharePct: d.sharePct })));

    if (analytics.summary.totalScans < 3) {
        throw new Error(`Expected at least 3 scans, got ${analytics.summary.totalScans}`);
    }
    if (analytics.devices.ios < 1 || analytics.devices.android < 1) {
        throw new Error('Device OS split did not record iOS and Android correctly');
    }
    if (analytics.interactions.socialPlatforms['Instagram'] < 1) {
        throw new Error('Social click on Instagram was not aggregated');
    }

    // 5. Test CSV Generation
    console.log('\nTesting Analytics CSV Export...');
    const csv = await analyticsService.generateCsv(restaurantId, '7d');
    console.log('CSV preview (first 250 chars):\n', csv.slice(0, 250));
    if (!csv.includes('--- SUMMARY ---') || !csv.includes('--- TOP PERFORMING DISHES ---')) {
        throw new Error('CSV output format is missing required sections');
    }
    console.log('✅ Step 5: CSV generated and validated successfully.');

    // 6. Test Restaurant Suspension Access Control
    console.log('\nTesting Restaurant Suspension Access Control...');
    // Suspend restaurant
    await adminService.updateRestaurantAccess(
        restaurantId,
        {
            isSuspended: true,
            suspensionReason: 'Account suspended for scheduled compliance review',
        },
        adminUser.id
    );

    let suspensionBlockedPublicMenu = false;
    try {
        await publicMenuService.getRestaurantBySlug(slug, 'EN');
    } catch (err: any) {
        if (err.statusCode === 403 && err.data?.isSuspended === true) {
            suspensionBlockedPublicMenu = true;
            console.log(`✅ Step 6a: Public menu correctly blocked with 403 and reason: "${err.data.reason}"`);
        }
    }

    if (!suspensionBlockedPublicMenu) {
        throw new Error('Suspended restaurant was not blocked on public menu!');
    }

    // Re-activate restaurant
    await adminService.updateRestaurantAccess(
        restaurantId,
        {
            isSuspended: false,
            suspensionReason: null,
        },
        adminUser.id
    );

    const publicMenuAfter = (await publicMenuService.getRestaurantBySlug(slug, 'EN')) as any;
    if (publicMenuAfter.slug !== slug) {
        throw new Error('Failed to access public menu after reactivation');
    }
    console.log('✅ Step 6b: Public menu successfully accessible again after reactivation.');

    // 7. Test User Directory & "Who Registered When"
    console.log('\nTesting User Directory & Audit Log...');
    const usersList = await adminService.listUsers({ page: 1, limit: 10 });
    console.log(`Found ${usersList.data.length} users. Recent registration:`, {
        name: usersList.data[0].name,
        email: usersList.data[0].email,
        role: usersList.data[0].role,
        registeredAt: usersList.data[0].createdAt,
    });

    const auditLogs = await adminService.listAuditLogs({ page: 1, limit: 10 });
    console.log(`Found ${auditLogs.data.length} audit logs. Latest actions:`, auditLogs.data.slice(0, 3).map(a => a.action));

    console.log('\n🎉 ALL SaaS Super Admin & Analytics tests PASSED perfectly! 🚀\n');
}

runTests()
    .catch((err) => {
        console.error('❌ Test failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
