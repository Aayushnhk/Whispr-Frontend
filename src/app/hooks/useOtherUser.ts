import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UseOtherUserProps {
  userId: string | null;
  currentUserId: string | null;
}

interface OtherUser {
  username: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_URL || "";

const useOtherUser = ({ userId, currentUserId }: UseOtherUserProps) => {
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!userId || !currentUserId) {
      setError("Invalid user IDs");
      setLoading(false);
      return;
    }

    const fetchOtherUser = async () => {
      setLoading(true);
      setError(null);
      if (!BACKEND_URL) {
        setError("Backend URL is not configured. Cannot fetch user details.");
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await fetch(`${BACKEND_URL}/api/user?id=${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include', // Added for CORS
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch user details");
        }

        const data = await response.json();
        setOtherUser({
          username: data.user.username || `${data.user.firstName} ${data.user.lastName}`,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          profilePicture: data.user.profilePicture,
        });
      } catch (err: any) {
        setError(err.message);
        router.push("/chat");
      } finally {
        setLoading(false);
      }
    };

    fetchOtherUser();
  }, [userId, currentUserId, router]);

  return { otherUser, loading, error };
};

export default useOtherUser;