// src/hooks/useAuthRedirect.ts
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/models/types";

const useAuthRedirect = () => {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (authLoading) {
      timeoutId = setTimeout(() => {
        if (authLoading && !isAuthenticated) {
          console.log("Authentication still loading after timeout, redirecting to /login");
          router.replace("/login");
        }
      }, 5000);
    }
    return () => clearTimeout(timeoutId);
  }, [authLoading, isAuthenticated, router]);

  return { authLoading, isAuthenticated, user: user as User | null, logout };
};

export default useAuthRedirect;