const baseUrl = 'http://localhost:3001/api/public/restaurants/habesha';
async function test() {
    try {
        const r1 = await fetch(baseUrl);
        console.log('GET /restaurants/habesha:', r1.status);
        console.log(await r1.text());

        const r2 = await fetch(baseUrl + '/menu');
        console.log('GET /restaurants/habesha/menu:', r2.status);
        console.log(await r2.text());
    } catch (e) { console.error(e); }
}
test();
