import sys

PATH = "src/pages/dashboard/OverviewPage.tsx"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "use{t('dashboard.total_categories')}": "useCategories",
    "{t('dashboard.total_categories')} card": "Categories card",
    "use{t('dashboard.total_items')}": "useMenuItems",
    "import { useMenuItems": "import { useMenuItems",
    "dashboard.steps.categories": "dashboard.steps.categories",
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed OverviewPage.")
