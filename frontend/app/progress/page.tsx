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
      <div className="px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Progress</h2>
        </div>

        <div className="space-y-6">
          {weekProgress.map((week) => (
            <div
              key={week.weekStartStr}
              className={`p-4 rounded-lg border-2 ${week.color || "bg-white border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-900">
                  {format(week.weekStart, "MMM d")} - {format(week.weekEnd, "MMM d")}
                </h3>
                {week.required > 0 && (
                  <span className="text-sm text-gray-600">
                    {week.completed} / {week.required} ({Math.round(week.percentage)}%)
                  </span>
                )}
              </div>
              {week.required > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      week.percentage < 25
                        ? "bg-red-500"
                        : week.percentage <= 75
                        ? "bg-yellow-500"
                        : "bg-green-500"
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
