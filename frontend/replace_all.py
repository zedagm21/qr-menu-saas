import os

# Fix MenuItemsPage
with open('src/pages/dashboard/MenuItemsPage.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('>Add First Item<', '>{t(\'menu_items.add_first_item\')}<')
c = c.replace('Category <span', '{t(\'menu_items.category_label\')} <span')
c = c.replace('> Change Photo<', '> {t(\'menu_items.change_photo\')}<')
c = c.replace('Drop food image here or click to browse', '{t(\'menu_items.drop_food_image\')}')
c = c.replace('> Featured<', '> {t(\'menu_items.featured\')}<')
c = c.replace('Price <span', '{t(\'menu_items.price\')} <span')
c = c.replace('> Remove<', '> {t(\'menu_items.remove\')}<')
c = c.replace('> Spicy<', '> {t(\'menu_items.spicy\')}<')
c = c.replace('title="Delete Item"', 'title={t(\'menu_items.delete\')}')
c = c.replace('title="Edit Item"', 'title={t(\'menu_items.edit\')}')
c = c.replace("{catName || 'Uncategorized'}", "{catName || t('menu_items.uncategorized')}")
# there are also places like: 
# <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 dark:text-amber-400" /> Featured
c = c.replace('/> Featured', '/> {t(\'menu_items.featured\')}')
c = c.replace('/> Spicy', '/> {t(\'menu_items.spicy\')}')

with open('src/pages/dashboard/MenuItemsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# Fix QRPage
with open('src/pages/dashboard/QRPage.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace("'Copied to clipboard'", "t('qr.copied_to_clipboard')")
c = c.replace("'Check out our digital menu!'", "t('qr.share_text')")
c = c.replace("'Restaurant'}", "t('qr.restaurant')}")
c = c.replace("?? 'Restaurant'", "?? t('qr.restaurant')")
c = c.replace('>Generate QR Code<', '>{t(\'qr.generate_qr_code\')}<')
c = c.replace('Scan to view <span', '{t(\'qr.scan_to_view\')} <span')
c = c.replace('aria-label="Copy link"', 'aria-label={t(\'qr.copy_link\')}')
with open('src/pages/dashboard/QRPage.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# Fix PublicMenuPage
with open('src/pages/public/PublicMenuPage.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('>Clear search<', '>{t(\'design.clear_search\')}<')
c = c.replace('>Powered by QR Menu<', '>{t(\'design.powered_by\')}<')
c = c.replace("?? 'Addis Ababa, Ethiopia'", "")
with open('src/pages/public/PublicMenuPage.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("done")
