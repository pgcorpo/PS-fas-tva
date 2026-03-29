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
    onMutate: async (newCompletion) => {
      // 1. Cancel outgoing queries so they don't accidentally overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["completions"] });

      // 2. Snapshot the current cache
      const previousCompletions = queryClient.getQueriesData({ queryKey: ["completions"] });

      // 3. Optimistically update all cached completion ranges
      queryClient.setQueriesData({ queryKey: ["completions"] }, (oldData: any[]) => {
        if (!oldData) return [];
        
        // Mock the completion object
        const optimisticCompletion = {
          id: `temp-${Date.now()}`,
          habit_id: newCompletion.habit_id,
          date: newCompletion.date,
          text: newCompletion.text || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return [...oldData, optimisticCompletion];
      });

      // 4. Return context containing the snapshot so we can roll back if needed
      return { previousCompletions };
    },
    onError: (err, newCompletion, context) => {
      // 5. On failure, roll back to the snapshotted cache
      if (context?.previousCompletions) {
        context.previousCompletions.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
    },
    onSettled: () => {
      // 6. Regardless of success/failure, invalidate to ensure perfectly aligned remote state
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
    onMutate: async (variables) => {
      // 1. Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["completions"] });

      // 2. Snapshot the current cache
      const previousCompletions = queryClient.getQueriesData({ queryKey: ["completions"] });

      // 3. Optimistically remove the completion from all cached ranges
      queryClient.setQueriesData({ queryKey: ["completions"] }, (oldData: any[]) => {
        if (!oldData) return [];
        return oldData.filter(c => c.id !== variables.completionId);
      });

      return { previousCompletions };
    },
    onError: (err, variables, context) => {
      // 4. Rollback on failure
      if (context?.previousCompletions) {
        context.previousCompletions.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
    },
    onSettled: () => {
      // 5. Always resync perfectly with server afterwards
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
