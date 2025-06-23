"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}

export default function UnifiedUserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const profileUserId = params.userId as string;

  const {
    userId: currentUserId,
    isAuthenticated,
    isLoading: authLoading,
    logout,
  } = useAuth();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const isCurrentUserProfile = currentUserId === profileUserId;

  const BACKEND_URL = process.env.NEXT_PUBLIC_URL || "";
  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!profileUserId) {
      setLoading(false);
      setError("Profile ID not found in URL.");
      return;
    }

    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      if (!BACKEND_URL) {
        setError("Backend URL is not configured. Cannot fetch user profile.");
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await fetch(
          `${BACKEND_URL}/api/users/${profileUserId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `Failed to fetch user profile for ID: ${profileUserId}`
          );
        }

        const data = await response.json();
        setUserProfile(data.user);
      } catch (err: any) {
        setError(err.message || "Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [
    profileUserId,
    authLoading,
    isAuthenticated,
    router,
    currentUserId,
    BACKEND_URL,
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      const maxSize = 5 * 1024 * 1024;

      if (!allowedTypes.includes(file.type)) {
        setUploadError("Invalid file type. Only JPG, PNG, GIF allowed.");
        setSelectedFile(null);
        return;
      }
      if (file.size > maxSize) {
        setUploadError("File size exceeds 5MB limit.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError("");
      setUploadMessage("");
    }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadMessage("");
    setUploadError("");

    if (!BACKEND_URL) {
      setUploadError("Backend URL is not configured. Cannot upload file.");
      setIsUploading(false);
      return;
    }

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setUploadError("Cloudinary environment variables not set. Cannot upload.");
      setIsUploading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      if (!currentUserId) {
        setUploadError(
          "User ID is not available. Please try logging in again."
        );
        setIsUploading(false);
        return;
      }

      // 1. Get signature from your backend
      const signatureResponse = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          folder: "WHISPR_profile_pictures",
          upload_preset: CLOUDINARY_UPLOAD_PRESET,
          resource_type: selectedFile.type.startsWith("image/") ? "image" : "raw", // Ensure correct resource type
        }),
      });

      if (!signatureResponse.ok) {
        const errorData = await signatureResponse.json();
        throw new Error(errorData.message || "Failed to get Cloudinary signature.");
      }

      const { signature, timestamp, api_key, cloud_name, upload_preset, folder } = await signatureResponse.json();

      // 2. Upload directly to Cloudinary using the signature
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append("file", selectedFile);
      cloudinaryFormData.append("api_key", api_key);
      cloudinaryFormData.append("timestamp", timestamp);
      cloudinaryFormData.append("signature", signature);
      cloudinaryFormData.append("folder", folder);
      cloudinaryFormData.append("upload_preset", upload_preset); // Include upload_preset

      // Determine resource type for Cloudinary URL (e.g., 'image', 'video', 'raw')
      const cloudinaryResourceType = selectedFile.type.startsWith("image/") ? "image" : 
                                     selectedFile.type.startsWith("video/") ? "video" : "raw";

      const cloudinaryUploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/${cloudinaryResourceType}/upload`,
        {
          method: "POST",
          body: cloudinaryFormData,
        }
      );

      if (!cloudinaryUploadResponse.ok) {
        const errorText = await cloudinaryUploadResponse.text();
        console.error("Cloudinary direct upload error:", errorText);
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error?.message || "Cloudinary direct upload failed.");
        } catch (parseError) {
          throw new Error(`Cloudinary direct upload failed with status ${cloudinaryUploadResponse.status}: ${errorText.substring(0, 100)}...`);
        }
      }

      const cloudinaryData = await cloudinaryUploadResponse.json();
      const fileUrl = cloudinaryData.secure_url;

      if (!fileUrl) {
        throw new Error("Cloudinary upload did not return a secure URL.");
      }

      // 3. Update profile picture in your own backend DB
      const updateDbResponse = await fetch(`${BACKEND_URL}/api/update-profile-picture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: currentUserId, profilePictureUrl: fileUrl }),
      });

      if (!updateDbResponse.ok) {
        const errorData = await updateDbResponse.json();
        throw new Error(errorData.message || "Failed to update profile picture in database.");
      }

      const updateDbData = await updateDbResponse.json();

      setUploadMessage(updateDbData.message || "Profile picture updated successfully!");
      if (userProfile && isCurrentUserProfile) {
        setUserProfile({
          ...userProfile,
          profilePicture: updateDbData.profilePicture, // Use the URL returned by your backend
        });
      }
    } catch (error: any) {
      console.error("Upload process error:", error);
      setUploadError(
        error.message || "An unexpected error occurred during upload."
      );
    } finally {
      setIsUploading(false);
      setSelectedFile(null); // Clear selected file after upload attempt
    }
  };

  if (loading || authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
        <div className="flex flex-col items-center space-y-6">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-400"></div>
          <p className="text-xl font-semibold tracking-tight">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
        <div className="text-center p-8 text-red-400">
          <p className="text-lg font-semibold mb-2">Error loading profile:</p>
          <p>{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-gray-100 rounded-lg hover:bg-blue-700 transition-all duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
        <div className="text-center p-8">
          <p className="text-lg font-semibold">User not found.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-gray-100 rounded-lg hover:bg-blue-700 transition-all duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-100 tracking-tight">
          {isCurrentUserProfile
            ? "Your Profile"
            : `${userProfile.firstName} ${userProfile.lastName}'s Profile`}
        </h1>
        {isCurrentUserProfile && (
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-gray-100 rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium cursor-pointer"
          >
            Logout
          </button>
        )}
        {!isCurrentUserProfile && (
          <Link
            href="/chat"
            className="px-4 py-2 bg-blue-600 text-gray-100 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium cursor-pointer"
          >
            Back to Chat
          </Link>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-lg p-8 space-y-6">
          <div className="flex flex-col items-center">
            <Image
              src={userProfile.profilePicture || "/default-avatar.png"}
              alt="Profile Picture"
              width={160}
              height={160}
              className="rounded-full border-4 border-blue-400 shadow-md object-cover w-40 h-40 transition-transform duration-200 hover:scale-105"
              priority
            />
            <p className="text-2xl font-bold mt-4 text-gray-100">
              {`${userProfile.firstName} ${userProfile.lastName}`}
            </p>
            <p className="text-sm text-gray-400">{userProfile.email}</p>
          </div>

          {isCurrentUserProfile && (
            <form
              onSubmit={handleUpload}
              className="space-y-5 border-t border-gray-700 pt-6"
            >
              <h2 className="text-xl font-semibold text-gray-100">
                Change Profile Picture
              </h2>
              <div>
                <label
                  htmlFor="profilePicture"
                  className="block text-sm font-medium text-gray-300"
                >
                  Select a new picture
                </label>
                <input
                  type="file"
                  id="profilePicture"
                  name="profilePicture"
                  accept="image/jpeg, image/png, image/gif"
                  onChange={handleFileChange}
                  className="mt-2 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-gray-100 file:hover:bg-blue-700 file:cursor-pointer file:transition-colors file:duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUploading}
                />
              </div>

              {selectedFile && (
                <p className="text-sm text-gray-400">
                  Selected:{" "}
                  <span className="font-medium text-gray-200">
                    {selectedFile.name}
                  </span>
                </p>
              )}

              {uploadMessage && (
                <p className="text-green-400 text-sm font-medium">
                  {uploadMessage}
                </p>
              )}
              {uploadError && (
                <p className="text-red-400 text-sm font-medium">
                  {uploadError}
                </p>
              )}

              <button
                type="submit"
                className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-gray-100 font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-100"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    Upload Picture
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 border-t border-gray-700 pt-6 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 text-sm">
            <Link
              href="/chat"
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200 cursor-pointer"
            >
              Back to Public Rooms
            </Link>
            {isCurrentUserProfile && (
              <Link
                href="/chat/users"
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200 cursor-pointer"
              >
                Find Users
              </Link>
            )}
            {!isCurrentUserProfile && (
              <Link
                href={`/profile/${currentUserId}`}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200 cursor-pointer"
              >
                Go to Your Profile
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}