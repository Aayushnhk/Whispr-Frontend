"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { OnlineUser } from "@/models/types";
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
  const { user, isAuthenticated, isLoading: authLoading, logout, refreshAuth } = useAuth();
  const socketRef = useRef<typeof Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:4001";

  useEffect(() => {
    if (!isAuthenticated || authLoading || !user || !user.id || !user.firstName || !user.lastName) {
      if (socketRef.current?.connected) {
        console.log('Global socket: Disconnecting due to incomplete auth data or logout.');
        socketRef.current.disconnect();
        socketRef.current = null;
        setOnlineUsers([]);
      }
      return;
    }

    if (!socketRef.current || socketRef.current.io.uri !== socketUrl) {
      if (socketRef.current?.connected) {
        console.log('Global socket: Disconnecting existing socket for re-initialization.');
        socketRef.current.disconnect();
      }
      const newSocket: typeof Socket = io(socketUrl, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
      socketRef.current = newSocket;
      console.log('New global socket instance created or re-initialized.');
    }

    const socket = socketRef.current;

    if (socket && !socket.connected) {
      console.log('Global socket: Attempting to connect.');
      socket.connect();
    }

    const handleConnect = () => {
      console.log('Global socket connected:', socket?.id);
      if (user && user.id && user.firstName && user.lastName) {
        socket?.emit('registerUser', user.id, user.firstName, user.lastName, user.profilePicture);
      }
    };

    const handleReconnect = () => {
      console.log('Global socket reconnected.');
      if (user && user.id && user.firstName && user.lastName) {
        socket?.emit('registerUser', user.id, user.firstName, user.lastName, user.profilePicture);
      }
    };

    const handleOnlineUsers = (usersList: OnlineUser[]) => {
      // Remove filter to include current user
      setOnlineUsers(usersList);
      console.log('Updated global online users:', usersList);
    };

    const handleDisconnect = (reason: string) => {
      console.log('Global socket disconnected:', reason);
      setOnlineUsers([]);
      if (reason === 'io server disconnect' && socket?.id) {
        // Handle specific server-side disconnects if needed
      }
    };

    if (socket) {
      socket.on('connect', handleConnect);
      socket.io.on('reconnect', handleReconnect);
      socket.on('onlineUsers', handleOnlineUsers);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error);
        if (error.message.includes("Authentication error") || error.message.includes("jwt expired")) {
          console.log("Token expired or invalid, attempting refresh...");
          refreshAuth().then(refreshed => {
            if (refreshed) {
              console.log("Token refreshed, reconnecting socket.");
              socket.connect();
            } else {
              console.log("Token refresh failed, logging out.");
              logout();
            }
          }).catch(err => {
            console.error("Error during token refresh attempt:", err);
            logout();
          });
        }
      });
    }

    return () => {
      if (socket) {
        console.log('Global socket: Cleaning up listeners and disconnecting.');
        socket.off('connect', handleConnect);
        socket.io.off('reconnect', handleReconnect);
        socket.off('onlineUsers', handleOnlineUsers);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error');
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
    throw new Error("useSocketContext must be used within a GlobalSocketManager");
  }
  return context;
};