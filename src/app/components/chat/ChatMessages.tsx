"use client";

import React, { useCallback } from "react";
import Image from "next/image";
import { Message, User, ContextMenu } from "@/types";
import ContextMenuComponent from "@/app/components/chat/ContextMenu";
import {
  PencilSquareIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/solid";

interface ChatMessagesProps {
  messages: Message[];
  user: User;
  contextMenu: ContextMenu;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenu>>;
  editingMessageId: string | null;
  editingMessageText: string;
  setEditingMessageText: React.Dispatch<React.SetStateAction<string>>;
  handleContextMenu: (e: React.MouseEvent, msg: Message) => void;
  handleEdit: (message: Message) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  handleDelete: (messageId: string) => void;
  handleReply: (message: Message) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) {
    return "Today";
  } else if (isSameDay(date, yesterday)) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  user,
  contextMenu,
  setContextMenu,
  editingMessageId,
  editingMessageText,
  setEditingMessageText,
  handleContextMenu,
  handleEdit,
  handleSaveEdit,
  handleCancelEdit,
  handleDelete,
  handleReply,
  messagesEndRef,
  className = "",
}) => {
  const renderMessageContent = useCallback(
    (msg: Message) => {
      const renderFileContent = (
        fileUrl?: string,
        fileType?: string,
        fileName?: string,
        isReply: boolean = false
      ) => {
        if (!fileUrl || !fileType) return null;
        switch (fileType) {
          case "image":
            return (
              <Image
                src={fileUrl}
                alt={fileName || "Shared Image"}
                width={isReply ? 80 : 240}
                height={isReply ? 80 : 240}
                className={`${
                  isReply ? "max-w-[80px]" : "max-w-[240px]"
                } h-auto rounded-lg object-cover shadow-sm transition-transform hover:scale-105`}
                priority
              />
            );
          case "video":
            return (
              <video
                controls
                src={fileUrl}
                className={`${
                  isReply ? "max-w-[80px]" : "max-w-[240px]"
                } h-auto rounded-lg shadow-sm`}
              />
            );
          case "audio":
            return (
              <audio
                controls
                src={fileUrl}
                className={`${isReply ? "w-[80px]" : "w-full max-w-[240px]"}`}
              />
            );
          case "document":
          case "other":
            return (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-400 hover:underline text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V7.414L10.586 4H6z"
                    clipRule="evenodd"
                  />
                </svg>
                {fileName || "Shared File"}
              </a>
            );
          default:
            return fileName ? (
              <p
                className={`text-xs italic ${
                  isReply ? "text-gray-400" : "text-gray-400"
                }`}
              >
                File: {fileName}
              </p>
            ) : null;
        }
      };

      return (
        <div className="flex flex-col items-start space-y-1">
          {msg.replyTo && (
            <div
              className={`mb-2 p-2 rounded-lg border-l-4 ${
                msg.senderId === user.id
                  ? "bg-blue-900/20 border-blue-600"
                  : "bg-gray-800/20 border-gray-500"
              }`}
            >
              <p className="text-xs font-medium text-gray-300">
                Replying to {msg.replyTo.sender}
              </p>
              {msg.replyTo.text && (
                <p className="text-xs mt-1 text-gray-400 line-clamp-2">
                  {msg.replyTo.text}
                </p>
              )}
              {renderFileContent(
                msg.replyTo.fileUrl,
                msg.replyTo.fileType,
                msg.replyTo.fileName,
                true
              )}
            </div>
          )}
          {msg.fileUrl && msg.fileType ? (
            renderFileContent(msg.fileUrl, msg.fileType, msg.fileName)
          ) : msg.text ? (
            (() => {
              try {
                const parsedMessage = JSON.parse(msg.text);
                if (
                  parsedMessage.event === "room_created" &&
                  parsedMessage.roomName
                ) {
                  return (
                    <p className="text-sm italic text-purple-400">
                      Room "{parsedMessage.roomName}" has been created.
                    </p>
                  );
                } else if (parsedMessage.data === "action") {
                  return (
                    <p className="text-sm italic text-gray-400">
                      Action: {parsedMessage.data}
                    </p>
                  );
                } else if (parsedMessage.data === "notification") {
                  return (
                    <p className="text-sm font-medium text-green-400">
                      Notification: {parsedMessage.message}
                    </p>
                  );
                } else {
                  return (
                    <pre className="whitespace-pre-wrap font-mono text-xs text-gray-300 bg-gray-800 p-2 rounded">
                      {JSON.stringify(parsedMessage, null, 2)}
                    </pre>
                  );
                }
              } catch (e) {
                return <p className="text-sm text-gray-200">{msg.text}</p>;
              }
            })()
          ) : (
            <p className="text-sm italic text-gray-400">Empty message</p>
          )}
        </div>
      );
    },
    [user.id]
  );

  let lastDate = "";

  return (
    <main
      className={`flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900 ${className}`}
    >
      {messages.map((msg, index) => {
        const messageDate = formatDate(msg.timestamp);
        const showDateSeparator = messageDate !== lastDate;
        lastDate = messageDate;

        return (
          <React.Fragment key={msg._id || msg.id}>
            {showDateSeparator && (
              <div className="my-4 text-center">
                <span className="inline-block px-3 py-1 text-xs font-medium text-gray-300 bg-gray-800 rounded-lg shadow-md">
                  {messageDate}
                </span>
              </div>
            )}
            <div
              className={`flex items-start message-container ${
                msg.senderId === user.id ? "justify-end" : "justify-start"
              }`}
            >
              {msg.senderId !== user.id && (
                <Image
                  src={msg.senderProfilePicture || "/default-avatar.png"}
                  alt={`${msg.sender}'s avatar`}
                  width={24}
                  height={24}
                  className="rounded-full object-cover mr-2 mt-2 aspect-square flex-shrink-0"
                />
              )}

              <div
                className={`relative max-w-xs sm:max-w-sm md:max-w-md p-3 rounded-xl shadow-lg transition-all duration-200 
            ${
              msg.senderId === user.id
                ? "bg-blue-600 text-white rounded-tr-none"
                : "bg-gray-800 text-gray-200 rounded-tl-none"
            } 
            after:content-[''] after:absolute after:w-0 after:h-0 after:border-l-6 after:border-r-6 after:border-b-6 after:border-l-transparent after:border-r-transparent after:border-b-transparent 
            ${
              msg.senderId === user.id
                ? "after:bottom-0 after:right-1 after:border-b-blue-600"
                : "after:bottom-0 after:left-1 after:border-b-gray-800"
            }
            flex flex-col`}
                onContextMenu={(e) => handleContextMenu(e, msg)}
              >
                <div className="text-xs font-medium mb-1 w-full text-gray-100">
                  <span
                    className={
                      msg.senderId === user.id ? "text-white" : "text-gray-200"
                    }
                  >
                    {msg.senderId === user.id ? "You" : msg.sender}
                  </span>
                </div>
                {editingMessageId === (msg._id || msg.id) ? (
                  <div className="flex flex-col space-y-2 w-full">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingMessageText}
                        onChange={(e) => setEditingMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                        }}
                        className="p-2 border border-gray-700 rounded-lg w-full bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          className="text-green-400 hover:text-green-300 text-sm font-medium cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-red-400 hover:text-red-300 text-sm font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 pr-10 pb-2">
                    {renderMessageContent(msg)}
                  </div>
                )}
                <div className="absolute bottom-1 right-2 flex items-center space-x-1">
                  {msg.isEdited && (
                    <span
                      className={`italic text-[0.6rem] ${
                        msg.senderId === user.id
                          ? "text-blue-200"
                          : "text-gray-400"
                      }`}
                    >
                      (Edited)
                    </span>
                  )}
                  <span
                    className={
                      msg.senderId === user.id
                        ? "text-blue-100 text-[0.6rem]"
                        : "text-gray-400 text-[0.6rem]"
                    }
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <ContextMenuComponent
                  contextMenu={contextMenu}
                  setContextMenu={setContextMenu}
                  messageId={msg._id || msg.id}
                  handleEdit={() => handleEdit(msg)}
                  handleDelete={() => handleDelete(msg._id || msg.id)}
                  handleReply={() => handleReply(msg)}
                />
              </div>

              {msg.senderId === user.id && (
                <Image
                  src={user.profilePicture || "/default-avatar.png"}
                  alt="Your avatar"
                  width={24}
                  height={24}
                  className="rounded-full object-cover ml-2 mt-2 aspect-square flex-shrink-0"
                />
              )}
            </div>
          </React.Fragment>
        );
      })}
      <div ref={messagesEndRef} />
    </main>
  );
};

export default ChatMessages;
