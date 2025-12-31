"use client";

import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useHabits } from "@/hooks/queries/useHabits";
import { useCompletions } from "@/hooks/queries/useCompletions";
import { getWeekRange, formatDate, getWeekStart, getWeekEnd } from "@/lib/dateUtils";
import { getActiveVersion } from "@/lib/habitUtils";
import { startOfMonth, endOfMonth, eachWeekOfInterval, format } from "date-fns";
import Link from "next/link";

export default function ProgressPage() {
  const [viewMonth, setViewMonth] = useState(new Date());

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
    };
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold text-gray-900 mb-3">Your Progress</h1>
          <p className="text-lg text-gray-600">Track your weekly habit completion</p>
        </div>

        {/* Week Cards */}
        <div className="space-y-4">
          {weekProgress.map((week) => (
            <div
              key={week.weekStartStr}
              className={`p-6 rounded-2xl border transition-all duration-200 hover:shadow-md ${
                week.color || "bg-white border-gray-200 shadow-sm"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(week.weekStart, "MMM d")} - {format(week.weekEnd, "MMM d, yyyy")}
                </h3>
                {week.required > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      {week.completed} / {week.required}
                    </span>
                    <span className="px-3 py-1 text-sm font-semibold bg-gray-100 text-gray-700 rounded-full">
                      {Math.round(week.percentage)}%
                    </span>
                  </div>
                )}
              </div>
              {week.required > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
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
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
