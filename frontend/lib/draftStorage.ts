/**
 * Client-side draft text storage for habit completions.
 * Drafts are stored in localStorage and keyed by user_id + habit_id + date.
 */

const DRAFT_PREFIX = "habit_draft_";

function getDraftKey(userId: string, habitId: string, date: string): string {
  return `${DRAFT_PREFIX}${userId}_${habitId}_${date}`;
}

export function saveDraft(
  userId: string,
  habitId: string,
  date: string,
  text: string
): void {
  if (typeof window === "undefined") return;
  
  const key = getDraftKey(userId, habitId, date);
  try {
    localStorage.setItem(key, text);
  } catch (error) {
    console.error("Failed to save draft:", error);
  }
}

export function getDraft(
  userId: string,
  habitId: string,
  date: string
): string | null {
  if (typeof window === "undefined") return null;
  
  const key = getDraftKey(userId, habitId, date);
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error("Failed to get draft:", error);
    return null;
  }
}

export function clearDraft(
  userId: string,
  habitId: string,
  date: string
): void {
  if (typeof window === "undefined") return;
  
  const key = getDraftKey(userId, habitId, date);
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear draft:", error);
  }
}
