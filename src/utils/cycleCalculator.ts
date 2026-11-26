import { INITIAL_14_DAY_MENU, MEAL_META, MEAL_ORDER } from '../data/initialMenuData';
import type {
  DayMenu,
  DishOverride,
  FoodLineItem,
  FormattedNotificationPayload,
  MealOperationalStatus,
  MealType,
  ResolvedCategoryGroup,
  ResolvedFoodItem,
  SnoozedReminder,
  TimingScheduleMode,
  UpcomingMealState,
  UserSettings,
} from '../types/mess';

/** Formats a local Date into YYYY-MM-DD without UTC timezone drift. */
export function toLocalDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses YYYY-MM-DD into a local Date at 00:00:00. */
export function parseLocalDateIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

/** Adds calendar days to a YYYY-MM-DD date accurately across months, years, and leap years. */
export function addDaysIso(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Whole calendar days between two YYYY-MM-DD dates (dst-safe via UTC midnight). */
export function diffCalendarDays(startIso: string, targetIso: string): number {
  const [sy, sm, sd] = startIso.split('-').map(Number);
  const [ty, tm, td] = targetIso.split('-').map(Number);
  const startUtc = Date.UTC(sy, sm - 1, sd);
  const targetUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((targetUtc - startUtc) / 86_400_000);
}

/**
 * Returns the cycle column index (1..14) corresponding to a calendar date.
 * Handles negative offsets, multi-year spans, leap years, and repeat/non-repeat modes.
 */
export function getCycleDayIndexForDate(
  targetDateIso: string,
  settings: Pick<UserSettings, 'cycleStartDateIso' | 'startingColumnIndex' | 'repeatAfter14Days'>
): number {
  const daysBetween = diffCalendarDays(settings.cycleStartDateIso, targetDateIso);
  const zeroBasedStart = Math.max(0, Math.min(13, settings.startingColumnIndex - 1));
  const rawOffset = zeroBasedStart + daysBetween;

  if (settings.repeatAfter14Days) {
    const modded = ((rawOffset % 14) + 14) % 14;
    return modded + 1;
  }

  return Math.max(0, Math.min(13, rawOffset)) + 1;
}

/** Computes the default starting column index (1..7 for Week 1, 8..14 for Week 2) matching today's weekday. */
export function getColumnIndexForWeekday(dateIso: string, weekNumber: 1 | 2): number {
  const dayOfWeek = parseLocalDateIso(dateIso).getDay(); // 0 = Sun .. 6 = Sat
  return (weekNumber === 1 ? 1 : 8) + dayOfWeek;
}

export function getDayMenuByCycleIndex(cycleDayIndex: number): DayMenu {
  const safe = Math.max(1, Math.min(14, cycleDayIndex));
  return INITIAL_14_DAY_MENU[safe - 1];
}

export function getDayMenuForDate(
  targetDateIso: string,
  settings: Pick<UserSettings, 'cycleStartDateIso' | 'startingColumnIndex' | 'repeatAfter14Days'>
): DayMenu {
  const idx = getCycleDayIndexForDate(targetDateIso, settings);
  return getDayMenuByCycleIndex(idx);
}

export function isHolidayScheduleForDate(
  dateIso: string,
  mode: TimingScheduleMode
): boolean {
  if (mode === 'WORKING_DAYS') return false;
  if (mode === 'SUNDAYS_HOLIDAYS') return true;
  return parseLocalDateIso(dateIso).getDay() === 0; // Sunday
}

export function getMealWindowMinutes(
  mealType: MealType,
  dateIso: string,
  mode: TimingScheduleMode
): { start: number; end: number; timingDisplay: string } {
  const meta = MEAL_META[mealType];
  const holiday = isHolidayScheduleForDate(dateIso, mode);
  return {
    start: holiday ? meta.holidayStartMinutes : meta.workingStartMinutes,
    end: holiday ? meta.holidayEndMinutes : meta.workingEndMinutes,
    timingDisplay: holiday ? meta.holidayTiming : meta.workingTiming,
  };
}

export function formatMinutesTo12Hour(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mins).padStart(2, '0')} ${suffix}`;
}

export function formatHHmmTo12Hour(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return formatMinutesTo12Hour((h || 0) * 60 + (m || 0));
}

export function formatCountdownDuration(minutesRemaining: number): string {
  const safe = Math.max(1, Math.round(minutesRemaining));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours > 0 && mins > 0) return `in ${hours}h ${mins}m`;
  if (hours > 0) return `in ${hours}h`;
  return `in ${mins}m`;
}

/** Determines whether a specific meal on a specific date is OPEN NOW, UPCOMING, or SERVED. */
export function getMealStatusForDate(
  mealType: MealType,
  targetDateIso: string,
  now: Date,
  mode: TimingScheduleMode
): MealOperationalStatus {
  const todayIso = toLocalDateIso(now);
  const dayDiff = diffCalendarDays(todayIso, targetDateIso);
  if (dayDiff < 0) return 'SERVED';
  if (dayDiff > 0) return 'UPCOMING';

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const { start, end } = getMealWindowMinutes(mealType, targetDateIso, mode);
  if (nowMinutes >= start && nowMinutes < end) return 'OPEN_NOW';
  if (nowMinutes < start) return 'UPCOMING';
  return 'SERVED';
}

/**
 * Calculates the centerpiece NEXT MEAL hero state:
 * - If a meal is currently being served -> OPEN_NOW (with closing countdown)
 * - Else if a meal is still upcoming today -> UPCOMING (with opening countdown)
 * - Else (after Dinner ends) -> CLOSED, pointing to Tomorrow's Breakfast
 */
export function getNextUpcomingMeal(
  now: Date,
  mode: TimingScheduleMode
): UpcomingMealState {
  const todayIso = toLocalDateIso(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const mealType of MEAL_ORDER) {
    const window = getMealWindowMinutes(mealType, todayIso, mode);
    if (nowMinutes >= window.start && nowMinutes < window.end) {
      const remaining = window.end - nowMinutes;
      return {
        mealType,
        status: 'OPEN_NOW',
        isToday: true,
        targetDateIso: todayIso,
        timingDisplay: window.timingDisplay,
        startTimeFormatted: formatMinutesTo12Hour(window.start),
        countdownText: `Closes ${formatCountdownDuration(remaining)}`,
        minutesRemaining: remaining,
      };
    }
    if (nowMinutes < window.start) {
      const remaining = window.start - nowMinutes;
      return {
        mealType,
        status: 'UPCOMING',
        isToday: true,
        targetDateIso: todayIso,
        timingDisplay: window.timingDisplay,
        startTimeFormatted: formatMinutesTo12Hour(window.start),
        countdownText: `Starts ${formatCountdownDuration(remaining)}`,
        minutesRemaining: remaining,
      };
    }
  }

  const tomorrowIso = addDaysIso(todayIso, 1);
  const nextBreakfast = getMealWindowMinutes('BREAKFAST', tomorrowIso, mode);
  const remaining = 1440 - nowMinutes + nextBreakfast.start;
  return {
    mealType: 'BREAKFAST',
    status: 'CLOSED',
    isToday: false,
    targetDateIso: tomorrowIso,
    timingDisplay: nextBreakfast.timingDisplay,
    startTimeFormatted: formatMinutesTo12Hour(nextBreakfast.start),
    countdownText: `Opens tomorrow ${formatCountdownDuration(remaining)}`,
    minutesRemaining: remaining,
  };
}

/** Resolves a FoodLineItem using the target date's month (for seasonal dishes) + any user DishOverride. */
export function resolveFoodItem(
  rawItem: FoodLineItem,
  targetDateIso: string,
  overrides: Record<string, DishOverride>
): ResolvedFoodItem {
  const month = parseLocalDateIso(targetDateIso).getMonth() + 1; // 1..12
  const override = overrides[rawItem.itemId];

  let seasonalDish = rawItem.originalDishName;
  let seasonalNote: string | undefined;

  if (rawItem.isSeasonalPlaceholder) {
    if (month >= 8 && month <= 10 && rawItem.seasonalAugOct) {
      seasonalDish = rawItem.seasonalAugOct;
      seasonalNote = 'Seasonal (Aug–Oct)';
    } else if ((month >= 11 || month <= 2) && rawItem.seasonalNovFeb) {
      seasonalDish = rawItem.seasonalNovFeb;
      seasonalNote = 'Seasonal (Nov–Feb)';
    } else if (month >= 3 && month <= 5 && rawItem.seasonalMarMay) {
      seasonalDish = rawItem.seasonalMarMay;
      seasonalNote = 'Seasonal (Mar–May)';
    } else {
      seasonalDish = `${rawItem.seasonalMarMay ?? ''} / ${rawItem.seasonalAugOct ?? ''}`.trim();
      seasonalNote = 'Seasonal transition (Jun–Jul)';
    }
  }

  const hasCustomDish = Boolean(override?.customDishName && override.customDishName.trim());
  const hasCustomAccomp = override?.customAccompaniment !== undefined;

  const activeDish = hasCustomDish ? override!.customDishName!.trim() : seasonalDish;
  const activeAccomp = hasCustomAccomp
    ? override!.customAccompaniment!.trim() || undefined
    : rawItem.originalAccompaniment;

  const isUserVerified = Boolean(override?.isUserVerified);
  const isEditedByUser = hasCustomDish || hasCustomAccomp;
  const needsVerification = Boolean(rawItem.needsVerification) && !isUserVerified && !isEditedByUser;

  return {
    itemId: rawItem.itemId,
    subCategory: rawItem.subCategory,
    dishName: activeDish,
    accompaniment: activeAccomp,
    originalDishName: rawItem.isSeasonalPlaceholder ? seasonalDish : rawItem.originalDishName,
    originalAccompaniment: rawItem.originalAccompaniment,
    isPrimaryDish: rawItem.isPrimaryDish,
    isSeasonalPlaceholder: Boolean(rawItem.isSeasonalPlaceholder),
    seasonalNote,
    needsVerification,
    isEditedByUser,
    isUserVerified,
  };
}

export function resolveMealCategories(
  dayMenu: DayMenu,
  mealType: MealType,
  targetDateIso: string,
  overrides: Record<string, DishOverride>
): ResolvedCategoryGroup[] {
  return dayMenu.meals[mealType].map((group) => ({
    sectionTitle: group.sectionTitle,
    items: group.items.map((raw) => resolveFoodItem(raw, targetDateIso, overrides)),
  }));
}

/** Extracts the top N primary dishes first (never burying mains behind accompaniments). */
export function getHeroDishesForMeal(
  dayMenu: DayMenu,
  mealType: MealType,
  targetDateIso: string,
  overrides: Record<string, DishOverride>,
  limit = 5
): ResolvedFoodItem[] {
  const categories = resolveMealCategories(dayMenu, mealType, targetDateIso, overrides);
  const all = categories.flatMap((c) => c.items);
  const primaries = all.filter((i) => i.isPrimaryDish);
  const secondaries = all.filter((i) => !i.isPrimaryDish);
  return [...primaries, ...secondaries].slice(0, limit);
}

/** Builds structured collapsed + expanded notification payload from the single menu data source. */
export function buildMealNotificationPayload(
  mealType: MealType,
  targetDateIso: string,
  settings: UserSettings,
  overrides: Record<string, DishOverride>,
  options?: { isSnoozed?: boolean; isTest?: boolean }
): FormattedNotificationPayload {
  const dayMenu = getDayMenuForDate(targetDateIso, settings);
  const meta = MEAL_META[mealType];
  const window = getMealWindowMinutes(mealType, targetDateIso, settings.timingScheduleMode);
  const categories = resolveMealCategories(dayMenu, mealType, targetDateIso, overrides);
  const heroDishes = getHeroDishesForMeal(dayMenu, mealType, targetDateIso, overrides, 4);

  const dateObj = parseLocalDateIso(targetDateIso);
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const dateLabel = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const prefix = options?.isSnoozed
    ? `${meta.title} reminder (Snoozed)`
    : `${meta.title} is coming up`;
  const title = options?.isTest ? `${prefix} · Test` : prefix;

  const collapsedSummary = heroDishes.map((d) => d.dishName).join(' · ');

  const expandedSections = categories.map((cat) => ({
    title: cat.sectionTitle,
    lines: cat.items.map((item) =>
      item.accompaniment ? `${item.dishName} (with ${item.accompaniment})` : item.dishName
    ),
  }));

  return {
    mealType,
    targetDateIso,
    channelName: meta.channelName,
    title,
    dateHeading: `${weekday}'s Menu · ${dateLabel} (${dayMenu.pdfColumnName})`,
    collapsedSummary,
    expandedSections,
    footerTiming: `Mess starts at ${formatMinutesTo12Hour(window.start)} (${window.timingDisplay})`,
    isSnoozed: options?.isSnoozed,
    isTest: options?.isTest,
  };
}

/**
 * Creates a separate one-time 30-minute snooze reminder without modifying recurring daily timings.
 * Deduplicates any existing active snooze for the same meal & date.
 */
export function createSnoozeReminder(
  existingSnoozes: SnoozedReminder[],
  mealType: MealType,
  targetDateIso: string,
  nowMs: number,
  snoozeMinutes = 30
): SnoozedReminder[] {
  const filtered = existingSnoozes.filter(
    (s) => !(s.mealType === mealType && s.targetDateIso === targetDateIso)
  );
  const nextReminder: SnoozedReminder = {
    id: `snooze_${mealType}_${targetDateIso}_${nowMs}`,
    mealType,
    targetDateIso,
    triggerAtEpochMs: nowMs + snoozeMinutes * 60_000,
    createdAtEpochMs: nowMs,
  };
  return [...filtered, nextReminder];
}

/** Computes the 14 calendar dates for the current 2-week cycle window containing todayIso. */
export function getCurrentCycleDates(
  todayIso: string,
  settings: Pick<UserSettings, 'cycleStartDateIso' | 'startingColumnIndex' | 'repeatAfter14Days'>
): Array<{ cycleDayIndex: number; dateIso: string; dayMenu: DayMenu; isToday: boolean }> {
  const todayCycleIdx = getCycleDayIndexForDate(todayIso, settings); // 1..14
  const cycleDay1DateIso = addDaysIso(todayIso, -(todayCycleIdx - 1));

  return Array.from({ length: 14 }, (_, i) => {
    const cycleDayIndex = i + 1;
    const dateIso = addDaysIso(cycleDay1DateIso, i);
    return {
      cycleDayIndex,
      dateIso,
      dayMenu: getDayMenuByCycleIndex(cycleDayIndex),
      isToday: dateIso === todayIso,
    };
  });
}

export function getGreetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatReadableDate(dateIso: string): string {
  const d = parseLocalDateIso(dateIso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatShortCalendarDate(dateIso: string): { weekdayShort: string; dayNum: string; monthShort: string } {
  const d = parseLocalDateIso(dateIso);
  return {
    weekdayShort: d.toLocaleDateString('en-US', { weekday: 'short' }),
    dayNum: String(d.getDate()),
    monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
  };
}
