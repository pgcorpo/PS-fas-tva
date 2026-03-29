"use client";

import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useHabits } from "@/hooks/queries/useHabits";
import { useCompletions, useHabitCompletions } from "@/hooks/queries/useCompletions";
import { getWeekRange, formatDate, getWeekStart, getWeekEnd } from "@/lib/dateUtils";
import { getActiveVersion } from "@/lib/habitUtils";
import { startOfMonth, endOfMonth, eachWeekOfInterval, format, addDays, parseISO, addMonths } from "date-fns";

export default function ProgressPage() {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  const [habitHistoryOffset, setHabitHistoryOffset] = useState(0);
  const [allHabitCompletions, setAllHabitCompletions] = useState<Array<any>>([]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const weeks = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 1 }
  );

  // Calculate the full date range for all weeks (including overlap into adjacent months)
  const firstWeekStart = weeks.length > 0 ? weeks[0] : monthStart;
  const lastWeekEnd = weeks.length > 0 ? addDays(weeks[weeks.length - 1], 6) : monthEnd;

  const { data: habits = [] } = useHabits();
  const { data: completions = [] } = useCompletions(
    format(firstWeekStart, "yyyy-MM-dd"),
    format(lastWeekEnd, "yyyy-MM-dd")
  );

  // Fetch habit-specific completions for pagination
  const { data: habitCompletions = [], isLoading: isLoadingHistory } = useHabitCompletions(
    expandedHabitId,
    20,
    habitHistoryOffset
  );

  // Accumulate habit completions when new data arrives
  useEffect(() => {
    if (habitCompletions.length > 0) {
      if (habitHistoryOffset === 0) {
        // First load - replace all
        setAllHabitCompletions(habitCompletions);
      } else {
        // Load more - append
        setAllHabitCompletions(prev => [...prev, ...habitCompletions]);
      }
    }
  }, [habitCompletions, habitHistoryOffset]);

  // Reset when habit changes
  useEffect(() => {
    setHabitHistoryOffset(0);
    setAllHabitCompletions([]);
  }, [expandedHabitId]);

  // Format completions for display
  const formattedHabitHistory = allHabitCompletions.map(c => ({
    id: c.id,
    date: c.date,
    dateFormatted: format(parseISO(c.date), "EEE, MMM d"),
    text: c.text
  }));

  // Calculate selected week
  const selectedWeekStart = getWeekStart(selectedDate);
  const selectedWeekEnd = getWeekEnd(selectedDate);

  // Calculate progress for each week
  const weekProgress = weeks.map((weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekStartStr = format(weekStart, "yyyy-MM-dd");
    const weekEndStr = format(weekEnd, "yyyy-MM-dd");

    // Calculate required and completed for the week (v3 - for...of)
    let required = 0;
    let completed = 0;

    for (const habit of habits) {
      const version = getActiveVersion(habit, weekStartStr);
      if (version) {
        const weekCompletions = completions.filter(
          (c) =>
            c.habit_id === habit.id &&
            c.date >= weekStartStr &&
            c.date <= weekEndStr
        );

        let habitRequired = version.weekly_target;
        let habitCompleted = weekCompletions.length;

        // Fair Deletion Logic
        if (habit.is_deleted) {
          const deletionWeekStart = getWeekStart(habit.updated_at);
          
          if (weekStartStr > deletionWeekStart) {
            // Future week: Exclude entirely
            continue;
          } else if (weekStartStr === deletionWeekStart) {
            // Deletion week: Cap target to current completions (fair score)
            habitRequired = habitCompleted;
          }
        }

        required += habitRequired;
        completed += habitCompleted;
      }
    }

    const percentage = required > 0 ? (completed / required) * 100 : 0;

    // Determine color
    let color = "";
    if (required === 0 || weekStart > new Date()) {
      color = ""; // No color for future weeks or weeks with no habits
    } else if (percentage < 25) {
      color = "bg-red-950 border-red-800";
    } else if (percentage <= 75) {
      color = "bg-amber-950 border-amber-800";
    } else {
      color = "bg-green-950 border-green-800";
    }

    return {
      weekStart,
      weekEnd,
      weekStartStr,
      weekEndStr,
      required,
      completed,
      percentage,
      color,
      isSelected: weekStartStr === selectedWeekStart,
    };
  });

  // Generate 7 days for selected week (Mon-Sun)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(parseISO(selectedWeekStart), i);
    return {
      date: format(day, "yyyy-MM-dd"),
      dayName: format(day, "EEE"),
      dayOfMonth: format(day, "d")
    };
  });

  // Build habit grid data (habits × days matrix)
  const habitGridData = habits
    // Show all habits (including deleted) to display historical data
    .map(habit => {
      const version = getActiveVersion(habit, selectedWeekStart);
      if (!version) return null;

      let weeklyTarget = version.weekly_target;

      // Fair Deletion Logic for rendering the row
      if (habit.is_deleted) {
        const deletionWeekStart = getWeekStart(habit.updated_at);
        if (selectedWeekStart > deletionWeekStart) {
          return null; // Don't render the row if this week is strictly after the deletion week
        }
      }

      const dailyStatus = weekDays.map(day => {
        const completion = completions.find(c =>
          c.habit_id === habit.id && c.date === day.date
        );
        return {
          date: day.date,
          isComplete: !!completion,
          hasNotes: !!completion?.text
        };
      });

      const completedCount = dailyStatus.filter(d => d.isComplete).length;
      
      if (habit.is_deleted) {
        const deletionWeekStart = getWeekStart(habit.updated_at);
        if (selectedWeekStart === deletionWeekStart) {
          // Deletion week: Cap target to completions
          weeklyTarget = completedCount;
        }
      }

      const percentage = weeklyTarget > 0 ? (completedCount / weeklyTarget) * 100 : 0;

      return {
        habit,
        version,
        dailyStatus,
        completedCount,
        percentage,
        weeklyTarget,
        isExpanded: expandedHabitId === habit.id
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Calculate selected week overall stats
  const selectedWeekStats = weekProgress.find(w => w.weekStartStr === selectedWeekStart);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-100 mb-2 tracking-tight">how you&apos;re doing</h1>
          <p className="text-base md:text-lg text-zinc-400">pick a week to see your daily breakdown <span className="text-xs text-zinc-500 font-mono ml-2">Build: v1.0.5</span></p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column: Enhanced Mini Calendar */}
          <div className="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6 shadow-sm">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  aria-label="Previous month"
                >
                  <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-zinc-100">
                  {format(viewMonth, "MMMM yyyy")}
                </h3>
                <button
                  onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  aria-label="Next month"
                >
                  <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Week List */}
              <div className="space-y-2">
                {weekProgress.map((week) => (
                  <button
                    key={week.weekStartStr}
                    onClick={() => week.color && setSelectedDate(week.weekStart)}
                    disabled={!week.color}
                    className={`w-full p-4 rounded-xl border transition-all duration-200 text-left ${
                      week.isSelected
                        ? "ring-2 ring-pink-500 border-pink-500 bg-zinc-800 shadow-md"
                        : !week.color
                        ? "bg-zinc-900 border-zinc-700 opacity-50 cursor-not-allowed"
                        : week.percentage < 25
                        ? "bg-red-950 border-red-800 hover:shadow-sm"
                        : week.percentage <= 75
                        ? "bg-amber-950 border-amber-800 hover:shadow-sm"
                        : "bg-green-950 border-green-800 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Date range */}
                      <span className="text-sm font-medium text-zinc-100">
                        {format(week.weekStart, "MMM d")} - {format(week.weekEnd, "MMM d")}
                      </span>

                      {/* Completion stats */}
                      {week.required > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-300">
                            {week.completed}/{week.required}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-700 text-zinc-100 rounded-full shadow-sm">
                            {Math.round(week.percentage)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Mini progress bar */}
                    {week.required > 0 && (
                      <div className="w-full bg-zinc-700 rounded-full h-1.5 mt-2">
                        <div
                          className={`h-1.5 rounded-full bar-grow ${
                            week.percentage < 25
                              ? "bg-gradient-to-r from-red-500 to-rose-500"
                              : week.percentage <= 75
                              ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                              : "bg-gradient-to-r from-green-500 to-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, week.percentage)}%` }}
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Weekly Grid Section */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-sm overflow-hidden flex-1 w-full min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800 border-b border-zinc-700">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-100">
                    habit
                  </th>
                  {weekDays.map(day => {
                    const isToday = day.date === format(new Date(), "yyyy-MM-dd");
                    return (
                      <th key={day.date} className={`text-center px-3 py-4 text-sm font-semibold text-zinc-100 ${
                        isToday ? "bg-pink-500/10" : ""
                      }`}>
                        <div className={isToday ? "text-pink-400" : ""}>{day.dayName}</div>
                        <div className={`text-xs font-normal ${isToday ? "text-pink-400" : "text-zinc-400"}`}>
                          {day.dayOfMonth}
                          {isToday && <span className="ml-0.5 inline-block w-1 h-1 bg-pink-400 rounded-full align-middle"></span>}
                        </div>
                      </th>
                    );
                  })}
                  <th className="text-center px-4 py-4 text-sm font-semibold text-zinc-100">
                    total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700">
                {habitGridData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-zinc-400 font-medium">no habits yet</p>
                      <p className="text-zinc-500 text-sm mt-1">add habits to start tracking your progress</p>
                    </td>
                  </tr>
                ) : (
                  habitGridData.map(item => (
                    <>
                      {/* Main habit row */}
                      <tr key={item.habit.id} className="hover:bg-zinc-800 transition-colors">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setExpandedHabitId(
                              item.isExpanded ? null : item.habit.id
                            )}
                            className="text-base font-medium text-zinc-100 hover:text-pink-400 transition-colors"
                            aria-expanded={item.isExpanded}
                            aria-controls={`history-${item.habit.id}`}
                          >
                            {item.habit.name}
                          </button>
                        </td>
                        {item.dailyStatus.map(day => (
                          <td key={day.date} className="text-center px-3 py-4">
                            {day.isComplete ? (
                              <span className="text-green-400 text-lg">✓</span>
                            ) : (
                              <span className="text-zinc-600">-</span>
                            )}
                          </td>
                        ))}
                        <td className="text-center px-4 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-medium text-zinc-100">
                              {item.completedCount}/{item.weeklyTarget}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.percentage < 25
                                ? "bg-red-950 text-red-300"
                                : item.percentage <= 75
                                ? "bg-amber-950 text-amber-300"
                                : "bg-green-950 text-green-300"
                            }`}>
                              {Math.round(item.percentage)}%
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable history row */}
                      {item.isExpanded && (
                        <tr id={`history-${item.habit.id}`}>
                          <td colSpan={9} className="bg-zinc-800 px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-zinc-100">
                                  completion history
                                </h4>
                                <button
                                  onClick={() => setExpandedHabitId(null)}
                                  className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                                >
                                  close
                                </button>
                              </div>

                              {/* Loading state */}
                              {isLoadingHistory && habitHistoryOffset === 0 ? (
                                <p className="text-sm text-zinc-400 text-center py-4">
                                  loading...
                                </p>
                              ) : formattedHabitHistory.length === 0 ? (
                                <p className="text-sm text-zinc-400 text-center py-4">
                                  no completions yet
                                </p>
                              ) : (
                                <>
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {formattedHabitHistory.map(completion => (
                                      <div key={completion.id} className="flex items-start gap-3 p-3 bg-zinc-700 rounded-lg border border-zinc-600">
                                        <span className="text-green-400 text-sm flex-shrink-0">✓</span>
                                        <div className="flex-1">
                                          <div className="text-sm font-medium text-zinc-100">
                                            {completion.dateFormatted}
                                          </div>
                                          {completion.text && (
                                            <p className="text-sm text-zinc-400 mt-1">
                                              &quot;{completion.text}&quot;
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Load More button */}
                                  {habitCompletions.length === 20 && (
                                    <div className="text-center mt-3">
                                      <button
                                        onClick={() => setHabitHistoryOffset(prev => prev + 20)}
                                        disabled={isLoadingHistory}
                                        className="px-4 py-2 text-sm font-medium text-zinc-100 bg-zinc-700 border border-zinc-600 rounded-lg hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {isLoadingHistory ? "loading..." : "load more"}
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
}
