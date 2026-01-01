"use client";

import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useHabits } from "@/hooks/queries/useHabits";
import { useCompletions } from "@/hooks/queries/useCompletions";
import { getWeekRange, formatDate, getWeekStart, getWeekEnd } from "@/lib/dateUtils";
import { getActiveVersion } from "@/lib/habitUtils";
import { startOfMonth, endOfMonth, eachWeekOfInterval, format, addDays, parseISO, addMonths } from "date-fns";

export default function ProgressPage() {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const weeks = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 1 }
  );

  const { data: habits = [] } = useHabits();
  const { data: completions = [] } = useCompletions(
    format(monthStart, "yyyy-MM-dd"),
    format(monthEnd, "yyyy-MM-dd")
  );

  // Calculate selected week
  const selectedWeekStart = getWeekStart(selectedDate);
  const selectedWeekEnd = getWeekEnd(selectedDate);

  // Calculate progress for each week
  const weekProgress = weeks.map((weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekStartStr = format(weekStart, "yyyy-MM-dd");
    const weekEndStr = format(weekEnd, "yyyy-MM-dd");

    // Calculate required and completed for the week
    let required = 0;
    let completed = 0;

    habits
      .filter((h) => !h.is_deleted)
      .forEach((habit) => {
        const version = getActiveVersion(habit, weekStartStr);
        if (version) {
          required += version.weekly_target;
          const weekCompletions = completions.filter(
            (c) =>
              c.habit_id === habit.id &&
              c.date >= weekStartStr &&
              c.date <= weekEndStr
          );
          completed += weekCompletions.length;
        }
      });

    const percentage = required > 0 ? (completed / required) * 100 : 0;

    // Determine color
    let color = "";
    if (required === 0 || weekStart > new Date()) {
      color = ""; // No color for future weeks or weeks with no habits
    } else if (percentage < 25) {
      color = "bg-red-100 border-red-300";
    } else if (percentage <= 75) {
      color = "bg-yellow-100 border-yellow-300";
    } else {
      color = "bg-green-100 border-green-300";
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
    .filter(h => !h.is_deleted)
    .map(habit => {
      const version = getActiveVersion(habit, selectedWeekStart);
      if (!version) return null;

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
      const percentage = (completedCount / version.weekly_target) * 100;

      return {
        habit,
        version,
        dailyStatus,
        completedCount,
        percentage,
        isExpanded: expandedHabitId === habit.id
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Calculate selected week overall stats
  const selectedWeekStats = weekProgress.find(w => w.weekStartStr === selectedWeekStart);

  // Function to get habit history
  const getHabitHistory = (habitId: string) => {
    return completions
      .filter(c => c.habit_id === habitId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20)
      .map(c => ({
        id: c.id,
        date: c.date,
        dateFormatted: format(parseISO(c.date), "EEE, MMM d"),
        text: c.text
      }));
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold text-gray-900 mb-2">how you&apos;re doing</h1>
          <p className="text-lg text-gray-900">see your week at a glance</p>
        </div>

        {/* Top Section: Mini Calendar + Week Stats */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Mini Calendar - Left */}
          <div className="w-full lg:w-2/5">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Previous month"
                >
                  <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(viewMonth, "MMMM yyyy")}
                </h3>
                <button
                  onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Next month"
                >
                  <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    className={`w-full p-3 rounded-xl border transition-all duration-200 text-left ${
                      week.isSelected
                        ? "ring-2 ring-pink-500 border-pink-500 bg-white"
                        : !week.color
                        ? "bg-white border-gray-200 opacity-50 cursor-not-allowed"
                        : week.percentage < 25
                        ? "bg-red-100 border-red-300 hover:shadow-sm"
                        : week.percentage <= 75
                        ? "bg-yellow-100 border-yellow-300 hover:shadow-sm"
                        : "bg-green-100 border-green-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {format(week.weekStart, "MMM d")} - {format(week.weekEnd, "d")}
                      </span>
                      {week.required > 0 && (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-white rounded-full">
                          {Math.round(week.percentage)}%
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Week Stats Card - Right */}
          <div className="w-full lg:w-3/5">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedDate(addDays(parseISO(selectedWeekStart), -7))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Previous week"
                >
                  <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-gray-900">
                  Week of {format(parseISO(selectedWeekStart), "MMM d")} - {format(parseISO(selectedWeekEnd), "d, yyyy")}
                </h3>
                <button
                  onClick={() => setSelectedDate(addDays(parseISO(selectedWeekStart), 7))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Next week"
                >
                  <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Overall Stats */}
              {selectedWeekStats && selectedWeekStats.required > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Overall Progress</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedWeekStats.completed} / {selectedWeekStats.required}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        selectedWeekStats.percentage < 25
                          ? "bg-gradient-to-r from-red-500 to-rose-500"
                          : selectedWeekStats.percentage <= 75
                          ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                          : "bg-gradient-to-r from-green-500 to-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, selectedWeekStats.percentage)}%` }}
                    />
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-semibold ${
                      selectedWeekStats.percentage < 25
                        ? "text-red-600"
                        : selectedWeekStats.percentage <= 75
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}>
                      {Math.round(selectedWeekStats.percentage)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Grid Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Habit
                  </th>
                  {weekDays.map(day => (
                    <th key={day.date} className="text-center px-3 py-4 text-sm font-semibold text-gray-900">
                      <div>{day.dayName}</div>
                      <div className="text-xs text-gray-600 font-normal">{day.dayOfMonth}</div>
                    </th>
                  ))}
                  <th className="text-center px-4 py-4 text-sm font-semibold text-gray-900">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {habitGridData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <p className="text-gray-600">no habits yet</p>
                    </td>
                  </tr>
                ) : (
                  habitGridData.map(item => (
                    <>
                      {/* Main habit row */}
                      <tr key={item.habit.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setExpandedHabitId(
                              item.isExpanded ? null : item.habit.id
                            )}
                            className="text-base font-medium text-gray-900 hover:text-pink-600 transition-colors"
                            aria-expanded={item.isExpanded}
                            aria-controls={`history-${item.habit.id}`}
                          >
                            {item.habit.name}
                          </button>
                        </td>
                        {item.dailyStatus.map(day => (
                          <td key={day.date} className="text-center px-3 py-4">
                            {day.isComplete ? (
                              <span className="text-green-500 text-lg">✓</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        ))}
                        <td className="text-center px-4 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-medium text-gray-900">
                              {item.completedCount}/{item.version.weekly_target}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.percentage < 25
                                ? "bg-red-100 text-red-700"
                                : item.percentage <= 75
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}>
                              {Math.round(item.percentage)}%
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable history row */}
                      {item.isExpanded && (
                        <tr id={`history-${item.habit.id}`}>
                          <td colSpan={9} className="bg-gray-50 px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  last 20 completions
                                </h4>
                                <button
                                  onClick={() => setExpandedHabitId(null)}
                                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                  close
                                </button>
                              </div>

                              {(() => {
                                const history = getHabitHistory(item.habit.id);
                                return history.length === 0 ? (
                                  <p className="text-sm text-gray-600 text-center py-4">
                                    no completions yet
                                  </p>
                                ) : (
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {history.map(completion => (
                                      <div key={completion.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                        <span className="text-green-500 text-sm flex-shrink-0">✓</span>
                                        <div className="flex-1">
                                          <div className="text-sm font-medium text-gray-900">
                                            {completion.dateFormatted}
                                          </div>
                                          {completion.text && (
                                            <p className="text-sm text-gray-900 mt-1">
                                              "{completion.text}"
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
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
    </Layout>
  );
}
