import sys
import glob

def replace_in_file(path, replacements):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

# SettingsPage
replace_in_file("src/pages/dashboard/SettingsPage.tsx", {
    '>Account Profile<': '>{t("settings.account_profile")}<',
    '>Your personal account information<': '>{t("settings.account_desc")}<',
    '>Full Name<': '>{t("settings.full_name")}<',
    '>Appearance<': '>{t("settings.appearance")}<',
    '>Customize how your dashboard looks<': '>{t("settings.appearance_desc")}<',
    '>Language<': '>{t("settings.language")}<',
    '>Choose your dashboard language<': '>{t("settings.language_desc")}<',
    '>Security<': '>{t("settings.security")}<',
    '>Update your account password<': '>{t("settings.security_desc")}<',
    '>Current Password<': '>{t("settings.current_password")}<',
    '>New Password<': '>{t("settings.new_password")}<',
    '>Confirm New Password<': '>{t("settings.confirm_new_password")}<',
    "'To delete your account, please contact our support team.'": "t('settings.contact_support_delete')"
})

# RestaurantPage
replace_in_file("src/pages/dashboard/RestaurantPage.tsx", {
    '>Change Image<': '>{t("restaurant.change_image")}<',
    '>Drop to upload<': '>{t("restaurant.drop_to_upload")}<',
    '>to upload<': '>{t("restaurant.to_upload")}<',
    '"e.g. Blue Nile Restaurant"': 't("restaurant.ph_name")',
    '"+251 911 123 456"': 't("restaurant.ph_phone")',
    '"hello@restaurant.com"': 't("restaurant.ph_email")',
    '"e.g. Bole Road, near Edna Mall"': 't("restaurant.ph_address")',
    '"e.g. Addis Ababa"': 't("restaurant.ph_city")',
    '"e.g. Ethiopia"': 't("restaurant.ph_country")',
    '"Describe your restaurant — cuisine type, ambiance, specialties…"': 't("restaurant.ph_desc")'
})

# QRPage
replace_in_file("src/pages/dashboard/QRPage.tsx", {
    '>Generate your QR code<': '>{t("qr.generate_title")}<',
    '>Download PNG<': '>{t("qr.download_png")}<',
    '>Share<': '>{t("qr.share")}<'
})

# MenuItemsPage
replace_in_file("src/pages/dashboard/MenuItemsPage.tsx", {
    '>Food Photo<': '>{t("menu_items.food_photo")}<',
    '> items<': '> {t("menu_items.items_count")}<',
    '> active<': '> {t("menu_items.active_count")}<',
    '> tags<': '> {t("menu_items.tags_count")}<',
    '>All Items<': '>{t("menu_items.all_items")}<',
    '"Search food by name, description, or ingredients…"': 't("menu_items.search_ph")'
})

# CategoriesPage
replace_in_file("src/pages/dashboard/CategoriesPage.tsx", {
    '>Visibility<': '>{t("categories.visibility")}<',
    '>Organize your menu into sections<': '>{t("categories.organize_desc")}<',
    '"e.g. Starters"': 't("categories.ph_en_name")',
    '"Optional description"': 't("categories.ph_en_desc")',
    '"ለምሳሌ: ቀዳሚ ምናሌዎች"': 't("categories.ph_am_name")',
    '"አማካሪ መግለጫ (አማርኛ)"': 't("categories.ph_am_desc")'
})

# PublicMenuPage
replace_in_file("src/pages/public/PublicMenuPage.tsx", {
    '>Menu not found<': '>{t("public.menu_not_found")}<',
    '>MENU<': '>{t("public.menu_label")}<',
    '>No items found<': '>{t("public.no_items_found")}<'
})

print("JSX strings replaced!")
