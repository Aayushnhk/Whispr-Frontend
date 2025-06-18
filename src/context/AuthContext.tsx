// src/context/AuthContext.tsx
"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// REMOVE: import jwt from 'jsonwebtoken';
import { jwtDecode } from "jwt-decode"; // ADD THIS: Use jwt-decode for client-side decoding

export interface UserAuthData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture: string;
    role: 'user' | 'admin';
}

interface AuthContextType {
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, refreshToken: string, userData: UserAuthData) => void;
    logout: () => void;
    isLoading: boolean;
    user: UserAuthData | null;
    refreshAuth: () => Promise<boolean>;
    userId: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profilePicture: string | null;
    role: 'user' | 'admin' | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<UserAuthData | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const INACTIVITY_TIMEOUT = 3600000; // 1 hour

    const BACKEND_URL = process.env.NEXT_PUBLIC_URL || "";

    const updateLastActivity = useCallback(() => {
        localStorage.setItem('lastActivity', Date.now().toString());
    }, []);

    const clearAuthData = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('lastActivity');

        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    const logout = useCallback(() => {
        clearAuthData();
        router.replace('/login');
    }, [clearAuthData, router]);

    const refreshAuth = useCallback(async (): Promise<boolean> => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                logout();
                return false;
            }

            if (!BACKEND_URL) {
                console.error("Backend URL is not configured. Cannot refresh auth token.");
                logout();
                return false;
            }

            const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                if (data.user) {
                    localStorage.setItem('userData', JSON.stringify(data.user));
                    setUser(data.user);
                }
                setToken(data.token);
                updateLastActivity();
                return true;
            } else {
                logout();
                return false;
            }
        } catch (error) {
            logout();
            return false;
        }
    }, [logout, updateLastActivity, BACKEND_URL]);

    const login = useCallback((
        newToken: string,
        newRefreshToken: string,
        userData: UserAuthData
    ) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('lastActivity', Date.now().toString());

        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        setIsLoading(false);
        router.replace('/chat');
    }, [router]);

    useEffect(() => {
        const validateAuth = async () => {
            try {
                const storedToken = localStorage.getItem('token');
                const storedRefreshToken = localStorage.getItem('refreshToken');
                const storedUserData = localStorage.getItem('userData');
                const storedLastActivity = localStorage.getItem('lastActivity');

                if (!storedToken || !storedRefreshToken || !storedUserData) {
                    throw new Error('Missing auth data');
                }

                const parsedUserData: UserAuthData = JSON.parse(storedUserData);

                // Use jwtDecode for client-side decoding
                const decoded = jwtDecode(storedToken) as { exp?: number }; // Changed jwt.decode to jwtDecode
                if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
                    const refreshed = await refreshAuth();
                    if (!refreshed) throw new Error('Token refresh failed');
                    return;
                }

                if (storedLastActivity) {
                    const lastActivity = parseInt(storedLastActivity, 10);
                    if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
                        throw new Error('Session expired due to inactivity');
                    }
                }

                setToken(storedToken);
                setUser(parsedUserData);
                setIsAuthenticated(true);
                updateLastActivity();

                if (pathname === '/login' || pathname === '/') {
                    router.replace('/chat');
                }
            } catch (error) {
                clearAuthData();
                if (pathname !== '/login' && pathname !== '/') {
                    router.replace('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        validateAuth();

        const interval = setInterval(updateLastActivity, 60000);
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(event => window.addEventListener(event, updateLastActivity));

        return () => {
            clearInterval(interval);
            events.forEach(event => window.removeEventListener(event, updateLastActivity));
        };
    }, [router, pathname, clearAuthData, refreshAuth, updateLastActivity, INACTIVITY_TIMEOUT]);

    const userId = user?.id || null;
    const firstName = user?.firstName || null;
    const lastName = user?.lastName || null;
    const email = user?.email || null;
    const profilePicture = user?.profilePicture || null;
    const role = user?.role || null;

    return (
        <AuthContext.Provider
            value={{
                token,
                userId,
                firstName,
                lastName,
                email,
                profilePicture,
                role,
                isAuthenticated,
                login,
                logout,
                isLoading,
                user,
                refreshAuth,
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