import { parseISO } from "date-fns";
import type { DateString } from "./dateUtils";

export interface HabitVersion {
  id: string;
  weekly_target: number;
  requires_text_on_completion: boolean;
  linked_goal_id: string | null;
  effective_week_start: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  name: string;
  order_index: number;
  linked_goal_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  versions: HabitVersion[];
}

/**
 * Get the active habit version for a given week start.
 * Returns the version with the greatest effective_week_start <= week_start.
 * If multiple versions have the same effective_week_start, returns the most recently created one.
 */
export function getActiveVersion(
  habit: Habit,
  weekStart: DateString
): HabitVersion | null {
  const weekStartDate = parseISO(weekStart);

  // Find the version with the greatest effective_week_start <= week_start
  const activeVersion = habit.versions
    .filter((v) => {
      const effectiveDate = parseISO(v.effective_week_start);
      return effectiveDate <= weekStartDate;
    })
    .sort((a, b) => {
      const dateA = parseISO(a.effective_week_start);
      const dateB = parseISO(b.effective_week_start);

      // Primary sort: effective_week_start descending
      const dateDiff = dateB.getTime() - dateA.getTime();
      if (dateDiff !== 0) return dateDiff;

      // Secondary sort: created_at descending (for same week edits)
      const createdA = parseISO(a.created_at);
      const createdB = parseISO(b.created_at);
      return createdB.getTime() - createdA.getTime();
    })[0];

  return activeVersion || null;
}

/**
 * Compute the current consecutive-week streak for a habit.
 * Walks backwards from the most recent completed week and counts consecutive
 * weeks where completions >= weeklyTarget.
 *
 * @param completions  All completion records for this habit (any date range).
 * @param weeklyTarget The target number of completions per week.
 * @param today        Optional override for "today" (for testing).
 */
export function computeStreak(
  completions: Array<{ date: string }>,
  weeklyTarget: number,
  today: Date = new Date()
): number {
  if (weeklyTarget === 0 || completions.length === 0) return 0;

  // Build a Set of completed dates for quick lookup
  const completedDates = new Set(completions.map((c) => c.date));

  let streak = 0;
  // Start from the week containing today and walk backwards up to 52 weeks
  const todayMs = today.getTime();

  for (let weeksBack = 0; weeksBack < 52; weeksBack++) {
    // Monday of this week
    const pivot = new Date(todayMs - weeksBack * 7 * 24 * 60 * 60 * 1000);
    const dayOfWeek = pivot.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(pivot);
    monday.setDate(pivot.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    // If the week hasn't ended yet (current week), only count if target already met
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Count completions in this week
    let count = 0;
    for (let d = 0; d < 7; d++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + d);
      const dateStr = day.toISOString().split("T")[0];
      if (completedDates.has(dateStr)) count++;
    }

    if (count >= weeklyTarget) {
      streak++;
    } else if (weeksBack === 0) {
      // Current week not yet complete — don't break streak, just skip
      continue;
    } else {
      break;
    }
  }

  return streak;
}
