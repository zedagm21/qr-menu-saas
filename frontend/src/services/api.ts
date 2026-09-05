import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true, // Always send HttpOnly cookies
    headers: { 'Content-Type': 'application/json' },
});

// ─── Global Response Interceptor for Auth Expiry ─────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const path = window.location.pathname;
            // Only redirect and notify if user is currently inside dashboard routes
            if (path.startsWith('/dashboard')) {
                toast.error('Session expired. Please log in again.', { id: 'session-expired' });
                // Clean redirect to login
                setTimeout(() => {
                    if (window.location.pathname.startsWith('/dashboard')) {
                        window.location.href = '/login';
                    }
                }, 800);
            }
        }
        return Promise.reject(error);
    }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
    register: (data: { name: string; email: string; password: string; restaurantName?: string }): Promise<{ success: boolean; email: string; requiresVerification: boolean }> =>
        api.post('/auth/register', data).then(r => r.data),
    verifyOtp: (data: { email: string; otp: string }) =>
        api.post('/auth/verify-otp', data).then(r => r.data),
    resendOtp: (data: { email: string }) =>
        api.post('/auth/resend-otp', data).then(r => r.data),
    googleAuth: (data: { credential: string }) =>
        api.post('/auth/google', data).then(r => r.data),
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data).then(r => r.data),
    logout: () => api.post('/auth/logout').then(r => r.data),
    me: () => api.get('/auth/me').then(r => r.data),
    updatePassword: (data: { currentPassword: string; newPassword: string }) =>
        api.post('/auth/password', data).then(r => r.data),
    forgotPassword: (data: { email: string }): Promise<{ success: boolean; message: string }> =>
        api.post('/auth/forgot-password', data).then(r => r.data),
    resetPassword: (data: { email: string; otp: string; password: string }): Promise<{ success: boolean; message: string }> =>
        api.post('/auth/reset-password', data).then(r => r.data),
};

// ─── Restaurant ───────────────────────────────────────────────────────────────
export const restaurantApi = {
    get: () => api.get('/restaurant').then(r => r.data),
    update: (data: object) => api.put('/restaurant', data).then(r => r.data),
    changeSlug: (slug: string) => api.put('/restaurant/slug', { slug }).then(r => r.data),
    updateTheme: (data: object) => api.put('/restaurant/theme', data).then(r => r.data),
    getStats: () => api.get('/restaurant/stats').then(r => r.data),
    publish: () => api.post('/restaurant/publish').then(r => r.data),
    uploadLogo: (file: File, onProgress?: (percent: number) => void) => {
        const fd = new FormData();
        fd.append('image', file);
        return api.post('/restaurant/logo', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (e.total && onProgress) {
                    onProgress(Math.round((e.loaded * 100) / e.total));
                }
            },
        }).then(r => r.data);
    },
    uploadCover: (file: File, onProgress?: (percent: number) => void) => {
        const fd = new FormData();
        fd.append('image', file);
        return api.post('/restaurant/cover', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (e.total && onProgress) {
                    onProgress(Math.round((e.loaded * 100) / e.total));
                }
            },
        }).then(r => r.data);
    },
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoryApi = {
    list: () => api.get('/categories').then(r => r.data),
    create: (data: object) => api.post('/categories', data).then(r => r.data),
    update: (id: string, data: object) => api.put(`/categories/${id}`, data).then(r => r.data),
    remove: (id: string) => api.delete(`/categories/${id}`).then(r => r.data),
    reorder: (items: { id: string; displayOrder: number }[]) =>
        api.put('/categories/reorder', { items }).then(r => r.data),
};

// ─── Menu Items ───────────────────────────────────────────────────────────────
export const menuItemApi = {
    list: (categoryId?: string) =>
        api.get('/menu-items', { params: categoryId ? { categoryId } : {} }).then(r => r.data),
    get: (id: string) => api.get(`/menu-items/${id}`).then(r => r.data),
    create: (data: object) => api.post('/menu-items', data).then(r => r.data),
    update: (id: string, data: object) => api.put(`/menu-items/${id}`, data).then(r => r.data),
    remove: (id: string) => api.delete(`/menu-items/${id}`).then(r => r.data),
    uploadImage: (id: string, file: File, onProgress?: (percent: number) => void) => {
        const fd = new FormData();
        fd.append('image', file);
        return api.post(`/menu-items/${id}/image`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (e.total && onProgress) {
                    onProgress(Math.round((e.loaded * 100) / e.total));
                }
            },
        }).then(r => r.data);
    },
    reorder: (items: { id: string; displayOrder: number }[]) =>
        api.put('/menu-items/reorder', { items }).then(r => r.data),
};

// ─── QR ───────────────────────────────────────────────────────────────────────
export const qrApi = {
    list: () => api.get('/qr').then(r => r.data),
    ensure: () => api.post('/qr').then(r => r.data),
    remove: (id: string) => api.delete(`/qr/${id}`).then(r => r.data),
};

// ─── Public ───────────────────────────────────────────────────────────────────
export const publicApi = {
    getRestaurant: (slug: string, lang: string = 'EN') =>
        api.get(`/public/restaurants/${slug}`, { params: { lang } }).then(r => r.data),
    getMenu: (slug: string, lang: string = 'EN') =>
        api.get(`/public/restaurants/${slug}/menu`, { params: { lang } }).then(r => r.data),
    recordScan: (slug: string, data: { table?: string; qr?: string; language?: string }) =>
        api.post(`/public/restaurants/${slug}/scan`, data).then(r => r.data).catch(() => {}),
    recordItemClick: (slug: string, menuItemId: string) =>
        api.post(`/public/restaurants/${slug}/item-click`, { menuItemId }).then(r => r.data).catch(() => {}),
    recordSearch: (slug: string, query: string, resultsCount?: number) =>
        api.post(`/public/restaurants/${slug}/search`, { query, resultsCount }).then(r => r.data).catch(() => {}),
    recordInteraction: (slug: string, type: 'PROFILE_VIEW' | 'SOCIAL_CLICK' | 'CALL_CLICK' | 'DIRECTIONS_CLICK', platform?: string) =>
        api.post(`/public/restaurants/${slug}/interaction`, { type, platform }).then(r => r.data).catch(() => {}),
};

// ─── Restaurant Analytics ─────────────────────────────────────────────────────
export const analyticsApi = {
    get: (timeframe: string = '7d') =>
        api.get('/restaurant/analytics', { params: { range: timeframe } }).then(r => r.data),
    downloadCsv: (timeframe: string = '30d') =>
        api.get('/restaurant/analytics/export', { params: { range: timeframe }, responseType: 'blob' }).then(r => r.data),
};

// ─── SaaS Super Admin ─────────────────────────────────────────────────────────
export const adminApi = {
    getOverview: () => api.get('/admin/overview').then(r => r.data),
    listRestaurants: (params: { page?: number; limit?: number; search?: string; status?: string; tier?: string }) =>
        api.get('/admin/restaurants', { params }).then(r => r.data),
    updateRestaurantAccess: (id: string, data: { isSuspended?: boolean; suspensionReason?: string | null; status?: string; subscriptionTier?: string; subscriptionExpiresAt?: string | null }) =>
        api.patch(`/admin/restaurants/${id}/access`, data).then(r => r.data),
    deleteRestaurant: (id: string) =>
        api.delete(`/admin/restaurants/${id}`).then(r => r.data),
    listUsers: (params: { page?: number; limit?: number; search?: string; role?: string; verified?: string }) =>
        api.get('/admin/users', { params }).then(r => r.data),
    updateUserRole: (id: string, role: string) =>
        api.patch(`/admin/users/${id}/role`, { role }).then(r => r.data),
    verifyUserEmail: (id: string) =>
        api.patch(`/admin/users/${id}/verify`).then(r => r.data),
    deleteUser: (id: string) =>
        api.delete(`/admin/users/${id}`).then(r => r.data),
    listAuditLogs: (params: { page?: number; limit?: number; action?: string; search?: string }) =>
        api.get('/admin/activity', { params }).then(r => r.data),
    getBroadcast: () => api.get('/admin/broadcast').then(r => r.data),
    setBroadcast: (data: { title: string; message: string; type?: string; isActive?: boolean }) =>
        api.post('/admin/broadcast', data).then(r => r.data),
};

// ─── Global Broadcast Announcement ────────────────────────────────────────────
export const broadcastApi = {
    getActive: () => api.get('/broadcast/active').then(r => r.data),
};

// ─── Upload Sessions (Phone Camera Companion) ─────────────────────────────────
export const uploadSessionApi = {
    create: () => api.post<{ success: boolean; data: { sessionId: string; token: string; expiresAt: number } }>('/upload-sessions').then(r => r.data),
    getStatus: (sessionId: string, token: string) =>
        api.get<{ success: boolean; data: { status: 'PENDING' | 'COMPLETED' | 'EXPIRED'; imageUrl?: string | null } }>(`/upload-sessions/${sessionId}/status`, { params: { token } }).then(r => r.data),
    uploadPhoto: (sessionId: string, token: string, file: File, onProgress?: (percent: number) => void) => {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('token', token);
        return api.post<{ success: boolean; message: string; data: { imageUrl: string } }>(`/upload-sessions/${sessionId}/upload`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (e.total && onProgress) {
                    onProgress(Math.round((e.loaded * 100) / e.total));
                }
            },
        }).then(r => r.data);
    },
};

export default api;

