"use client";

import React from "react";
import Image from "next/image";

interface ChatHeaderProps {
  chatHeaderTitle: string;
  isPrivateChat: boolean;
  displayName: string;
  profilePicture?: string;
  logout: () => void;
  goBackToRooms: () => void;
  className?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatHeaderTitle,
  isPrivateChat,
  displayName,
  profilePicture,
  logout,
  goBackToRooms,
  className = "",
}) => {
  return (
    <header
      className={`flex items-center justify-between p-3 bg-gray-900 border-b border-gray-800 shadow-md ${className}`}
    >
      <div className="flex items-center">
        {isPrivateChat && profilePicture && (
          <Image
            src={profilePicture || "/default-avatar.png"}
            alt="Chat partner avatar"
            width={32}
            height={32}
            className="rounded-full object-cover mr-3"
            priority
          />
        )}
        <h2 className="text-xl font-semibold text-gray-100 tracking-tight">
          {chatHeaderTitle}
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        {!isPrivateChat && (
          <>
            <span className="text-gray-300 text-sm">
              Logged in as{" "}
              <span className="font-medium text-blue-400">
                {displayName}
              </span>
            </span>
            <button
              onClick={logout}
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-semibold cursor-pointer transform hover:scale-105"
            >
              Logout
            </button>
          </>
        )}
        {isPrivateChat && (
          <button
            onClick={goBackToRooms}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-semibold cursor-pointer transform hover:scale-105"
          >
            Back to Public Rooms
          </button>
        )}
      </div>
    </header>
  );
};

export default ChatHeader;