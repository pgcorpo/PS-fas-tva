import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

export function useCompletions(start: string, end: string) {
  return useQuery({
    queryKey: ["completions", start, end],
    queryFn: () => api.getCompletions(start, end),
  });
}

export function useCreateCompletion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createCompletion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["completions"] });
    },
  });
}

export function useDeleteCompletion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ completionId, clientTimezone, clientTzOffsetMinutes }: {
      completionId: string;
      clientTimezone?: string | null;
      clientTzOffsetMinutes?: number | null;
    }) => api.deleteCompletion(completionId, clientTimezone, clientTzOffsetMinutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["completions"] });
    },
  });
}
