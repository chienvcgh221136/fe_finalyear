import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
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
    }
};

export const postService = {
    getAll: (params?: any) => api.get('/posts', { params }),
    getById: (id: string) => api.get(`/posts/${id}`),
};

export const postsAPI = postService; // Alias for compatibility with new Home code

export default api;
