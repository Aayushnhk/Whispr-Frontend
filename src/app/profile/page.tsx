// src/app/profile/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RedirectToMyProfile() {
  const router = useRouter();
  const { userId, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && userId) {
        router.replace(`/profile/${userId}`);
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, userId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
      <div className="flex flex-col items-center space-y-6">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-400"></div>
        <p className="text-xl font-semibold tracking-tight">Redirecting to profile...</p>
      </div>
    </div>
  );
}