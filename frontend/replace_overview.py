import sys

PATH = "src/pages/dashboard/OverviewPage.tsx"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "label: 'Add Item', sub: 'New menu item'": "labelKey: 'quick.add_item', subKey: 'quick.new_item_desc'",
    "label: 'Menu', sub: 'Manage items'": "labelKey: 'quick.menu', subKey: 'quick.manage_items'",
    "label: 'Categories', sub: 'Organize'": "labelKey: 'quick.categories', subKey: 'quick.organize'",
    "label: 'QR Code', sub: 'Download'": "labelKey: 'quick.qr_code', subKey: 'quick.download'",
    
    "{item.label}": "{t(item.labelKey)}",
    "{item.sub}": "{t(item.subKey)}",
    
    "LIVE": "{t('dashboard.live_badge')}",
    "DRAFT MODE": "{t('dashboard.draft_badge')}",
    
    "'Your digital menu is live. Customers can scan your QR code to view it.'": "t('dashboard.live_desc')",
    "'Your menu is hidden. Complete setup and publish when ready.'": "t('dashboard.draft_desc')",
    
    "View Menu": "{t('nav.viewMenu')}",
    "Publish Now": "{t('dashboard.publish_now')}",
    
    "Active": "{t('dashboard.active')}",
    "Menu Items": "{t('dashboard.total_items')}",
    "{itemsLoading ? '…' : animAvail} available": "{itemsLoading ? '…' : animAvail} {t('dashboard.available')}",
    
    "Organized": "{t('dashboard.organized')}",
    "Categories": "{t('dashboard.total_categories')}",
    
    "isPublished ? 'Published' : 'Draft'": "isPublished ? t('dashboard.status_published') : t('dashboard.status_draft')",
    "Menu Status": "{t('dashboard.menu_status_label')}",
    "isPublished ? 'Live' : 'Draft'": "isPublished ? t('dashboard.status_live') : t('status.draft')",
    
    "'Accessible to customers via QR code'": "t('dashboard.accessible_desc')",
    "'Not visible to customers yet'": "t('dashboard.not_accessible_desc')",
    
    "Quick Actions": "{t('dashboard.quick_actions')}",
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated OverviewPage.")
