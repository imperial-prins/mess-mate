import React, { useMemo, useState } from 'react';
import { Bell, Check, ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import { MEAL_META, MEAL_ORDER } from '../data/initialMenuData';
import type { MealType, TimingScheduleMode, UserSettings } from '../types/mess';
import {
  formatReadableDate,
  getColumnIndexForWeekday,
  getDayMenuByCycleIndex,
  getHeroDishesForMeal,
} from '../utils/cycleCalculator';
import type { BrowserNotificationPermission } from '../utils/storage';

interface OnboardingModalProps {
  todayIso: string;
  initialSettings: UserSettings;
  notificationPermission: BrowserNotificationPermission;
  onRequestPermission: () => Promise<void>;
  onComplete: (updated: Partial<UserSettings>) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  todayIso,
  initialSettings,
  notificationPermission,
  onRequestPermission,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedWeek, setSelectedWeek] = useState<1 | 2>(1);
  const [scheduleMode, setScheduleMode] = useState<TimingScheduleMode>('AUTO_BY_CALENDAR');
  const [masterNotify, setMasterNotify] = useState<boolean>(initialSettings.masterNotificationsEnabled);
  const [notifyTimes, setNotifyTimes] = useState<Record<MealType, string>>(
    initialSettings.mealNotifyTimes
  );

  const week1Col = getColumnIndexForWeekday(todayIso, 1);
  const week2Col = getColumnIndexForWeekday(todayIso, 2);

  const week1Preview = useMemo(() => {
    const menu = getDayMenuByCycleIndex(week1Col);
    return {
      columnName: menu.pdfColumnName,
      lunch: getHeroDishesForMeal(menu, 'LUNCH', todayIso, {}, 3).map((d) => d.dishName),
      dinner: getHeroDishesForMeal(menu, 'DINNER', todayIso, {}, 3).map((d) => d.dishName),
    };
  }, [week1Col, todayIso]);

  const week2Preview = useMemo(() => {
    const menu = getDayMenuByCycleIndex(week2Col);
    return {
      columnName: menu.pdfColumnName,
      lunch: getHeroDishesForMeal(menu, 'LUNCH', todayIso, {}, 3).map((d) => d.dishName),
      dinner: getHeroDishesForMeal(menu, 'DINNER', todayIso, {}, 3).map((d) => d.dishName),
    };
  }, [week2Col, todayIso]);

  const handleFinish = () => {
    onComplete({
      hasCompletedOnboarding: true,
      cycleStartDateIso: todayIso,
      startingColumnIndex: selectedWeek === 1 ? week1Col : week2Col,
      repeatAfter14Days: true,
      timingScheduleMode: scheduleMode,
      masterNotificationsEnabled: masterNotify,
      mealNotifyTimes: notifyTimes,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF9F6] dark:bg-[#121613] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-heading"
    >
      <div className="w-full max-w-xl my-auto rounded-3xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#E4E7E2] dark:border-[#2C352F] shadow-xl p-6 sm:p-8">
        {/* Step indicator */}
        <div className="flex items-center justify-between text-xs font-medium text-[#5A625A] dark:text-[#A4B0A6] mb-6">
          <span>MessMate Setup</span>
          <span className="font-mono tabular-nums">Step {step} of 4</span>
        </div>

        {/* Step 1: Menu Week */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-sm text-[#244C3A] dark:text-[#8BB69F] font-medium mb-1">
                <Calendar className="w-4 h-4" />
                <span>{formatReadableDate(todayIso)}</span>
              </div>
              <h1
                id="onboarding-heading"
                className="text-2xl sm:text-3xl font-semibold text-[#242824] dark:text-[#F2F3EE]"
              >
                Which menu week is running today?
              </h1>
              <p className="mt-1.5 text-sm text-[#5A625A] dark:text-[#A4B0A6]">
                Match today&apos;s lunch or dinner below to lock your 14-day cycle accurately.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { week: 1 as const, preview: week1Preview },
                { week: 2 as const, preview: week2Preview },
              ].map(({ week, preview }) => {
                const active = selectedWeek === week;
                return (
                  <button
                    key={week}
                    type="button"
                    onClick={() => setSelectedWeek(week)}
                    aria-pressed={active}
                    className={`w-full text-left p-4 rounded-2xl border transition-colors ${
                      active
                        ? 'border-[#244C3A] dark:border-[#8BB69F] bg-[#244C3A]/[0.05] dark:bg-[#8BB69F]/[0.10]'
                        : 'border-[#E4E7E2] dark:border-[#2C352F] hover:border-[#A5B9A5]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-[#242824] dark:text-[#F2F3EE]">
                        Week {week} · {preview.columnName}
                      </span>
                      {active && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#244C3A] dark:text-[#8BB69F]">
                          <Check className="w-4 h-4" /> Selected
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-[#242824] dark:text-[#E2E6E0]">
                      <span className="text-[#5A625A] dark:text-[#A4B0A6]">Lunch: </span>
                      {preview.lunch.join(', ')}
                    </p>
                    <p className="mt-1 text-sm text-[#242824] dark:text-[#E2E6E0]">
                      <span className="text-[#5A625A] dark:text-[#A4B0A6]">Dinner: </span>
                      {preview.dinner.join(', ')}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Timing Schedule */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-sm text-[#244C3A] dark:text-[#8BB69F] font-medium mb-1">
                <Clock className="w-4 h-4" />
                <span>Two Timing Columns Detected</span>
              </div>
              <h1
                id="onboarding-heading"
                className="text-2xl sm:text-3xl font-semibold text-[#242824] dark:text-[#F2F3EE]"
              >
                Choose your mess timing schedule
              </h1>
              <p className="mt-1.5 text-sm text-[#5A625A] dark:text-[#A4B0A6]">
                Your hostel timetable lists separate schedules for Working Days and Sundays/Holidays.
              </p>
            </div>

            <div className="space-y-3">
              {(
                [
                  {
                    mode: 'AUTO_BY_CALENDAR' as const,
                    title: 'Auto-Switch (Recommended)',
                    summary: 'Working Days timings Mon–Sat · Holiday timings on Sundays',
                    detail: 'Breakfast 7:30 AM (Sun 8:00 AM) · Lunch 11:30 AM (Sun 12:30 PM)',
                  },
                  {
                    mode: 'WORKING_DAYS' as const,
                    title: 'Working Days Schedule',
                    summary: 'Breakfast 7:30–9:30 AM · Lunch 11:30 AM–3:00 PM',
                    detail: 'Snacks 5:00–6:30 PM · Dinner 7:30–9:30 PM',
                  },
                  {
                    mode: 'SUNDAYS_HOLIDAYS' as const,
                    title: 'Sundays / Holidays Schedule',
                    summary: 'Breakfast 8:00–10:00 AM · Lunch 12:30–3:00 PM',
                    detail: 'Snacks 5:00–6:30 PM · Dinner 7:30–9:30 PM',
                  },
                ] as const
              ).map((opt) => {
                const active = scheduleMode === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => setScheduleMode(opt.mode)}
                    aria-pressed={active}
                    className={`w-full text-left p-4 rounded-2xl border transition-colors ${
                      active
                        ? 'border-[#244C3A] dark:border-[#8BB69F] bg-[#244C3A]/[0.05] dark:bg-[#8BB69F]/[0.10]'
                        : 'border-[#E4E7E2] dark:border-[#2C352F] hover:border-[#A5B9A5]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-semibold text-[#242824] dark:text-[#F2F3EE]">
                        {opt.title}
                      </span>
                      {active && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#244C3A] dark:text-[#8BB69F]">
                          <Check className="w-4 h-4" /> Selected
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[#242824] dark:text-[#E2E6E0]">{opt.summary}</p>
                    <p className="mt-0.5 text-xs text-[#5A625A] dark:text-[#A4B0A6]">{opt.detail}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Meal Notifications */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-sm text-[#244C3A] dark:text-[#8BB69F] font-medium mb-1">
                <Bell className="w-4 h-4" />
                <span>Pre-Meal Alerts</span>
              </div>
              <h1
                id="onboarding-heading"
                className="text-2xl sm:text-3xl font-semibold text-[#242824] dark:text-[#F2F3EE]"
              >
                Enable meal notifications
              </h1>
              <p className="mt-1.5 text-sm text-[#5A625A] dark:text-[#A4B0A6]">
                Get today&apos;s exact menu before each meal so you can decide whether to eat or skip.
              </p>
            </div>

            <label className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-[#E4E7E2] dark:border-[#2C352F] cursor-pointer min-h-[56px]">
              <div>
                <p className="text-base font-semibold text-[#242824] dark:text-[#F2F3EE]">
                  Daily meal alerts
                </p>
                <p className="text-xs text-[#5A625A] dark:text-[#A4B0A6]">
                  Individual meals can be toggled anytime in Settings
                </p>
              </div>
              <input
                type="checkbox"
                checked={masterNotify}
                onChange={(e) => setMasterNotify(e.target.checked)}
                className="w-5 h-5 accent-[#244C3A]"
              />
            </label>

            {masterNotify && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MEAL_ORDER.map((meal) => (
                  <div
                    key={meal}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#121613] border border-[#E4E7E2] dark:border-[#2C352F]"
                  >
                    <label
                      htmlFor={`onboard-time-${meal}`}
                      className="text-sm font-medium text-[#242824] dark:text-[#F2F3EE]"
                    >
                      {MEAL_META[meal].title}
                    </label>
                    <input
                      id={`onboard-time-${meal}`}
                      type="time"
                      value={notifyTimes[meal]}
                      onChange={(e) =>
                        setNotifyTimes((prev) => ({ ...prev, [meal]: e.target.value }))
                      }
                      className="min-h-[40px] px-2.5 rounded-lg bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#D7DDD6] dark:border-[#323D36] text-sm font-mono tabular-nums text-[#242824] dark:text-[#F2F3EE]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Permissions */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h1
                id="onboarding-heading"
                className="text-2xl sm:text-3xl font-semibold text-[#242824] dark:text-[#F2F3EE]"
              >
                Notification permissions
              </h1>
              <p className="mt-1.5 text-sm text-[#5A625A] dark:text-[#A4B0A6]">
                MessMate works completely offline. We only ask for permissions needed to deliver
                timely meal alerts.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#121613] border border-[#E4E7E2] dark:border-[#2C352F]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#242824] dark:text-[#F2F3EE]">
                    System Notification Permission
                  </p>
                  <span className="text-xs font-mono font-medium text-[#244C3A] dark:text-[#8BB69F]">
                    {notificationPermission === 'granted'
                      ? 'Granted'
                      : notificationPermission === 'denied'
                      ? 'Blocked in browser'
                      : notificationPermission === 'unsupported'
                      ? 'In-app alerts only'
                      : 'Not requested'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#5A625A] dark:text-[#A4B0A6]">
                  Required so meal menus appear before Breakfast, Lunch, Snacks, and Dinner without
                  opening the app.
                </p>

                {notificationPermission === 'default' && (
                  <button
                    type="button"
                    onClick={() => void onRequestPermission()}
                    className="mt-3 min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold bg-[#244C3A] text-white hover:bg-[#1C3D2E] dark:bg-[#8BB69F] dark:text-[#121613] transition-colors"
                  >
                    Allow Notifications
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#121613] border border-[#E4E7E2] dark:border-[#2C352F]">
                <p className="text-sm font-semibold text-[#242824] dark:text-[#F2F3EE]">
                  Honest Delivery Notice
                </p>
                <p className="mt-1 text-xs text-[#5A625A] dark:text-[#A4B0A6] leading-relaxed">
                  On browsers and mobile OSes, aggressive battery savers or closed tabs can delay
                  scheduled alerts. You can always check your live permission status, send a test
                  alert, or adjust your 14-day cycle date in Settings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer controls */}
        <div className="mt-8 pt-5 border-t border-[#ECEEE9] dark:border-[#262F29] flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
              className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#242824] dark:text-[#F2F3EE] border border-[#D7DDD6] dark:border-[#323D36] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
              className="min-h-[44px] px-6 py-2 rounded-xl text-sm font-semibold bg-[#244C3A] text-white hover:bg-[#1C3D2E] dark:bg-[#8BB69F] dark:text-[#121613] dark:hover:bg-[#A1C6B2] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="min-h-[44px] px-6 py-2 rounded-xl text-sm font-semibold bg-[#244C3A] text-white hover:bg-[#1C3D2E] dark:bg-[#8BB69F] dark:text-[#121613] dark:hover:bg-[#A1C6B2] transition-colors whitespace-nowrap"
            >
              Open Today&apos;s Menu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
