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

export type SubscriptionTier = 'FREE_TRIAL' | 'STARTER' | 'PRO';

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
    isSuspended?: boolean;
    suspensionReason?: string | null;
    subscriptionTier?: SubscriptionTier;
    subscriptionExpiresAt?: string | null;
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

// ─── Analytics Types ──────────────────────────────────────────────────────────
export interface AnalyticsSummary {
    totalScans: number;
    uniqueDiners: number;
    scanGrowthPct: number;
    peakHour: string;
    topDish: string;
    profileViews: number;
    totalSocialClicks: number;
    callClicks: number;
    directionsClicks: number;
}

export interface AnalyticsTimelineItem {
    label: string;
    count: number;
}

export interface PeakHourItem {
    hour: number;
    label: string;
    count: number;
}

export interface TopDishItem {
    id: string;
    name: string;
    amName: string | null;
    category: string;
    price: number;
    imageUrl: string | null;
    clicks: number;
    sharePct: number;
}

export interface TopSearchItem {
    query: string;
    count: number;
}

export interface DayOfWeekItem {
    day: string;
    count: number;
    pct: number;
}

export interface AnalyticsData {
    summary: AnalyticsSummary;
    timeline: AnalyticsTimelineItem[];
    peakHours: PeakHourItem[];
    dayOfWeek: DayOfWeekItem[];
    topDishes: TopDishItem[];
    topSearches: TopSearchItem[];
    devices: {
        ios: number;
        android: number;
        other: number;
        iosPct: number;
        androidPct: number;
    };
    languages: {
        en: number;
        am: number;
        enPct: number;
        amPct: number;
    };
    interactions: {
        profileViews: number;
        callClicks: number;
        directionsClicks: number;
        socialPlatforms: Record<string, number>;
    };
}

// ─── Platform Super Admin Types ───────────────────────────────────────────────
export interface AdminOverviewMetrics {
    restaurants: {
        total: number;
        published: number;
        draft: number;
        suspended: number;
    };
    users: {
        total: number;
        verified: number;
        unverified: number;
    };
    catalog: {
        totalItems: number;
        totalCategories: number;
    };
    scans: {
        total: number;
        today: number;
        week: number;
    };
    signupTimeline: {
        date: string;
        users: number;
        restaurants: number;
    }[];
    topRestaurants: {
        id: string;
        name: string;
        slug: string;
        city: string | null;
        tier: string;
        scans: number;
    }[];
    recentAudits: AuditLogEntry[];
}

export interface AdminRestaurantItem {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    status: MenuStatus;
    isSuspended: boolean;
    suspensionReason: string | null;
    subscriptionTier: SubscriptionTier;
    subscriptionExpiresAt: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
    country: string;
    createdAt: string;
    updatedAt: string;
    owner: {
        id: string;
        name: string;
        email: string;
        role: Role;
        emailVerified: boolean;
    } | null;
    itemCount: number;
    categoryCount: number;
    scanCount: number;
}

export interface AdminUserItem {
    id: string;
    name: string;
    email: string;
    role: Role;
    emailVerified: boolean;
    isGoogleUser: boolean;
    restaurant: {
        id: string;
        name: string;
        slug: string;
        isSuspended: boolean;
        status: MenuStatus;
    } | null;
    createdAt: string;
    updatedAt: string;
}

export interface AuditLogEntry {
    id: string;
    action: string;
    details: any;
    ipAddress: string | null;
    createdAt: string;
    user?: {
        id: string;
        name: string;
        email: string;
    } | null;
    restaurant?: {
        id: string;
        name: string;
        slug: string;
    } | null;
}

export interface BroadcastAnnouncement {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

