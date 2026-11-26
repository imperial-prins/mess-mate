import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  Palette,
  ShieldCheck,
  RotateCcw,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  INITIAL_14_DAY_MENU,
  MEAL_META,
  MEAL_ORDER,
  MESS_SERVICES_NOTES,
} from '../data/initialMenuData';
import type {
  MealType,
  ThemeMode,
  TimingScheduleMode,
  UserSettings,
} from '../types/mess';
import type { BrowserNotificationPermission } from '../utils/storage';
import { formatHHmmTo12Hour } from '../utils/cycleCalculator';

interface SettingsViewProps {
  settings: UserSettings;
  notificationPermission: BrowserNotificationPermission;
  editedDishCount: number;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onToggleMealNotification: (meal: MealType, enabled: boolean) => void;
  onUpdateMealTime: (meal: MealType, time: string) => void;
  onRequestPermission: () => Promise<void>;
  onSendTestNotification: () => void;
  onResetMenuConfiguration: () => void;
  onResetAllDishOverrides: () => void;
  onRerunOnboarding: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  notificationPermission,
  editedDishCount,
  onUpdateSettings,
  onToggleMealNotification,
  onUpdateMealTime,
  onRequestPermission,
  onSendTestNotification,
  onResetMenuConfiguration,
  onResetAllDishOverrides,
  onRerunOnboarding,
}) => {
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleResetMenu = () => {
    onResetMenuConfiguration();
    setResetMessage('Menu cycle configuration reset to today (Week 1).');
  };

  const handleResetEdits = () => {
    onResetAllDishOverrides();
    setResetMessage('All dish corrections restored to the original extracted PDF menu.');
  };

  const permissionStatusInfo = (() => {
    switch (notificationPermission) {
      case 'granted':
        return {
          label: 'Granted',
          detail: 'Browser notifications are allowed while MessMate is open.',
          isOk: true,
        };
      case 'denied':
        return {
          label: 'Blocked by browser',
          detail:
            'Notifications are denied in browser settings. In-app alerts still work, but OS banners cannot fire until re-enabled.',
          isOk: false,
        };
      case 'unsupported':
        return {
          label: 'Unsupported in this browser',
          detail: 'This environment does not expose the Web Notification API. In-app meal banners will still appear.',
          isOk: false,
        };
      default:
        return {
          label: 'Not requested yet',
          detail: 'Grant permission so meal alerts can appear outside the tab.',
          isOk: false,
        };
    }
  })();

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="text-sm font-medium text-[#5A625A] dark:text-[#A4B0A6]">
          Preferences · Stored Offline on Device
        </p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-semibold text-[#242824] dark:text-[#F2F3EE]">
          Settings
        </h1>
      </div>

      {resetMessage && (
        <div
          role="status"
          className="rounded-2xl bg-[#244C3A]/10 dark:bg-[#8BB69F]/15 border border-[#244C3A]/20 px-4 py-3 text-sm font-medium text-[#244C3A] dark:text-[#8BB69F] flex items-center justify-between gap-3"
        >
          <span>{resetMessage}</span>
          <button
            type="button"
            onClick={() => setResetMessage(null)}
            className="text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. NOTIFICATIONS */}
      <section
        aria-labelledby="settings-notifications-heading"
        className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#DCE1DA] dark:border-[#2C352F] p-6 space-y-5"
      >
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#244C3A] dark:text-[#8BB69F]" />
          <h2
            id="settings-notifications-heading"
            className="text-xl font-semibold text-[#242824] dark:text-[#F2F3EE]"
          >
            Notifications
          </h2>
        </div>

        <label className="flex items-center justify-between gap-4 py-2 cursor-pointer min-h-[48px]">
          <div>
            <p className="text-base font-semibold text-[#242824] dark:text-[#F2F3EE]">
              Master meal notifications
            </p>
            <p className="text-xs text-[#5A625A] dark:text-[#A4B0A6]">
              Turns all four daily meal notification channels on or off
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.masterNotificationsEnabled}
            onChange={(e) =>
              onUpdateSettings({ masterNotificationsEnabled: e.target.checked })
            }
            className="w-5 h-5 accent-[#244C3A]"
          />
        </label>

        <div className="divide-y divide-[#ECEEE9] dark:divide-[#262F29] border-t border-[#ECEEE9] dark:border-[#262F29]">
          {MEAL_ORDER.map((meal) => {
            const enabled =
              settings.masterNotificationsEnabled &&
              settings.mealNotificationsEnabled[meal];
            return (
              <label
                key={meal}
                className={`py-3.5 flex items-center justify-between gap-4 min-h-[52px] ${
                  settings.masterNotificationsEnabled ? 'cursor-pointer' : 'opacity-50'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-[#242824] dark:text-[#F2F3EE]">
                    {MEAL_META[meal].title}
                  </p>
                  <p className="text-xs text-[#5A625A] dark:text-[#A4B0A6]">
                    Channel: {MEAL_META[meal].channelName}
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled={!settings.masterNotificationsEnabled}
                  checked={enabled}
                  onChange={(e) => onToggleMealNotification(meal, e.target.checked)}
                  className="w-5 h-5 accent-[#244C3A]"
                />
              </label>
            );
          })}
        </div>
      </section>

      {/* 2. NOTIFICATION TIMINGS */}
      <section
        aria-labelledby="settings-timings-heading"
        className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#DCE1DA] dark:border-[#2C352F] p-6 space-y-5"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#244C3A] dark:text-[#8BB69F]" />
          <h2
            id="settings-timings-heading"
            className="text-xl font-semibold text-[#242824] dark:text-[#F2F3EE]"
          >
            Notification Timings
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MEAL_ORDER.map((meal) => (
            <div
              key={meal}
              className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#121613] border border-[#E4E7E2] dark:border-[#2C352F]"
            >
              <div>
                <label
                  htmlFor={`setting-time-${meal}`}
                  className="block text-sm font-semibold text-[#242824] dark:text-[#F2F3EE]"
                >
                  {MEAL_META[meal].title} alert time
                </label>
                <span className="text-xs text-[#5A625A] dark:text-[#A4B0A6]">
                  Default {formatHHmmTo12Hour(MEAL_META[meal].defaultNotifyTime)}
                </span>
              </div>
              <input
                id={`setting-time-${meal}`}
                type="time"
                value={settings.mealNotifyTimes[meal]}
                onChange={(e) => onUpdateMealTime(meal, e.target.value)}
                className="min-h-[44px] px-3 rounded-xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#D7DDD6] dark:border-[#323D36] text-sm font-mono tabular-nums text-[#242824] dark:text-[#F2F3EE]"
              />
            </div>
          ))}
        </div>
      </section>

      {/* 3. MENU CYCLE & TIMING SCHEDULE */}
      <section
        aria-labelledby="settings-menu-heading"
        className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#DCE1DA] dark:border-[#2C352F] p-6 space-y-5"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#244C3A] dark:text-[#8BB69F]" />
          <h2
            id="settings-menu-heading"
            className="text-xl font-semibold text-[#242824] dark:text-[#F2F3EE]"
          >
            14-Day Menu Cycle &amp; Schedule
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="cycle-start-date"
              className="block text-sm font-semibold text-[#242824] dark:text-[#F2F3EE] mb-1.5"
            >
              Cycle Starting Date
            </label>
            <input
              id="cycle-start-date"
              type="date"
              value={settings.cycleStartDateIso}
              onChange={(e) => {
                if (e.target.value) {
                  onUpdateSettings({ cycleStartDateIso: e.target.value });
                }
              }}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#121613] border border-[#D7DDD6] dark:border-[#323D36] text-sm font-mono tabular-nums text-[#242824] dark:text-[#F2F3EE]"
            />
          </div>

          <div>
            <label
              htmlFor="starting-column-select"
              className="block text-sm font-semibold text-[#242824] dark:text-[#F2F3EE] mb-1.5"
            >
              Starting PDF Column on That Date
            </label>
            <select
              id="starting-column-select"
              value={settings.startingColumnIndex}
              onChange={(e) =>
                onUpdateSettings({ startingColumnIndex: Number(e.target.value) })
              }
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#121613] border border-[#D7DDD6] dark:border-[#323D36] text-sm text-[#242824] dark:text-[#F2F3EE]"
            >
              {INITIAL_14_DAY_MENU.map((day) => (
                <option key={day.cycleDayIndex} value={day.cycleDayIndex}>
                  Day {day.cycleDayIndex} — {day.pdfColumnName} (Week {day.weekNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center justify-between gap-4 py-2 cursor-pointer min-h-[48px]">
          <div>
            <p className="text-sm font-semibold text-[#242824] dark:text-[#F2F3EE]">
              Repeat 14-day cycle automatically
            </p>
            <p className="text-xs text-[#5A625A] dark:text-[#A4B0A6]">
              Day 15 wraps back to Day 1 across months, years, and leap years
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.repeatAfter14Days}
            onChange={(e) => onUpdateSettings({ repeatAfter14Days: e.target.checked })}
            className="w-5 h-5 accent-[#244C3A]"
          />
        </label>

        <div className="space-y-2.5 pt-2 border-t border-[#ECEEE9] dark:border-[#262F29]">
          <p className="text-sm font-semibold text-[#242824] dark:text-[#F2F3EE]">
            Mess Timing Schedule (from PDF)
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {(
              [
                {
                  mode: 'AUTO_BY_CALENDAR' as TimingScheduleMode,
                  label: 'Auto-Switch (Working Days Mon–Sat, Sunday Schedule on Sundays)',
                },
                {
                  mode: 'WORKING_DAYS' as TimingScheduleMode,
                  label: 'Working Days (Breakfast 7:30–9:30 AM · Lunch 11:30 AM–3:00 PM)',
                },
                {
                  mode: 'SUNDAYS_HOLIDAYS' as TimingScheduleMode,
                  label: 'Sundays / Holidays (Breakfast 8:00–10:00 AM · Lunch 12:30–3:00 PM)',
                },
              ] as const
            ).map((opt) => (
              <label
                key={opt.mode}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer min-h-[48px] transition-colors ${
                  settings.timingScheduleMode === opt.mode
                    ? 'border-[#244C3A] dark:border-[#8BB69F] bg-[#244C3A]/[0.05] dark:bg-[#8BB69F]/[0.10]'
                    : 'border-[#E4E7E2] dark:border-[#2C352F]'
                }`}
              >
                <input
                  type="radio"
                  name="timing-schedule-mode"
                  checked={settings.timingScheduleMode === opt.mode}
                  onChange={() => onUpdateSettings({ timingScheduleMode: opt.mode })}
                  className="w-4 h-4 accent-[#244C3A]"
                />
                <span className="text-sm font-medium text-[#242824] dark:text-[#F2F3EE]">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* 4. APPEARANCE & ACCESSIBILITY */}
      <section
        aria-labelledby="settings-appearance-heading"
        className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#DCE1DA] dark:border-[#2C352F] p-6 space-y-5"
      >
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#244C3A] dark:text-[#8BB69F]" />
          <h2
            id="settings-appearance-heading"
            className="text-xl font-semibold text-[#242824] dark:text-[#F2F3EE]"
          >
            Appearance &amp; Readability
          </h2>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#242824] dark:text-[#F2F3EE]">Theme</p>
          <div
            role="group"
            aria-label="Theme mode"
            className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[#EFEFE9] dark:bg-[#121613] border border-[#E4E7E2] dark:border-[#2C352F]"
          >
            {(
              [
                { mode: 'LIGHT' as ThemeMode, label: 'Light' },
                { mode: 'DARK' as ThemeMode, label: 'Dark' },
                { mode: 'SYSTEM' as ThemeMode, label: 'System' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.mode}
                type="button"
                onClick={() => onUpdateSettings({ themeMode: opt.mode })}
                aria-pressed={settings.themeMode === opt.mode}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  settings.themeMode === opt.mode
                    ? 'bg-[#FFFFFF] dark:bg-[#244C3A] text-[#244C3A] dark:text-[#F2F3EE] shadow-xs'
                    : 'text-[#5A625A] dark:text-[#A4B0A6] hover:text-[#242824] dark:hover:text-[#F2F3EE]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#242824] dark:text-[#F2F3EE]">
            Food Text Scaling (Accessibility up to 200%)
          </p>
          <div
            role="group"
            aria-label="Text size scaling"
            className="grid grid-cols-4 gap-2 p-1 rounded-xl bg-[#EFEFE9] dark:bg-[#121613] border border-[#E4E7E2] dark:border-[#2C352F]"
          >
            {([100, 125, 150, 200] as const).map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => onUpdateSettings({ textScalePercent: pct })}
                aria-pressed={settings.textScalePercent === pct}
                className={`min-h-[44px] px-2 py-2 rounded-lg text-sm font-mono tabular-nums font-semibold transition-colors whitespace-nowrap ${
                  settings.textScalePercent === pct
                    ? 'bg-[#FFFFFF] dark:bg-[#244C3A] text-[#244C3A] dark:text-[#F2F3EE] shadow-xs'
                    : 'text-[#5A625A] dark:text-[#A4B0A6] hover:text-[#242824] dark:hover:text-[#F2F3EE]'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PERMISSIONS, DIAGNOSTICS & RESETS */}
      <section
        aria-labelledby="settings-other-heading"
        className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#DCE1DA] dark:border-[#2C352F] p-6 space-y-5"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#244C3A] dark:text-[#8BB69F]" />
          <h2
            id="settings-other-heading"
            className="text-xl font-semibold text-[#242824] dark:text-[#F2F3EE]"
          >
            Permissions &amp; Reliability
          </h2>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#121613] border border-[#E4E7E2] dark:border-[#2C352F] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-[#242824] dark:text-[#F2F3EE]">
              Notification Permission Status
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                permissionStatusInfo.isOk
                  ? 'text-[#1E5E3E] dark:text-[#8AD1A8]'
                  : 'text-[#8C5F12] dark:text-[#E8B86D]'
              }`}
            >
              {permissionStatusInfo.isOk ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {permissionStatusInfo.label}
            </span>
          </div>
          <p className="text-xs text-[#5A625A] dark:text-[#A4B0A6] leading-relaxed">
            {permissionStatusInfo.detail}
          </p>
          {notificationPermission === 'default' && (
            <button
              type="button"
              onClick={() => void onRequestPermission()}
              className="mt-2 min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold bg-[#244C3A] text-white hover:bg-[#1C3D2E] dark:bg-[#8BB69F] dark:text-[#121613] transition-colors"
            >
              Request Permission
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSendTestNotification}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold bg-[#244C3A] text-white hover:bg-[#1C3D2E] dark:bg-[#8BB69F] dark:text-[#121613] inline-flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Bell className="w-4 h-4" />
            Send Test Notification
          </button>

          <button
            type="button"
            onClick={handleResetMenu}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#242824] dark:text-[#F2F3EE] border border-[#D7DDD6] dark:border-[#323D36] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] inline-flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Menu Configuration
          </button>

          <button
            type="button"
            onClick={handleResetEdits}
            disabled={editedDishCount === 0}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#242824] dark:text-[#F2F3EE] border border-[#D7DDD6] dark:border-[#323D36] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            Restore All Dishes ({editedDishCount})
          </button>

          <button
            type="button"
            onClick={onRerunOnboarding}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#5A625A] dark:text-[#A4B0A6] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] transition-colors whitespace-nowrap"
          >
            Re-run Quick Setup
          </button>
        </div>
      </section>

      {/* 6. ABOUT MESSMATE & MESS SERVICES (PDF PAGE 2) */}
      <section
        aria-labelledby="settings-about-heading"
        className="rounded-3xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#DCE1DA] dark:border-[#2C352F] p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-[#244C3A] dark:text-[#8BB69F]" />
          <h2
            id="settings-about-heading"
            className="text-xl font-semibold text-[#242824] dark:text-[#F2F3EE]"
          >
            About MessMate &amp; Mess Services
          </h2>
        </div>

        <p className="text-sm text-[#5A625A] dark:text-[#A4B0A6] leading-relaxed">
          MessMate is an offline-first hostel food-menu companion built around your 14-day Girls
          Hostel Mess Menu (2026–2027). No accounts, no advertisements, and no internet connection
          required.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {MESS_SERVICES_NOTES.map((service) => (
            <div
              key={service.title}
              className="p-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#121613] border border-[#E4E7E2] dark:border-[#2C352F]"
            >
              <p className="text-sm font-semibold text-[#242824] dark:text-[#F2F3EE]">
                {service.title}
              </p>
              <p className="mt-1 text-xs text-[#5A625A] dark:text-[#A4B0A6] leading-relaxed">
                {service.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
