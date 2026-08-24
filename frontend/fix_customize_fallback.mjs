import fs from 'fs';

const enPath = 'src/i18n/locales/en.json';
const amPath = 'src/i18n/locales/am.json';
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const amData = JSON.parse(fs.readFileSync(amPath, 'utf8'));

enData.customize.prepared_fresh_daily = "Prepared fresh daily";
amData.customize.prepared_fresh_daily = "በየቀኑ ትኩስ ሆኖ የሚዘጋጅ";

fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));
fs.writeFileSync(amPath, JSON.stringify(amData, null, 4));

let q = fs.readFileSync('src/pages/dashboard/CustomizePage.tsx', 'utf8');
q = q.replace(/'Restaurant Name'/g, "t('auth.restaurantName')");
q = q.replace(/'Prepared fresh daily'/g, "t('customize.prepared_fresh_daily')");
fs.writeFileSync('src/pages/dashboard/CustomizePage.tsx', q);
console.log('done');
