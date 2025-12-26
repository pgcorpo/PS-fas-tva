import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.getMe(),
  });
}
