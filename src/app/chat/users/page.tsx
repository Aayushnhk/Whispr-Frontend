// app/chat/users/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSocketContext } from "@/context/SocketContext";
import UserCard from "@/app/components/UserCard";

interface UserInfo {
  _id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

export default function UsersListPage() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { onlineUsers } = useSocketContext();
  const router = useRouter();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    setLoadingUsers(true);
    try {
      const formattedUsers = onlineUsers.map((user) => ({
        _id: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture || "/default-avatar.png",
      }));
      setUsers(formattedUsers);
      setError("");
    } catch (err: any) {
      setError("Failed to load online users");
    } finally {
      setLoadingUsers(false);
    }
  }, [authLoading, isAuthenticated, router, onlineUsers]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
        <div className="flex flex-col items-center space-y-6">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-400" />
          <p className="text-xl font-semibold tracking-tight">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-sm">
        <h1 className="text-2xl font-bold text-blue-400 tracking-tight">
          Start a Private Chat
        </h1>
        <Link href="/chat">
          <button className="px-4 py-2 bg-blue-600 text-gray-100 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium cursor-pointer flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span>Back to Rooms</span>
          </button>
        </Link>
      </header>

      <main className="flex-1 p-6 overflow-y-auto flex flex-col items-center">
        {loadingUsers ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-400 mb-4" />
            <p className="text-lg font-medium">Loading users...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mb-4 opacity-75"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a7 7 0 00-7 7v0a7 7 0 001.543 4.171L2 18l5.5-2.5A7 7 0 0016 9v0a7 7 0 00-7-7zm1.05 4.293a1 0 1 1 1.414 1.414 1 0 0 1-1.414-1.414zm2.536 2.464a1 0 1 1 1.414 1.414 1 0 0 1-1.414-1.414z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-lg font-medium">No users online</p>
          </div>
        ) : (
          <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              Available Users
            </h2>
            <div className="space-y-3">
              {users.map((user) => (
                <UserCard key={user._id} user={user} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}