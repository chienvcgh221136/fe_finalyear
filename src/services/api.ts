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
    logout: () => {
        const refreshToken = localStorage.getItem('refreshToken');
        return api.post('/auth/logout', { refreshToken });
    },
    getProfile: () => api.get('/users/me'), // Assuming /users/me is the endpoint
};

export const usersAPI = {
    getProfile: authService.getProfile,
    updateProfile: (data: any) => api.put('/users/me', data),
};

export const postService = {
    getAll: (params?: any) => api.get('/posts', { params }),
    getById: (id: string) => api.get(`/posts/${id}`),
    getMyPosts: () => api.get('/posts/me/list'), // Corrected endpoint
    create: (data: FormData) => api.post('/posts', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    markSold: (id: string) => api.patch(`/posts/${id}/sold`),
};

export const postsAPI = postService; // Alias for compatibility with new Home code

export default api;
