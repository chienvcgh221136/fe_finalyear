import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api', // Explicit URL for dev usually helps
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for cookies
});

// Request interceptor (no longer needs to add token manually)
api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors (e.g., 401)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Optional: Handle token refresh logic here
        return Promise.reject(error);
    }
);

export const authService = {
    login: (data: any) => api.post('/auth/login', data),
    register: (data: any) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    googleLogin: (token: string) => api.post('/auth/google', { token }),
    getProfile: () => api.get('/users/me'), // Assuming /users/me is the endpoint
};

export const usersAPI = {
    getProfile: authService.getProfile,
    updateProfile: (data: any) => api.put('/users/me', data),
    getAll: () => api.get('/users'),
    ban: (id: string) => api.patch(`/admin/users/${id}/ban`),
    unban: (id: string) => api.patch(`/admin/users/${id}/unban`),
};

export const filesAPI = {
    upload: (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        return api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

export const postService = {
    getAll: (params?: any) => api.get('/posts', { params }),
    getById: (id: string) => api.get(`/posts/${id}`),
    getMyPosts: () => api.get('/posts/me/list'), // Corrected endpoint
    create: (data: any) => api.post('/posts', data),
    update: (id: string, data: any) => api.put(`/posts/${id}`, data),
    delete: (id: string) => api.delete(`/posts/${id}`),
    markSold: (id: string) => api.patch(`/posts/${id}/sold`),
    getPending: () => api.get('/posts/admin/pending'),
    approve: (id: string) => api.patch(`/posts/${id}/approve`),
    reject: (id: string, reason: string) => api.patch(`/posts/${id}/reject`, { reason }),
};

export const reportsAPI = {
    create: (postId: string, data: { reason: string; description: string }) => api.post(`/reports/${postId}`, data),
    getAll: () => api.get('/reports/admin'),
    resolve: (id: string) => api.patch(`/reports/${id}/resolve`),
    reject: (id: string) => api.patch(`/reports/${id}/reject`),
};

export const postsAPI = postService;

export const chatAPI = {
    createOrGet: (data: { postId: string; sellerId: string }) => api.post('/chat/create', data),
    getMyChats: () => api.get('/chat/my-chats'),
    getMessages: (chatRoomId: string) => api.get(`/chat/${chatRoomId}/messages`),
    sendMessage: (chatRoomId: string, content: string, type: 'TEXT' | 'IMAGE' = 'TEXT') => api.post(`/chat/${chatRoomId}/send`, { content, type }),
    markAsRead: (chatRoomId: string) => api.put(`/chat/${chatRoomId}/read`),
    searchMessages: (query: string) => api.get('/chat/search', { params: { query } }),
    deleteChat: (chatRoomId: string) => api.delete(`/chat/${chatRoomId}`),
};

export const walletAPI = {
    getMe: () => api.get('/wallet/me'),
    topup: (amount: number, method?: string) => api.post('/wallet/topup', { amount, method }),
    getTransactions: () => api.get('/wallet/transactions'),
};

export const withdrawAPI = {
    request: (amount: number) => api.post('/withdraw/request', { amount }),
    verify: (otp: string, amount: number, bank: any) => api.post('/withdraw/verify', { otp, amount, bank }),
    getAll: (status?: string) => api.get('/withdraw/admin/requests', { params: { status } }),
    updateStatus: (id: string, status: string, adminNote?: string) => api.put(`/withdraw/admin/request/${id}`, { status, adminNote }),
};

export const vipAPI = {
    getPackages: () => api.get('/vip/packages'),
    purchase: (packageId: string) => api.post('/vip/purchase', { packageId }),
    getMyVip: () => api.get('/vip/me'),

    // Admin Endpoints
    createPackage: (data: any) => api.post('/vip/packages', data),
    updatePackage: (id: string, data: any) => api.put(`/vip/packages/${id}`, data),
    deletePackage: (id: string) => api.patch(`/vip/packages/${id}`),
    getAdminStats: () => api.get('/vip/admin/stats'),
    getVipUsers: () => api.get('/vip/admin/users'),
};

export const statsAPI = {
    getMyStats: () => api.get('/stats/me'),
    getAdminOverview: () => api.get('/stats/admin/overview'),
};

export const leadsAPI = {
    showPhone: (postId: string) => api.post(`/leads/show-phone/${postId}`),
};

export default api;
