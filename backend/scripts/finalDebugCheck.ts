import process from 'node:process';
import prisma from '../src/config/database';

async function main() {
    console.log('🔍 Executing Final Verification & Debug Suite...\n');
    const baseUrl = 'http://localhost:3001';

    // 1. Health Check
    console.log('1. Checking Server Health...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    if (!healthRes.ok) throw new Error(`Health check failed: ${healthRes.status}`);
    const healthData = await healthRes.json() as any;
    console.log(`✅ Health check passed: status = "${healthData.status}"`);

    // 2. Active Broadcast Banner Endpoint
    console.log('\n2. Checking Active Broadcast Endpoint...');
    const broadcastRes = await fetch(`${baseUrl}/api/broadcast/active`);
    if (!broadcastRes.ok) throw new Error(`Broadcast check failed: ${broadcastRes.status}`);
    const broadcastData = await broadcastRes.json() as any;
    console.log(`✅ Active Broadcast banner: "${broadcastData?.title || 'None'}" (active: ${broadcastData?.isActive})`);

    // 3. Super Admin Authentication
    console.log('\n3. Authenticating Super Admin...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bluenile.et', password: 'Demo1234!' }),
    });
    if (!loginRes.ok) throw new Error(`Admin login failed: ${loginRes.status}`);
    const loginData = await loginRes.json() as any;
    const token = loginData.token;
    console.log(`✅ Super Admin logged in: ${loginData.user.name} (Role: ${loginData.user.role})`);

    // 4. Super Admin Overview with Top Restaurants Leaderboard
    console.log('\n4. Checking Admin Overview & Top Restaurants Leaderboard...');
    const overviewRes = await fetch(`${baseUrl}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!overviewRes.ok) throw new Error(`Admin overview failed: ${overviewRes.status}`);
    const overviewData = await overviewRes.json() as any;
    console.log(`✅ Overview fetched: ${overviewData.restaurants.total} restaurants, ${overviewData.topRestaurants.length} in top leaderboard`);
    if (overviewData.topRestaurants.length > 0) {
        console.log(`   🏆 Leaderboard #1: ${overviewData.topRestaurants[0].name} (${overviewData.topRestaurants[0].scans} scans, Tier: ${overviewData.topRestaurants[0].tier})`);
    }

    // 5. Super Admin Restaurants with Tier Filter
    console.log('\n5. Checking Admin Restaurants with Tier Filter...');
    const proRestRes = await fetch(`${baseUrl}/api/admin/restaurants?tier=PRO`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!proRestRes.ok) throw new Error(`Admin restaurants list failed: ${proRestRes.status}`);
    const proRestData = await proRestRes.json() as any;
    console.log(`✅ Filtered PRO tier restaurants: ${proRestData.data.length} found`);

    // 6. Security Check: Unauthenticated access blocked
    console.log('\n6. Checking Security Route Guards...');
    const unauthAdmin = await fetch(`${baseUrl}/api/admin/overview`);
    if (unauthAdmin.status !== 401) throw new Error(`Expected 401 for unauthenticated admin access, got ${unauthAdmin.status}`);
    console.log('✅ Unauthenticated access to /api/admin/overview blocked (401)');

    const unauthAnalytics = await fetch(`${baseUrl}/api/restaurant/analytics`);
    if (unauthAnalytics.status !== 401) throw new Error(`Expected 401 for unauthenticated analytics, got ${unauthAnalytics.status}`);
    console.log('✅ Unauthenticated access to /api/restaurant/analytics blocked (401)');

    // 7. Restaurant Owner Analytics with Day-of-Week Dining Rhythm
    console.log('\n7. Checking Restaurant Analytics & Day-of-Week Distribution...');
    const analyticsRes = await fetch(`${baseUrl}/api/restaurant/analytics?range=7d`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!analyticsRes.ok) throw new Error(`Analytics fetch failed: ${analyticsRes.status}`);
    const analyticsData = await analyticsRes.json() as any;
    console.log(`✅ Analytics fetched: ${analyticsData.summary.totalScans} scans, Peak: ${analyticsData.summary.peakHour}`);
    if (!analyticsData.dayOfWeek || analyticsData.dayOfWeek.length !== 7) {
        throw new Error('dayOfWeek distribution is missing or incomplete in API response');
    }
    console.log(`✅ Day-of-Week Distribution (7 days):`, analyticsData.dayOfWeek.map((d: any) => `${d.day}:${d.count}`).join(' '));

    // 8. Privacy Check: Suspension withholding from diners
    console.log('\n8. Checking Suspension Privacy Enforcement...');
    const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@bluenile.et' },
        include: { restaurant: true },
    });
    const restId = adminUser!.restaurant!.id;
    const slug = adminUser!.restaurant!.slug;

    // Suspend
    await fetch(`${baseUrl}/api/admin/restaurants/${restId}/access`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuspended: true, suspensionReason: 'CONFIDENTIAL_ADMIN_INTERNAL_NOTE_12345' }),
    });

    // Check public menu
    const publicRes = await fetch(`${baseUrl}/api/public/restaurants/${slug}`);
    const publicData = await publicRes.json() as any;
    if (publicRes.status !== 403) throw new Error(`Expected 403 for suspended restaurant, got ${publicRes.status}`);
    if (JSON.stringify(publicData).includes('CONFIDENTIAL_ADMIN_INTERNAL_NOTE_12345')) {
        throw new Error('LEAK: Suspension reason was exposed in public response!');
    }
    console.log('✅ Suspension privacy verified: HTTP 403 returned, internal reason is strictly withheld from diners.');

    // Reactivate restaurant
    await fetch(`${baseUrl}/api/admin/restaurants/${restId}/access`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuspended: false, suspensionReason: null }),
    });
    console.log('✅ Restaurant restored to active status.');

    console.log('\n🎯 ALL FINAL DEBUG TESTS PASSED WITH 100% INTEGRITY! 🌟\n');
}

main()
    .catch((err) => {
        console.error('❌ Debug verification failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
