export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER';

export type TimingScheduleMode =
  | 'WORKING_DAYS'
  | 'SUNDAYS_HOLIDAYS'
  | 'AUTO_BY_CALENDAR';

export type ThemeMode = 'SYSTEM' | 'LIGHT' | 'DARK';

export type WidgetSize = '2x2' | '4x2' | '4x4';

export type MealOperationalStatus = 'OPEN_NOW' | 'UPCOMING' | 'SERVED' | 'CLOSED';

export interface MealMeta {
  type: MealType;
  title: string;
  shortTitle: string;
  channelName: string;
  workingTiming: string;
  holidayTiming: string;
  workingStartMinutes: number; // minutes from midnight
  workingEndMinutes: number;
  holidayStartMinutes: number;
  holidayEndMinutes: number;
  defaultNotifyTime: string; // HH:mm 24h
}

export interface FoodLineItem {
  itemId: string;
  subCategory: string;
  originalDishName: string;
  originalAccompaniment?: string;
  isPrimaryDish: boolean;
  isSeasonalPlaceholder?: boolean;
  seasonalAugOct?: string;
  seasonalNovFeb?: string;
  seasonalMarMay?: string;
  needsVerification?: boolean;
}

export interface DishOverride {
  customDishName?: string;
  customAccompaniment?: string;
  isUserVerified?: boolean;
  updatedAtIso: string;
}

export interface ResolvedFoodItem {
  itemId: string;
  subCategory: string;
  dishName: string;
  accompaniment?: string;
  originalDishName: string;
  originalAccompaniment?: string;
  isPrimaryDish: boolean;
  isSeasonalPlaceholder: boolean;
  seasonalNote?: string;
  needsVerification: boolean;
  isEditedByUser: boolean;
  isUserVerified: boolean;
}

export interface FoodCategoryGroup {
  sectionTitle: string;
  items: FoodLineItem[];
}

export interface ResolvedCategoryGroup {
  sectionTitle: string;
  items: ResolvedFoodItem[];
}

export interface DayMenu {
  cycleDayIndex: number; // 1..14
  pdfColumnName: string; // e.g., "Sunday 1" .. "Saturday 2"
  dayOfWeekIndex: number; // 0 = Sunday .. 6 = Saturday
  weekNumber: 1 | 2;
  meals: Record<MealType, FoodCategoryGroup[]>;
}

export interface UserSettings {
  hasCompletedOnboarding: boolean;
  cycleStartDateIso: string; // YYYY-MM-DD local date
  startingColumnIndex: number; // 1..14
  repeatAfter14Days: boolean;
  timingScheduleMode: TimingScheduleMode;
  masterNotificationsEnabled: boolean;
  mealNotificationsEnabled: Record<MealType, boolean>;
  mealNotifyTimes: Record<MealType, string>; // "HH:mm"
  themeMode: ThemeMode;
  textScalePercent: 100 | 125 | 150 | 200;
}

export interface SnoozedReminder {
  id: string;
  mealType: MealType;
  targetDateIso: string;
  triggerAtEpochMs: number;
  createdAtEpochMs: number;
}

export interface UpcomingMealState {
  mealType: MealType;
  status: 'OPEN_NOW' | 'UPCOMING' | 'CLOSED';
  isToday: boolean;
  targetDateIso: string;
  timingDisplay: string;
  startTimeFormatted: string;
  countdownText: string;
  minutesRemaining: number;
}

export interface FormattedNotificationPayload {
  mealType: MealType;
  targetDateIso: string;
  channelName: string;
  title: string;
  dateHeading: string;
  collapsedSummary: string;
  expandedSections: Array<{
    title: string;
    lines: string[];
  }>;
  footerTiming: string;
  isSnoozed?: boolean;
  isTest?: boolean;
}
