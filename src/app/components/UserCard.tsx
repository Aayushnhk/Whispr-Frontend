// src/app/user/components/chat/UserCard.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";

interface UserCardProps {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

const UserCard: React.FC<UserCardProps> = ({ user }) => (
  // The href is now set to "/profile" to redirect to the current user's profile page.
  // This means clicking any UserCard will lead to your own profile.
  <Link href="/profile">
    <div className="p-4 bg-gray-900 dark:bg-gray-900 hover:bg-gray-800 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center space-x-4 transition-all duration-200 border border-gray-800">
      <Image
        src={user.profilePicture || "/default-avatar.png"}
        alt={`${user.firstName} ${user.lastName}'s avatar`}
        width={48}
        height={48}
        className="rounded-full object-cover shadow-sm"
      />
      <span className="font-medium text-base flex-1 text-gray-100 dark:text-gray-100">
        {`${user.firstName} ${user.lastName}`}
      </span>
      <div className="flex items-center text-blue-400 dark:text-blue-400 hover:text-blue-300 dark:hover:text-blue-300 transition-colors duration-200">
        {/* Changed text and icon to reflect navigating to a profile */}
        <span className="text-sm font-medium mr-2">View Profile</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5.121 17.804A10 10 0 0112 15c2.457 0 4.767.892 6.518 2.378l-.001.001A8 8 0 0012 4a8 8 0 00-6.879 12.012l.001.001zM12 12a4 4 0 100-8 4 4 0 000 8z"
          />
        </svg>
      </div>
    </div>
  </Link>
);

export default UserCard;