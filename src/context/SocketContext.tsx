"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { OnlineUser } from "@/types";
import { Socket } from "socket.io-client";

interface SocketContextType {
  socket: typeof Socket | null;
  onlineUsers: OnlineUser[];
}

const SocketContext = createContext<SocketContextType | null>(null);

interface GlobalSocketManagerProps {
  children: ReactNode;
}

export const GlobalSocketManager: React.FC<GlobalSocketManagerProps> = ({
  children,
}) => {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    logout,
    refreshAuth,
  } = useAuth();
  const socketRef = useRef<typeof Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "https://whispr-backend-sarl.onrender.com";

  useEffect(() => {
    if (
      !isAuthenticated ||
      authLoading ||
      !user ||
      !user.id ||
      !user.firstName ||
      !user.lastName
    ) {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setOnlineUsers([]);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      return;
    }

    if (!socketUrl) {
      console.error(
        "NEXT_PUBLIC_SOCKET_URL is not defined or is empty! Socket connection cannot proceed."
      );
      return;
    }

    if (!socketRef.current || socketRef.current.io.uri !== socketUrl) {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }

      console.log("DEBUG 1: socketUrl passed to io():", socketUrl);

      const newSocket = io(socketUrl, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        transports: ["websocket", "polling"],
        timeout: 20000,
      });

      console.log(
        "DEBUG 2: newSocket.io.uri (after io() initialization):",
        newSocket.io.uri
      );

      socketRef.current = newSocket;
    }

    const socket = socketRef.current;

    if (socket && !socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      if (user && user.id && user.firstName && user.lastName) {
        socket?.emit(
          "registerUser",
          user.id,
          user.firstName,
          user.lastName,
          user.profilePicture
        );
      }
      console.log("Socket connected:", socket?.id);
    };

    const handleReconnect = () => {
      if (user && user.id && user.firstName && user.lastName) {
        socket?.emit(
          "registerUser",
          user.id,
          user.firstName,
          user.lastName,
          user.profilePicture
        );
      }
      console.log("Socket reconnected:", socket?.id);
    };

    const handleOnlineUsers = (usersList: OnlineUser[]) => {
      setOnlineUsers(usersList);
    };

    const handleDisconnect = (reason: string) => {
      console.log("Socket disconnected:", reason);
      setOnlineUsers([]);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };

    const startPing = () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      pingIntervalRef.current = setInterval(() => {
        if (socket?.connected) {
          socket.emit("ping", () => {
            console.log("Ping sent at:", new Date().toISOString());
          });
        } else {
          console.log("Socket not connected, attempting reconnect...");
          socket?.connect();
        }
      }, 5 * 60 * 1000);
    };

    if (socket) {
      socket.on("connect", handleConnect);
      socket.io.on("reconnect", handleReconnect);
      socket.on("onlineUsers", handleOnlineUsers);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", (error: Error) => { // Explicitly type 'error' as Error
        console.error("Socket connect_error:", error.message, error.stack);
        if (
          error.message.includes("Authentication error") ||
          error.message.includes("jwt expired")
        ) {
          refreshAuth()
            .then((refreshed) => {
              if (refreshed) {
                socket.connect();
              } else {
                logout();
              }
            })
            .catch(() => {
              logout();
            });
        }
      });

      socket.on("connect", startPing);
    }

    return () => {
      if (socket) {
        socket.off("connect", handleConnect);
        socket.io.off("reconnect", handleReconnect);
        socket.off("onlineUsers", handleOnlineUsers);
        socket.off("disconnect", handleDisconnect);
        socket.off("connect_error");
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, authLoading, socketUrl, user, logout, refreshAuth]);

  const contextValue = { socket: socketRef.current, onlineUsers };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error(
      "useSocketContext must be used within a GlobalSocketManager"
    );
  }
  return context;
};