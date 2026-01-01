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

export function useHabitCompletions(
  habitId: string | null,
  limit: number = 20,
  offset: number = 0
) {
  return useQuery({
    queryKey: ["habitCompletions", habitId, limit, offset],
    queryFn: async () => {
      if (!habitId) return [];
      return api.getHabitCompletions(habitId, limit, offset);
    },
    enabled: !!habitId, // Only fetch when habitId is provided
    staleTime: 60 * 1000, // 60 seconds
  });
}
