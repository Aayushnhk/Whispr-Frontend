// src/context/AuthContext.tsx
"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import jwt from 'jsonwebtoken';

// Define the structure of the user data
export interface UserAuthData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture: string;
    role: 'user' | 'admin';
}

// Define the shape of the AuthContext
interface AuthContextType {
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, refreshToken: string, userData: UserAuthData) => void;
    logout: () => void;
    isLoading: boolean;
    user: UserAuthData | null; // This is the central user object
    refreshAuth: () => Promise<boolean>;
    // Derived properties for convenience (get their values from the 'user' object)
    userId: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profilePicture: string | null;
    role: 'user' | 'admin' | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => { // FIX 1: Corrected children type here
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<UserAuthData | null>(null); // Central user state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const INACTIVITY_TIMEOUT = 3600000; // 1 hour

    const updateLastActivity = useCallback(() => {
        localStorage.setItem('lastActivity', Date.now().toString());
    }, []);

    const clearAuthData = useCallback(() => {
        console.log("Clearing auth data");
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData'); // FIX 2: Only remove the single userData item
        localStorage.removeItem('lastActivity');

        setToken(null);
        setUser(null); // Clear user object
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

            const response = await fetch('/api/auth/refresh', {
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
                // Assuming refresh endpoint might return updated user data
                if (data.user) {
                    localStorage.setItem('userData', JSON.stringify(data.user)); // FIX 3: Store updated user data
                    setUser(data.user); // FIX 4: Update user state
                }
                setToken(data.token);
                updateLastActivity();
                return true;
            } else {
                logout();
                return false;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
            return false;
        }
    }, [logout, updateLastActivity]);

    const login = useCallback((
        newToken: string,
        newRefreshToken: string,
        userData: UserAuthData // Expect userData as a single object
    ) => {
        console.log("Login data received:", { newToken, newRefreshToken, userData });
        
        // FIX 5: Removed the problematic sanitizedLastName logic

        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        localStorage.setItem('userData', JSON.stringify(userData)); // FIX 6: Store user data as JSON string
        localStorage.setItem('lastActivity', Date.now().toString());

        setToken(newToken);
        setUser(userData); // FIX 7: Set the user object
        setIsAuthenticated(true);
        setIsLoading(false);
        router.replace('/chat');
    }, [router]);

    useEffect(() => {
        const validateAuth = async () => {
            try {
                const storedToken = localStorage.getItem('token');
                const storedRefreshToken = localStorage.getItem('refreshToken');
                const storedUserData = localStorage.getItem('userData'); // FIX 8: Get combined user data
                const storedLastActivity = localStorage.getItem('lastActivity');

                if (!storedToken || !storedRefreshToken || !storedUserData) {
                    throw new Error('Missing auth data');
                }

                const parsedUserData: UserAuthData = JSON.parse(storedUserData); // FIX 9: Parse user data

                // Check token expiration
                const decoded = jwt.decode(storedToken) as { exp?: number };
                if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
                    const refreshed = await refreshAuth();
                    if (!refreshed) throw new Error('Token refresh failed');
                    // If refreshed, refreshAuth would have already updated token and user state,
                    // so we don't need to do it here again. Just return.
                    return; 
                }

                // Check inactivity
                if (storedLastActivity) {
                    const lastActivity = parseInt(storedLastActivity, 10);
                    if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
                        throw new Error('Session expired due to inactivity');
                    }
                }

                // All checks passed
                setToken(storedToken);
                setUser(parsedUserData); // FIX 10: Set the user object from stored data
                setIsAuthenticated(true);
                updateLastActivity();

                if (pathname === '/login' || pathname === '/') {
                    router.replace('/chat');
                }
            } catch (error) {
                console.error('Auth validation failed:', error);
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

    // Derive individual user properties from the 'user' object for convenience
    const userId = user?.id || null;
    const firstName = user?.firstName || null;
    const lastName = user?.lastName || null;
    const email = user?.email || null;
    const profilePicture = user?.profilePicture || null;
    const role = user?.role || null;


    console.log("AuthContext providing:", { user, isAuthenticated, isLoading, token, userId, firstName, lastName, email, profilePicture, role });

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
                user, // Provide the combined user object
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