"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatLayout from "@/app/components/chat/ChatLayout";
import useSocket from "@/app/hooks/useSocket";
import useMessages from "@/app/hooks/useMessages";
import { useAuth } from "@/context/AuthContext";
import { User as UserType, OnlineUser, Message } from "@/types";
// REMOVE: import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode"; // ADD THIS: Use jwt-decode for client-side decoding

export default function ChatPage() {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    logout,
    refreshAuth,
  } = useAuth();
  const { userId: receiverIdFromUrl } = useParams<{ userId?: string }>();
  const router = useRouter();

  const [currentRoom, setCurrentRoom] = useState<string>("general");
  const [isPrivateChat, setIsPrivateChat] = useState<boolean>(!!receiverIdFromUrl);
  const [receiverFirstName, setReceiverFirstName] = useState<string | null>(null);
  const [receiverLastName, setReceiverLastName] = useState<string | null>(null);
  const [onlineUsersData, setOnlineUsersData] = useState<OnlineUser[]>([]);

  // Define the backend URL from environment variables
  const BACKEND_URL = process.env.NEXT_PUBLIC_URL || ""; // Using NEXT_PUBLIC_URL as per your Vercel setup

  const { messages, setMessages, fetchRoomMessages, fetchPrivateMessages } =
    useMessages({
      isAuthenticated,
      user,
      currentRoom,
    });

  const {
    socket,
    onlineUsers: rawOnlineUsers,
    typingUsers,
    clearTypingStatus,
    isTypingRef,
    typingTimeoutRef,
  } = useSocket({
    user,
    isAuthenticated,
    authLoading,
    currentRoom,
    isPrivateChat,
    receiverId: receiverIdFromUrl,
    receiverFirstName,
    receiverLastName,
    setMessages,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleTokenRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const refreshed = await refreshAuth();
      if (!refreshed) {
        logout();
        return false;
      }
      return true;
    } catch (error) {
      logout();
      return false;
    }
  }, [refreshAuth, logout]);

  useEffect(() => {
    if (rawOnlineUsers && rawOnlineUsers.length > 0) {
      const formattedUsers = rawOnlineUsers.map((u) => ({
        userId: u.userId,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: u.fullName || `${u.firstName} ${u.lastName}`,
        profilePicture: u.profilePicture || "/default-avatar.png",
      }));
      setOnlineUsersData(formattedUsers);
    } else {
      setOnlineUsersData([]);
    }
  }, [rawOnlineUsers]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    if (isPrivateChat && receiverIdFromUrl && typeof receiverIdFromUrl === "string") {
      const fetchReceiverDetails = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            logout();
            return;
          }

          // Use jwtDecode for client-side decoding
          const decoded = jwtDecode(token) as { exp?: number }; // Changed jwt.decode to jwtDecode
          if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
            const refreshed = await handleTokenRefresh();
            if (!refreshed) return;
          }

          // Check if backend URL is available
          if (!BACKEND_URL) {
            console.error("Backend URL is not configured. Cannot fetch receiver details.");
            logout(); // Or handle this error gracefully
            return;
          }

          const response = await fetch(
            `${BACKEND_URL}/api/users?userId=${encodeURIComponent(receiverIdFromUrl)}`, // Updated API call
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.status === 401) {
            const refreshed = await handleTokenRefresh();
            if (refreshed) {
              fetchReceiverDetails();
            }
            return;
          }

          if (!response.ok) {
            throw new Error("Failed to fetch receiver details");
          }

          const data = await response.json();
          setReceiverFirstName(data.user.firstName);
          setReceiverLastName(data.user.lastName);
          fetchPrivateMessages(user.id, receiverIdFromUrl);
        } catch (error) {
          setReceiverFirstName(null);
          setReceiverLastName(null);
          router.push("/chat");
        }
      };
      fetchReceiverDetails();
    } else {
      setMessages([]);
      fetchRoomMessages(currentRoom);
    }
  }, [
    isAuthenticated,
    user,
    isPrivateChat,
    receiverIdFromUrl,
    currentRoom,
    fetchPrivateMessages,
    fetchRoomMessages,
    router,
    logout,
    handleTokenRefresh,
    setMessages,
    BACKEND_URL // Added BACKEND_URL to dependencies
  ]);

  const handleRoomChange = useCallback(
    (newRoom: string) => {
      if (socket && user && currentRoom !== newRoom) {
        if (isTypingRef.current) clearTypingStatus();
        if (isPrivateChat && receiverIdFromUrl && typeof receiverIdFromUrl === "string") {
          socket.emit("leavePrivateRoom", {
            senderId: user.id,
            receiverId: receiverIdFromUrl,
          });
        }
        socket.emit("joinRoom", newRoom, user.id, user.firstName, user.lastName);
        socket.emit("leaveRoom", currentRoom, user.id, user.firstName, user.lastName);
        setIsPrivateChat(false);
        setReceiverFirstName(null);
        setReceiverLastName(null);
        setCurrentRoom(newRoom);
        setMessages([]);
        fetchRoomMessages(newRoom);
      }
    },
    [
      socket,
      user,
      currentRoom,
      isPrivateChat,
      receiverIdFromUrl,
      clearTypingStatus,
      fetchRoomMessages,
      setMessages,
    ]
  );

  const startPrivateConversation = useCallback(
    async (targetUserId: string, targetFullName: string) => {
      if (!socket || !user || targetUserId === user.id) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          logout();
          return;
        }

        // Use jwtDecode for client-side decoding
        const decoded = jwtDecode(token) as { exp?: number }; // Changed jwt.decode to jwtDecode
        if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
          const refreshed = await handleTokenRefresh();
          if (!refreshed) return;
        }

        router.push(`/chat/private/${targetUserId}`);
      } catch (error) {
      }
    },
    [socket, user, router, logout, handleTokenRefresh]
  );

  const navigateToUserProfile = useCallback(
    (fullName: string) => {
      if (fullName === `${user?.firstName} ${user?.lastName}`) {
        router.push("/profile");
      } else {
        router.push(`/chat/users?fullName=${encodeURIComponent(fullName)}`);
      }
    },
    [user, router]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-400"></div>
        <p className="text-xl font-semibold text-gray-100 ml-4">
          Loading chat...
        </p>
      </div>
    );
  }

  return (
    <ChatLayout
      user={user}
      currentRoom={currentRoom}
      isPrivateChat={isPrivateChat}
      receiverFirstName={receiverFirstName}
      receiverLastName={receiverLastName}
      messages={messages}
      setMessages={setMessages}
      onlineUsers={onlineUsersData}
      typingUsers={typingUsers}
      handleRoomChange={handleRoomChange}
      startPrivateConversation={startPrivateConversation}
      navigateToUserProfile={navigateToUserProfile}
      logout={logout}
      messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
      socket={socket}
      fetchRoomMessages={fetchRoomMessages}
      fetchPrivateMessages={fetchPrivateMessages}
    />
  );
}