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
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-pink-500 border-r-transparent"></div>
            <p className="mt-6 text-gray-900 font-medium">pulling up your day...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold text-gray-900 mb-2">
            {formatDate(selectedDate, "EEEE, MMMM d")}
          </h1>
          {!isToday && (
            <p className="text-base text-gray-600">view only (can&apos;t edit)</p>
          )}
        </div>

        {/* Remaining Section */}
        {isToday && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-8 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></div>
              <h2 className="text-2xl font-semibold text-gray-900">
                on your plate today
              </h2>
            </div>

            {habitInstances.filter((item) => item.renderCount > 0).length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">you&apos;re done!</h3>
                <p className="text-gray-700">week = complete. go touch grass</p>
              </div>
            ) : (
              <div className="space-y-3">
                {habitInstances
                  .filter((item) => item.renderCount > 0)
                  .flatMap((item) =>
                    Array.from({ length: item.renderCount }, (_, i) => (
                      <div
                        key={`${item.habit.id}-${i}`}
                        className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-pink-200 hover:shadow-sm transition-all duration-200 group"
                      >
                        <input
                          type="checkbox"
                          className="w-6 h-6 text-pink-500 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer transition-all"
                          onChange={() => {
                            if (item.version.requires_text_on_completion) {
                              // TODO: Open inline text editor
                              alert("needs notes - editor dropping soon");
                            } else {
                              handleComplete(item.habit.id);
                            }
                          }}
                        />
                        <label className="flex-1 text-base text-gray-900 font-medium cursor-pointer">
                          {item.habit.name}
                        </label>
                      </div>
                    ))
                  )}
              </div>
            )}
          </div>
        )}

        {/* Completed Section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
            <h2 className="text-2xl font-semibold text-gray-900">
              already done
            </h2>
          </div>

          {habitInstances.filter((item) => item.completedForDate.length > 0).length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
              <p className="text-gray-600">nothing done yet, time to start</p>
            </div>
          ) : (
            <div className="space-y-3">
              {habitInstances
                .filter((item) => item.completedForDate.length > 0)
                .flatMap((item) =>
                  item.completedForDate.map((completion) => (
                    <div
                      key={completion.id}
                      className="flex items-center gap-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 group"
                    >
                      <input
                        type="checkbox"
                        checked
                        disabled={isPast}
                        className="w-6 h-6 text-green-500 border-2 border-green-400 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onChange={() => {
                          if (!isPast) {
                            handleUncomplete(completion.id);
                          }
                        }}
                      />
                      <div className="flex-1">
                        <label className="text-base text-gray-900 font-medium">
                          {item.habit.name}
                        </label>
                        {completion.text && (
                          <p className="text-sm text-gray-700 mt-1">
                            {completion.text.substring(0, 100)}
                            {completion.text.length > 100 ? "..." : ""}
                          </p>
                        )}
                      </div>
                      <svg className="w-6 h-6 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
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
