const http = require('http');

const API_URL = 'http://localhost:3001/api';

async function request(method, path, body, cookie = '') {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_URL}${path}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (cookie) {
            options.headers['Cookie'] = cookie;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk.toString();
            });
            res.on('end', () => {
                let parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch (e) { }

                let newCookie = '';
                const setCookieHeader = res.headers['set-cookie'];
                if (setCookieHeader) {
                    newCookie = setCookieHeader[0].split(';')[0];
                }

                resolve({
                    status: res.statusCode,
                    data: parsed,
                    cookie: newCookie || cookie,
                });
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    }

    try {
        console.log('--- Phase 3, 4, 5, 6 Verification ---');

        const r = Math.floor(Math.random() * 100000);

        // 1. Register User A
        const resA = await request('POST', '/auth/register', {
            name: 'User A', email: `usera${r}@test.com`, password: 'Password123!', restaurantName: `Rest A ${r}`
        });
        assert(resA.status === 201, 'User A registered successfully');
        const cookieA = resA.cookie;

        // 2. Register User B
        const resB = await request('POST', '/auth/register', {
            name: 'User B', email: `userb${r}@test.com`, password: 'Password123!', restaurantName: `Rest B ${r}`
        });
        const cookieB = resB.cookie;

        // 3. CRUD: Category & Menu Item
        const catARes = await request('POST', '/categories', {
            translations: [{ language: 'EN', name: 'Cat A', description: '' }]
        }, cookieA);
        const catAId = catARes.data.id;
        assert(catARes.status === 201, 'Category created');

        const itemRes = await request('POST', '/menu-items', {
            categoryId: catAId, price: 15.00, translations: [{ language: 'EN', name: 'Item A', description: '' }]
        }, cookieA);
        const itemId = itemRes.data.id;
        assert(itemRes.status === 201, 'Menu Item created');

        // Verify unavailable item
        await request('PUT', `/menu-items/${itemId}`, { isAvailable: false }, cookieA);

        // Publish the restaurant!
        await request('PUT', '/restaurant', { status: 'PUBLISHED' }, cookieA);

        // 4. Public Menu Check
        const publicRes = await request('GET', `/public/restaurants/${resA.data.restaurant.slug}`, null);
        if (publicRes.status !== 200) console.log('publicRes:', publicRes.data);
        assert(publicRes.status === 200, 'Public restaurant details retrieved');

        const publicMenuRes = await request('GET', `/public/restaurants/${resA.data.restaurant.slug}/menu?lang=EN`, null);
        if (publicMenuRes.status !== 200) console.log('publicMenuRes:', publicMenuRes.data);
        assert(publicMenuRes.status === 200, 'Public menu retrieved');
        const pubCat = publicMenuRes.data.find(c => c.id === catAId);
        assert(pubCat && pubCat.menuItems[0].isAvailable === false, 'Menu item shows as unavailable');

        // 5. Customization
        const themeRes = await request('PUT', '/restaurant/theme', {
            primaryColor: '#000000', menuStyle: 'MINIMAL', darkMode: 'DARK'
        }, cookieA);
        assert(themeRes.status === 200 && themeRes.data.menuStyle === 'MINIMAL', 'Restaurant theme updated correctly');

        // 6. QR Code
        const qrRes = await request('POST', '/qr', {}, cookieA);
        assert(qrRes.status === 200 && qrRes.data.targetUrl.includes(resA.data.restaurant.slug), 'QR Code generated with correct URL');

        console.log(`\nTests complete. ${passed} Passed, ${failed} Failed.`);
    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

runTests();
