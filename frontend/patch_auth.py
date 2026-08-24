import json

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

en["auth"].update({
    "ph_email": "you@restaurant.com",
    "ph_password": "••••••••",
    "ph_min_8": "Min. 8 characters"
})
am["auth"].update({
    "ph_email": "you@restaurant.com",
    "ph_password": "••••••••",
    "ph_min_8": "ቢያንስ 8 ፊደላት"
})
save_json(EN_PATH, en)
save_json(AM_PATH, am)

def replace_in_file(path, replacements):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    for old, new in replacements.items():
        content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

replace_in_file("src/pages/auth/LoginPage.tsx", {
    '"you@restaurant.com"': 't("auth.ph_email")',
    '"••••••••"': 't("auth.ph_password")'
})
replace_in_file("src/pages/auth/RegisterPage.tsx", {
    '"Min. 8 characters"': 't("auth.ph_min_8")'
})

print("Auth pages updated")
