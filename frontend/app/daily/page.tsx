"use client";

import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useHabits } from "@/hooks/queries/useHabits";
import { useCompletions } from "@/hooks/queries/useCompletions";
import { useCreateCompletion, useDeleteCompletion } from "@/hooks/queries/useCompletions";
import {
  getLocalToday,
  getWeekRange,
  isTodayDate,
  isPastDate,
  formatDate,
} from "@/lib/dateUtils";
import { getActiveVersion } from "@/lib/habitUtils";

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(getLocalToday());
  const isToday = isTodayDate(selectedDate);
  const isPast = isPastDate(selectedDate);

  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const weekRange = getWeekRange(selectedDate);
  const { data: completions = [], isLoading: completionsLoading } = useCompletions(
    weekRange.start,
    weekRange.end
  );

  const createCompletion = useCreateCompletion();
  const deleteCompletion = useDeleteCompletion();

  // Calculate remaining instances for each habit
  const habitInstances = habits
    .filter((habit) => !habit.is_deleted)
    .map((habit) => {
      const version = getActiveVersion(habit, weekRange.start);
      if (!version) return null;

      const completedCount = completions.filter(
        (c) => c.habit_id === habit.id
      ).length;

      const remaining = Math.max(0, version.weekly_target - completedCount);
      
      // Determine how many instances to render
      let renderCount = 0;
      if (remaining > 0) {
        if (isToday) {
          const today = new Date(selectedDate);
          const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
          if (dayOfWeek === 0) {
            // Sunday: render all remaining
            renderCount = remaining;
          } else {
            // Mon-Sat: render 1
            renderCount = 1;
          }
        }
      }

      const completedForDate = completions.filter(
        (c) => c.habit_id === habit.id && c.date === selectedDate
      );

      return {
        habit,
        version,
        remaining,
        renderCount,
        completedForDate,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const handleComplete = async (habitId: string) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMinutes = new Date().getTimezoneOffset() * -1;

    try {
      await createCompletion.mutateAsync({
        habit_id: habitId,
        date: selectedDate,
        client_timezone: timezone,
        client_tz_offset_minutes: offsetMinutes,
      });
    } catch (error) {
      console.error("Failed to create completion:", error);
    }
  };

  const handleUncomplete = async (completionId: string) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMinutes = new Date().getTimezoneOffset() * -1;

    try {
      await deleteCompletion.mutateAsync({
        completionId,
        clientTimezone: timezone,
        clientTzOffsetMinutes: offsetMinutes,
      });
    } catch (error) {
      console.error("Failed to delete completion:", error);
    }
  };

  if (habitsLoading || completionsLoading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {formatDate(selectedDate)}
          </h2>
          {!isToday && (
            <p className="text-sm text-gray-500 mt-1">Read-only</p>
          )}
        </div>

        {isToday && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Remaining
            </h3>
            {habitInstances.filter((item) => item.renderCount > 0).length === 0 ? (
              <p className="text-gray-500">All habits completed for this week!</p>
            ) : (
              <div className="space-y-2">
                {habitInstances
                  .filter((item) => item.renderCount > 0)
                  .flatMap((item) =>
                    Array.from({ length: item.renderCount }, (_, i) => (
                      <div
                        key={`${item.habit.id}-${i}`}
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-blue-600 rounded"
                          onChange={() => {
                            if (item.version.requires_text_on_completion) {
                              // TODO: Open inline text editor
                              alert("Text entry required - inline editor coming soon");
                            } else {
                              handleComplete(item.habit.id);
                            }
                          }}
                        />
                        <label className="flex-1 text-gray-900">
                          {item.habit.name}
                        </label>
                      </div>
                    ))
                  )}
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Completed
          </h3>
          {habitInstances.filter((item) => item.completedForDate.length > 0)
            .length === 0 ? (
            <p className="text-gray-500">No completions for this date.</p>
          ) : (
            <div className="space-y-2">
              {habitInstances
                .filter((item) => item.completedForDate.length > 0)
                .flatMap((item) =>
                  item.completedForDate.map((completion) => (
                    <div
                      key={completion.id}
                      className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked
                        disabled={isPast}
                        className="w-5 h-5 text-blue-600 rounded disabled:opacity-50"
                        onChange={() => {
                          if (!isPast) {
                            handleUncomplete(completion.id);
                          }
                        }}
                      />
                      <label className="flex-1 text-gray-900">
                        {item.habit.name}
                        {completion.text && (
                          <span className="text-sm text-gray-500 ml-2">
                            - {completion.text.substring(0, 50)}
                            {completion.text.length > 50 ? "..." : ""}
                          </span>
                        )}
                      </label>
                    </div>
                  ))
                )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
