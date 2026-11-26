import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDaysIso,
  buildMealNotificationPayload,
  createSnoozeReminder,
  getCurrentCycleDates,
  getCycleDayIndexForDate,
  getDayMenuForDate,
  getHeroDishesForMeal,
  getMealStatusForDate,
  getNextUpcomingMeal,
  isHolidayScheduleForDate,
  resolveFoodItem,
} from './cycleCalculator';
import { INITIAL_14_DAY_MENU } from '../data/initialMenuData';
import type { UserSettings } from '../types/mess';

const BASE_SETTINGS: UserSettings = {
  hasCompletedOnboarding: true,
  cycleStartDateIso: '2026-11-22', // Sunday
  startingColumnIndex: 1, // Sunday 1
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
    BREAKFAST: '07:00',
    LUNCH: '11:00',
    SNACKS: '16:30',
    DINNER: '19:00',
  },
  themeMode: 'LIGHT',
  textScalePercent: 100,
};

test('14-day menu dataset has all 14 distinct days in Sunday 1 to Saturday 2 order', () => {
  assert.equal(INITIAL_14_DAY_MENU.length, 14);
  assert.equal(INITIAL_14_DAY_MENU[0].pdfColumnName, 'Sunday 1');
  assert.equal(INITIAL_14_DAY_MENU[4].pdfColumnName, 'Thursday 1');
  assert.equal(INITIAL_14_DAY_MENU[7].pdfColumnName, 'Sunday 2');
  assert.equal(INITIAL_14_DAY_MENU[13].pdfColumnName, 'Saturday 2');
});

test('14-day rotating cycle repeats accurately on Day 15 and across leap years', () => {
  assert.equal(getCycleDayIndexForDate('2026-11-22', BASE_SETTINGS), 1); // Day 1 -> Sunday 1
  assert.equal(getCycleDayIndexForDate('2026-11-26', BASE_SETTINGS), 5); // Day 5 -> Thursday 1
  assert.equal(getCycleDayIndexForDate('2026-12-05', BASE_SETTINGS), 14); // Day 14 -> Saturday 2
  assert.equal(getCycleDayIndexForDate('2026-12-06', BASE_SETTINGS), 1); // Day 15 -> Repeats Day 1

  // Negative offset before cycle start date wraps backwards properly
  assert.equal(getCycleDayIndexForDate('2026-11-21', BASE_SETTINGS), 14);

  // Leap year check: Feb 28 2028 -> Feb 29 2028 -> Mar 1 2028
  const leapSettings = {
    cycleStartDateIso: '2028-02-28',
    startingColumnIndex: 2, // Monday 1
    repeatAfter14Days: true,
  };
  assert.equal(getCycleDayIndexForDate('2028-02-28', leapSettings), 2);
  assert.equal(getCycleDayIndexForDate('2028-02-29', leapSettings), 3);
  assert.equal(getCycleDayIndexForDate('2028-03-01', leapSettings), 4);
  assert.equal(addDaysIso('2028-02-28', 1), '2028-02-29');
  assert.equal(addDaysIso('2028-02-29', 1), '2028-03-01');
});

test('non-repeating cycle clamps cleanly at Day 14', () => {
  const nonRepeat = { ...BASE_SETTINGS, repeatAfter14Days: false };
  assert.equal(getCycleDayIndexForDate('2026-12-20', nonRepeat), 14);
  assert.equal(getCycleDayIndexForDate('2026-11-10', nonRepeat), 1);
});

test('timing schedule handles Working Days, Sundays/Holidays, and Auto-Switch', () => {
  // 2026-11-22 is Sunday, 2026-11-26 is Thursday
  assert.equal(isHolidayScheduleForDate('2026-11-22', 'AUTO_BY_CALENDAR'), true);
  assert.equal(isHolidayScheduleForDate('2026-11-26', 'AUTO_BY_CALENDAR'), false);
  assert.equal(isHolidayScheduleForDate('2026-11-26', 'SUNDAYS_HOLIDAYS'), true);
  assert.equal(isHolidayScheduleForDate('2026-11-22', 'WORKING_DAYS'), false);
});

test('next upcoming meal detects OPEN_NOW, UPCOMING, and CLOSED rollover to tomorrow breakfast', () => {
  // Thursday 2026-11-26 at 08:15 AM -> Breakfast is OPEN NOW (07:30 - 09:30)
  const duringBreakfast = getNextUpcomingMeal(new Date(2026, 10, 26, 8, 15), 'WORKING_DAYS');
  assert.equal(duringBreakfast.mealType, 'BREAKFAST');
  assert.equal(duringBreakfast.status, 'OPEN_NOW');
  assert.equal(duringBreakfast.isToday, true);

  // Thursday 2026-11-26 at 10:30 AM -> Lunch is UPCOMING (starts 11:30 AM, 60m remaining)
  const beforeLunch = getNextUpcomingMeal(new Date(2026, 10, 26, 10, 30), 'WORKING_DAYS');
  assert.equal(beforeLunch.mealType, 'LUNCH');
  assert.equal(beforeLunch.status, 'UPCOMING');
  assert.equal(beforeLunch.minutesRemaining, 60);

  // Thursday 2026-11-26 at 10:15 PM -> CLOSED, next meal is tomorrow's Breakfast
  const lateNight = getNextUpcomingMeal(new Date(2026, 10, 26, 22, 15), 'WORKING_DAYS');
  assert.equal(lateNight.mealType, 'BREAKFAST');
  assert.equal(lateNight.status, 'CLOSED');
  assert.equal(lateNight.isToday, false);
  assert.equal(lateNight.targetDateIso, '2026-11-27');

  // Meal status checks on Thursday at 10:30 AM
  assert.equal(
    getMealStatusForDate('BREAKFAST', '2026-11-26', new Date(2026, 10, 26, 10, 30), 'WORKING_DAYS'),
    'SERVED'
  );
  assert.equal(
    getMealStatusForDate('LUNCH', '2026-11-26', new Date(2026, 10, 26, 10, 30), 'WORKING_DAYS'),
    'UPCOMING'
  );
});

test('seasonal vegetable resolves by month and respects user Fix Dish overrides', () => {
  // Thursday 1 Lunch South Indian Main Veg 1 is seasonal:
  // Aug-Oct: Mix Veg Poriyal, Nov-Feb: Beans Poriyal, Mar-May: Drumstick Tomato
  const thursday1 = getDayMenuForDate('2026-11-26', BASE_SETTINGS);
  const seasonalRaw = thursday1.meals.LUNCH[0].items[0];

  const inNov = resolveFoodItem(seasonalRaw, '2026-11-26', {});
  assert.equal(inNov.dishName, 'Beans Poriyal');
  assert.equal(inNov.needsVerification, true);

  const inSep = resolveFoodItem(seasonalRaw, '2026-09-10', {});
  assert.equal(inSep.dishName, 'Mix Veg Poriyal');

  const inApr = resolveFoodItem(seasonalRaw, '2026-04-02', {});
  assert.equal(inApr.dishName, 'Drumstick Tomato');

  // User Fix Dish override takes precedence and clears unverified flag
  const edited = resolveFoodItem(seasonalRaw, '2026-11-26', {
    [seasonalRaw.itemId]: {
      customDishName: 'French Beans Coconut Poriyal',
      customAccompaniment: 'Gunpowder',
      isUserVerified: true,
      updatedAtIso: '2026-11-26T08:00:00Z',
    },
  });
  assert.equal(edited.dishName, 'French Beans Coconut Poriyal');
  assert.equal(edited.accompaniment, 'Gunpowder');
  assert.equal(edited.isEditedByUser, true);
  assert.equal(edited.needsVerification, false);
});

test('notification payload prioritizes primary dishes and snooze 30m does not mutate daily timings', () => {
  const payload = buildMealNotificationPayload('LUNCH', '2026-11-26', BASE_SETTINGS, {});
  assert.match(payload.title, /Lunch is coming up/i);
  assert.match(payload.collapsedSummary, /Beans Poriyal/);
  assert.match(payload.collapsedSummary, /Punjabi Kadhi Pakoda/);
  assert.equal(payload.expandedSections.length, 3);
  assert.match(payload.footerTiming, /11:30 AM/);

  const nowMs = 1_700_000_000_000;
  const snoozes = createSnoozeReminder([], 'LUNCH', '2026-11-26', nowMs, 30);
  assert.equal(snoozes.length, 1);
  assert.equal(snoozes[0].triggerAtEpochMs, nowMs + 30 * 60_000);
  // Deduplicates when snoozed again for the same meal/date
  const snoozedAgain = createSnoozeReminder(snoozes, 'LUNCH', '2026-11-26', nowMs + 1000, 30);
  assert.equal(snoozedAgain.length, 1);
  // Daily settings remain completely unchanged
  assert.equal(BASE_SETTINGS.mealNotifyTimes.LUNCH, '11:00');
});

test('current 14-day cycle dates map all 14 days with exactly one Today marker', () => {
  const days = getCurrentCycleDates('2026-11-26', BASE_SETTINGS);
  assert.equal(days.length, 14);
  const todayEntries = days.filter((d) => d.isToday);
  assert.equal(todayEntries.length, 1);
  assert.equal(todayEntries[0].dayMenu.pdfColumnName, 'Thursday 1');
  assert.equal(todayEntries[0].dateIso, '2026-11-26');

  const heroDishes = getHeroDishesForMeal(todayEntries[0].dayMenu, 'DINNER', '2026-11-26', {}, 5);
  assert.equal(heroDishes.length, 5);
  assert.ok(heroDishes.some((d) => d.dishName === 'Paneer Do Pyaza'));
});
