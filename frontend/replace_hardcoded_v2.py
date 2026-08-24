import json
import os
import re

# UPDATE JSON LOCALES
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

en["menu_items"].update({
    "add_first_item": "Add First Item",
    "add_food_item": "Add Food Item",
    "attributes_badges": "Attributes & Badges",
    "catalog_management": "Catalog Management",
    "category": "Category",
    "change_photo": "Change Photo",
    "dietary_extra": "Dietary & Extra Info",
    "drop_food_image": "Drop food image here or click to browse",
    "featured": "Featured",
    "food_and_drinks": "Food & Drinks",
    "price": "Price",
    "pricing_category": "Pricing & Category",
    "remove": "Remove",
    "spicy": "Spicy"
})
am["menu_items"].update({
    "add_first_item": "የመጀመሪያ ምግብዎን ጨምር",
    "add_food_item": "ምግብ / መጠጥ ጨምር",
    "attributes_badges": "ተጨማሪ መግለጫዎች",
    "catalog_management": "የምግብ አስተዳደር",
    "category": "የምግብ ክፍል",
    "change_photo": "ምስል ቀይር",
    "dietary_extra": "ዝርዝር መግለጫዎች",
    "drop_food_image": "ምስል እዚህ ያስገቡ ወይም ይምረጡ",
    "featured": "ተመራጭ",
    "food_and_drinks": "ምግብ እና መጠጥ",
    "price": "ዋጋ",
    "pricing_category": "ዋጋ እና ክፍል",
    "remove": "አጥፋ",
    "spicy": "የሚያቃጥል"
})

en["qr"].update({
    "connect_share": "Connect & Share",
    "regenerate": "Regenerate",
    "scan_view": "Scan to view",
    "open_menu": "Open Menu"
})
am["qr"].update({
    "connect_share": "ያገናኙ እና ያጋሩ",
    "regenerate": "እንደገና ፍጠር",
    "scan_view": "ለማየት ስካን ያድርጉ",
    "open_menu": "የምግብ ዝርዝሩን ክፈት"
})

if "overview" not in en: en["overview"] = {}
if "overview" not in am: am["overview"] = {}

en["overview"].update({
    "items_by_category": "Items by Category",
    "view_live_menu": "View Live Menu"
})
am["overview"].update({
    "items_by_category": "የምግብ ብዛት በክፍል",
    "view_live_menu": "የቀጥታ የምግብ ዝርዝርን ይመልከቱ"
})

en["restaurant"].update({
    "click_drag_drop": "Click or drag & drop",
    "brand_identity": "Brand Identity",
    "brand_identity_desc": "Upload a logo and cover image to personalize your menu.",
    "business_profile": "Business Profile",
    "business_profile_desc": "Contact information and location details.",
    "operational_settings": "Operational Settings",
    "operational_settings_desc": "Configure language, currency, and menu visibility."
})
am["restaurant"].update({
    "click_drag_drop": "ይምረጡ ወይም ያስገቡ",
    "brand_identity": "የብራንድ መለያ",
    "brand_identity_desc": "የምግብ ቤቱን ሎጎ እና ዋና ምስል ያስገቡ።",
    "business_profile": "የንግድ መረጃ",
    "business_profile_desc": "የመገኛ መረጃ እና ስልክ አድራሻ።",
    "operational_settings": "የአሠራር ቅንብሮች",
    "operational_settings_desc": "ቋንቋ፣ ምንዛሪ እና እይታን ማስተካከል"
})

if "design" not in en:
    en["design"] = {}
if "design" not in am:
    am["design"] = {}

en["design"].update({
    "clear_search": "Clear search",
    "powered_by": "Powered by QR Menu"
})
am["design"].update({
    "clear_search": "ፍለጋን ያጽዱ",
    "powered_by": "በ QR Menu የተሰራ"
})

en["settings"].update({"delete_account": "Delete Account", "update_password": "Update Password"})
am["settings"].update({"delete_account": "መለያ ሰርዝ", "update_password": "ምስጢር ቁጥር አዘምን"})

save_json(EN_PATH, en)
save_json(AM_PATH, am)
print("Locales Updated.")
