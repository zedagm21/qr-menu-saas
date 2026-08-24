import json
import os

EN_PATH = "src/i18n/locales/en.json"
AM_PATH = "src/i18n/locales/am.json"
def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

en = load_json(EN_PATH)
am = load_json(AM_PATH)

en["settings"].update({
    "account_profile": "Account Profile",
    "account_desc": "Your personal account information",
    "full_name": "Full Name",
    "appearance": "Appearance",
    "appearance_desc": "Customize how your dashboard looks",
    "language": "Language",
    "language_desc": "Choose your dashboard language",
    "security": "Security",
    "security_desc": "Update your account password",
    "current_password": "Current Password",
    "new_password": "New Password",
    "confirm_new_password": "Confirm New Password",
    "contact_support_delete": "To delete your account, please contact our support team."
})

am["settings"].update({
    "account_profile": "የምግብ ቤት መረጃ", # Account Profile
    "account_desc": "የግል መረጃዎ",
    "full_name": "ሙሉ ስም",
    "appearance": "ገጽታ",
    "appearance_desc": "የማስተዳደሪያዎን ገጽታ ያስተካክሉ",
    "language": "ቋንቋ",
    "language_desc": "የማስተዳደሪያውን ቋንቋ ይምረጡ",
    "security": "ደህንነት",
    "security_desc": "የምስጢር ቁጥርዎን ያዘምኑ",
    "current_password": "የአሁኑ ምስጢር ቁጥር",
    "new_password": "አዲስ ምስጢር ቁጥር",
    "confirm_new_password": "አዲሱን ምስጢር ቁጥር ያረጋግጡ",
    "contact_support_delete": "መለያዎን ለማጥፋት እባክዎ የድጋፍ ቡድናችንን ያነጋግሩ።"
})

en["restaurant"].update({
    "change_image": "Change Image",
    "drop_to_upload": "Drop to upload",
    "to_upload": "to upload",
    "ph_name": "e.g. Blue Nile Restaurant",
    "ph_phone": "+251 911 123 456",
    "ph_email": "hello@restaurant.com",
    "ph_address": "e.g. Bole Road, near Edna Mall",
    "ph_city": "e.g. Addis Ababa",
    "ph_country": "e.g. Ethiopia",
    "ph_desc": "Describe your restaurant — cuisine type, ambiance, specialties…"
})

am["restaurant"].update({
    "change_image": "ምስል ቀይር",
    "drop_to_upload": "እዚህ ያስገቡ",
    "to_upload": "ወይም ይምረጡ",
    "ph_name": "ለምሳሌ፦ ብሉ ናይል ምግብ ቤት",
    "ph_phone": "+251 911 123 456",
    "ph_email": "hello@restaurant.com",
    "ph_address": "ለምሳሌ፦ ቦሌ መንገድ",
    "ph_city": "ለምሳሌ፦ አዲስ አበባ",
    "ph_country": "ለምሳሌ፦ ኢትዮጵያ",
    "ph_desc": "ስለ ምግብ ቤትዎ አጭር መግለጫ..."
})

en["qr"].update({
    "generate_title": "Generate your QR code",
    "download_png": "Download PNG",
    "share": "Share"
})

am["qr"].update({
    "generate_title": "የእርስዎ QR ኮድ",
    "download_png": "PNG አውርድ",
    "share": "አጋራ"
})

en["menu_items"].update({
    "food_photo": "Food Photo",
    "items_count": "items",
    "active_count": "active",
    "tags_count": "tags",
    "all_items": "All Items",
    "search_ph": "Search food by name, description, or ingredients…"
})

am["menu_items"].update({
    "food_photo": "የምግብ ምስል",
    "items_count": "ምግቦች",
    "active_count": "ይገኛሉ",
    "tags_count": "ክፍሎች",
    "all_items": "ሁሉም ምግቦች",
    "search_ph": "ምግብ በስም ወይም በመግለጫ ፈልግ..."
})

en["categories"].update({
    "visibility": "Visibility",
    "organize_desc": "Organize your menu into sections",
    "ph_en_name": "e.g. Starters",
    "ph_en_desc": "Optional description",
    "ph_am_name": "ለምሳሌ: ቀዳሚ ምናሌዎች",
    "ph_am_desc": "አማካሪ መግለጫ (አማርኛ)"
})

am["categories"].update({
    "visibility": "ለደንበኛ ይታይ?",
    "organize_desc": "የምግብ ዝርዝርዎን በክፍል ያደራጁ",
    "ph_en_name": "e.g. Starters",
    "ph_en_desc": "Optional description",
    "ph_am_name": "ለምሳሌ፦ የጾም ምግቦች",
    "ph_am_desc": "የክፍሉ መግለጫ"
})

en["public"].update({
    "menu_not_found": "Menu not found",
    "menu_label": "MENU",
    "no_items_found": "No items found",
    "ingredients": "Ingredients",
    "allergens": "Allergens"
})

am["public"] = am.get("public", {})
am["public"].update({
    "menu_not_found": "የምግብ ዝርዝር አልተገኘም",
    "menu_label": "የምግብ ዝርዝር",
    "no_items_found": "ምንም ምግብ አልተገኘም",
    "ingredients": "ግብዓቶች",
    "allergens": "አለርጂዎች"
})

save_json(EN_PATH, en)
save_json(AM_PATH, am)
print("Locales fully updated with QA pass keys.")
