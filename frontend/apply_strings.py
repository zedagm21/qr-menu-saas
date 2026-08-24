import sys

def replace_in_file(path, replacements):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    for old, new in replacements.items():
        content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

replace_in_file("src/pages/dashboard/MenuItemsPage.tsx", {
    ">Catalog Management<": ">{t('menu_items.catalog_management')}<",
    ">Food & Drinks<": ">{t('menu_items.food_and_drinks')}<",
    ">Add Food Item<": ">{t('menu_items.add_food_item')}<",
    ">Add First Item<": ">{t('menu_items.add_first_item')}<",
    ">Pricing & Category<": ">{t('menu_items.pricing_category')}<",
    ">Dietary & Extra Info<": ">{t('menu_items.dietary_extra')}<",
    ">Attributes & Badges<": ">{t('menu_items.attributes_badges')}<",
    ">Drop food image here or click to browse<": ">{t('menu_items.drop_food_image')}<",
    ">Change Photo<": ">{t('menu_items.change_photo')}<",
    ">Remove<": ">{t('menu_items.remove')}<",
    ">Spicy<": ">{t('menu_items.spicy')}<",
    ">Featured<": ">{t('menu_items.featured')}<",
    "getTranslation(c.translations, 'EN')": "getTranslation(c.translations, i18n.language)",
    "getTranslation(cats.find(c => c.id === item.categoryId)?.translations ?? [], 'EN')": "getTranslation(cats.find(c => c.id === item.categoryId)?.translations ?? [], i18n.language)",
    "getTranslation(item.translations, 'EN')": "getTranslation(item.translations, i18n.language)",
    "getTranslation(i.translations, 'EN').toLowerCase()": "getTranslation(i.translations, i18n.language).toLowerCase()",
    "getTranslation(i.translations, 'EN', 'description')": "getTranslation(i.translations, i18n.language, 'description')",
    "getTranslation(i.translations, 'EN', 'ingredients')": "getTranslation(i.translations, i18n.language, 'ingredients')"
})

replace_in_file("src/pages/dashboard/CategoriesPage.tsx", {
    "getTranslation(cat.translations, 'EN')": "getTranslation(cat.translations, i18n.language)",
    "{getTranslation(cat.translations, 'AM') && (": "",
    "<span className=\"text-[15px] font-medium text-neutral-500 dark:text-[#A3A3A3] font-ethiopic line-clamp-1\">": "<!--",
    "{getTranslation(cat.translations, 'AM')}": "",
    "</span>": "</span>" # Simplification logic below
})

# Needs careful CategoriesPage list replacement because it explicitly shows both AM and EN.
with open("src/pages/dashboard/CategoriesPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import re
# Replace the category list render logic showing both languages to just show the current language:
content = re.sub(
    r'<span className="text-\[16px\].*?>[\s\S]*?\{getTranslation\(cat\.translations, i18n\.language\)\}[\s\S]*?</span>[\s\S]*?\{/\* Amharic Name \*/\}[\s\S]*?\{getTranslation\(cat\.translations, \'AM\'\).*?\}',
    r'<span className="text-[16px] font-bold text-neutral-900 dark:text-[#F5F5F5]">{getTranslation(cat.translations, i18n.language)}</span>',
    content
)
# Make sure to remove the conditional AM line if it lingers
content = re.sub(r'\{getTranslation\(cat\.translations, \'AM\'\) && \([\s\S]*?</span>\s*\)\}', '', content)

with open("src/pages/dashboard/CategoriesPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)


replace_in_file("src/pages/dashboard/QRPage.tsx", {
    ">Connect & Share<": ">{t('qr.connect_share')}<",
    ">Regenerate<": ">{t('qr.regenerate')}<",
    ">Scan to view<": ">{t('qr.scan_view')}<",
    ">Open Menu<": ">{t('qr.open_menu')}<"
})

replace_in_file("src/pages/dashboard/OverviewPage.tsx", {
    ">Items by Category<": ">{t('overview.items_by_category')}<",
    ">View Live Menu<": ">{t('overview.view_live_menu')}<"
})

replace_in_file("src/pages/dashboard/RestaurantPage.tsx", {
    ">Brand Identity<": ">{t('restaurant.brand_identity')}<",
    ">Upload a logo and cover image to personalize your menu.<": ">{t('restaurant.brand_identity_desc')}<",
    ">Business Profile<": ">{t('restaurant.business_profile')}<",
    ">Contact information and location details.<": ">{t('restaurant.business_profile_desc')}<",
    ">Operational Settings<": ">{t('restaurant.operational_settings')}<",
    ">Configure language, currency, and menu visibility.<": ">{t('restaurant.operational_settings_desc')}<",
    ">Click or drag & drop<": ">{t('restaurant.click_drag_drop')}<"
})

replace_in_file("src/pages/dashboard/SettingsPage.tsx", {
    ">Delete Account<": ">{t('settings.delete_account')}<",
    ">Update Password<": ">{t('settings.update_password')}<"
})

replace_in_file("src/pages/public/PublicMenuPage.tsx", {
    ">Clear search<": ">{t('design.clear_search')}<",
    ">Powered by QR Menu<": ">{t('design.powered_by')}<"
})

replace_in_file("src/components/layout/Sidebar.tsx", {
    ">MenuQR<": ">{t('nav.menuQr', { defaultValue: 'MenuQR' })}<" # Edge case fallback
})

print("Frontend string implementations done!")
