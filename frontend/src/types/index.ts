// ─── Auth Types ───────────────────────────────────────────────────────────────
export type Role = 'OWNER' | 'ADMIN';
export type Language = 'EN' | 'AM';
export type MenuStatus = 'DRAFT' | 'PUBLISHED';
export type MenuStyle = 'CLASSIC' | 'MODERN' | 'ELEGANT' | 'MINIMAL';
export type ThemeMode = 'LIGHT' | 'DARK' | 'AUTO';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    restaurantId: string | null;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

// ─── Restaurant Types ──────────────────────────────────────────────────────────
export interface RestaurantTheme {
    id: string;
    restaurantId: string;
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    menuStyle: MenuStyle;
    darkMode: ThemeMode;
}

export interface RestaurantTranslation {
    id?: string;
    restaurantId?: string;
    language: Language;
    name: string;
    description: string | null;
    address: string | null;
    city: string | null;
}

export interface SocialMediaEntry {
    platform: string;
    url: string;
}

export interface Restaurant {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    coverImageUrl: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    country: string;
    defaultLanguage: Language;
    currency: string;
    status: MenuStatus;
    wifiName?: string | null;
    wifiPassword?: string | null;
    paymentInfo?: string | null;
    socialMedia?: SocialMediaEntry[] | null;
    translations?: RestaurantTranslation[];
    theme: RestaurantTheme | null;
    createdAt: string;
    updatedAt: string;
}

// ─── Translation Types ─────────────────────────────────────────────────────────
export interface CategoryTranslation {
    id: string;
    categoryId: string;
    language: Language;
    name: string;
    description: string | null;
}

export interface Category {
    id: string;
    restaurantId: string;
    displayOrder: number;
    isActive: boolean;
    translations: CategoryTranslation[];
    createdAt: string;
    updatedAt: string;
}

export interface MenuItemTranslation {
    id: string;
    menuItemId: string;
    language: Language;
    name: string;
    description: string | null;
    ingredients: string | null;
    allergens: string | null;
}

export interface MenuItem {
    id: string;
    restaurantId: string;
    categoryId: string;
    price: string; // Decimal as string from API
    discountPrice: string | null;
    currency: string;
    imageUrl: string | null;
    isAvailable: boolean;
    isFeatured: boolean;
    isFasting: boolean;
    displayOrder: number;
    translations: MenuItemTranslation[];
    category?: Category;
    createdAt: string;
    updatedAt: string;
}

// ─── QR Types ─────────────────────────────────────────────────────────────────
export interface QRCode {
    id: string;
    restaurantId: string;
    name: string;
    targetUrl: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// ─── Public Menu Types ────────────────────────────────────────────────────────
export interface PublicMenuItem {
    id: string;
    name: string;
    description: string | null;
    price: string;
    discountPrice: string | null;
    currency: string;
    imageUrl: string | null;
    isAvailable: boolean;
    isFeatured: boolean;
    isFasting: boolean;
    displayOrder: number;
}

export interface PublicCategory {
    id: string;
    name: string;
    description: string | null;
    displayOrder: number;
    menuItems: PublicMenuItem[];
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
    itemCount: number;
    categoryCount: number;
    qrActive: boolean;
    status: MenuStatus;
    restaurantName: string;
    translations?: RestaurantTranslation[];
    defaultLanguage: Language;
    theme: RestaurantTheme | null;
}

// ─── API Helpers ──────────────────────────────────────────────────────────────
export interface ApiError {
    error: string;
    details?: unknown;
}

// ─── Forms ────────────────────────────────────────────────────────────────────
export interface TranslationInput {
    language: Language;
    name: string;
    description?: string;
    ingredients?: string;
    allergens?: string;
    address?: string;
    city?: string;
}

export interface CreateCategoryInput {
    displayOrder?: number;
    isActive?: boolean;
    translations: TranslationInput[];
}

export interface CreateMenuItemInput {
    categoryId: string;
    price: number;
    discountPrice?: number | null;
    currency?: string;
    isAvailable?: boolean;
    isFeatured?: boolean;
    isFasting?: boolean;
    translations: TranslationInput[];
}
