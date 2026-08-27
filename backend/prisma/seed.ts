import { PrismaClient, Language, MenuStyle, ThemeMode, MenuStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Clean up any existing seed data
    await prisma.qRCode.deleteMany({});
    await prisma.menuItemTranslation.deleteMany({});
    await prisma.menuItem.deleteMany({});
    await prisma.categoryTranslation.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.restaurantTranslation.deleteMany({});
    await prisma.restaurantTheme.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.restaurant.deleteMany({});

    // ─── Restaurant ─────────────────────────────────────────────────────────────
    const restaurant = await prisma.restaurant.create({
        data: {
            name: 'Blue Nile Restaurant',
            slug: 'blue-nile-restaurant',
            description: 'Traditional Ethiopian cuisine and international dishes prepared with the finest ingredients in the heart of Addis Ababa.',
            phone: '+251-11-123-4567',
            email: 'info@bluenile.et',
            address: 'Bole Road, near Edna Mall',
            city: 'Addis Ababa',
            country: 'Ethiopia',
            defaultLanguage: Language.EN,
            currency: 'ETB',
            status: MenuStatus.PUBLISHED,
            translations: {
                create: [
                    {
                        language: Language.EN,
                        name: 'Blue Nile Restaurant',
                        description: 'Traditional Ethiopian cuisine and international dishes prepared with the finest ingredients in the heart of Addis Ababa.',
                        address: 'Bole Road, near Edna Mall',
                        city: 'Addis Ababa',
                    },
                    {
                        language: Language.AM,
                        name: 'ብሉ ናይል ምግብ ቤት',
                        description: 'ባህላዊ የኢትዮጵያ ምግቦች እና አለም አቀፍ ምግቦች በጥራት የተዘጋጁበት በአዲስ አበባ እምብርት የሚገኝ ልዩ ምግብ ቤት።',
                        address: 'ቦሌ መንገድ፣ ኤድና ሞል አጠገብ',
                        city: 'አዲስ አበባ',
                    },
                ],
            },
            theme: {
                create: {
                    primaryColor: '#C8913A',
                    accentColor: '#E8B94F',
                    fontFamily: 'Inter',
                    menuStyle: MenuStyle.CLASSIC,
                    darkMode: ThemeMode.LIGHT,
                },
            },
        },
    });

    // ─── Admin user ──────────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('Demo1234!', 12);
    await prisma.user.create({
        data: {
            name: 'Abebe Girma',
            email: 'admin@bluenile.et',
            passwordHash,
            emailVerified: true,
            role: Role.ADMIN,
            restaurantId: restaurant.id,
        },
    });

    // ─── QR Code ─────────────────────────────────────────────────────────────────
    await prisma.qRCode.create({
        data: {
            restaurantId: restaurant.id,
            name: 'Main Entrance QR',
            isActive: true,
        },
    });

    // ─── Categories with EN + AM translations ────────────────────────────────────
    const categoryData = [
        {
            displayOrder: 0,
            translations: [
                { language: Language.EN, name: 'Breakfast', description: 'Start your day right with our morning selections' },
                { language: Language.AM, name: 'ቁርስ', description: 'ቀኑን በደስታ ጀምሩ — የጠዋት ምርጫዎቻችን' },
            ],
        },
        {
            displayOrder: 1,
            translations: [
                { language: Language.EN, name: 'Ethiopian Dishes', description: 'Authentic traditional Ethiopian cuisine' },
                { language: Language.AM, name: 'ኢትዮጵያዊ ምግቦች', description: 'ቆንጆ ባህላዊ ኢትዮጵያዊ ምግቦች' },
            ],
        },
        {
            displayOrder: 2,
            translations: [
                { language: Language.EN, name: 'Main Dishes', description: 'Hearty mains prepared fresh daily' },
                { language: Language.AM, name: 'ዋና ምግቦች', description: 'ዕለታዊ የተዘጋጁ ዋና ምግቦች' },
            ],
        },
        {
            displayOrder: 3,
            translations: [
                { language: Language.EN, name: 'Pizza', description: 'Wood-fired pizzas with premium toppings' },
                { language: Language.AM, name: 'ፒዛ', description: 'የእንጨት እሳት ፒዛ — ምርጥ ውጤቶቻችን' },
            ],
        },
        {
            displayOrder: 4,
            translations: [
                { language: Language.EN, name: 'Burgers', description: 'Handcrafted burgers with fresh ingredients' },
                { language: Language.AM, name: 'በርገር', description: 'ሙሉ እጃቸው የተሰሩ በርገሮች' },
            ],
        },
        {
            displayOrder: 5,
            translations: [
                { language: Language.EN, name: 'Drinks', description: 'Fresh juices, coffee, and beverages' },
                { language: Language.AM, name: 'መጠጦች', description: 'ትኩስ ጭማቂ፣ ቡና እና ሌሎች መጠጦች' },
            ],
        },
        {
            displayOrder: 6,
            translations: [
                { language: Language.EN, name: 'Desserts', description: 'Sweet endings to a perfect meal' },
                { language: Language.AM, name: 'ጣፋጭ ምግቦች', description: 'ምሳ ወይም እራት በጣፋጭ ምግቦች ዝጉ' },
            ],
        },
    ];

    const categories: { id: string; order: number }[] = [];

    for (const catData of categoryData) {
        const cat = await prisma.category.create({
            data: {
                restaurantId: restaurant.id,
                displayOrder: catData.displayOrder,
                isActive: true,
                translations: { create: catData.translations },
            },
        });
        categories.push({ id: cat.id, order: catData.displayOrder });
    }

    const [breakfastCat, ethiopianCat, mainCat, pizzaCat, burgerCat, drinksCat, dessertCat] = categories;

    // ─── Menu Items ───────────────────────────────────────────────────────────────
    const menuItems = [
        // Breakfast
        {
            categoryId: breakfastCat.id,
            price: 180,
            displayOrder: 0,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Full English Breakfast', description: 'Eggs, bacon, sausage, baked beans, toast, and grilled tomato' },
                { language: Language.AM, name: 'ሙሉ የእንግሊዝ ቁርስ', description: 'እንቁላል፣ ቤከን፣ ሶሴጅ፣ ቶስት እና የተጠበሰ ቲማቲም' },
            ],
        },
        {
            categoryId: breakfastCat.id,
            price: 120,
            displayOrder: 1,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Chechebsa', description: 'Traditional Ethiopian breakfast — shredded injera with honey, spiced butter and berbere' },
                { language: Language.AM, name: 'ጨጨብሳ', description: 'ባህላዊ ኢትዮጵያዊ ቁርስ — ቆረጣ እንጀራ ከንብ ማር፣ ቤቀቤ ቅቤ እና በርበሬ ጋር' },
            ],
        },
        {
            categoryId: breakfastCat.id,
            price: 90,
            displayOrder: 2,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Scrambled Eggs & Toast', description: 'Creamy scrambled eggs with buttered whole-wheat toast' },
                { language: Language.AM, name: 'የተቀላቀለ እንቁላልና ቶስት', description: 'ቅቤ ያለው የስንዴ ቶስት ከዕንቁላል ጋር' },
            ],
        },
        // Ethiopian Dishes
        {
            categoryId: ethiopianCat.id,
            price: 280,
            displayOrder: 0,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Kitfo', description: 'Minced raw lean beef marinated in mitmita spice and spiced butter — served with ayib and gomen' },
                { language: Language.AM, name: 'ክትፎ', description: 'ከሚጥሚጣ እና ቅቤ ጋር የተዘጋጀ ጥሬ ሥጋ — ከጎጆ ቤዛና ጎመን ጋር' },
            ],
        },
        {
            categoryId: ethiopianCat.id,
            price: 250,
            displayOrder: 1,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Doro Wat', description: 'Slow-cooked chicken in rich berbere sauce with boiled egg — served with injera' },
                { language: Language.AM, name: 'ዶሮ ወጥ', description: 'ቀስ ብሎ የተዘጋጀ ዶሮ ከሀብሃብ በርበሬ ወጥ ጋር — ከእንቁላልና እንጀራ ጋር' },
            ],
        },
        {
            categoryId: ethiopianCat.id,
            price: 200,
            displayOrder: 2,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Tibs', description: 'Tender sautéed beef or lamb with rosemary, garlic and onions — served with injera' },
                { language: Language.AM, name: 'ጥብስ', description: 'ለስላሳ የተጠበሰ ሥጋ ከቃሪያ፣ ሽንኩርት እና ነጭ ሽንኩርት ጋር' },
            ],
        },
        {
            categoryId: ethiopianCat.id,
            price: 180,
            displayOrder: 3,
            isAvailable: false, // Unavailable — shows label
            translations: [
                { language: Language.EN, name: 'Shiro Wat', description: 'Smooth chickpea stew seasoned with berbere and spiced butter — vegan-friendly' },
                { language: Language.AM, name: 'ሽሮ ወጥ', description: 'ቀለጠ አተር ከበርበሬ እና ቅቤ ጋር — ቪጋን ምርጫ' },
            ],
        },
        // Main Dishes
        {
            categoryId: mainCat.id,
            price: 320,
            displayOrder: 0,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Grilled Salmon', description: 'Atlantic salmon fillet with lemon butter sauce, asparagus and roasted potatoes' },
                { language: Language.AM, name: 'የተጠበሰ ሳልሞን', description: 'ሳልሞን ፊሌ ከሎሚ ቅቤ ሾርባ እና ድንቾ ጋር' },
            ],
        },
        {
            categoryId: mainCat.id,
            price: 380,
            displayOrder: 1,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Beef Tenderloin', description: '300g prime beef tenderloin with peppercorn sauce, seasonal vegetables and mashed potato' },
                { language: Language.AM, name: 'የዳቦ ሥጋ', description: '300 ግ የምርጥ ሥጋ ከቁሬ ሾርባ፣ አትክልቶች እና ደቀቀ ድንቾ ጋር' },
            ],
        },
        {
            categoryId: mainCat.id,
            price: 270,
            displayOrder: 2,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Pasta Alfredo', description: 'Fettuccine pasta in creamy parmesan sauce with mushrooms and garlic bread' },
                { language: Language.AM, name: 'ፓስታ አልፍሬዶ', description: 'ፌቱቺን ፓስታ ከፓርሜዛን ሾርባ እና ማሽሩም ጋር' },
            ],
        },
        // Pizza
        {
            categoryId: pizzaCat.id,
            price: 280,
            displayOrder: 0,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Margherita Pizza', description: 'Classic tomato sauce, fresh mozzarella, basil and extra virgin olive oil' },
                { language: Language.AM, name: 'ማርጋሪታ ፒዛ', description: 'ክላሲክ ቲማቲም ሾርባ፣ ሞዛሬላ ቺዝ እና ቅዝቃዜ ዘይት' },
            ],
        },
        {
            categoryId: pizzaCat.id,
            price: 320,
            displayOrder: 1,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'BBQ Chicken Pizza', description: 'Smoky BBQ sauce, grilled chicken, red onion, mozzarella and coriander' },
                { language: Language.AM, name: 'BBQ ዶሮ ፒዛ', description: 'ቢቢኪው ሾርባ፣ የተጠበሰ ዶሮ፣ ሞዛሬላ ቺዝ' },
            ],
        },
        {
            categoryId: pizzaCat.id,
            price: 350,
            displayOrder: 2,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Meat Lover Pizza', description: 'Beef, chicken, pepperoni, sausage, mozzarella on rich tomato base' },
                { language: Language.AM, name: 'ሥጋ ወዳጅ ፒዛ', description: 'ሥጋ፣ ዶሮ፣ ሶሴጅ፣ ሞዛሬላ ቺዝ ከቲማቲም ሾርባ ጋር' },
            ],
        },
        // Burgers
        {
            categoryId: burgerCat.id,
            price: 240,
            displayOrder: 0,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Classic Beef Burger', description: '180g beef patty, lettuce, tomato, cheese, pickles and special sauce on brioche bun' },
                { language: Language.AM, name: 'ክላሲክ ሥጋ በርገር', description: '180 ግ ሥጋ፣ ሊቲስ፣ ቲማቲም፣ ቺዝ እና ምርጥ ሾርባ' },
            ],
        },
        {
            categoryId: burgerCat.id,
            price: 220,
            displayOrder: 1,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Chicken Burger', description: 'Grilled chicken breast with avocado, crispy lettuce, tomato and lemon mayo' },
                { language: Language.AM, name: 'ዶሮ በርገር', description: 'የተጠበሰ ዶሮ ደረት ከአቮካዶ፣ ሊቲስ እና ሎሚ ማዮ ጋር' },
            ],
        },
        // Drinks
        {
            categoryId: drinksCat.id,
            price: 80,
            displayOrder: 0,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Ethiopian Coffee', description: 'Traditionally roasted and brewed Ethiopian Yirgacheffe coffee — served in jebena' },
                { language: Language.AM, name: 'ኢትዮጵያዊ ቡና', description: 'ዕቃ ይርጋጨፌ ቡና — ጀበና ቡና' },
            ],
        },
        {
            categoryId: drinksCat.id,
            price: 90,
            displayOrder: 1,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Fresh Mango Juice', description: 'Cold-pressed fresh mango juice with no added sugar' },
                { language: Language.AM, name: 'ትኩስ ማንጎ ጭማቂ', description: 'ስኳር ያልተጨመረ ትኩስ ማንጎ ጭማቂ' },
            ],
        },
        {
            categoryId: drinksCat.id,
            price: 70,
            displayOrder: 2,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Avocado Smoothie', description: 'Creamy blended avocado with milk and a touch of honey' },
                { language: Language.AM, name: 'አቮካዶ ስሙዝ', description: 'ቅቤ አቮካዶ ከወተት እና ማር ጋር' },
            ],
        },
        // Desserts
        {
            categoryId: dessertCat.id,
            price: 130,
            displayOrder: 0,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Chocolate Lava Cake', description: 'Warm dark chocolate cake with molten centre, served with vanilla ice cream' },
                { language: Language.AM, name: 'ቸኮሌት ኬክ', description: 'ሙቅ ጨለማ ቸኮሌት ኬክ ከቫኒላ አይስ ክሪም ጋር' },
            ],
        },
        {
            categoryId: dessertCat.id,
            price: 100,
            displayOrder: 1,
            isAvailable: true,
            translations: [
                { language: Language.EN, name: 'Tiramisu', description: 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone cream' },
                { language: Language.AM, name: 'ቲራሚሱ', description: 'ክላሲክ ጣሊያናዊ ጣፋጭ ምግብ ከቡና እና ማስካርፖን ክሬም ጋር' },
            ],
        },
    ];

    for (const item of menuItems) {
        await prisma.menuItem.create({
            data: {
                restaurantId: restaurant.id,
                categoryId: item.categoryId,
                price: item.price,
                currency: 'ETB',
                isAvailable: item.isAvailable,
                displayOrder: item.displayOrder,
                translations: { create: item.translations },
            },
        });
    }

    console.log('✅ Seed complete!');
    console.log(`📍 Restaurant: ${restaurant.name} (slug: ${restaurant.slug})`);
    console.log(`👤 Demo login: admin@bluenile.et / Demo1234!`);
    console.log(`🌐 Public menu: http://localhost:5173/r/blue-nile-restaurant`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
