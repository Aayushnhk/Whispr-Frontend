// src/app/components/chat/ChatLayout.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import MessageInput from "./MessageInput";
import { Message, ContextMenu, User, OnlineUser } from "@/types";
import { Room } from "@/types";
import { Socket as SocketConstructor } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { XCircleIcon } from "@heroicons/react/24/outline";

const capitalizeWords = (str: string) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

interface ChatLayoutProps {
  user: User;
  currentRoom: string;
  isPrivateChat: boolean;
  receiverFirstName: string | null;
  receiverLastName: string | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onlineUsers: OnlineUser[];
  typingUsers: string[];
  startPrivateConversation: (userId: string, fullName: string) => void;
  navigateToUserProfile: (fullName: string) => void;
  logout: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  socket: typeof SocketConstructor | null;
  fetchRoomMessages: (roomName: string) => void;
  fetchPrivateMessages: (user1Id: string, user2Id: string) => void;
  handleRoomChange: (roomName: string) => void;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({
  user,
  currentRoom,
  isPrivateChat,
  receiverFirstName,
  receiverLastName,
  messages,
  setMessages,
  onlineUsers,
  typingUsers,
  handleRoomChange,
  startPrivateConversation,
  navigateToUserProfile,
  logout,
  messagesEndRef,
  socket,
  fetchRoomMessages,
  fetchPrivateMessages,
}) => {
  const receiverIdFromUrl = (() => {
    if (!isPrivateChat) return undefined;
    const match = window.location.pathname.match(/\/private\/([^/]+)/);
    return match ? match[1] : undefined;
  })();

  const BACKEND_URL = process.env.NEXT_PUBLIC_URL || "";

  const [messageInput, setMessageInput] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [isProfilePictureUpload, setIsProfilePictureUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null!);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    messageId: null,
    position: { x: 0, y: 0 },
  });
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomPictureFile, setNewRoomPictureFile] = useState<File | null>(null);
  const [newRoomPicturePreview, setNewRoomPicturePreview] = useState<string | null>(null);
  const newRoomFileInputRef = useRef<HTMLInputElement>(null);
  const [roomCreationError, setRoomCreationError] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [editRoomDescription, setEditRoomDescription] = useState<string | null>("");
  const [editRoomPictureFile, setEditRoomPictureFile] = useState<File | null>(null);
  const [editRoomPicturePreview, setEditRoomPicturePreview] = useState<string | null>(null);
  const editRoomFileInputRef = useRef<HTMLInputElement>(null);
  const [roomEditError, setRoomEditError] = useState<string | null>(null);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  const isTypingRef = useRef<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getFileType = (mimeType: string): Message["fileType"] => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (
      mimeType === "application/pdf" ||
      mimeType.includes("msword") ||
      mimeType.includes("wordprocessingml") ||
      mimeType.includes("excel") ||
      mimeType.includes("spreadsheetml") ||
      mimeType.includes("powerpoint") ||
      mimeType.includes("presentationml")
    )
      return "document";
    return "other";
  };

  const fetchRooms = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }
      if (!BACKEND_URL) {
        console.error("Backend URL is not configured. Cannot fetch rooms.");
        return;
      }
      const response = await fetch(`${BACKEND_URL}/api/rooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch rooms");
      }
      const data: Room[] = await response.json();
      setRooms(data);
    } catch (error: any) {
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

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

  const handleOnAddRoomClick = () => {
    setShowAddRoomModal(true);
    setNewRoomName("");
    setNewRoomDescription("");
    setNewRoomPictureFile(null);
    setNewRoomPicturePreview(null);
    if (newRoomFileInputRef.current) newRoomFileInputRef.current.value = "";
    setRoomCreationError(null);
  };

  const handleNewRoomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setRoomCreationError("Only image files are allowed for room pictures.");
        setNewRoomPictureFile(null);
        setNewRoomPicturePreview(null);
        if (newRoomFileInputRef.current) newRoomFileInputRef.current.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setRoomCreationError("Room picture size cannot exceed 5MB.");
        setNewRoomPictureFile(null);
        setNewRoomPicturePreview(null);
        if (newRoomFileInputRef.current) newRoomFileInputRef.current.value = "";
        return;
      }
      setNewRoomPictureFile(file);
      setNewRoomPicturePreview(URL.createObjectURL(file));
      setRoomCreationError(null);
    } else {
      setNewRoomPictureFile(null);
      setNewRoomPicturePreview(null);
      setRoomCreationError(null);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      setRoomCreationError("Room name cannot be empty.");
      return;
    }
    if (newRoomDescription.length > 200) {
      setRoomCreationError("Room description cannot exceed 200 characters.");
      return;
    }
    setIsCreatingRoom(true);
    setRoomCreationError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      if (!BACKEND_URL) {
        console.error("Backend URL is not configured. Cannot add room.");
        throw new Error("Backend URL is not configured.");
      }
      const formData = new FormData();
      formData.append("roomName", newRoomName.trim());
      formData.append("description", newRoomDescription.trim());
      if (newRoomPictureFile) {
        formData.append("roomPicture", newRoomPictureFile);
      }
      const response = await fetch(`${BACKEND_URL}/api/rooms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create room.");
      }
      await fetchRooms();
      setShowAddRoomModal(false);
      setNewRoomName("");
      setNewRoomDescription("");
      setNewRoomPictureFile(null);
      setNewRoomPicturePreview(null);
      if (newRoomFileInputRef.current) newRoomFileInputRef.current.value = "";
    } catch (error: any) {
      setRoomCreationError(
        error.message || "Failed to create room. Please try again."
      );
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleOnEditRoomClick = (room: Room) => {
    setEditingRoom(room);
    setEditRoomName(room.name);
    setEditRoomDescription(room.description || null);
    setEditRoomPictureFile(null);
    setEditRoomPicturePreview(room.roomPicture || null);
    if (editRoomFileInputRef.current) editRoomFileInputRef.current.value = "";
    setRoomEditError(null);
    setShowEditRoomModal(true);
  };

  const handleEditRoomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setRoomEditError("Only image files are allowed for room pictures.");
        setEditRoomPictureFile(null);
        setEditRoomPicturePreview(editingRoom?.roomPicture || null);
        if (editRoomFileInputRef.current) editRoomFileInputRef.current.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setRoomEditError("Room picture size cannot exceed 5MB.");
        setEditRoomPictureFile(null);
        setEditRoomPicturePreview(editingRoom?.roomPicture || null);
        if (editRoomFileInputRef.current) editRoomFileInputRef.current.value = "";
        return;
      }
      setEditRoomPictureFile(file);
      setEditRoomPicturePreview(URL.createObjectURL(file));
      setRoomEditError(null);
    } else {
      setEditRoomPictureFile(null);
      setEditRoomPicturePreview(editingRoom?.roomPicture || null);
      setRoomEditError(null);
    }
  };

  const handleSaveEditedRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    if (!editRoomName.trim()) {
      setRoomEditError("Room name cannot be empty.");
      return;
    }
    if (editRoomDescription && editRoomDescription.length > 200) {
      setRoomEditError("Room description cannot exceed 200 characters.");
      return;
    }
    setIsUpdatingRoom(true);
    setRoomEditError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      if (!BACKEND_URL) {
        console.error("Backend URL is not configured. Cannot update room.");
        throw new Error("Backend URL is not configured.");
      }
      const formData = new FormData();
      formData.append("roomName", editRoomName.trim());
      formData.append(
        "description",
        editRoomDescription !== null ? editRoomDescription.trim() : "null"
      );
      if (editRoomPictureFile) {
        formData.append("roomPicture", editRoomPictureFile);
      } else if (editRoomPicturePreview === null && editingRoom.roomPicture) {
        formData.append("clearPicture", "true");
      }
      const response = await fetch(`${BACKEND_URL}/api/rooms/${editingRoom._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || "Failed to update room.");
        } catch (jsonError) {
          throw new Error(
            `Failed to update room: ${errorText || response.statusText}`
          );
        }
      }
      await fetchRooms();
      setShowEditRoomModal(false);
      setEditingRoom(null);
      setEditRoomName("");
      setEditRoomDescription(null);
      setEditRoomPictureFile(null);
      setEditRoomPicturePreview(null);
      if (editRoomFileInputRef.current) editRoomFileInputRef.current.value = "";
    } catch (error: any) {
      setRoomEditError(
        error.message || "Failed to update room. Please try again."
      );
    } finally {
      setIsUpdatingRoom(false);
    }
  };

  const sendMessage = useCallback(async () => {
    if (
      !socket ||
      !user ||
      (isPrivateChat &&
        (!receiverFirstName || !receiverLastName || !receiverIdFromUrl))
    )
      return;
    if (isUploadingFile) {
      setFileUploadError("Please wait for the current file upload to complete.");
      return;
    }
    if (!messageInput.trim() && !selectedFile && !isProfilePictureUpload)
      return;
    const tempMessageId = uuidv4();
    const optimisticMessage: Message = {
      id: tempMessageId,
      _id: undefined,
      sender: `${user.firstName} ${user.lastName}`,
      senderId: user.id,
      senderFirstName: user.firstName,
      senderLastName: user.lastName,
      senderProfilePicture: user.profilePicture,
      text: messageInput.trim() || undefined,
      timestamp: new Date().toISOString(),
      isEdited: false,
      chatType: isPrivateChat ? "private" : "room",
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            sender: replyingTo.sender,
            text: replyingTo.text,
            fileUrl: replyingTo.fileUrl,
            fileType: replyingTo.fileType,
            fileName: replyingTo.fileName,
          }
        : undefined,
      room: isPrivateChat ? undefined : currentRoom,
      receiver: isPrivateChat
        ? `${receiverFirstName} ${receiverLastName}`
        : undefined,
      receiverId: isPrivateChat ? receiverIdFromUrl : undefined,
      receiverFirstName: isPrivateChat ? receiverFirstName || undefined : undefined,
      receiverLastName: isPrivateChat ? receiverLastName || undefined : undefined,
      fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
      fileType: selectedFile ? getFileType(selectedFile.type) : undefined,
      fileName: selectedFile ? selectedFile.name : undefined,
      isProfilePictureUpload: isProfilePictureUpload,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput("");
    setReplyingTo(null);
    setSelectedFile(null);
    setFilePreview(null);
    setIsProfilePictureUpload(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFileUploadError(null);
    try {
      if (selectedFile || isProfilePictureUpload) {
        setIsUploadingFile(true);
        const formData = new FormData();
        if (selectedFile) formData.append("file", selectedFile);
        formData.append("id", tempMessageId);
        formData.append("userId", user.id);
        formData.append("senderFirstName", user.firstName);
        formData.append("senderLastName", user.lastName);
        formData.append("chatType", isPrivateChat ? "private" : "room");
        formData.append("text", optimisticMessage.text || "");
        formData.append(
          "isProfilePictureUpload",
          JSON.stringify(isProfilePictureUpload)
        );
        if (
          isPrivateChat &&
          receiverIdFromUrl &&
          receiverFirstName &&
          receiverLastName
        ) {
          formData.append("receiverId", receiverIdFromUrl);
          formData.append("receiverFirstName", receiverFirstName);
          formData.append("receiverLastName", receiverLastName);
        } else {
          formData.append("room", currentRoom);
        }
        if (replyingTo) {
          formData.append(
            "replyTo",
            JSON.stringify({
              id: replyingTo.id,
              sender: replyingTo.sender,
              text: replyingTo.text,
              fileUrl: replyingTo.fileUrl,
              fileType: replyingTo.fileType,
              fileName: replyingTo.fileName,
            })
          );
        }
        const token = localStorage.getItem("token");
        if (!BACKEND_URL) {
          console.error("Backend URL is not configured. Cannot upload file.");
          throw new Error("Backend URL is not configured.");
        }
        const response = await fetch(`${BACKEND_URL}/api/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "File upload failed");
        }
      } else {
        if (
          isPrivateChat &&
          receiverIdFromUrl &&
          receiverFirstName &&
          receiverLastName
        ) {
          socket.emit("privateMessage", {
            id: tempMessageId,
            senderId: user.id,
            senderFirstName: user.firstName,
            senderLastName: user.lastName,
            senderProfilePicture: user.profilePicture,
            receiverId: receiverIdFromUrl,
            receiverFirstName,
            receiverLastName,
            text: optimisticMessage.text,
            replyTo: replyingTo
              ? {
                  id: replyingTo.id,
                  sender: replyingTo.sender,
                  text: replyingTo.text,
                  fileUrl: replyingTo.fileUrl,
                  fileType: replyingTo.fileType,
                  fileName: replyingTo.fileName,
                }
              : undefined,
            isProfilePictureUpload,
          });
        } else {
          socket.emit("sendMessage", {
            id: tempMessageId,
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: user.profilePicture,
            text: optimisticMessage.text,
            room: currentRoom,
            replyTo: replyingTo
              ? {
                  id: replyingTo.id,
                  sender: replyingTo.sender,
                  text: replyingTo.text,
                  fileUrl: replyingTo.fileUrl,
                  fileType: replyingTo.fileType,
                  fileName: replyingTo.fileName,
                }
              : undefined,
            isProfilePictureUpload,
          });
        }
      }
    } catch (error) {
      setFileUploadError((error as Error).message || "Failed to send message.");
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));
    } finally {
      setIsUploadingFile(false);
    }
  }, [
    socket,
    user,
    isPrivateChat,
    receiverIdFromUrl,
    receiverFirstName,
    receiverLastName,
    messageInput,
    selectedFile,
    replyingTo,
    currentRoom,
    setMessages,
    isUploadingFile,
    isProfilePictureUpload,
    BACKEND_URL,
  ]);

  const handleMessageInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setMessageInput(e.target.value);
    if (!socket || !user) return;
    if (e.target.value.length > 0) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        if (
          isPrivateChat &&
          receiverIdFromUrl &&
          receiverFirstName &&
          receiverLastName
        ) {
          socket.emit("typing", {
            senderId: user.id,
            receiverId: receiverIdFromUrl,
            firstName: user.firstName,
            lastName: user.lastName,
            username: `${user.firstName} ${user.lastName}`,
          });
        } else {
          socket.emit("typing", {
            room: currentRoom,
            firstName: user.firstName,
            lastName: user.lastName,
            username: `${user.firstName} ${user.lastName}`,
          });
        }
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          if (
            isPrivateChat &&
            receiverIdFromUrl &&
            receiverFirstName &&
            receiverLastName
          ) {
            socket.emit("stopTyping", {
              senderId: user.id,
              receiverId: receiverIdFromUrl,
              firstName: user.firstName,
              lastName: user.lastName,
              username: `${user.firstName} ${user.lastName}`,
            });
          } else {
            socket.emit("stopTyping", {
              room: currentRoom,
              firstName: user.firstName,
              lastName: user.lastName,
              username: `${user.firstName} ${user.lastName}`,
            });
          }
          isTypingRef.current = false;
        }
      }, 1500);
    } else {
      if (
        isPrivateChat &&
        receiverIdFromUrl &&
        receiverFirstName &&
        receiverLastName
      ) {
        socket.emit("stopTyping", {
          senderId: user.id,
          receiverId: receiverIdFromUrl,
          firstName: user.firstName,
          lastName: user.lastName,
          username: `${user.firstName} ${user.lastName}`,
        });
      } else {
        socket.emit("stopTyping", {
          room: currentRoom,
          firstName: user.firstName,
          lastName: user.lastName,
          username: `${user.firstName} ${user.lastName}`,
        });
      }
      isTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];
      const maxSize = 25 * 1024 * 1024;
      if (!allowedTypes.includes(file.type)) {
        setFileUploadError("Unsupported file type.");
        setSelectedFile(null);
        setFilePreview(null);
        setIsProfilePictureUpload(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > maxSize) {
        setFileUploadError("File size exceeds 25MB limit.");
        setSelectedFile(null);
        setFilePreview(null);
        setIsProfilePictureUpload(false);
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
      setIsProfilePictureUpload(false);
    }
  };

  const handleProfilePictureUpload = (file: File) => {
    setSelectedFile(file);
    setIsProfilePictureUpload(true);
    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
    sendMessage();
  };

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    if (msg.senderId === user.id) {
      e.preventDefault();
      const messageElement = e.currentTarget.closest(".message-container") as HTMLElement;
      if (!messageElement) return;
      const containerRect = messageElement.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;
      setContextMenu({
        visible: true,
        messageId: msg.id,
        position: { x: 0, y: y + 10 },
      });
    }
  };

  const handleEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingMessageText(message.text || "");
    setContextMenu({
      visible: false,
      messageId: null,
      position: { x: 0, y: 0 },
    });
  };

  const handleSaveEdit = () => {
    if (!socket || !user || !editingMessageId || !editingMessageText.trim()) {
      return;
    }
    socket.emit("editMessage", {
      messageId: editingMessageId,
      newText: editingMessageText.trim(),
      userId: user.id,
    });
    setEditingMessageId(null);
    setEditingMessageText("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText("");
  };

  const handleDelete = (messageId: string) => {
    if (!socket || !user) return;
    socket.emit("deleteMessage", { messageId, userId: user.id });
    setContextMenu({
      visible: false,
      messageId: null,
      position: { x: 0, y: 0 },
    });
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setMessageInput("");
    setContextMenu({
      visible: false,
      messageId: null,
      position: { x: 0, y: 0 },
    });
    const inputElement = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement;
    if (inputElement) inputElement.focus();
  };

  const chatHeaderTitle =
    isPrivateChat && receiverFirstName && receiverLastName
      ? `Private Chat with ${capitalizeWords(
          `${receiverFirstName} ${receiverLastName}`
        )}`
      : `Room: ${capitalizeWords(currentRoom)}`;

  const typingMessage =
    typingUsers.length > 0
      ? typingUsers.length === 1
        ? `${typingUsers[0]} is typing...`
        : `${typingUsers.slice(0, -1).join(", ")} and ${
            typingUsers[typingUsers.length - 1]
          } are typing...`
      : "";

  return (
    <div className="flex h-screen bg-gray-900">
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-3/4 bg-gray-900 border-r border-gray-800
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:w-1/4 md:flex md:flex-col
          ${!isSidebarOpen && 'hidden md:flex'}
        `}
      >
        <ChatSidebar
          rooms={rooms}
          onlineUsers={onlineUsers}
          currentRoom={currentRoom}
          handleRoomChange={handleRoomChange}
          startPrivateConversation={startPrivateConversation}
          navigateToUserProfile={navigateToUserProfile}
          user={user}
          className="shadow-lg flex-1"
          onAddRoomClick={handleOnAddRoomClick}
          onEditRoomClick={handleOnEditRoomClick}
          onSidebarItemClick={() => setIsSidebarOpen(false)}
        />
        <button
          className="md:hidden absolute top-4 right-4 text-gray-400 hover:text-gray-200"
          onClick={() => setIsSidebarOpen(false)}
          title="Close Sidebar"
        >
          <XCircleIcon className="h-7 w-7" />
        </button>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div className="flex-1 flex flex-col">
        <ChatHeader
          chatHeaderTitle={chatHeaderTitle}
          isPrivateChat={isPrivateChat}
          displayName={`${user.firstName} ${user.lastName}`}
          logout={logout}
          goBackToRooms={() => handleRoomChange("general")}
          className="shadow-sm"
          onMenuClick={() => setIsSidebarOpen(true)}
          isSidebarOpen={isSidebarOpen}
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
          className="flex-1"
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
          className="shadow-sm"
        />
      </div>

      {showAddRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 ease-out">
          <div className="bg-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-sm relative transform scale-100 transition-all duration-300 ease-out border border-gray-800">
            <h3 className="text-xl font-bold mb-6 text-gray-100 text-center">
              Create New Room
            </h3>
            <button
              onClick={() => {
                setShowAddRoomModal(false);
                setRoomCreationError(null);
                setNewRoomName("");
                setNewRoomDescription("");
                setNewRoomPictureFile(null);
                setNewRoomPicturePreview(null);
                if (newRoomFileInputRef.current)
                  newRoomFileInputRef.current.value = "";
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
              title="Close"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
            <form onSubmit={handleAddRoom}>
              <div className="mb-4">
                <label
                  htmlFor="newRoomName"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Room Name
                </label>
                <input
                  type="text"
                  id="newRoomName"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full p-2.5 border border-gray-800 rounded-lg bg-gray-800 text-gray-100 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g., General, Gaming, Tech"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="newRoomDescription"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="newRoomDescription"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full p-2.5 border border-gray-800 rounded-lg bg-gray-800 text-gray-100 focus:ring-blue-500 focus:border-blue-500 resize-y outline-none transition-all"
                  placeholder="A brief description of the room..."
                  rows={3}
                  maxLength={200}
                ></textarea>
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {newRoomDescription.length}/200
                </p>
              </div>
              <div className="mb-6">
                <label
                  htmlFor="newRoomPicture"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Room Picture (Optional)
                </label>
                <input
                  type="file"
                  id="newRoomPicture"
                  ref={newRoomFileInputRef}
                  onChange={handleNewRoomFileChange}
                  className="w-full text-sm text-gray-100 cursor-pointer
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-700 file:text-white file:cursor-pointer
                    hover:file:bg-blue-800 transition-colors"
                  accept="image/*"
                />
                {newRoomPicturePreview && (
                  <div className="mt-4 text-center">
                    <img
                      src={newRoomPicturePreview}
                      alt="Room Preview"
                      className="max-w-full h-32 object-cover rounded-lg shadow-md mx-auto"
                    />
                  </div>
                )}
              </div>
              {roomCreationError && (
                <p className="text-red-400 text-sm mb-4 font-medium">
                  {roomCreationError}
                </p>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setRoomCreationError(null);
                    setNewRoomName("");
                    setNewRoomDescription("");
                    setNewRoomPictureFile(null);
                    setNewRoomPicturePreview(null);
                    if (newRoomFileInputRef.current)
                      newRoomFileInputRef.current.value = "";
                  }}
                  className="px-5 py-2.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200 cursor-pointer transform hover:scale-105"
                  disabled={isCreatingRoom}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transform hover:scale-105"
                  disabled={isCreatingRoom}
                >
                  {isCreatingRoom ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditRoomModal && editingRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 ease-out">
          <div className="bg-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-sm relative transform scale-100 transition-all duration-300 ease-out border border-gray-800">
            <h3 className="text-xl font-bold mb-6 text-gray-100 text-center">
              Edit Room: {editingRoom.name}
            </h3>
            <button
              onClick={() => {
                setShowEditRoomModal(false);
                setRoomEditError(null);
                setEditingRoom(null);
                setEditRoomName("");
                setEditRoomDescription(null);
                setEditRoomPictureFile(null);
                setEditRoomPicturePreview(null);
                if (editRoomFileInputRef.current)
                  editRoomFileInputRef.current.value = "";
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
              title="Close"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
            <form onSubmit={handleSaveEditedRoom}>
              <div className="mb-4">
                <label
                  htmlFor="editRoomName"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Room Name
                </label>
                <input
                  type="text"
                  id="editRoomName"
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                  className="w-full p-2.5 border border-gray-800 rounded-lg bg-gray-800 text-gray-100 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g., General, Gaming, Tech"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="editRoomDescription"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="editRoomDescription"
                  value={editRoomDescription !== null ? editRoomDescription : ""}
                  onChange={(e) => setEditRoomDescription(e.target.value)}
                  className="w-full p-2.5 border border-gray-800 rounded-lg bg-gray-800 text-gray-100 focus:ring-blue-500 focus:border-blue-500 resize-y outline-none transition-all"
                  placeholder="A brief description of the room..."
                  rows={3}
                  maxLength={200}
                ></textarea>
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {editRoomDescription ? editRoomDescription.length : 0}/200
                </p>
              </div>
              <div className="mb-6">
                <label
                  htmlFor="editRoomPicture"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Room Picture (Optional)
                </label>
                <input
                  type="file"
                  id="editRoomPicture"
                  ref={editRoomFileInputRef}
                  onChange={handleEditRoomFileChange}
                  className="w-full text-sm text-gray-100 cursor-pointer
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-700 file:text-white file:cursor-pointer
                    hover:file:bg-blue-800 transition-colors"
                  accept="image/*"
                />
                {editRoomPicturePreview && (
                  <div className="mt-4 relative">
                    <img
                      src={editRoomPicturePreview}
                      alt="Room Preview"
                      className="max-w-full h-32 object-cover rounded-lg shadow-md mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditRoomPictureFile(null);
                        setEditRoomPicturePreview(null);
                        if (editRoomFileInputRef.current)
                          editRoomFileInputRef.current.value = "";
                      }}
                      className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 cursor-pointer"
                      title="Remove Picture"
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {!editRoomPicturePreview && editingRoom.roomPicture && (
                  <p className="text-xs text-gray-400 mt-2">
                    No picture selected. Current: <span className="font-semibold">Default or existing</span>
                  </p>
                )}
              </div>
              {roomEditError && (
                <p className="text-red-400 text-sm mb-4 font-medium">
                  {roomEditError}
                </p>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditRoomModal(false);
                    setRoomEditError(null);
                    setEditingRoom(null);
                    setEditRoomName("");
                    setEditRoomDescription(null);
                    setEditRoomPictureFile(null);
                    setEditRoomPicturePreview(null);
                    if (editRoomFileInputRef.current)
                      editRoomFileInputRef.current.value = "";
                  }}
                  className="px-5 py-2.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200 cursor-pointer transform hover:scale-105"
                  disabled={isUpdatingRoom}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transform hover:scale-105"
                  disabled={isUpdatingRoom}
                >
                  {isUpdatingRoom ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatLayout;