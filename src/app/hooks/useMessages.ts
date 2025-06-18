import { useState, useCallback, useEffect } from "react";
import { Message } from "@/types";

interface UseMessagesProps {
  isAuthenticated: boolean;
  user: { id: string; firstName: string; lastName: string; profilePicture?: string } | null;
  currentRoom?: string;
  receiverId?: string | null;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_URL || "";

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
        senderFirstName: message.senderFirstName || undefined,
        senderLastName: message.senderLastName || undefined,
        senderProfilePicture: message.senderProfilePicture || undefined,
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
        return;
      }
      if (!BACKEND_URL) {
        console.error("Backend URL is not configured. Cannot fetch room messages.");
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${BACKEND_URL}/api/messages?room=${roomName}&limit=${limit}&skip=${skip}`,
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
        return;
      }
      if (!BACKEND_URL) {
        console.error("Backend URL is not configured. Cannot fetch private messages.");
        return;
      }
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found in local storage.");
        }

        const url = `${BACKEND_URL}/api/messages/private/${targetReceiverId}?limit=${limit}&skip=${skip}`;

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to fetch private messages: ${
              errorData.message || response.statusText
            }`
          );
        }
        const data = await response.json();
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
      return;
    }
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