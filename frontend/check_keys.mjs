import fs from 'fs';
import path from 'path';

const filesToCheck = [
    'src/pages/dashboard/SettingsPage.tsx',
    'src/pages/dashboard/QRPage.tsx',
    'src/pages/dashboard/MenuItemsPage.tsx',
    'src/pages/dashboard/RestaurantPage.tsx',
    'src/pages/dashboard/OverviewPage.tsx',
    'src/pages/dashboard/CategoriesPage.tsx',
    'src/pages/dashboard/CustomizePage.tsx',
    'src/components/layout/Sidebar.tsx',
    'src/components/layout/BottomNav.tsx',
    'src/components/BottomNav.tsx', // fallback
];

let enRaw, amRaw;
try {
    enRaw = fs.readFileSync('src/i18n/locales/en.json', 'utf8');
    amRaw = fs.readFileSync('src/i18n/locales/am.json', 'utf8');
} catch (e) {
    console.error("Locales not found");
    process.exit(1);
}

const en = JSON.parse(enRaw);
const am = JSON.parse(amRaw);

function getNestedValue(obj, key) {
    return key.split('.').reduce((acc, part) => acc && acc[part], obj);
}

let missingEn = [];
let missingAm = [];

for (let file of filesToCheck) {
    if (!fs.existsSync(file)) {
        continue;
    }
    const content = fs.readFileSync(file, 'utf8');
    // Using regex to match `t('some.key'` or `t("some.key"`
    const regex = /t\(['"]([^'"]+)['"]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        if (!getNestedValue(en, key)) {
            missingEn.push(`${key} (in ${file})`);
        }
        if (!getNestedValue(am, key)) {
            missingAm.push(`${key} (in ${file})`);
        }
    }
}

console.log("Missing in EN:", missingEn);
console.log("Missing in AM:", missingAm);
