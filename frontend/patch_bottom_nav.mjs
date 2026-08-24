import fs from 'fs';

const enPath = 'src/i18n/locales/en.json';
const amPath = 'src/i18n/locales/am.json';
const enStr = fs.readFileSync(enPath, 'utf8');
const amStr = fs.readFileSync(amPath, 'utf8');

const en = JSON.parse(enStr);
const am = JSON.parse(amStr);

let enChanged = false;
let amChanged = false;

if (!en.nav.home) { en.nav.home = "Home"; enChanged = true; }
if (!en.nav.more) { en.nav.more = "More"; enChanged = true; }

if (!am.nav.home) { am.nav.home = "መነሻ"; amChanged = true; }
if (!am.nav.more) { am.nav.more = "ተጨማሪ"; amChanged = true; }

if (enChanged) fs.writeFileSync(enPath, JSON.stringify(en, null, 4));
if (amChanged) fs.writeFileSync(amPath, JSON.stringify(am, null, 4));

console.log("Keys existed EN:", !enChanged, "AM:", !amChanged);
