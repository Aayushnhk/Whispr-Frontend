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

  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "https://whispr-backend-sarl.onrender.com/socket.io";

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

      console.log("DEBUG 1: socketUrl passed to io():", socketUrl); // What 'io()' receives

      const newSocket: typeof Socket = io(socketUrl, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
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
    };

    const handleOnlineUsers = (usersList: OnlineUser[]) => {
      setOnlineUsers(usersList);
    };

    const handleDisconnect = (reason: string) => {
      setOnlineUsers([]);
      if (reason === "io server disconnect" && socket?.id) {
      }
    };

    if (socket) {
      socket.on("connect", handleConnect);
      socket.io.on("reconnect", handleReconnect);
      socket.on("onlineUsers", handleOnlineUsers);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", (error: Error) => {
        console.error("Socket connection error:", error); // Log the error for debugging
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
    }

    return () => {
      if (socket) {
        socket.off("connect", handleConnect);
        socket.io.off("reconnect", handleReconnect);
        socket.off("onlineUsers", handleOnlineUsers);
        socket.off("disconnect", handleDisconnect);
        socket.off("connect_error");
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
