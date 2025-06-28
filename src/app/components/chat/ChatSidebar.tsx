"use client";

import React from "react";
import Link from "next/link";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Room } from "@/types";
import { User, OnlineUser } from "@/types";

type PopulatedCreator = {
  _id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
};

interface ChatSidebarProps {
  rooms: Room[];
  onlineUsers: OnlineUser[];
  currentRoom: string;
  handleRoomChange: (room: string) => void;
  startPrivateConversation: (userId: string, fullName: string) => void;
  navigateToUserProfile: (fullName: string) => void;
  user: User;
  className?: string;
  onAddRoomClick: () => void;
  onEditRoomClick: (room: Room) => void;
  onSidebarItemClick: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  rooms,
  onlineUsers,
  currentRoom,
  handleRoomChange,
  startPrivateConversation,
  navigateToUserProfile,
  user,
  className = "",
  onAddRoomClick,
  onEditRoomClick,
  onSidebarItemClick,
}) => {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const currentUserFullName = `${user.firstName} ${user.lastName}`;

  const uniqueOnlineUsers = Array.from(
    new Map(
      onlineUsers
        .filter((user) => {
          if (!user.userId) {
            return false;
          }
          return true;
        })
        .map((user) => [user.userId, user])
    ).values()
  );

  const generalChatRoom: Room = {
    _id: "general",
    name: "General",
    description: "General discussion for all users.",
    createdAt: new Date(),
    creator: {
      _id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
    },
    roomPicture: "/general-chat-icon.png",
    moderators: [],
  };

  const allRooms = [generalChatRoom, ...rooms];

  return (
    <div
      className={`w-64 sm:w-80 bg-gray-900 border-r border-gray-800 flex flex-col h-screen ${className}`}
    >
      <div className="p-3 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-100">Chat Rooms</h2>
        <button
          onClick={() => {
            onAddRoomClick();
            onSidebarItemClick();
          }}
          className="p-2 rounded-full text-blue-400 hover:bg-gray-700 transition-colors cursor-pointer"
          title="Add New Room"
        >
          <PlusCircleIcon className="h-6 w-6" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <ul className="space-y-2">
          {allRooms.map((room) => (
            <li
              key={room._id.toString()}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                currentRoom === room.name
                  ? "bg-blue-900/50 text-blue-300"
                  : "hover:bg-gray-800 text-gray-200"
              }`}
              onClick={() => {
                handleRoomChange(room.name);
                onSidebarItemClick();
                if (room.name === "General") {
                  router.push("/chat");
                } else {
                }
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center flex-1 min-w-0">
                  <img
                    src={room.roomPicture || "/default-room-avatar.png"}
                    alt={room.name}
                    className="w-8 h-8 rounded-full mr-3 object-cover flex-shrink-0"
                  />
                  <div className="flex flex-col flex-grow min-w-0">
                    <div className="flex items-center">
                      <span className="text-blue-400 mr-1 text-sm font-medium flex-shrink-0">
                        #
                      </span>
                      <span className="font-medium text-sm truncate">
                        {room.name}
                      </span>
                    </div>
                    {room.creator && typeof room.creator !== "string" && (
                      <span className="text-xs text-gray-400 ml-1 truncate">
                        by {(room.creator as PopulatedCreator).firstName}{" "}
                        {(room.creator as PopulatedCreator).lastName}
                      </span>
                    )}
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {room.description
                        ? room.description
                        : "No description available."}
                    </p>
                  </div>
                </div>
                {(user.role === "admin" ||
                  (room.creator &&
                    typeof room.creator !== "string" &&
                    (room.creator as PopulatedCreator)._id === user.id)) &&
                  room.name !== "General" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRoomClick(room);
                        onSidebarItemClick();
                      }}
                      className="ml-2 p-1.5 rounded-full text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer"
                      title="Edit Room"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    </button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 border-t border-gray-800">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">
          Online Users
        </h2>
        {uniqueOnlineUsers.length === 0 ? (
          <p className="text-sm text-gray-400">No users online</p>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {uniqueOnlineUsers.map((onlineUser) => (
              <li
                key={onlineUser.userId}
                className="flex items-center justify-between p-2 rounded-lg"
                onClick={() => {
                  navigateToUserProfile(
                    onlineUser.fullName ||
                      `${onlineUser.firstName} ${onlineUser.lastName}`
                  );
                  onSidebarItemClick();
                }}
              >
                <Link href={`/profile/${onlineUser.userId}`} passHref>
                  <div className="flex items-center flex-1 cursor-pointer">
                    <img
                      src={onlineUser.profilePicture || "/default-avatar.png"}
                      alt={
                        onlineUser.fullName ||
                        `${onlineUser.firstName} ${onlineUser.lastName}`
                      }
                      className="w-6 h-6 rounded-full mr-2 object-cover"
                    />
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-medium text-gray-200">
                      {onlineUser.fullName ||
                        `${onlineUser.firstName} ${onlineUser.lastName}`}
                      {onlineUser.userId === user.id && (
                        <span className="text-gray-400 text-xs"> (You)</span>
                      )}
                    </span>
                  </div>
                </Link>
                {onlineUser.userId !== user.id && (
                  <button
                    className="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      startPrivateConversation(
                        onlineUser.userId,
                        onlineUser.fullName ||
                          `${onlineUser.firstName} ${onlineUser.lastName}`
                      );
                      onSidebarItemClick();
                    }}
                    title="Start Private Chat"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                      />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {authUser?.role === "admin" && (
          <button
            onClick={() => {
              router.push("/admin/dashboard");
              onSidebarItemClick();
            }}
            className="w-full mt-4 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md cursor-pointer text-sm font-medium flex items-center justify-center"
          >
            Admin Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
