"use client";

import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useHabits } from "@/hooks/queries/useHabits";
import { useCompletions } from "@/hooks/queries/useCompletions";
import { useCreateCompletion, useDeleteCompletion } from "@/hooks/queries/useCompletions";
import {
  getLocalToday,
  getWeekRange,
  getWeekStart,
  isTodayDate,
  isPastDate,
  formatDate,
} from "@/lib/dateUtils";
import { getActiveVersion } from "@/lib/habitUtils";

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(getLocalToday());
  const isToday = isTodayDate(selectedDate);
  const isPast = isPastDate(selectedDate);

  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedHabitForNotes, setSelectedHabitForNotes] = useState<{ habitId: string; habitName: string } | null>(null);
  const [notesText, setNotesText] = useState("");

  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const weekRange = getWeekRange(selectedDate);
  const { data: completions = [], isLoading: completionsLoading } = useCompletions(
    weekRange.start,
    weekRange.end
  );

  const createCompletion = useCreateCompletion();
  const deleteCompletion = useDeleteCompletion();

  // Calculate remaining instances for each habit
  // Show all habits (including deleted) to access completion data
  const habitInstances = habits
    .map((habit) => {
      const version = getActiveVersion(habit, weekRange.start);
      if (!version) return null;

      const completedCount = completions.filter(
        (c) => c.habit_id === habit.id
      ).length;

      let weeklyTarget = version.weekly_target;

      // Fair Deletion Logic for score calculation
      if (habit.is_deleted) {
        const deletionWeekStart = getWeekStart(habit.updated_at);
        if (weekRange.start > deletionWeekStart) {
          // Future week: Should basically be hidden, but we return null to be safe
          return null;
        } else if (weekRange.start === deletionWeekStart) {
          // Deletion week: Cap target to completions
          weeklyTarget = completedCount;
        }
      }

      const remaining = Math.max(0, weeklyTarget - completedCount);

      const completedForDate = completions.filter(
        (c) => c.habit_id === habit.id && c.date === selectedDate
      );

      // Determine how many instances to render
      let renderCount = 0;
      if (remaining > 0 && isToday) {
        // Enforce pure consistency: Max 1 instance per habit per day, regardless of backlog or day of week
        if (completedForDate.length === 0) {
          renderCount = 1;
        }
      }

      return {
        habit,
        version,
        remaining,
        renderCount,
        completedForDate,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const handleComplete = async (habitId: string, text?: string) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMinutes = new Date().getTimezoneOffset() * -1;

    try {
      await createCompletion.mutateAsync({
        habit_id: habitId,
        date: selectedDate,
        text: text || null,
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
            <p className="mt-6 text-zinc-100 font-medium">pulling up your day...</p>
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
          <h1 className="text-4xl font-semibold text-zinc-100 mb-2">
            {formatDate(selectedDate, "EEEE, MMMM d")}
          </h1>
          {!isToday && (
            <p className="text-base text-zinc-400">view only (can&apos;t edit)</p>
          )}
        </div>

        {/* Remaining Section */}
        {isToday && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-8 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></div>
              <h2 className="text-2xl font-semibold text-zinc-100">
                on your plate today
              </h2>
            </div>

            {habitInstances.filter((item) => !item.habit.is_deleted && item.renderCount > 0).length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-green-950 to-emerald-950 rounded-2xl border border-green-800">
                <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-zinc-100 mb-2">you&apos;re done!</h3>
                <p className="text-zinc-400">week = complete. go touch grass</p>
              </div>
            ) : (
              <div className="space-y-3">
                {habitInstances
                  .filter((item) => !item.habit.is_deleted && item.renderCount > 0)
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
                              // Open notes modal
                              setSelectedHabitForNotes({
                                habitId: item.habit.id,
                                habitName: item.habit.name
                              });
                              setNotesText("");
                              setIsNotesModalOpen(true);
                            } else {
                              handleComplete(item.habit.id);
                            }
                          }}
                        />
                        <label className="flex-1 text-base text-zinc-100 font-medium cursor-pointer">
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
            <h2 className="text-2xl font-semibold text-zinc-100">
              already done
            </h2>
          </div>

          {habitInstances.filter((item) => item.completedForDate.length > 0).length === 0 ? (
            <div className="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-700">
              <p className="text-zinc-400">nothing done yet, time to start</p>
            </div>
          ) : (
            <div className="space-y-3">
              {habitInstances
                .filter((item) => item.completedForDate.length > 0)
                .flatMap((item) =>
                  item.completedForDate.map((completion) => (
                    <div
                      key={completion.id}
                      className="flex items-center gap-4 p-5 bg-gradient-to-r from-green-950 to-emerald-950 rounded-2xl border border-green-800 group"
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
                        <label className="text-base text-zinc-100 font-medium">
                          {item.habit.name}
                        </label>
                        {completion.text && (
                          <p className="text-sm text-zinc-400 mt-1">
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

      {/* Notes Modal */}
      {isNotesModalOpen && selectedHabitForNotes && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-40 transition-opacity backdrop-blur-sm"
              onClick={() => {
                setIsNotesModalOpen(false);
                setSelectedHabitForNotes(null);
                setNotesText("");
              }}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  add notes
                </h2>
                <button
                  onClick={() => {
                    setIsNotesModalOpen(false);
                    setSelectedHabitForNotes(null);
                    setNotesText("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-900 mb-4">
                {selectedHabitForNotes.habitName}
              </p>

              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-base resize-none"
                rows={6}
                placeholder="what did you do? how'd it go?"
                autoFocus
              />

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setIsNotesModalOpen(false);
                    setSelectedHabitForNotes(null);
                    setNotesText("");
                  }}
                  className="flex-1 px-6 py-3 border border-zinc-600 text-zinc-300 font-semibold rounded-xl hover:bg-zinc-800 transition-colors duration-200"
                >
                  cancel
                </button>
                <button
                  onClick={async () => {
                    if (notesText.trim()) {
                      await handleComplete(selectedHabitForNotes.habitId, notesText.trim());
                      setIsNotesModalOpen(false);
                      setSelectedHabitForNotes(null);
                      setNotesText("");
                    }
                  }}
                  disabled={!notesText.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  mark as done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
