import fs from 'fs';

const enPath = 'src/i18n/locales/en.json';
const amPath = 'src/i18n/locales/am.json';

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const amData = JSON.parse(fs.readFileSync(amPath, 'utf8'));

// Apply missing updates
enData.nav.menuQr = "Menu QR";
amData.nav.menuQr = "QR የምግብ ዝርዝር";

enData.restaurant.change_image = "Change image";
amData.restaurant.change_image = "ምስል ቀይር";

enData.categories.hidden = "Hidden";
amData.categories.hidden = "የተደበቀ";

enData.menu_items.uncategorized = "Uncategorized";
amData.menu_items.uncategorized = "ያልተመደበ";

enData.menu_items.category_label = "Category";
amData.menu_items.category_label = "የምግብ ክፍል";

enData.qr.copy_link = "Copy link";
amData.qr.copy_link = "ሊንኩን ቅዱ";

enData.qr.copied_to_clipboard = "Copied to clipboard";
amData.qr.copied_to_clipboard = "ተቀድቷል";

enData.restaurant.ethiopia = "Ethiopia";
amData.restaurant.ethiopia = "ኢትዮጵያ";

enData.settings.no_name_set = "No name set";
amData.settings.no_name_set = "ስም አልተሰጠም";

fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));
fs.writeFileSync(amPath, JSON.stringify(amData, null, 4));
console.log("Updated locales!");
