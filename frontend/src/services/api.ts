import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true, // Always send HttpOnly cookies
    headers: { 'Content-Type': 'application/json' },
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
    register: (data: { name: string; email: string; password: string; restaurantName: string }) =>
        api.post('/auth/register', data).then(r => r.data),
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
    uploadLogo: (file: File) => {
        const fd = new FormData();
        fd.append('image', file);
        return api.post('/restaurant/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
    },
    uploadCover: (file: File) => {
        const fd = new FormData();
        fd.append('image', file);
        return api.post('/restaurant/cover', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
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
    uploadImage: (id: string, file: File) => {
        const fd = new FormData();
        fd.append('image', file);
        return api.post(`/menu-items/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
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

export default api;
