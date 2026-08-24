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

# ================= EN =================
en["toast"].update({
    "passwordUpdated": "Your password has been updated successfully.",
    "passwordError": "Unable to update password. Please check your current password and try again.",
    "passwordsNoMatch": "The new passwords you entered do not match. Please try again.",
    "qrCanvasError": "QR canvas not found"
})

en["actions"].update({
    "signOut": "Sign Out",
    "signOutDesc": "Are you sure you want to sign out of your account? You can always sign back in to access your dashboard.",
    "deleteCategoryDesc": "Are you sure you want to delete this category? This action cannot be undone.",
    "deleteItemDesc": "Are you sure you want to delete this menu item? This action cannot be undone."
})

en["dashboard"].update({
    "live_badge": "LIVE",
    "draft_badge": "DRAFT MODE",
    "live_desc": "Your digital menu is live. Customers can scan your QR code to view it.",
    "draft_desc": "Your menu is hidden. Complete setup and publish when ready.",
    "publish_now": "Publish Now",
    "active": "Active",
    "organized": "Organized",
    "menu_status_label": "Menu Status",
    "status_live": "Live",
    "accessible_desc": "Accessible to customers via QR code",
    "not_accessible_desc": "Not visible to customers yet",
    "quick_actions": "Quick Actions",
    "available": "available",
})

en["quick"] = {
    "add_item": "Add Item",
    "new_item_desc": "New menu item",
    "menu": "Menu",
    "manage_items": "Manage items",
    "categories": "Categories",
    "organize": "Organize",
    "qr_code": "QR Code",
    "download": "Download"
}

en["qr"].update({
    "print_tips_title": "Printing Tips",
    "print_tips_desc": "For best results, print at least 3x3 inches (7x7 cm) in high contrast."
})

# ================= AM =================
# Proposed Terminology Replacements
am["nav"]["menu"] = "ምግቦችና መጠጦች" # Instead of ምናሌ ዓይነቶች
am["nav"]["categories"] = "የምግብ ክፍሎች" 
am["nav"]["dashboard"] = "ማስተዳደሪያ"
am["nav"]["overview"] = "አጠቃላይ መረጃ"
am["nav"]["customize"] = "ገጽታ ማስተካከያ"
am["status"]["published"] = "ለደንበኛ ይታያል"
am["status"]["draft"] = "ለደንበኛ አይታይም"
am["dashboard"]["title"] = "ማስተዳደሪያ"
am["dashboard"]["overview"] = "አጠቃላይ መረጃ"
am["dashboard"]["total_items"] = "ምግቦችና መጠጦች"
am["dashboard"]["total_categories"] = "የምግብ ክፍሎች"
am["dashboard"]["status_published"] = "ለደንበኛ ይታያል"
am["dashboard"]["status_draft"] = "ለደንበኛ አይታይም"

# Add new keys to AM
am["toast"].update({
    "passwordUpdated": "የምስጢር ቁጥርዎ ተቀይሯል።",
    "passwordError": "የምስጢር ቁጥር መቀየር አልተቻለም። የአሁኑን ምስጢር ቁጥር ያረጋግጡ።",
    "passwordsNoMatch": "አዲሱ ምስጢር ቁጥር አይመሳሰልም። እንደገና ይሞክሩ።",
    "qrCanvasError": "QR ኮዱ አልተገኘም"
})

am["actions"].update({
    "signOut": "ውጣ",
    "signOutDesc": "ከማስተዳደሪያዎ መውጣት ይፈልጋሉ?",
    "deleteCategoryDesc": "ይህን የምግብ ክፍል ማጥፋት ይፈልጋሉ? ይህ ተግባር ሊመለስ አይችልም።",
    "deleteItemDesc": "ይህን ምግብ ማጥፋት ይፈልጋሉ? ይህ ተግባር ሊመለስ አይችልም።"
})

am["dashboard"].update({
    "live_badge": "ለደንበኛ ይታያል",
    "draft_badge": "ለደንበኛ አይታይም",
    "live_desc": "የምግብ ዝርዝርዎ ክፍት ነው። ደንበኞች በQR ኮድ ማየት ይችላሉ።",
    "draft_desc": "የምግብ ዝርዝርዎ ዝግ ነው። ዝግጅትዎን ሲጨርሱ ክፍት ያድርጉ።",
    "publish_now": "አሁን ክፍት አድርግ",
    "active": "ንቁ",
    "organized": "የተደራጀ",
    "menu_status_label": "ሁኔታ",
    "status_live": "ክፍት",
    "accessible_desc": "ደንበኞች በQR ኮድ ማየት ይችላሉ",
    "not_accessible_desc": "እስከ አሁን ለደንበኞች አይታይም",
    "quick_actions": "ፈጣን እርምጃዎች",
    "available": "ይገኛል",
})

am["quick"] = {
    "add_item": "ምግብ ጨምር",
    "new_item_desc": "አዲስ ምግብ ወይም መጠጥ",
    "menu": "ምግቦች",
    "manage_items": "ምግቦችን አስተዳድር",
    "categories": "ክፍሎች",
    "organize": "ያደራጁ",
    "qr_code": "QR ኮድ",
    "download": "አውርድ"
}

am["qr"].update({
    "print_tips_title": "የህትመት ምክሮች",
    "print_tips_desc": "ለጥራት ከ7x7 ሴ.ሜ በላይ አድርገው ማተም ይመከራል።"
})

am["categories"]["title"] = "የምግብ ክፍሎች"
am["categories"]["add"] = "ክፍል ጨምር"
am["categories"]["edit"] = "ክፍል ያዘምኑ"
am["categories"]["delete"] = "ክፍል ሰርዝ"
am["categories"]["delete_confirm"] = "ይህን የምግብ ክፍል ማጥፋት ይፈልጋሉ?"

am["menu_items"]["title"] = "ምግቦችና መጠጦች"
am["menu_items"]["add"] = "ምግብ/መጠጥ ጨምር"
am["menu_items"]["edit"] = "ያዘምኑ"
am["menu_items"]["delete"] = "ሰርዝ"
am["menu_items"]["delete_confirm"] = "ይህን ምግብ ማጥፋት ይፈልጋሉ?"
am["menu_items"]["empty_hint"] = "የምግብ ዝርዝርዎን ማዘጋጀት ይጀምሩ"

am["customize"]["title"] = "ገጽታ ማስተካከያ"

save_json(EN_PATH, en)
save_json(AM_PATH, am)
print("Updated loc files successfully.")
