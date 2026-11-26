import { MEAL_META } from '../data/initialMenuData';
import { getColumnIndexForWeekday, toLocalDateIso } from './cycleCalculator';
import type { DishOverride, SnoozedReminder, UserSettings } from '../types/mess';

const KEYS = {
  SETTINGS: 'messmate_v1_settings',
  OVERRIDES: 'messmate_v1_dish_overrides',
  SNOOZES: 'messmate_v1_snoozes',
  SENT_LOG: 'messmate_v1_sent_log',
} as const;

export function createDefaultSettings(now = new Date()): UserSettings {
  const todayIso = toLocalDateIso(now);
  return {
    hasCompletedOnboarding: false,
    cycleStartDateIso: todayIso,
    startingColumnIndex: getColumnIndexForWeekday(todayIso, 1),
    repeatAfter14Days: true,
    timingScheduleMode: 'AUTO_BY_CALENDAR',
    masterNotificationsEnabled: true,
    mealNotificationsEnabled: {
      BREAKFAST: true,
      LUNCH: true,
      SNACKS: true,
      DINNER: true,
    },
    mealNotifyTimes: {
      BREAKFAST: MEAL_META.BREAKFAST.defaultNotifyTime,
      LUNCH: MEAL_META.LUNCH.defaultNotifyTime,
      SNACKS: MEAL_META.SNACKS.defaultNotifyTime,
      DINNER: MEAL_META.DINNER.defaultNotifyTime,
    },
    themeMode: 'SYSTEM',
    textScalePercent: 100,
  };
}

export function loadSettings(): UserSettings {
  const defaults = createDefaultSettings();
  try {
    const raw = window.localStorage.getItem(KEYS.SETTINGS);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      ...defaults,
      ...parsed,
      mealNotificationsEnabled: {
        ...defaults.mealNotificationsEnabled,
        ...(parsed.mealNotificationsEnabled ?? {}),
      },
      mealNotifyTimes: {
        ...defaults.mealNotifyTimes,
        ...(parsed.mealNotifyTimes ?? {}),
      },
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    window.localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors in restricted private contexts
  }
}

export function loadDishOverrides(): Record<string, DishOverride> {
  try {
    const raw = window.localStorage.getItem(KEYS.OVERRIDES);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DishOverride>;
  } catch {
    return {};
  }
}

export function saveDishOverrides(overrides: Record<string, DishOverride>): void {
  try {
    window.localStorage.setItem(KEYS.OVERRIDES, JSON.stringify(overrides));
  } catch {
    // Ignore storage errors
  }
}

export function loadSnoozes(): SnoozedReminder[] {
  try {
    const raw = window.localStorage.getItem(KEYS.SNOOZES);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SnoozedReminder[];
    const nowMs = Date.now();
    return parsed.filter((s) => s.triggerAtEpochMs > nowMs - 60_000);
  } catch {
    return [];
  }
}

export function saveSnoozes(snoozes: SnoozedReminder[]): void {
  try {
    window.localStorage.setItem(KEYS.SNOOZES, JSON.stringify(snoozes));
  } catch {
    // Ignore storage errors
  }
}

export function hasSentNotificationKey(dedupKey: string): boolean {
  try {
    const raw = window.localStorage.getItem(KEYS.SENT_LOG);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, number>;
    return Boolean(map[dedupKey]);
  } catch {
    return false;
  }
}

export function markNotificationKeySent(dedupKey: string): void {
  try {
    const raw = window.localStorage.getItem(KEYS.SENT_LOG);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map[dedupKey] = Date.now();
    // Prune entries older than 7 days
    const cutoff = Date.now() - 7 * 86_400_000;
    for (const k of Object.keys(map)) {
      if (map[k] < cutoff) delete map[k];
    }
    window.localStorage.setItem(KEYS.SENT_LOG, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

export type BrowserNotificationPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}
