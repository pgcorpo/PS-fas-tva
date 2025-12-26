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
      return dateB.getTime() - dateA.getTime(); // Descending
    })[0];

  return activeVersion || null;
}
