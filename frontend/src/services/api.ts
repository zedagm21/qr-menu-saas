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
};

// ─── Restaurant ───────────────────────────────────────────────────────────────
export const restaurantApi = {
    get: () => api.get('/restaurant').then(r => r.data),
    update: (data: object) => api.put('/restaurant', data).then(r => r.data),
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

