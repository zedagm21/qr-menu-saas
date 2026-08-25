import prisma from '../config/database';

/**
 * Complete Ge'ez / Amharic Fidel Transliteration Map.
 * Converts Ethiopic script characters into their phonetic Latin equivalents.
 */
const AMHARIC_FIDEL_MAP: Record<string, string> = {
    // ሀ (he/ha)
    'ሀ': 'he', 'ሁ': 'hu', 'ሂ': 'hi', 'ሃ': 'ha', 'ሄ': 'he', 'ህ': 'h', 'ሆ': 'ho',
    // ለ (le)
    'ለ': 'le', 'ሉ': 'lu', 'ሊ': 'li', 'ላ': 'la', 'ሌ': 'le', 'ል': 'l', 'ሎ': 'lo', 'ሏ': 'lwa',
    // ሐ (hha/ha)
    'ሐ': 'ha', 'ሑ': 'hu', 'ሒ': 'hi', 'ሓ': 'ha', 'ሔ': 'he', 'ሕ': 'h', 'ሖ': 'ho', 'ሗ': 'hwa',
    // መ (me)
    'መ': 'me', 'ሙ': 'mu', 'ሚ': 'mi', 'ማ': 'ma', 'ሜ': 'me', 'ም': 'm', 'ሞ': 'mo', 'ሟ': 'mwa',
    // ሠ (se)
    'ሠ': 'se', 'ሡ': 'su', 'ሢ': 'si', 'ሣ': 'sa', 'ሤ': 'se', 'ሥ': 's', 'ሦ': 'so', 'ሧ': 'swa',
    // ረ (re)
    'ረ': 're', 'ሩ': 'ru', 'ሪ': 'ri', 'ራ': 'ra', 'ሬ': 're', 'ር': 'r', 'ሮ': 'ro', 'ሯ': 'rwa',
    // ሰ (se)
    'ሰ': 'se', 'ሱ': 'su', 'ሲ': 'si', 'ሳ': 'sa', 'ሴ': 'se', 'ስ': 's', 'ሶ': 'so', 'ሷ': 'swa',
    // ሸ (she)
    'ሸ': 'she', 'ሹ': 'shu', 'ሺ': 'shi', 'ሻ': 'sha', 'ሼ': 'she', 'ሽ': 'sh', 'ሾ': 'sho', 'ሿ': 'shwa',
    // ቀ (qe)
    'ቀ': 'qe', 'ቁ': 'qu', 'ቂ': 'qi', 'ቃ': 'qa', 'ቄ': 'qe', 'ቅ': 'q', 'ቆ': 'qo',
    'ቈ': 'qwe', 'ቊ': 'qwi', 'ቋ': 'qwa', 'ቌ': 'qwe', 'ቍ': 'qw',
    // በ (be)
    'በ': 'be', 'ቡ': 'bu', 'ቢ': 'bi', 'ባ': 'ba', 'ቤ': 'be', 'ብ': 'b', 'ቦ': 'bo', 'ቧ': 'bwa',
    // ቨ (ve)
    'ቨ': 've', 'ቩ': 'vu', 'ቪ': 'vi', 'ቫ': 'va', 'ቬ': 've', 'ቭ': 'v', 'ቮ': 'vo', 'ቯ': 'vwa',
    // ተ (te)
    'ተ': 'te', 'ቱ': 'tu', 'ቲ': 'ti', 'ታ': 'ta', 'ቴ': 'te', 'ት': 't', 'ቶ': 'to', 'ቷ': 'twa',
    // ቸ (che)
    'ቸ': 'che', 'ቹ': 'chu', 'ቺ': 'chi', 'ቻ': 'cha', 'ቼ': 'che', 'ች': 'ch', 'ቾ': 'cho', 'ቿ': 'chwa',
    // ኀ (ha)
    'ኀ': 'ha', 'ኁ': 'hu', 'ኂ': 'hi', 'ኃ': 'ha', 'ኄ': 'he', 'ኅ': 'h', 'ኆ': 'ho',
    'ኈ': 'hwe', 'ኊ': 'hwi', 'ኋ': 'hwa', 'ኌ': 'hwe', 'ኍ': 'hw',
    // ነ (ne)
    'ነ': 'ne', 'ኑ': 'nu', 'ኒ': 'ni', 'ና': 'na', 'ኔ': 'ne', 'ን': 'n', 'ኖ': 'no', 'ኗ': 'nwa',
    // ኘ (nye)
    'ኘ': 'nye', 'ኙ': 'nyu', 'ኚ': 'nyi', 'ኛ': 'nya', 'ኜ': 'nye', 'ኝ': 'ny', 'ኞ': 'nyo', 'ኟ': 'nywa',
    // አ (a/e)
    'አ': 'a', 'ኡ': 'u', 'ኢ': 'i', 'ኣ': 'a', 'ኤ': 'e', 'እ': 'i', 'ኦ': 'o', 'ኧ': 'ea',
    // ከ (ke)
    'ከ': 'ke', 'ኩ': 'ku', 'ኪ': 'ki', 'ካ': 'ka', 'ኬ': 'ke', 'ክ': 'k', 'ኮ': 'ko',
    'ኰ': 'kwe', 'ኲ': 'kwi', 'ኳ': 'kwa', 'ኴ': 'kwe', 'ኵ': 'kw',
    // ኸ (he/khe)
    'ኸ': 'he', 'ኹ': 'hu', 'ኺ': 'hi', 'ኻ': 'ha', 'ኼ': 'he', 'ኽ': 'h', 'ኾ': 'ho',
    'ዀ': 'hwe', 'ዂ': 'hwi', 'ዃ': 'hwa', 'ዄ': 'hwe', 'ዅ': 'hw',
    // ወ (we)
    'ወ': 'we', 'ዉ': 'wu', 'ዊ': 'wi', 'ዋ': 'wa', 'ዌ': 'we', 'ው': 'w', 'ዎ': 'wo',
    // ዐ (a/e)
    'ዐ': 'a', 'ዑ': 'u', 'ዒ': 'i', 'ዓ': 'a', 'ዔ': 'e', 'ዕ': 'e', 'ዖ': 'o',
    // ዘ (ze)
    'ዘ': 'ze', 'ዙ': 'zu', 'ዚ': 'zi', 'ዛ': 'za', 'ዜ': 'ze', 'ዝ': 'z', 'ዞ': 'zo', 'ዟ': 'zwa',
    // ዠ (zhe)
    'ዠ': 'zhe', 'ዡ': 'zhu', 'ዢ': 'zhi', 'ዣ': 'zha', 'ዤ': 'zhe', 'ዥ': 'zh', 'ዦ': 'zho', 'ዧ': 'zhwa',
    // የ (ye)
    'የ': 'ye', 'ዩ': 'yu', 'ዪ': 'yi', 'ያ': 'ya', 'ዬ': 'ye', 'ይ': 'y', 'ዮ': 'yo', 'ዯ': 'ywa',
    // ደ (de)
    'ደ': 'de', 'ዱ': 'du', 'ዲ': 'di', 'ዳ': 'da', 'ዴ': 'de', 'ድ': 'd', 'ዶ': 'do', 'ዷ': 'dwa',
    // ጀ (je)
    'ጀ': 'je', 'ጁ': 'ju', 'ጂ': 'ji', 'ጃ': 'ja', 'ጄ': 'je', 'ጅ': 'j', 'ጆ': 'jo', 'ጇ': 'jwa',
    // ገ (ge)
    'ገ': 'ge', 'ጉ': 'gu', 'ጊ': 'gi', 'ጋ': 'ga', 'ጌ': 'ge', 'ግ': 'g', 'ጎ': 'go',
    'ጐ': 'gwe', 'ጒ': 'gwi', 'ጓ': 'gwa', 'ጔ': 'gwe', 'ጕ': 'gw',
    // ጠ (te)
    'ጠ': 'te', 'ጡ': 'tu', 'ጢ': 'ti', 'ጣ': 'ta', 'ጤ': 'te', 'ጥ': 't', 'ጦ': 'to', 'ጧ': 'twa',
    // ጨ (che)
    'ጨ': 'che', 'ጩ': 'chu', 'ጪ': 'chi', 'ጫ': 'cha', 'ጬ': 'che', 'ጭ': 'ch', 'ጮ': 'cho', 'ጯ': 'chwa',
    // ጰ (pe)
    'ጰ': 'pe', 'ጱ': 'pu', 'ጲ': 'pi', 'ጳ': 'pa', 'ጴ': 'pe', 'ጵ': 'p', 'ጶ': 'po', 'ጷ': 'pwa',
    // ጸ (tse)
    'ጸ': 'tse', 'ጹ': 'tsu', 'ጺ': 'tsi', 'ጻ': 'tsa', 'ጼ': 'tse', 'ጽ': 'ts', 'ጾ': 'tso', 'ጿ': 'tswa',
    // ፀ (tse)
    'ፀ': 'tse', 'ፁ': 'tsu', 'ፂ': 'tsi', 'ፃ': 'tsa', 'ፄ': 'tse', 'ፅ': 'ts', 'ፆ': 'tso', 'ፇ': 'tswa',
    // ፈ (fe)
    'ፈ': 'fe', 'ፉ': 'fu', 'ፊ': 'fi', 'ፋ': 'fa', 'ፌ': 'fe', 'ፍ': 'f', 'ፎ': 'fo', 'ፏ': 'fwa',
    // ፐ (pe)
    'ፐ': 'pe', 'ፑ': 'pu', 'ፒ': 'pi', 'ፓ': 'pa', 'ፔ': 'pe', 'ፕ': 'p', 'ፖ': 'po', 'ፗ': 'pwa',
};

/**
 * Transliterates Amharic text into phonetic English/Latin characters.
 * Non-Amharic characters (Latin letters, numbers, spaces) are preserved as-is.
 */
export const transliterateAmharic = (text: string): string => {
    return Array.from(text)
        .map((char) => AMHARIC_FIDEL_MAP[char] || char)
        .join('');
};

/**
 * Generates a clean, URL-safe slug from a string with full Amharic transliteration.
 * Ensures uniqueness by appending a counter if slug already exists.
 */
export const generateSlug = (text: string): string => {
    // 1. Convert Amharic script into readable Latin phonetics
    const transliterated = transliterateAmharic(text);

    // 2. Standardize to lowercase URL slug
    const slug = transliterated
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    // Fallback: If resulting string is still empty, generate a safe unique ID
    return slug.length > 0 ? slug : `r-${Math.random().toString(36).substring(2, 8)}`;
};

export const ensureUniqueSlug = async (baseSlug: string, excludeId?: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await prisma.restaurant.findUnique({ where: { slug } });
        if (!existing || existing.id === excludeId) {
            return slug;
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
};
