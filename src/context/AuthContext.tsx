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

    // Check auth on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Try to fetch profile. If cookies are valid, this will succeed.
                const res = await usersAPI.getProfile();
                const userData = res.data.data || res.data;
                setUser(userData);
            } catch (error) {
                // Not authenticated
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login({ email, password });

            // The server sets the cookie. We just need to check success and user data.
            const data = response.data.data || response.data;
            const newUser = data.user || (data.id ? data : null);

            if (newUser) {
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
        setUser(null);
        // We might want to clear local user state even if server fail
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

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
