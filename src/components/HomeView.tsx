import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Pencil, ArrowUpRight, Bell } from 'lucide-react';
import { MEAL_META, MEAL_ORDER } from '../data/initialMenuData';
import type {
  DayMenu,
  DishOverride,
  MealType,
  ResolvedFoodItem,
  SnoozedReminder,
  TimingScheduleMode,
  UpcomingMealState,
  UserSettings,
  WidgetSize,
} from '../types/mess';
import {
  addDaysIso,
  buildMealNotificationPayload,
  formatHHmmTo12Hour,
  formatReadableDate,
  getGreetingForHour,
  getHeroDishesForMeal,
  getMealStatusForDate,
  getMealWindowMinutes,
  resolveMealCategories,
} from '../utils/cycleCalculator';
import { HomeScreenWidget } from './HomeScreenWidget';
import { NotificationCard } from './NotificationTrayBanner';

interface HomeViewProps {
  now: Date;
  todayIso: string;
  todayMenu: DayMenu;
  tomorrowMenu: DayMenu;
  upcomingMeal: UpcomingMealState;
  settings: UserSettings;
  dishOverrides: Record<string, DishOverride>;
  snoozes: SnoozedReminder[];
  widgetLastUpdated: string;
  onRefreshWidget: () => void;
  onOpenMealDetail: (mealType: MealType, targetDateIso: string) => void;
  onEditDish: (item: ResolvedFoodItem) => void;
  onSnooze30m: (mealType: MealType, targetDateIso: string) => void;
  onCancelSnooze: (id: string) => void;
  onTestNotification: (mealType: MealType, targetDateIso: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  now,
  todayIso,
  todayMenu,
  tomorrowMenu,
  upcomingMeal,
  settings,
  dishOverrides,
  snoozes,
  widgetLastUpdated,
  onRefreshWidget,
  onOpenMealDetail,
  onEditDish,
  onSnooze30m,
  onCancelSnooze,
  onTestNotification,
}) => {
  const [dayMode, setDayMode] = useState<'TODAY' | 'TOMORROW'>('TODAY');
  const [heroExpanded, setHeroExpanded] = useState(false);
  const [expandedMeals, setExpandedMeals] = useState<Record<MealType, boolean>>({
    BREAKFAST: false,
    LUNCH: false,
    SNACKS: false,
    DINNER: false,
  });
  const [sidebarWidgetSize, setSidebarWidgetSize] = useState<WidgetSize>('4x2');

  const tomorrowIso = addDaysIso(todayIso, 1);
  const activeDateIso = dayMode === 'TODAY' ? todayIso : tomorrowIso;
  const activeMenu = dayMode === 'TODAY' ? todayMenu : tomorrowMenu;

  const heroMenu = upcomingMeal.isToday ? todayMenu : tomorrowMenu;
  const heroPrimaryDishes = getHeroDishesForMeal(
    heroMenu,
    upcomingMeal.mealType,
    upcomingMeal.targetDateIso,
    dishOverrides,
    5
  );
  const heroFullCategories = resolveMealCategories(
    heroMenu,
    upcomingMeal.mealType,
    upcomingMeal.targetDateIso,
    dishOverrides
  );

  const upcomingNotificationPreview = buildMealNotificationPayload(
    upcomingMeal.mealType,
    upcomingMeal.targetDateIso,
    settings,
    dishOverrides
  );

  const heroStatusLabel =
    upcomingMeal.status === 'OPEN_NOW'
      ? 'OPEN NOW'
      : upcomingMeal.status === 'CLOSED'
      ? 'CLOSED · NEXT TOMORROW'
      : 'UPCOMING';

  const heroStatusClass =
    upcomingMeal.status === 'OPEN_NOW'
      ? 'text-[#1E5E3E] dark:text-[#8AD1A8]'
      : upcomingMeal.status === 'CLOSED'
      ? 'text-[#7A5920] dark:text-[#E8B86D]'
      : 'text-[#244C3A] dark:text-[#8BB69F]';

  const toggleMealExpand = (meal: MealType) => {
    setExpandedMeals((prev) => ({ ...prev, [meal]: !prev[meal] }));
  };

  return (
    <div className="space-y-8">
      {/* Greeting & Date Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#5A625A] dark:text-[#A4B0A6]">
            {getGreetingForHour(now.getHours())} · {formatReadableDate(activeDateIso)}
          </p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight text-[#242824] dark:text-[#F2F3EE]">
            {dayMode === 'TODAY' ? "Today's Mess Menu" : "Tomorrow's Mess Menu"}
          </h1>
          <p className="mt-1 text-sm text-[#5A625A] dark:text-[#A4B0A6]">
            {activeMenu.pdfColumnName} · Week {activeMenu.weekNumber} of 2
          </p>
        </div>

        {/* Today / Tomorrow Segmented Control */}
        <div
          role="group"
          aria-label="Choose day to view"
          className="inline-flex self-start sm:self-auto items-center p-1 rounded-xl bg-[#EFEFE9] dark:bg-[#1A201C] border border-[#E4E7E2] dark:border-[#2C352F]"
        >
          <button
            type="button"
            onClick={() => setDayMode('TODAY')}
            aria-pressed={dayMode === 'TODAY'}
            className={`min-h-[40px] px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              dayMode === 'TODAY'
                ? 'bg-[#FFFFFF] dark:bg-[#244C3A] text-[#244C3A] dark:text-[#F2F3EE] shadow-xs'
                : 'text-[#5A625A] dark:text-[#A4B0A6] hover:text-[#242824] dark:hover:text-[#F2F3EE]'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDayMode('TOMORROW')}
            aria-pressed={dayMode === 'TOMORROW'}
            className={`min-h-[40px] px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              dayMode === 'TOMORROW'
                ? 'bg-[#FFFFFF] dark:bg-[#244C3A] text-[#244C3A] dark:text-[#F2F3EE] shadow-xs'
                : 'text-[#5A625A] dark:text-[#A4B0A6] hover:text-[#242824] dark:hover:text-[#F2F3EE]'
            }`}
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* Active Snoozed Reminders Bar (if any) */}
      {snoozes.length > 0 && (
        <div className="rounded-2xl bg-[#E8B86D]/15 dark:bg-[#E8B86D]/12 border border-[#E8B86D]/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm text-[#5C3D0C] dark:text-[#F3D29B]">
            <Bell className="w-4 h-4 shrink-0" />
            <span>
              <strong>Snoozed reminder active:</strong>{' '}
              {snoozes
                .map((s) => {
                  const triggerDate = new Date(s.triggerAtEpochMs);
                  const timeStr = triggerDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  });
                  return `${MEAL_META[s.mealType].title} at ${timeStr}`;
                })
                .join(' · ')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => snoozes.forEach((s) => onCancelSnooze(s.id))}
            className="min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold text-[#5C3D0C] dark:text-[#F3D29B] hover:bg-black/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            Dismiss Snooze
          </button>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Primary Column: Hero Next Meal + 4 Chronological Meals */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Centerpiece NEXT MEAL Hero Card */}
          <section
            aria-label="Next upcoming meal"
            className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#DCE1DA] dark:border-[#2C352F] shadow-sm overflow-hidden"
          >
            <div className="p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold tracking-wider">
                <span className={heroStatusClass}>
                  {heroStatusLabel} · {upcomingMeal.isToday ? 'TODAY' : 'TOMORROW'}
                </span>
                <span className="font-mono tabular-nums text-[#244C3A] dark:text-[#8BB69F]">
                  {upcomingMeal.countdownText}
                </span>
              </div>

              {/* Clickable Hero Body -> Opens Meal Details */}
              <button
                type="button"
                onClick={() => onOpenMealDetail(upcomingMeal.mealType, upcomingMeal.targetDateIso)}
                className="mt-2.5 w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#244C3A] rounded-xl"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-[#242824] dark:text-[#F2F3EE] group-hover:text-[#244C3A] dark:group-hover:text-[#8BB69F] transition-colors">
                    {MEAL_META[upcomingMeal.mealType].title}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5A625A] dark:text-[#A4B0A6] shrink-0">
                    Full details
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-mono tabular-nums text-[#5A625A] dark:text-[#A4B0A6]">
                  <Clock className="w-4 h-4 shrink-0" />
                  {upcomingMeal.timingDisplay}
                </p>

                {/* Prominent Scannable Main Dishes */}
                <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {heroPrimaryDishes.map((dish) => (
                    <li key={dish.itemId} className="text-base sm:text-lg font-semibold text-[#242824] dark:text-[#F2F3EE] leading-snug">
                      {dish.dishName}
                      {dish.accompaniment && (
                        <span className="block text-xs font-normal text-[#5A625A] dark:text-[#A4B0A6]">
                          with {dish.accompaniment}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </button>

              {/* Inline Expand / Collapse Full Menu on Hero Card */}
              <div className="mt-5 pt-4 border-t border-[#ECEEE9] dark:border-[#262F29] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setHeroExpanded((prev) => !prev)}
                  aria-expanded={heroExpanded}
                  className="min-h-[44px] px-3.5 -ml-3.5 py-2 rounded-xl text-sm font-semibold text-[#244C3A] dark:text-[#8BB69F] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  {heroExpanded ? (
                    <>
                      Hide full menu <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Expand all categories <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onTestNotification(upcomingMeal.mealType, upcomingMeal.targetDateIso)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium text-[#5A625A] dark:text-[#A4B0A6] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Send Test Alert
                </button>
              </div>

              {heroExpanded && (
                <div className="mt-4 pt-4 border-t border-[#ECEEE9] dark:border-[#262F29] space-y-4">
                  {heroFullCategories.map((cat) => (
                    <div key={cat.sectionTitle}>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#244C3A] dark:text-[#8BB69F]">
                        {cat.sectionTitle}
                      </h3>
                      <div className="mt-2 divide-y divide-[#F0F2EE] dark:divide-[#242D27]">
                        {cat.items.map((item) => (
                          <div
                            key={item.itemId}
                            className="py-2 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-[#242824] dark:text-[#F2F3EE]">
                                {item.dishName}
                              </span>
                              {item.accompaniment && (
                                <span className="text-xs text-[#5A625A] dark:text-[#A4B0A6]">
                                  {' '}
                                  · with {item.accompaniment}
                                </span>
                              )}
                              {item.needsVerification && (
                                <span className="ml-2 text-xs font-medium text-[#8C5F12] dark:text-[#E8B86D]">
                                  (Unverified)
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => onEditDish(item)}
                              aria-label={`Fix dish ${item.dishName}`}
                              className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium text-[#5A625A] dark:text-[#A4B0A6] hover:text-[#244C3A] dark:hover:text-[#8BB69F] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] inline-flex items-center gap-1 shrink-0"
                            >
                              <Pencil className="w-3 h-3" />
                              Fix
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* All Four Meals in Chronological Order */}
          <section aria-label="All meals for selected day" className="space-y-3.5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold text-[#242824] dark:text-[#F2F3EE]">
                {dayMode === 'TODAY' ? "All 4 Meals Today" : "All 4 Meals Tomorrow"}
              </h2>
              <span className="text-xs text-[#5A625A] dark:text-[#A4B0A6]">
                {activeMenu.pdfColumnName}
              </span>
            </div>

            <div className="space-y-3">
              {MEAL_ORDER.map((mealType) => {
                const status = getMealStatusForDate(
                  mealType,
                  activeDateIso,
                  now,
                  settings.timingScheduleMode
                );
                const isServed = status === 'SERVED';
                const isOpenNow = status === 'OPEN_NOW';
                const isExpanded = expandedMeals[mealType];
                const window = getMealWindowMinutes(
                  mealType,
                  activeDateIso,
                  settings.timingScheduleMode
                );
                const mainDishes = getHeroDishesForMeal(
                  activeMenu,
                  mealType,
                  activeDateIso,
                  dishOverrides,
                  4
                );
                const allCategories = resolveMealCategories(
                  activeMenu,
                  mealType,
                  activeDateIso,
                  dishOverrides
                );

                return (
                  <article
                    key={mealType}
                    className={`rounded-2xl border transition-colors ${
                      isServed
                        ? 'bg-[#FFFFFF]/70 dark:bg-[#1A201C]/60 border-[#E8EBE6] dark:border-[#242C27] opacity-75'
                        : 'bg-[#FFFFFF] dark:bg-[#1A201C] border-[#DCE1DA] dark:border-[#2C352F]'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => onOpenMealDetail(mealType, activeDateIso)}
                          className="text-left flex-1 min-w-0 group focus:outline-none"
                        >
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono tabular-nums text-[#5A625A] dark:text-[#A4B0A6]">
                              {window.timingDisplay}
                            </span>
                            <span aria-hidden="true" className="text-[#A5B9A5]">
                              ·
                            </span>
                            <span
                              className={`font-semibold ${
                                isOpenNow
                                  ? 'text-[#1E5E3E] dark:text-[#8AD1A8]'
                                  : isServed
                                  ? 'text-[#737B73] dark:text-[#849086]'
                                  : 'text-[#244C3A] dark:text-[#8BB69F]'
                              }`}
                            >
                              {isOpenNow ? 'Open now' : isServed ? 'Served' : 'Upcoming'}
                            </span>
                          </div>

                          <h3 className="mt-1 text-lg font-semibold text-[#242824] dark:text-[#F2F3EE] group-hover:text-[#244C3A] dark:group-hover:text-[#8BB69F] transition-colors">
                            {MEAL_META[mealType].title}
                          </h3>

                          <p className="mt-2 text-base font-medium text-[#242824] dark:text-[#E8ECE8] leading-relaxed">
                            {mainDishes.map((d) => d.dishName).join(' · ')}
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleMealExpand(mealType)}
                          aria-expanded={isExpanded}
                          aria-label={
                            isExpanded
                              ? `Collapse ${MEAL_META[mealType].title} categories`
                              : `Expand ${MEAL_META[mealType].title} categories`
                          }
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#5A625A] dark:text-[#A4B0A6] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] shrink-0 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-[#ECEEE9] dark:border-[#262F29] space-y-4">
                          {allCategories.map((cat) => (
                            <div key={cat.sectionTitle}>
                              <p className="text-xs font-semibold uppercase tracking-wider text-[#244C3A] dark:text-[#8BB69F]">
                                {cat.sectionTitle}
                              </p>
                              <ul className="mt-1.5 space-y-1.5">
                                {cat.items.map((item) => (
                                  <li
                                    key={item.itemId}
                                    className="flex items-center justify-between gap-2 text-sm"
                                  >
                                    <span className="text-[#242824] dark:text-[#E8ECE8]">
                                      <span className="font-medium">{item.dishName}</span>
                                      {item.accompaniment && (
                                        <span className="text-[#5A625A] dark:text-[#A4B0A6]">
                                          {' '}
                                          (with {item.accompaniment})
                                        </span>
                                      )}
                                      {item.needsVerification && (
                                        <span className="ml-1.5 text-xs text-[#8C5F12] dark:text-[#E8B86D]">
                                          · Unverified
                                        </span>
                                      )}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onEditDish(item)}
                                      aria-label={`Fix dish ${item.dishName}`}
                                      className="min-h-[36px] px-2.5 rounded-lg text-xs font-medium text-[#5A625A] dark:text-[#A4B0A6] hover:text-[#244C3A] dark:hover:text-[#8BB69F] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] shrink-0"
                                    >
                                      Fix
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}

                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => onOpenMealDetail(mealType, activeDateIso)}
                              className="min-h-[40px] text-xs font-semibold text-[#244C3A] dark:text-[#8BB69F] hover:underline inline-flex items-center gap-1"
                            >
                              Open full {MEAL_META[mealType].title} view
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Desktop Companion Column: Live Home Screen Widget + Next Alert Preview */}
        <aside className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[#242824] dark:text-[#F2F3EE]">
                Home Screen Widget
              </h2>
              <p className="text-xs text-[#5A625A] dark:text-[#A4B0A6]">
                Live data synced with your local menu &amp; dish edits
              </p>
            </div>
            <HomeScreenWidget
              todayIso={todayIso}
              now={now}
              todayMenu={todayMenu}
              tomorrowMenu={tomorrowMenu}
              upcomingMeal={upcomingMeal}
              scheduleMode={settings.timingScheduleMode}
              dishOverrides={dishOverrides}
              size={sidebarWidgetSize}
              onSizeChange={setSidebarWidgetSize}
              lastUpdatedText={widgetLastUpdated}
              onRefresh={onRefreshWidget}
              onOpenMealDetail={onOpenMealDetail}
            />
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[#242824] dark:text-[#F2F3EE]">
                Next Meal Alert Preview
              </h2>
              <p className="text-xs text-[#5A625A] dark:text-[#A4B0A6]">
                Scheduled for{' '}
                <span className="font-mono tabular-nums font-medium">
                  {formatHHmmTo12Hour(settings.mealNotifyTimes[upcomingMeal.mealType])}
                </span>{' '}
                · Expand or Snooze 30m
              </p>
            </div>
            <NotificationCard
              payload={upcomingNotificationPreview}
              onOpenMeal={onOpenMealDetail}
              onSnooze30m={onSnooze30m}
            />
          </div>
        </aside>
      </div>
    </div>
  );
};
