"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "user" | "admin";
  profilePicture: string;
  banned: boolean;
}

export default function AdminDashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // Define the backend URL from environment variables
  const BACKEND_URL = process.env.NEXT_PUBLIC_URL || ""; // Using NEXT_PUBLIC_URL as per your Vercel setup

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found.");
        setLoadingUsers(false);
        return;
      }

      // Check if backend URL is available
      if (!BACKEND_URL) {
        setError("Backend URL is not configured. Please check environment variables.");
        setLoadingUsers(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/admin/users`, { // Updated API call
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        logout();
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoadingUsers(false);
    }
  }, [logout, router, BACKEND_URL]); // Added BACKEND_URL to dependencies

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (user?.role !== "admin") {
        router.replace("/chat");
      } else {
        fetchUsers();
      }
    }
  }, [isAuthenticated, authLoading, user, router, fetchUsers]);

  const handleChangeRole = async (
    userId: string,
    currentRole: "user" | "admin"
  ) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const confirmChange = window.confirm(
      `Are you sure you want to change role of user ${userId} to ${newRole}?`
    );
    if (!confirmChange) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found.");
        return;
      }

      if (user && userId === user.id) {
        setActionMessage("You cannot change your own role.");
        return;
      }

      // Check if backend URL is available
      if (!BACKEND_URL) {
        setError("Backend URL is not configured. Please check environment variables.");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/admin/users`, { // Updated API call
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change role");
      }

      setActionMessage(`Role of user ${userId} changed to ${newRole}.`);
      fetchUsers();
    } catch (err: any) {
      setError(
        err.message || "An unexpected error occurred while changing role."
      );
    }
  };

  const handleBanToggle = async (
    userId: string,
    currentBannedStatus: boolean
  ) => {
    const newBannedStatus = !currentBannedStatus;
    const actionText = newBannedStatus ? "ban" : "unban";
    const confirmAction = window.confirm(
      `Are you sure you want to ${actionText} user ${userId}?`
    );
    if (!confirmAction) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found.");
        return;
      }

      if (user && userId === user.id) {
        setActionMessage(`You cannot ${actionText} your own account.`);
        return;
      }

      // Check if backend URL is available
      if (!BACKEND_URL) {
        setError("Backend URL is not configured. Please check environment variables.");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/admin/ban`, { // Updated API call
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, bannedStatus: newBannedStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${actionText} user`);
      }

      setActionMessage(`User ${userId} has been ${actionText}ned.`);
      fetchUsers();
    } catch (err: any) {
      setError(
        err.message ||
          `An unexpected error occurred while ${actionText}ning user.`
      );
    }
  };

  if (authLoading || loadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-medium text-gray-100">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error && !actionMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 p-6">
        <div className="max-w-md w-full bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">Error</h2>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-gray-100 font-medium transition-colors cursor-pointer"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-blue-400 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-center text-gray-400">
            Manage user roles and permissions
          </p>
        </header>

        {actionMessage && (
          <div className="bg-green-700/90 text-gray-100 p-4 rounded-lg mb-6 text-center animate-fade-in">
            {actionMessage}
          </div>
        )}
        {error && !actionMessage && (
          <div className="bg-red-700/90 text-gray-100 p-4 rounded-lg mb-6 text-center animate-fade-in">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Profile
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative overflow-hidden rounded-full border-2 border-blue-400">
                          <Image
                            src={u.profilePicture || "/default-avatar.png"}
                            alt={`${u.firstName || "User"}'s profile`}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="40px"
                            className="pointer-events-none"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-100">
                        {`${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                          "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{u.email}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-purple-600 text-gray-100"
                            : "bg-blue-600 text-gray-100"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.banned
                            ? "bg-red-600 text-gray-100"
                            : "bg-green-600 text-gray-100"
                        }`}
                      >
                        {u.banned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {user?.id !== u._id && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleChangeRole(u._id, u.role)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                              u.role === "admin"
                                ? "bg-yellow-600 hover:bg-yellow-700 text-gray-100"
                                : "bg-blue-600 hover:bg-blue-700 text-gray-100"
                            }`}
                          >
                            {u.role === "admin" ? "Demote" : "Promote"}
                          </button>
                          <button
                            onClick={() => handleBanToggle(u._id, u.banned)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                              u.banned
                                ? "bg-green-600 hover:bg-green-700 text-gray-100"
                                : "bg-red-600 hover:bg-red-700 text-gray-100"
                            }`}
                          >
                            {u.banned ? "Unban" : "Ban"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}