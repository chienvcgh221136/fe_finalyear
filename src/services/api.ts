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
    delete: (id: string) => api.delete(`/admin/users/${id}`),
    getById: (id: string) => api.get(`/users/${id}`),
    block: (userIdToBlock: string) => api.post('/users/block', { userIdToBlock }),
    unblock: (userIdToUnblock: string) => api.post('/users/unblock', { userIdToUnblock }),
    getBlockedUsers: () => api.get('/users/blocked/all'),
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
    getSuggestions: (q: string) => api.get('/posts/suggestions', { params: { q } }),
    getById: (id: string) => api.get(`/posts/${id}`),
    getMyPosts: () => api.get('/posts/me/list'), // Corrected endpoint
    getByUser: (userId: string) => api.get(`/posts/user/${userId}/list`),
    create: (data: any) => api.post('/posts', data),
    update: (id: string, data: any) => api.put(`/posts/${id}`, data),
    delete: (id: string) => api.delete(`/posts/${id}`),
    markSold: (id: string) => api.patch(`/posts/${id}/sold`),
    markRented: (id: string) => api.patch(`/posts/${id}/rented`),
    getPending: () => api.get('/posts/admin/pending'),
    approve: (id: string) => api.patch(`/posts/${id}/approve`),
    reject: (id: string, reason: string) => api.patch(`/posts/${id}/reject`, { reason }),
};

export const reportsAPI = {
    create: (postId: string, data: { reason: string; description: string }) => api.post(`/reports/${postId}`, data),
    createUserReport: (data: { targetUserId: string; chatRoomId?: string; reason: string; description: string }) => api.post(`/reports/user/report`, data),
    getAll: () => api.get('/reports/admin'),
    resolve: (id: string) => api.patch(`/reports/${id}/resolve`),
    reject: (id: string) => api.patch(`/reports/${id}/reject`),
    delete: (id: string) => api.delete(`/reports/${id}`),
};

export const postsAPI = postService;

export const chatAPI = {
    createOrGet: (data: { postId: string; sellerId: string }) => api.post('/chat/create', data),
    getMyChats: () => api.get('/chat/my-chats'),
    getMessages: (chatRoomId: string) => api.get(`/chat/${chatRoomId}/messages`),
    sendMessage: (chatRoomId: string, content: string, type: 'TEXT' | 'IMAGE' = 'TEXT') => api.post(`/chat/${chatRoomId}/send`, { content, type }),
    markAsRead: (chatRoomId: string) => api.put(`/chat/${chatRoomId}/read`),
    searchMessages: (query: string) => api.get('/chat/search', { params: { query } }),
    setNickname: (chatRoomId: string, targetUserId: string, nickname: string) => api.put(`/chat/${chatRoomId}/nickname`, { targetUserId, nickname }),
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
    getUpgradeInfo: () => api.get('/vip/upgrade'),
    upgrade: (targetPackageId: string) => api.post('/vip/upgrade', { targetPackageId }),


    // Admin Endpoints
    createPackage: (data: any) => api.post('/vip/packages', data),
    updatePackage: (id: string, data: any) => api.put(`/vip/packages/${id}`, data),
    deletePackage: (id: string) => api.patch(`/vip/packages/${id}`),
    getAdminStats: () => api.get('/vip/admin/stats'),
    getVipUsers: () => api.get('/vip/admin/users'),
    updateUserVip: (userId: string, data: any) => api.put(`/vip/admin/users/${userId}`, data),

    // User Actions
    attach: (postIds: string[]) => api.post('/vip/attach', { postIds }),
    detach: (postIds: string[]) => api.post('/vip/detach', { postIds }),
};

export const favoriteAPI = {
    toggle: (postId: string) => api.post(`/favorites/${postId}`),
    getMyFavorites: () => api.get('/favorites/me'),
};

export const reviewsAPI = {
    getBySeller: (sellerId: string) => api.get(`/reviews/seller/${sellerId}`),
    getByPost: (postId: string) => api.get(`/reviews/post/${postId}`),
    create: (postId: string, data: any) => api.post(`/reviews/${postId}`, data),
    update: (id: string, data: any) => api.put(`/reviews/${id}`, data),
    delete: (id: string) => api.delete(`/reviews/${id}`),
};

export const statsAPI = {
    getMyStats: () => api.get('/stats/me'),
    getAdminOverview: () => api.get('/stats/admin/overview'),
    getAdminPostStats: () => api.get('/stats/admin/posts'),
};

export const commentsAPI = {
    getByPost: (postId: string) => api.get(`/comments/${postId}`),
    create: (postId: string, content: string) => api.post(`/comments/${postId}`, { content }),
    delete: (id: string) => api.delete(`/comments/${id}`)
};

export const appointmentAPI = {
    create: (postId: string, data: { appointmentTime: Date; note: string }) => api.post(`/appointments/${postId}`, data),
    getMyAppointments: () => api.get('/appointments/me'),
    updateStatus: (id: string, status: string) => api.patch(`/appointments/${id}`, { status }),
    delete: (id: string) => api.delete(`/appointments/${id}`),
};

export const leadsAPI = {
    showPhone: (postId: string) => api.post(`/leads/show-phone/${postId}`),
};


export const notificationAPI = {
    getAll: () => api.get('/notifications'),
    markRead: (id: string) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.put('/notifications/mark-all-read'),

    // Admin
    createSystemNotification: (data: any) => api.post('/notifications/admin/create', data),
    getSystemNotifications: () => api.get('/notifications/admin/list'),
    updateNotification: (id: string, message: string) => api.put(`/notifications/admin/${id}`, { message }),
    deleteNotification: (id: string) => api.delete(`/notifications/admin/${id}`),
};

export const pointsAPI = {
    getMyPoints: () => api.get('/points/me'),
    getVipItemsHistory: () => api.get('/points/vip-items-history'),
    redeem: (rewardKey: string) => api.post('/points/redeem', { rewardKey }),
    useItem: (itemKey: string, postId?: string, quantity: number = 1) => api.post('/points/use-item', { itemKey, postId, quantity }),

    // Admin
    getAllLogs: (params?: any) => api.get('/points/admin/logs', { params }),
    getAdminStats: () => api.get('/points/admin/stats'),
    getUsersWithPoints: (params?: any) => api.get('/points/admin/users-points', { params }),
    adjustUserPoints: (data: any) => api.post('/points/admin/adjust-points', data),
};

export default api;
