import { format, startOfWeek, endOfWeek, isToday, isPast, parseISO, addDays } from "date-fns";

export type DateString = string; // YYYY-MM-DD format

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
export function getLocalToday(): DateString {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Get the Monday of the week containing the given date
 */
export function getWeekStart(date: DateString | Date): DateString {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const monday = startOfWeek(dateObj, { weekStartsOn: 1 }); // Monday = 1
  return format(monday, "yyyy-MM-dd");
}

/**
 * Get the Sunday of the week containing the given date
 */
export function getWeekEnd(date: DateString | Date): DateString {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const sunday = endOfWeek(dateObj, { weekStartsOn: 1 }); // Monday = 1
  return format(sunday, "yyyy-MM-dd");
}

/**
 * Check if a date is today
 */
export function isTodayDate(date: DateString | Date): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isToday(dateObj);
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: DateString | Date): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isPast(dateObj) && !isToday(dateObj);
}

/**
 * Get week range (start and end) for a given date
 */
export function getWeekRange(date: DateString | Date): { start: DateString; end: DateString } {
  return {
    start: getWeekStart(date),
    end: getWeekEnd(date),
  };
}

/**
 * Get the next Monday after a given date
 */
export function getNextMonday(date: DateString | Date): DateString {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const weekStart = startOfWeek(dateObj, { weekStartsOn: 1 });
  const nextMonday = addDays(weekStart, 7);
  return format(nextMonday, "yyyy-MM-dd");
}

/**
 * Format date for display
 */
export function formatDate(date: DateString | Date, formatStr: string = "PPP"): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatStr);
}
