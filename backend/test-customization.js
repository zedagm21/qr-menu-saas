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
            headers: { 'Content-Type': 'application/json' },
        };
        if (cookie) options.headers['Cookie'] = cookie;

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (c) => { data += c.toString(); });
            res.on('end', () => {
                let parsed = data;
                try { parsed = JSON.parse(data); } catch (e) { }
                let newCookie = '';
                if (res.headers['set-cookie']) newCookie = res.headers['set-cookie'][0].split(';')[0];
                resolve({ status: res.statusCode, data: parsed, cookie: newCookie || cookie });
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    try {
        const r = Math.floor(Math.random() * 99999);
        const resA = await request('POST', '/auth/register', {
            name: 'Test Verify', email: `verify${r}@test.com`, password: 'Password123!', restaurantName: `Verify ${r}`
        });
        const cookie = resA.cookie;
        const slug = resA.data.restaurant.slug;

        await request('PUT', '/restaurant', { status: 'PUBLISHED' }, cookie);

        const themeRes = await request('PUT', '/restaurant/theme', {
            primaryColor: '#00FF00', accentColor: '#FF0000', menuStyle: 'CLASSIC', darkMode: 'AUTO', fontFamily: 'Playfair Display'
        }, cookie);

        if (themeRes.status !== 200) {
            console.error('Failed to update theme:', themeRes.data);
            process.exit(1);
        }

        const publicRes = await request('GET', `/public/restaurants/${slug}`);
        const theme = publicRes.data.theme;

        console.log("PUBLIC THEME DATA:");
        console.log(JSON.stringify(theme, null, 2));

        if (theme.primaryColor === '#00FF00' && theme.fontFamily === 'Playfair Display' && theme.darkMode === 'AUTO') {
            console.log("SUCCESS: Public Menu respects theme saving!");
            process.exit(0);
        } else {
            console.log("FAILURE: Theme mismatch!");
            process.exit(1);
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
