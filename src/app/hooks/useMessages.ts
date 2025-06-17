// File: src/app/hooks/useMessages.ts

import { useState, useCallback, useEffect } from "react";
import { Message } from "@/models/types";

interface UseMessagesProps {
  isAuthenticated: boolean;
  user: { id: string; firstName: string; lastName: string; profilePicture?: string } | null; // Added profilePicture to user
  currentRoom?: string;
  receiverId?: string | null;
}

const useMessages = ({
  isAuthenticated,
  user,
  currentRoom,
  receiverId,
}: UseMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const normalizeMessage = useCallback(
    (message: any): Message => {
      let senderName = message.senderUsername;
      if (!senderName) {
        if (message.senderFirstName && message.senderLastName) {
          senderName = `${message.senderFirstName} ${message.senderLastName}`;
        } else if (message.sender) {
          senderName = message.sender;
        } else {
          senderName = "Unknown Sender";
        }
      }

      if (
        user?.id &&
        (message.senderId === user.id || message.sender === user.id)
      ) {
        if (!senderName.endsWith(" (You)")) {
          senderName = `${senderName} (You)`;
        }
      }

      return {
        id: message._id?.toString() || message.id || Date.now().toString(),
        _id: message._id?.toString(),
        sender: senderName,
        senderId:
          message.senderId ||
          message.sender?._id?.toString() ||
          message.sender?.toString() ||
          "",
        senderFirstName: message.senderFirstName || undefined, // ADDED
        senderLastName: message.senderLastName || undefined,   // ADDED
        senderProfilePicture: message.senderProfilePicture || undefined, // ADDED THIS LINE
        text: message.text || message.content || undefined,
        timestamp:
          message.timestamp || message.createdAt || new Date().toISOString(),
        room: message.room || undefined,
        chatType: message.chatType || (receiverId ? "private" : "room"),
        receiverId:
          message.receiverId ||
          message.receiver?._id?.toString() ||
          message.receiver?.toString() ||
          undefined,
        receiver:
          message.receiverUsername ||
          (message.receiverFirstName && message.receiverLastName
            ? `${message.receiverFirstName} ${message.receiverLastName}`
            : undefined),
        receiverFirstName: message.receiverFirstName || undefined,
        receiverLastName: message.receiverLastName || undefined,
        isEdited: message.isEdited || false,
        fileUrl: message.fileUrl || undefined,
        fileType: message.fileType || undefined,
        fileName: message.fileName || undefined,
        replyTo: message.replyTo
          ? {
              id: message.replyTo.id || message.replyTo._id?.toString(),
              sender: message.replyTo.sender || "Unknown",
              text: message.replyTo.text || undefined,
              fileUrl: message.replyTo.fileUrl || undefined,
              fileType: message.replyTo.fileType || undefined,
              fileName: message.replyTo.fileName || undefined,
            }
          : undefined,
      };
    },
    [receiverId, user?.id]
  );

  const fetchRoomMessages = useCallback(
    async (roomName: string, limit = 50, skip = 0) => {
      if (!isAuthenticated) {
        console.log("fetchRoomMessages: Not authenticated, skipping fetch");
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `/api/messages?room=${roomName}&limit=${limit}&skip=${skip}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("fetchRoomMessages: Fetched messages", data.messages);
        const normalizedMessages = data.messages.map(normalizeMessage);
        setMessages(normalizedMessages);
      } catch (error) {
        console.error("Error fetching room messages:", error);
      }
    },
    [isAuthenticated, normalizeMessage]
  );

  const fetchPrivateMessages = useCallback(
    async (
      currentLoggedInUserId: string,
      targetReceiverId: string,
      limit = 50,
      skip = 0
    ) => {
      if (!isAuthenticated || !currentLoggedInUserId || !targetReceiverId) {
        console.log(
          "fetchPrivateMessages: Missing auth or user IDs, skipping fetch"
        );
        return;
      }
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found in local storage.");
        }

        const url = `/api/messages/private/${targetReceiverId}?limit=${limit}&skip=${skip}`;

        console.log("Fetching private messages from URL:", url);

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error Response:", errorData);
          throw new Error(
            `Failed to fetch private messages: ${
              errorData.message || response.statusText
            }`
          );
        }
        const data = await response.json();
        console.log("fetchPrivateMessages: Fetched messages", data.messages);
        const normalizedMessages = data.messages.map(normalizeMessage);
        setMessages(normalizedMessages);
      } catch (error: any) {
        console.error("Error fetching private messages:", error.message);
      }
    },
    [isAuthenticated, normalizeMessage]
  );

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      console.log("useMessages: Skipping fetch due to missing auth or user", {
        isAuthenticated,
        user,
      });
      return;
    }
    console.log("useMessages: Triggering fetch", {
      currentRoom,
      receiverId,
      userId: user.id,
    });
    if (currentRoom) {
      fetchRoomMessages(currentRoom);
    } else if (receiverId) {
      fetchPrivateMessages(user.id, receiverId);
    }
  }, [
    isAuthenticated,
    user,
    currentRoom,
    receiverId,
    fetchRoomMessages,
    fetchPrivateMessages,
  ]);

  return {
    messages,
    setMessages,
    fetchRoomMessages,
    fetchPrivateMessages,
    normalizeMessage,
  };
};

export default useMessages;