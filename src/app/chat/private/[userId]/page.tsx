"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatHeader from "@/app/components/chat/ChatHeader";
import ChatMessages from "@/app/components/chat/ChatMessages";
import MessageInput from "@/app/components/chat/MessageInput";
import useSocket from "@/app/hooks/useSocket";
import useMessages from "@/app/hooks/useMessages";
import useAuthRedirect from "@/app/hooks/useAuthRedirect";
import useOtherUser from "@/app/hooks/useOtherUser";
import { Message, ContextMenu } from "@/types";

export default function PrivateChatPage() {
  const { user, isAuthenticated, authLoading, logout } = useAuthRedirect();
  const { userId: receiverId } = useParams<{ userId?: string }>();
  const router = useRouter();

  const { otherUser, loading: userLoading, error: userError } = useOtherUser({
    userId: receiverId ?? null,
    currentUserId: user?.id ?? null,
  });

  const [messageInput, setMessageInput] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null!);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    messageId: null,
    position: { x: 0, y: 0 },
  });
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null!);

  const { messages, setMessages, fetchPrivateMessages, normalizeMessage } = useMessages({
    isAuthenticated,
    user,
    receiverId,
  });

  const { socket, typingUsers, clearTypingStatus, isTypingRef, typingTimeoutRef } = useSocket({
    user,
    isAuthenticated,
    authLoading,
    isPrivateChat: true,
    receiverId,
    receiverFirstName: otherUser?.firstName,
    receiverLastName: otherUser?.lastName,
    setMessages,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const contextMenuElement = document.getElementById("context-menu");
      if (
        contextMenu.visible &&
        contextMenuElement &&
        !contextMenuElement.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".message-container")
      ) {
        setContextMenu({
          visible: false,
          messageId: null,
          position: { x: 0, y: 0 },
        });
      }
    };
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("contextmenu", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("contextmenu", handleClickOutside);
    };
  }, [contextMenu.visible]);

  const sendMessage = useCallback(async () => {
    if (!socket || !user || !receiverId || !otherUser) {
      if (selectedFile && isUploadingFile) {
        setFileUploadError("Please wait for the current file upload to complete.");
      } else {
        setFileUploadError("Chat not ready. Please try again.");
      }
      return;
    }
    if (!messageInput.trim() && !selectedFile) {
      setFileUploadError("Message cannot be empty.");
      return;
    }

    const tempMessageId = Date.now().toString();

    const rawNewMessage: {
      id: string;
      senderId: string;
      senderFirstName: string;
      senderLastName: string;
      senderProfilePicture?: string;
      text?: string;
      timestamp: string;
      chatType: string;
      receiverId: string;
      receiver: string;
      receiverFirstName: string;
      receiverLastName: string;
      isEdited: boolean;
      replyTo?: {
        id: string;
        sender: string;
        text?: string;
        fileUrl?: string;
        fileType?: string;
        fileName?: string;
      };
      fileUrl?: string;
      fileType?: string;
      fileName?: string;
      isProfilePictureUpload?: boolean;
    } = {
      id: tempMessageId,
      senderId: user.id,
      senderFirstName: user.firstName,
      senderLastName: user.lastName,
      senderProfilePicture: user.profilePicture,
      text: messageInput.trim() || undefined,
      timestamp: new Date().toISOString(),
      chatType: "private",
      receiverId,
      receiver: otherUser.username,
      receiverFirstName: otherUser.firstName,
      receiverLastName: otherUser.lastName,
      isEdited: false,
      replyTo: replyingTo
        ? {
            id: replyingTo._id || replyingTo.id,
            sender: replyingTo.sender,
            text: replyingTo.text,
            fileUrl: replyingTo.fileUrl,
            fileType: replyingTo.fileType,
            fileName: replyingTo.fileName,
          }
        : undefined,
      isProfilePictureUpload: false,
    };

    const optimisticMessage: Message = normalizeMessage(rawNewMessage);

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      let finalMessageData: typeof rawNewMessage = {
        ...rawNewMessage,
        id: tempMessageId,
        senderFirstName: user.firstName,
        senderLastName: user.lastName,
        senderProfilePicture: user.profilePicture,
        receiverFirstName: otherUser.firstName,
        receiverLastName: otherUser.lastName,
        receiver: otherUser.username,
      };

      if (selectedFile) {
        setIsUploadingFile(true);
        setFileUploadError(null);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("userId", user.id);
        formData.append("senderFirstName", user.firstName);
        formData.append("senderLastName", user.lastName);
        formData.append("chatType", "private");
        formData.append("receiverId", receiverId);
        formData.append("receiverFirstName", otherUser.firstName);
        formData.append("receiverLastName", otherUser.lastName);
        formData.append("text", messageInput.trim());
        formData.append("isProfilePictureUpload", JSON.stringify(false));
        if (replyingTo) {
          formData.append(
            "replyTo",
            JSON.stringify({
              id: replyingTo._id || replyingTo.id,
              sender: replyingTo.sender,
              text: replyingTo.text,
              fileUrl: replyingTo.fileUrl,
              fileType: replyingTo.fileType,
              fileName: replyingTo.fileName,
            })
          );
        }

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "File upload failed");
        }
        const data = await response.json();

        finalMessageData = {
          ...finalMessageData,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          fileName: data.fileName,
          text: messageInput.trim() || undefined,
        };
        setIsUploadingFile(false);
      }

      socket.emit("privateMessage", finalMessageData, (response: any) => {
        if (!response.success) {
          setFileUploadError(response.error || "Failed to send message");
          setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempMessageId
                ? { ...msg, _id: response.messageId, id: response.messageId }
                : msg
            )
          );
        }
      });
    } catch (error) {
      setFileUploadError((error as Error).message || "Failed to send message.");
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));
    } finally {
      setIsUploadingFile(false);
      setMessageInput("");
      setReplyingTo(null);
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      clearTypingStatus();
    }
  }, [
    socket,
    user,
    receiverId,
    otherUser,
    messageInput,
    selectedFile,
    replyingTo,
    isUploadingFile,
    setMessages,
    clearTypingStatus,
    normalizeMessage,
  ]);

  const handleMessageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setMessageInput(e.target.value);
      if (!socket || !user || !receiverId) return;

      if (e.target.value.length > 0 && !isTypingRef.current) {
        isTypingRef.current = true;
        socket.emit("typing", {
          senderId: user.id,
          receiverId,
          firstName: user.firstName,
          lastName: user.lastName,
        });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          clearTypingStatus();
        }, 1500);
      } else if (e.target.value.length === 0) {
        clearTypingStatus();
      }
    },
    [socket, user, receiverId, clearTypingStatus, isTypingRef, typingTimeoutRef]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "video/mp4",
          "video/webm",
          "audio/mpeg",
          "audio/wav",
          "application/pdf",
          "text/plain",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ];
        const maxSize = 25 * 1024 * 1024;
        if (!allowedTypes.includes(file.type)) {
          setFileUploadError("Unsupported file type");
          setSelectedFile(null);
          setFilePreview(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        if (file.size > maxSize) {
          setFileUploadError("File size exceeds 25MB limit");
          setSelectedFile(null);
          setFilePreview(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        setSelectedFile(file);
        setFileUploadError(null);
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          setFilePreview(URL.createObjectURL(file));
        } else {
          setFilePreview(null);
        }
      } else {
        setSelectedFile(null);
        setFilePreview(null);
        setFileUploadError(null);
      }
    },
    []
  );

  const handleProfilePictureUpload = useCallback((file: File) => {
    
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, msg: Message) => {
      if (msg.senderId === user?.id) {
        e.preventDefault();
        const messageElement = e.currentTarget.closest(".message-container") as HTMLElement;
        if (!messageElement) return;
        const containerRect = messageElement.getBoundingClientRect();
        const x = e.clientX - containerRect.left;
        const y = e.clientY - containerRect.top;
        setContextMenu({
          visible: true,
          messageId: msg._id || msg.id,
          position: { x: 0, y: y + 10 },
        });
      }
    },
    [user]
  );

  const handleEdit = useCallback(
    (message: Message) => {
      setEditingMessageId(message._id || message.id);
      setEditingMessageText(message.text || "");
      setContextMenu({
        visible: false,
        messageId: null,
        position: { x: 0, y: 0 },
      });
    },
    []
  );

  const handleSaveEdit = useCallback(() => {
    if (!socket || !user || !editingMessageId || !editingMessageText.trim()) {
      setFileUploadError("Please enter text to save the edit");
      return;
    }
    socket.emit("editMessage", {
      messageId: editingMessageId,
      newText: editingMessageText.trim(),
      userId: user.id,
    });
    setEditingMessageId(null);
    setEditingMessageText("");
  }, [socket, user, editingMessageId, editingMessageText]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingMessageText("");
  }, []);

  const handleDelete = useCallback(
    (messageId: string) => {
      if (!socket || !user) return;
      socket.emit("deleteMessage", { messageId, userId: user.id });
      setContextMenu({
        visible: false,
        messageId: null,
        position: { x: 0, y: 0 },
      });
    },
    [socket, user]
  );

  const handleReply = useCallback(
    (message: Message) => {
      setReplyingTo(message);
      setMessageInput("");
      setContextMenu({
        visible: false,
        messageId: null,
        position: { x: 0, y: 0 },
      });
      const inputElement = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement;
      if (inputElement) inputElement.focus();
    },
    []
  );

  if (authLoading || userLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-400" />
        <p className="ml-4 text-lg font-medium">Loading...</p>
      </div>
    );
  }

  if (userError || !otherUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-400">
        <p className="text-lg font-medium">{userError || "User not found"}</p>
      </div>
    );
  }

  const typingMessage =
    Array.from(typingUsers).length > 0
      ? `${Array.from(typingUsers)[0]} is typing...`
      : "";

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <ChatHeader
        chatHeaderTitle={`Chat with ${otherUser.username}`}
        isPrivateChat={true}
        displayName={`${user.firstName} ${user.lastName}`} 
        profilePicture={otherUser.profilePicture} 
        logout={() => {}} 
        goBackToRooms={() => router.push("/chat")}
        className="bg-gray-800 shadow-md p-4 flex items-center justify-between"
      />
      <ChatMessages
        messages={messages}
        user={user}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        editingMessageId={editingMessageId}
        editingMessageText={editingMessageText}
        setEditingMessageText={setEditingMessageText}
        handleContextMenu={handleContextMenu}
        handleEdit={handleEdit}
        handleSaveEdit={handleSaveEdit}
        handleCancelEdit={handleCancelEdit}
        handleDelete={handleDelete}
        handleReply={handleReply}
        messagesEndRef={messagesEndRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-800"
      />
      <MessageInput
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        filePreview={filePreview}
        setFilePreview={setFilePreview}
        isUploadingFile={isUploadingFile}
        setIsUploadingFile={setIsUploadingFile}
        fileUploadError={fileUploadError}
        setFileUploadError={setFileUploadError}
        typingMessage={typingMessage}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        sendMessage={sendMessage}
        handleMessageInputChange={handleMessageInputChange}
        handleFileChange={handleFileChange}
        fileInputRef={fileInputRef}
        handleProfilePictureUpload={handleProfilePictureUpload}
        className="bg-gray-800 p-4 border-t border-gray-700"
      />
    </div>
  );
}