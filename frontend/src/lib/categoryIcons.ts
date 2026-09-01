/**
 * Category Icon Resolver Utility
 * Maps category names (English and Amharic) to intuitive food & beverage icons.
 */

interface IconRule {
    icon: string;
    keywords: string[];
}

const CATEGORY_ICON_RULES: IconRule[] = [
    // ── Breakfast & Morning ──
    {
        icon: '🍳',
        keywords: ['breakfast', 'morning', 'brunch', 'egg', 'omelet', 'omelette', 'pancake', 'waffle', 'ቁርስ', 'እንቁላል', 'ፓንኬክ'],
    },
    // ── Fasting / Vegetarian / Vegan ──
    {
        icon: '🌱',
        keywords: ['fasting', 'vegan', 'vegetarian', 'plant', 'veggie', 'green', 'የፆም', 'የጾም', 'ጾም', 'ፆም', 'አትክልት'],
    },
    // ── Traditional / Ethiopian Habesha Cuisine ──
    {
        icon: '🍲',
        keywords: ['traditional', 'habesha', 'ethiopian', 'cultural', 'heritage', 'injera', 'enjera', 'ባህላዊ', 'የሀገር ባህል', 'ሀበሻ', 'እንጀራ', 'የባህል'],
    },
    // ── Meat, Beef, Steaks, Tibs, Kitfo ──
    {
        icon: '🥩',
        keywords: ['meat', 'beef', 'steak', 'bbq', 'barbecue', 'grill', 'grilled', 'lamb', 'pork', 'ribs', 'tibs', 'kitfo', 'gored', 'tere', 'ስጋ', 'ሥጋ', 'ጥብስ', 'ክትፎ', 'ጎረድ', 'ጥሬ', 'የበሬ', 'የበግ'],
    },
    // ── Chicken & Poultry ──
    {
        icon: '🍗',
        keywords: ['chicken', 'poultry', 'wings', 'drumstick', 'fried chicken', 'doro', 'kuku', 'ዶሮ', 'ክንፍ', 'የዶሮ'],
    },
    // ── Fish & Seafood ──
    {
        icon: '🐟',
        keywords: ['fish', 'seafood', 'shrimp', 'prawn', 'salmon', 'tuna', 'tilapia', 'crab', 'lobster', 'fillet', 'asa', 'assa', 'አሳ', 'ዓሳ', 'የባህር', 'የባሕር'],
    },
    // ── Burgers ──
    {
        icon: '🍔',
        keywords: ['burger', 'burgers', 'cheeseburger', 'slider', 'sliders', 'patty', 'በርገር'],
    },
    // ── Pizza ──
    {
        icon: '🍕',
        keywords: ['pizza', 'pizzas', 'calzone', 'flatbread', 'ፒዛ'],
    },
    // ── Pasta, Spaghetti, Noodles ──
    {
        icon: '🍝',
        keywords: ['pasta', 'spaghetti', 'macaroni', 'penne', 'noodles', 'noodle', 'ramen', 'lasagna', 'fettuccine', 'carbonara', 'bolognese', 'tagliatelle', 'ፓስታ', 'ስፓጌቲ', 'ማካሮኒ', 'ኑድል', 'ላዛኛ'],
    },
    // ── Salads & Bowls ──
    {
        icon: '🥗',
        keywords: ['salad', 'salads', 'caesar', 'greek', 'bowl', 'greens', 'lettuce', 'slaw', 'coleslaw', 'ሰላጣ'],
    },
    // ── Soups & Stews ──
    {
        icon: '🥣',
        keywords: ['soup', 'soups', 'broth', 'stew', 'chowder', 'cream soup', 'goulash', 'ሾርባ', 'መረቅ'],
    },
    // ── Sandwiches, Wraps, Shawarma ──
    {
        icon: '🥪',
        keywords: ['sandwich', 'sandwiches', 'wrap', 'wraps', 'toast', 'toasts', 'panini', 'shawarma', 'roll', 'rolls', 'sub', 'subs', 'ሳንድዊች', 'ቶስት', 'ሻዋርማ'],
    },
    // ── Appetizers, Starters, Snacks, Fries ──
    {
        icon: '🍟',
        keywords: ['appetizer', 'appetizers', 'starter', 'starters', 'snack', 'snacks', 'fries', 'french fries', 'potato', 'chips', 'nachos', 'dip', 'dips', 'nuggets', 'onion rings', 'finger food', 'መክሰስ', 'ጀማሪ', 'ድንች', 'ቺፕስ'],
    },
    // ── Bakery & Pastries ──
    {
        icon: '🥐',
        keywords: ['bakery', 'bread', 'pastry', 'pastries', 'croissant', 'donut', 'bun', 'bagel', 'toast bread', 'ዳቦ', 'ክሩሳን'],
    },
    // ── Desserts & Sweets ──
    {
        icon: '🍰',
        keywords: ['dessert', 'desserts', 'sweet', 'sweets', 'cake', 'cakes', 'ice cream', 'icecream', 'gelato', 'sundae', 'brownie', 'tiramisu', 'cheesecake', 'pudding', 'tart', 'ጣፋጭ', 'አይስክሬም', 'ኬክ', 'ጣፋጮች'],
    },
    // ── Hot Drinks (Coffee, Tea, Espresso) ──
    {
        icon: '☕',
        keywords: ['hot drink', 'hot drinks', 'hot beverage', 'hot beverages', 'coffee', 'tea', 'espresso', 'cappuccino', 'latte', 'mocha', 'macchiato', 'herbal', 'chai', 'hot chocolate', 'cocoa', 'buna', 'shai', 'ትኩስ', 'ትኩስ መጠጦች', 'ቡና', 'ሻይ', 'ማኪያቶ', 'ካፑቺኖ'],
    },
    // ── Cold Drinks (Soft Drinks, Sodas, Water) ──
    {
        icon: '🥤',
        keywords: ['cold drink', 'cold drinks', 'cold beverage', 'cold beverages', 'soft drink', 'soft drinks', 'soda', 'sodas', 'water', 'mineral water', 'coke', 'coca cola', 'pepsi', 'sprite', 'fanta', 'iced tea', 'iced coffee', 'energy drink', 'ቀዝቃዛ', 'ቀዝቃዛ መጠጦች', 'ለስላሳ', 'ለስላሳ መጠጦች', 'ውሃ'],
    },
    // ── Fresh Juices & Smoothies ──
    {
        icon: '🧃',
        keywords: ['juice', 'juices', 'fresh juice', 'smoothie', 'smoothies', 'shake', 'shakes', 'mocktail', 'mocktails', 'lemonade', 'avocado juice', 'mango juice', 'orange juice', 'punch', 'ጁስ', 'ጭማቂ', 'ስሙዚ', 'ፍራፍሬ'],
    },
    // ── Alcoholic Drinks, Beer, Wine, Cocktails ──
    {
        icon: '🍺',
        keywords: ['alcohol', 'alcoholic', 'beer', 'beers', 'wine', 'wines', 'cocktail', 'cocktails', 'liquor', 'spirits', 'whiskey', 'whisky', 'vodka', 'rum', 'gin', 'draft', 'draught', 'tequila', 'champagne', 'cider', 'ቢራ', 'ወይን', 'ኮክቴል', 'አልኮል', 'መጠጥ', 'መጠጦች'],
    },
    // ── Specials & Chef Recommendations ──
    {
        icon: '⭐',
        keywords: ['special', 'specials', 'chef', 'signature', 'featured', 'popular', 'recommendation', 'house special', 'ልዩ', 'የሼፍ', 'ተወዳጅ'],
    },
    // ── Rice & Asian Dishes ──
    {
        icon: '🍚',
        keywords: ['rice', 'biryani', 'fried rice', 'pilaf', 'bowl rice', 'ruze', 'ሩዝ'],
    },
    // ── Combos & Platters ──
    {
        icon: '🍱',
        keywords: ['combo', 'combos', 'platter', 'platters', 'set', 'family', 'deal', 'deals', 'bundle', 'ጥቅል', 'ጥምር'],
    },
    // ── Tacos & Mexican ──
    {
        icon: '🌮',
        keywords: ['taco', 'tacos', 'burrito', 'burritos', 'quesadilla', 'mexican', 'fajita', 'ታኮ'],
    },
    // ── Sushi & Japanese ──
    {
        icon: '🍣',
        keywords: ['sushi', 'maki', 'sashimi', 'nigiri', 'japanese', 'ሱሺ'],
    },
    // ── Sides & Extras ──
    {
        icon: '🧂',
        keywords: ['side', 'sides', 'extra', 'extras', 'sauce', 'sauces', 'addon', 'addons', 'condiment', 'dressing', 'ተጨማሪ', 'ተጨማሪዎች', 'ማባበያ'],
    },
    // ── Kids Menu ──
    {
        icon: '👶',
        keywords: ['kid', 'kids', 'children', 'child', 'junior', 'የልጆች'],
    },
];

const DEFAULT_ICON = '🍽️';

/**
 * Returns an emoji food icon for a given category name (English or Amharic).
 */
export function getCategoryIcon(name?: string | null): string {
    if (!name || typeof name !== 'string') return DEFAULT_ICON;

    const normalized = name.toLowerCase().trim();
    if (!normalized) return DEFAULT_ICON;

    // 1. Direct / word boundary matching
    for (const rule of CATEGORY_ICON_RULES) {
        for (const keyword of rule.keywords) {
            // Match whole word or exact substring
            if (
                normalized === keyword ||
                normalized.startsWith(`${keyword} `) ||
                normalized.endsWith(` ${keyword}`) ||
                normalized.includes(` ${keyword} `) ||
                normalized.includes(keyword)
            ) {
                return rule.icon;
            }
        }
    }

    return DEFAULT_ICON;
}
