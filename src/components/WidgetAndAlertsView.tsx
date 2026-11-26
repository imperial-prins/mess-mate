import React, { useState } from 'react';
import { Bell, Clock, Sun, Moon, Trash2 } from 'lucide-react';
import { MEAL_META, MEAL_ORDER } from '../data/initialMenuData';
import type {
  DayMenu,
  DishOverride,
  MealType,
  SnoozedReminder,
  UpcomingMealState,
  UserSettings,
  WidgetSize,
} from '../types/mess';
import {
  buildMealNotificationPayload,
  formatHHmmTo12Hour,
} from '../utils/cycleCalculator';
import { HomeScreenWidget } from './HomeScreenWidget';
import { NotificationCard } from './NotificationTrayBanner';

interface WidgetAndAlertsViewProps {
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
  onSnooze30m: (mealType: MealType, targetDateIso: string) => void;
  onCancelSnooze: (id: string) => void;
  onTestNotification: (mealType: MealType, targetDateIso: string) => void;
}

export const WidgetAndAlertsView: React.FC<WidgetAndAlertsViewProps> = ({
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
  onSnooze30m,
  onCancelSnooze,
  onTestNotification,
}) => {
  const [widgetSize, setWidgetSize] = useState<WidgetSize>('4x4');
  const [widgetTheme, setWidgetTheme] = useState<'light' | 'dark'>('light');
  const [selectedAlertMeal, setSelectedAlertMeal] = useState<MealType>(upcomingMeal.mealType);

  const alertPayload = buildMealNotificationPayload(
    selectedAlertMeal,
    todayIso,
    settings,
    dishOverrides
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-[#5A625A] dark:text-[#A4B0A6]">
          Live Menu Sync · Offline First
        </p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-semibold text-[#242824] dark:text-[#F2F3EE]">
          Widget &amp; Meal Alerts
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Responsive Home Screen Widget Studio */}
        <section
          aria-label="Home screen widget preview"
          className="lg:col-span-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#DCE1DA] dark:border-[#2C352F] p-6 space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[#242824] dark:text-[#F2F3EE]">
                Home Screen Widget
              </h2>
              <p className="mt-0.5 text-sm text-[#5A625A] dark:text-[#A4B0A6]">
                Switch between 2×2, 4×2, and 4×4 sizes. Tap any meal to open its full details.
              </p>
            </div>

            <div
              role="group"
              aria-label="Widget surface theme"
              className="inline-flex items-center p-1 rounded-xl bg-[#EFEFE9] dark:bg-[#121613] border border-[#E4E7E2] dark:border-[#2C352F]"
            >
              <button
                type="button"
                onClick={() => setWidgetTheme('light')}
                aria-pressed={widgetTheme === 'light'}
                aria-label="Light widget preview"
                className={`min-h-[36px] px-2.5 rounded-lg inline-flex items-center gap-1 text-xs font-semibold transition-colors ${
                  widgetTheme === 'light'
                    ? 'bg-[#FFFFFF] text-[#244C3A] shadow-xs'
                    : 'text-[#5A625A] dark:text-[#A4B0A6]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setWidgetTheme('dark')}
                aria-pressed={widgetTheme === 'dark'}
                aria-label="Dark widget preview"
                className={`min-h-[36px] px-2.5 rounded-lg inline-flex items-center gap-1 text-xs font-semibold transition-colors ${
                  widgetTheme === 'dark'
                    ? 'bg-[#244C3A] text-white shadow-xs'
                    : 'text-[#5A625A] dark:text-[#A4B0A6]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Dark
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-[#EAECE6] dark:bg-[#0D100E] p-5 flex justify-center">
            <HomeScreenWidget
              todayIso={todayIso}
              now={now}
              todayMenu={todayMenu}
              tomorrowMenu={tomorrowMenu}
              upcomingMeal={upcomingMeal}
              scheduleMode={settings.timingScheduleMode}
              dishOverrides={dishOverrides}
              size={widgetSize}
              onSizeChange={setWidgetSize}
              widgetTheme={widgetTheme}
              lastUpdatedText={widgetLastUpdated}
              onRefresh={onRefreshWidget}
              onOpenMealDetail={onOpenMealDetail}
            />
          </div>

          <div className="text-xs text-[#5A625A] dark:text-[#A4B0A6] space-y-1">
            <p>
              <strong>2×2:</strong> Today&apos;s date, next meal, and top 4 primary dishes.
            </p>
            <p>
              <strong>4×2:</strong> Next meal highlighted beside quick summaries of the other 3 meals.
            </p>
            <p>
              <strong>4×4:</strong> Full daily timetable with completed meals visually subdued.
            </p>
          </div>
        </section>

        {/* Right Column: Notification Experience & Snooze 30m */}
        <section
          aria-label="Notification preview and snooze controls"
          className="lg:col-span-6 space-y-5"
        >
          <div className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#DCE1DA] dark:border-[#2C352F] p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#242824] dark:text-[#F2F3EE]">
                  Meal Notification Preview
                </h2>
                <p className="mt-0.5 text-sm text-[#5A625A] dark:text-[#A4B0A6]">
                  Main dishes appear in the collapsed alert; expand for the complete categorized menu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onTestNotification(selectedAlertMeal, todayIso)}
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold bg-[#244C3A] text-white hover:bg-[#1C3D2E] dark:bg-[#8BB69F] dark:text-[#121613] inline-flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Bell className="w-4 h-4" />
                Send Test Alert
              </button>
            </div>

            {/* Meal Selector Tabs */}
            <div
              role="group"
              aria-label="Choose meal notification to inspect"
              className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#EFEFE9] dark:bg-[#121613] border border-[#E4E7E2] dark:border-[#2C352F]"
            >
              {MEAL_ORDER.map((meal) => {
                const active = selectedAlertMeal === meal;
                return (
                  <button
                    key={meal}
                    type="button"
                    onClick={() => setSelectedAlertMeal(meal)}
                    aria-pressed={active}
                    className={`min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#FFFFFF] dark:bg-[#244C3A] text-[#244C3A] dark:text-[#F2F3EE] shadow-xs'
                        : 'text-[#5A625A] dark:text-[#A4B0A6] hover:text-[#242824] dark:hover:text-[#F2F3EE]'
                    }`}
                  >
                    {MEAL_META[meal].shortTitle}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-[#5A625A] dark:text-[#A4B0A6] flex items-center justify-between">
              <span>Channel: {MEAL_META[selectedAlertMeal].channelName}</span>
              <span className="font-mono tabular-nums">
                Daily at {formatHHmmTo12Hour(settings.mealNotifyTimes[selectedAlertMeal])}
              </span>
            </div>

            <NotificationCard
              key={selectedAlertMeal}
              payload={alertPayload}
              defaultExpanded={true}
              onOpenMeal={onOpenMealDetail}
              onSnooze30m={onSnooze30m}
            />
          </div>

          {/* Active Snoozed Reminders Panel */}
          <div className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#DCE1DA] dark:border-[#2C352F] p-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-[#242824] dark:text-[#F2F3EE] inline-flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#244C3A] dark:text-[#8BB69F]" />
                One-Time Snoozed Reminders
              </h3>
              <span className="text-xs font-mono tabular-nums text-[#5A625A] dark:text-[#A4B0A6]">
                {snoozes.length} active
              </span>
            </div>

            <p className="text-xs text-[#5A625A] dark:text-[#A4B0A6]">
              Snoozing creates an independent 30-minute reminder without altering your recurring daily
              meal schedule.
            </p>

            {snoozes.length === 0 ? (
              <p className="text-sm text-[#5A625A] dark:text-[#A4B0A6] py-3">
                No snoozed reminders right now. Tap &ldquo;Snooze 30m&rdquo; on any meal notification
                above to schedule one.
              </p>
            ) : (
              <ul className="divide-y divide-[#ECEEE9] dark:divide-[#262F29]">
                {snoozes.map((snooze) => {
                  const triggerStr = new Date(snooze.triggerAtEpochMs).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  });
                  return (
                    <li
                      key={snooze.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#242824] dark:text-[#F2F3EE]">
                          {MEAL_META[snooze.mealType].title} (Snoozed 30m)
                        </p>
                        <p className="text-xs font-mono tabular-nums text-[#5A625A] dark:text-[#A4B0A6]">
                          Triggers at {triggerStr} · Daily schedule untouched
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onCancelSnooze(snooze.id)}
                        aria-label={`Cancel snoozed reminder for ${MEAL_META[snooze.mealType].title}`}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#5A625A] dark:text-[#A4B0A6] hover:text-[#A63A2B] dark:hover:text-[#F28B7D] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
