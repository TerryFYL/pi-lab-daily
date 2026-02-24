/**
 * Student roster management with localStorage persistence.
 * Single source of truth for the student list across the app.
 */

const STORAGE_KEY = "lab_students";

export const DEFAULT_STUDENTS = ["陈思远", "刘雨桐", "张明阳", "王子涵", "李晓萱", "赵天宇"];

/** Read current student list. Falls back to defaults if none saved. */
export function getStudents(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // corrupted — fall through
  }
  return [...DEFAULT_STUDENTS];
}

/** Persist a student list to localStorage. */
export function saveStudents(names: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
}

/** Whether the user has customized the roster. */
export function isCustomRoster(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/** Remove custom roster, reverting to defaults. */
export function resetToDefault(): void {
  localStorage.removeItem(STORAGE_KEY);
}
