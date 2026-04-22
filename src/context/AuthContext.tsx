import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { authService, usersAPI } from '../services/api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean; // Removed 'token' from context as it is now httpOnly
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    googleLogin: (token: string) => Promise<{ success: boolean; error?: string }>;
    register: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateUser: (user: User) => void;

}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBannedModalOpen, setIsBannedModalOpen] = useState(false);

    const checkAuth = async () => {
        try {
            // Try to fetch profile. If cookies are valid, this will succeed.
            const res = await usersAPI.getProfile();
            const userData = res.data.data || res.data;
            setUser(userData);
        } catch {
            // Not authenticated
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Check auth on mount
    useEffect(() => {
        checkAuth();
    }, []);

    // Listen for global ban events
    useEffect(() => {
        const handleBannedEvent = () => setIsBannedModalOpen(true);
        window.addEventListener('user_banned', handleBannedEvent);
        
        // Also check if user object already says they are banned directly
        if (user?.isBanned) {
            setIsBannedModalOpen(true);
        }

        return () => window.removeEventListener('user_banned', handleBannedEvent);
    }, [user]);

    const handleAcknowledgeBan = async () => {
        setIsBannedModalOpen(false);
        try {
            await authService.logout();
        } catch {
            // Ignore error
        }
        localStorage.removeItem('accessToken');
        setUser(null);
        window.location.href = '/login'; // Hard redirect to clear all states
    };    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login({ email, password });

            // The server sets the cookie. We just need to check success and user data.
            const data = response.data.data || response.data;
            const newUser = data.user || (data.id ? data : null);

            if (newUser) {
                if (data.token || response.data.token) localStorage.setItem('accessToken', data.token || response.data.token);
                setUser(newUser);
                return { success: true };
            } else {
                return { success: false, error: "Invalid user data received" };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (data: { name: string; email: string; phone: string; password: string }) => {
        try {
            await authService.register(data);
            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const googleLogin = async (token: string) => {
        try {
            const response = await authService.googleLogin(token);
            const data = response.data.data || response.data;
            const newUser = data.user || (data.id ? data : null);

            if (newUser) {
                if (data.token || response.data.token) localStorage.setItem('accessToken', data.token || response.data.token);
                setUser(newUser);
                return { success: true };
            } else {
                return { success: false, error: "Invalid user data received" };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.message || 'Google Login failed'
            };
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error("Logout error", error);
        }
        localStorage.removeItem('accessToken');
        setUser(null);
        // We might want to clear local user state even if server fail
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    // The Banned Modal UI
    const BannedModal = isBannedModalOpen ? (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Tài khoản bị khóa</h3>
                <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                    Tài khoản của bạn đã bị vô hiệu hóa do vi phạm chính sách của hệ thống. Bạn không thể tiếp tục truy cập các tính năng.
                </p>
                <button
                    onClick={handleAcknowledgeBan}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm shadow-red-200"
                >
                    Đã hiểu & Đăng xuất
                </button>
            </div>
        </div>
    ) : null;

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                isAdmin: user?.role === 'ADMIN',
                login,
                googleLogin,
                register,
                logout,
                updateUser,

            }}
        >

            {children}
            {BannedModal}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
