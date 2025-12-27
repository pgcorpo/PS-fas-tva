import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

/**
 * Hook that provides the JWT token for API authentication
 */
export function useAuthToken() {
  const { data: session, status } = useSession();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchToken() {
      if (status === "loading") {
        return;
      }

      if (!session?.user) {
        setToken(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/token");
        if (response.ok) {
          const data = await response.json();
          setToken(data.token);
        } else {
          setToken(null);
        }
      } catch (error) {
        console.error("Failed to fetch token:", error);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchToken();
  }, [session, status]);

  return {
    token,
    isLoading,
    isAuthenticated: !!session?.user && !!token,
  };
}
