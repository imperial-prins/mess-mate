import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Utensils, CalendarDays, LayoutGrid, Settings, Bell } from 'lucide-react';
import { MEAL_ORDER } from './data/initialMenuData';
import type {
  DishOverride,
  FormattedNotificationPayload,
  MealType,
  ResolvedFoodItem,
  SnoozedReminder,
  UserSettings,
} from './types/mess';
import {
  addDaysIso,
  buildMealNotificationPayload,
  createSnoozeReminder,
  getColumnIndexForWeekday,
  getDayMenuForDate,
  getMealStatusForDate,
  getNextUpcomingMeal,
  toLocalDateIso,
} from './utils/cycleCalculator';
import {
  getBrowserNotificationPermission,
  hasSentNotificationKey,
  loadDishOverrides,
  loadSettings,
  loadSnoozes,
  markNotificationKeySent,
  saveDishOverrides,
  saveSettings,
  saveSnoozes,
  type BrowserNotificationPermission,
} from './utils/storage';
import { HomeView } from './components/HomeView';
import { WeeklyMenuView } from './components/WeeklyMenuView';
import { WidgetAndAlertsView } from './components/WidgetAndAlertsView';
import { SettingsView } from './components/SettingsView';
import { MealDetailDrawer } from './components/MealDetailDrawer';
import { FixDishModal } from './components/FixDishModal';
import { OnboardingModal } from './components/OnboardingModal';
import { NotificationCard } from './components/NotificationTrayBanner';

type AppTab = 'HOME' | 'WEEKLY' | 'WIDGETS' | 'SETTINGS';

export default function App() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [activeTab, setActiveTab] = useState<AppTab>('HOME');
  const [settings, setSettings] = useState<UserSettings>(() => {
    const loaded = loadSettings();
    if (
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('autostart') === '1'
    ) {
      return { ...loaded, hasCompletedOnboarding: true };
    }
    return loaded;
  });
  const [dishOverrides, setDishOverrides] = useState<Record<string, DishOverride>>(() =>
    loadDishOverrides()
  );
  const [snoozes, setSnoozes] = useState<SnoozedReminder[]>(() => loadSnoozes());
  const [permission, setPermission] = useState<BrowserNotificationPermission>(() =>
    getBrowserNotificationPermission()
  );
  const [widgetLastUpdated, setWidgetLastUpdated] = useState<string>(() =>
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );

  // Selected meal details drawer state
  const [detailTarget, setDetailTarget] = useState<{
    mealType: MealType;
    targetDateIso: string;
  } | null>(null);

  // Fix Dish modal state
  const [editingDish, setEditingDish] = useState<ResolvedFoodItem | null>(null);

  // Live floating notification tray (Android-style heads-up alert)
  const [floatingAlert, setFloatingAlert] = useState<FormattedNotificationPayload | null>(null);

  // Sync settings, dish overrides, and snoozes to localStorage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveDishOverrides(dishOverrides);
  }, [dishOverrides]);

  useEffect(() => {
    saveSnoozes(snoozes);
  }, [snoozes]);

  // Scroll back to top cleanly when switching primary screens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  // Apply Light / Dark / System theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const shouldBeDark =
        settings.themeMode === 'DARK' ||
        (settings.themeMode === 'SYSTEM' && media.matches);
      root.classList.toggle('dark', shouldBeDark);
    };

    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [settings.themeMode]);

  // Apply accessibility font scaling (100% - 200%)
  useEffect(() => {
    document.documentElement.style.fontSize = `${settings.textScalePercent}%`;
    return () => {
      document.documentElement.style.fontSize = '100%';
    };
  }, [settings.textScalePercent]);

  const dispatchMealAlert = useCallback(
    (
      mealType: MealType,
      targetDateIso: string,
      options?: { isSnoozed?: boolean; isTest?: boolean }
    ) => {
      const payload = buildMealNotificationPayload(
        mealType,
        targetDateIso,
        settings,
        dishOverrides,
        options
      );
      setFloatingAlert(payload);

      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          const notif = new Notification(payload.title, {
            body: `${payload.collapsedSummary}\n${payload.footerTiming}`,
            tag: options?.isTest
              ? 'messmate-test'
              : `messmate-${mealType}-${targetDateIso}`,
          });
          notif.onclick = () => {
            window.focus();
            setDetailTarget({ mealType, targetDateIso });
            notif.close();
          };
        } catch {
          // Fallback already rendered via in-app heads-up notification tray
        }
      }
    },
    [settings, dishOverrides]
  );

  // Minute ticker for live countdowns, scheduled notifications, and due 30m snoozes
  useEffect(() => {
    const tick = () => {
      const current = new Date();
      setNow(current);

      const currentDateIso = toLocalDateIso(current);
      const currentHHmm = `${String(current.getHours()).padStart(2, '0')}:${String(
        current.getMinutes()
      ).padStart(2, '0')}`;

      // Check regular scheduled meal alerts (deduplicated per date + meal + HH:mm)
      if (settings.hasCompletedOnboarding && settings.masterNotificationsEnabled) {
        for (const meal of MEAL_ORDER) {
          if (
            settings.mealNotificationsEnabled[meal] &&
            settings.mealNotifyTimes[meal] === currentHHmm
          ) {
            const dedupKey = `daily_${currentDateIso}_${meal}_${currentHHmm}`;
            if (!hasSentNotificationKey(dedupKey)) {
              markNotificationKeySent(dedupKey);
              dispatchMealAlert(meal, currentDateIso);
            }
          }
        }
      }

      // Check due one-time snoozed reminders
      const nowMs = current.getTime();
      setSnoozes((prev) => {
        const due = prev.filter((s) => s.triggerAtEpochMs <= nowMs);
        if (due.length === 0) return prev;
        due.forEach((s) => {
          dispatchMealAlert(s.mealType, s.targetDateIso, { isSnoozed: true });
        });
        return prev.filter((s) => s.triggerAtEpochMs > nowMs);
      });
    };

    const interval = window.setInterval(tick, 15_000);
    return () => window.clearInterval(interval);
  }, [settings, dispatchMealAlert]);

  const todayIso = toLocalDateIso(now);
  const tomorrowIso = addDaysIso(todayIso, 1);

  const todayMenu = useMemo(
    () => getDayMenuForDate(todayIso, settings),
    [todayIso, settings]
  );
  const tomorrowMenu = useMemo(
    () => getDayMenuForDate(tomorrowIso, settings),
    [tomorrowIso, settings]
  );
  const upcomingMeal = useMemo(
    () => getNextUpcomingMeal(now, settings.timingScheduleMode),
    [now, settings.timingScheduleMode]
  );

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch {
      setPermission(getBrowserNotificationPermission());
    }
  };

  const handleUpdateSettings = (patch: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setWidgetLastUpdated(
      new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    );
  };

  const handleToggleMealNotification = (meal: MealType, enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      mealNotificationsEnabled: {
        ...prev.mealNotificationsEnabled,
        [meal]: enabled,
      },
    }));
  };

  const handleUpdateMealTime = (meal: MealType, time: string) => {
    setSettings((prev) => ({
      ...prev,
      mealNotifyTimes: {
        ...prev.mealNotifyTimes,
        [meal]: time,
      },
    }));
  };

  const handleSaveDishOverride = (itemId: string, override: DishOverride) => {
    setDishOverrides((prev) => ({
      ...prev,
      [itemId]: override,
    }));
    setWidgetLastUpdated(
      new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    );
  };

  const handleRestoreDishOriginal = (itemId: string) => {
    setDishOverrides((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setWidgetLastUpdated(
      new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    );
  };

  const handleSnooze30m = (mealType: MealType, targetDateIso: string) => {
    setSnoozes((prev) =>
      createSnoozeReminder(prev, mealType, targetDateIso, Date.now(), 30)
    );
    setFloatingAlert(null);
  };

  const handleCancelSnooze = (id: string) => {
    setSnoozes((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRefreshWidget = () => {
    const fresh = new Date();
    setNow(fresh);
    setWidgetLastUpdated(
      fresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    );
  };

  const handleResetMenuConfiguration = () => {
    const currentToday = toLocalDateIso(new Date());
    handleUpdateSettings({
      cycleStartDateIso: currentToday,
      startingColumnIndex: getColumnIndexForWeekday(currentToday, 1),
      repeatAfter14Days: true,
    });
  };

  const handleOpenMealDetail = (mealType: MealType, targetDateIso: string) => {
    setDetailTarget({ mealType, targetDateIso });
    setFloatingAlert(null);
  };

  const detailDayMenu = detailTarget
    ? getDayMenuForDate(detailTarget.targetDateIso, settings)
    : null;
  const detailStatus = detailTarget
    ? getMealStatusForDate(
        detailTarget.mealType,
        detailTarget.targetDateIso,
        now,
        settings.timingScheduleMode
      )
    : null;

  const navItems: Array<{ id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'HOME', label: 'Today', icon: Utensils },
    { id: 'WEEKLY', label: 'Weekly', icon: CalendarDays },
    { id: 'WIDGETS', label: 'Widget', icon: LayoutGrid },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#121613] text-[#242824] dark:text-[#F2F3EE] flex flex-col">
      {/* Top Bar Contract: Single Wordmark — 4 Single-Line Nav Links — 1 Primary Action */}
      <header className="sticky top-0 z-30 bg-[#FAF9F6]/90 dark:bg-[#121613]/90 backdrop-blur-md border-b border-[#E4E7E2] dark:border-[#242D27]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('HOME')}
            className="font-display text-xl font-bold tracking-tight text-[#244C3A] dark:text-[#8BB69F] whitespace-nowrap shrink-0 focus:outline-none"
          >
            MessMate
          </button>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    active
                      ? 'text-[#244C3A] dark:text-[#8BB69F] border-[#244C3A] dark:border-[#8BB69F] font-semibold'
                      : 'text-[#5A625A] dark:text-[#A4B0A6] border-transparent hover:text-[#242824] dark:hover:text-[#F2F3EE]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() =>
              dispatchMealAlert(upcomingMeal.mealType, upcomingMeal.targetDateIso, {
                isTest: true,
              })
            }
            className="min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#244C3A] text-white hover:bg-[#1C3D2E] dark:bg-[#8BB69F] dark:text-[#121613] dark:hover:bg-[#A1C6B2] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Bell className="w-3.5 h-3.5" />
            Test Alert
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-24 md:pb-12">
        {activeTab === 'HOME' && (
          <HomeView
            now={now}
            todayIso={todayIso}
            todayMenu={todayMenu}
            tomorrowMenu={tomorrowMenu}
            upcomingMeal={upcomingMeal}
            settings={settings}
            dishOverrides={dishOverrides}
            snoozes={snoozes}
            widgetLastUpdated={widgetLastUpdated}
            onRefreshWidget={handleRefreshWidget}
            onOpenMealDetail={handleOpenMealDetail}
            onEditDish={setEditingDish}
            onSnooze30m={handleSnooze30m}
            onCancelSnooze={handleCancelSnooze}
            onTestNotification={(meal, dateIso) =>
              dispatchMealAlert(meal, dateIso, { isTest: true })
            }
          />
        )}

        {activeTab === 'WEEKLY' && (
          <WeeklyMenuView
            todayIso={todayIso}
            settings={settings}
            dishOverrides={dishOverrides}
            onOpenMealDetail={handleOpenMealDetail}
            onEditDish={setEditingDish}
          />
        )}

        {activeTab === 'WIDGETS' && (
          <WidgetAndAlertsView
            now={now}
            todayIso={todayIso}
            todayMenu={todayMenu}
            tomorrowMenu={tomorrowMenu}
            upcomingMeal={upcomingMeal}
            settings={settings}
            dishOverrides={dishOverrides}
            snoozes={snoozes}
            widgetLastUpdated={widgetLastUpdated}
            onRefreshWidget={handleRefreshWidget}
            onOpenMealDetail={handleOpenMealDetail}
            onSnooze30m={handleSnooze30m}
            onCancelSnooze={handleCancelSnooze}
            onTestNotification={(meal, dateIso) =>
              dispatchMealAlert(meal, dateIso, { isTest: true })
            }
          />
        )}

        {activeTab === 'SETTINGS' && (
          <SettingsView
            settings={settings}
            notificationPermission={permission}
            editedDishCount={Object.keys(dishOverrides).length}
            onUpdateSettings={handleUpdateSettings}
            onToggleMealNotification={handleToggleMealNotification}
            onUpdateMealTime={handleUpdateMealTime}
            onRequestPermission={handleRequestPermission}
            onSendTestNotification={() =>
              dispatchMealAlert(upcomingMeal.mealType, upcomingMeal.targetDateIso, {
                isTest: true,
              })
            }
            onResetMenuConfiguration={handleResetMenuConfiguration}
            onResetAllDishOverrides={() => {
              setDishOverrides({});
              handleRefreshWidget();
            }}
            onRerunOnboarding={() =>
              handleUpdateSettings({ hasCompletedOnboarding: false })
            }
          />
        )}
      </main>

      {/* Mobile Bottom Tab Bar (Thumb-Zone Ergonomics) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FFFFFF]/95 dark:bg-[#1A201C]/95 backdrop-blur-md border-t border-[#E4E7E2] dark:border-[#262F29]"
      >
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-1 transition-colors ${
                  active
                    ? 'text-[#244C3A] dark:text-[#8BB69F] font-semibold'
                    : 'text-[#5A625A] dark:text-[#A4B0A6]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Floating Heads-Up Notification Tray */}
      {floatingAlert && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-[420px] z-50">
          <NotificationCard
            payload={floatingAlert}
            defaultExpanded={false}
            isFloating={true}
            onOpenMeal={handleOpenMealDetail}
            onSnooze30m={handleSnooze30m}
            onDismiss={() => setFloatingAlert(null)}
          />
        </div>
      )}

      {/* Meal Details Drawer */}
      <MealDetailDrawer
        mealType={detailTarget?.mealType ?? null}
        targetDateIso={detailTarget?.targetDateIso ?? null}
        dayMenu={detailDayMenu}
        status={detailStatus}
        scheduleMode={settings.timingScheduleMode}
        dishOverrides={dishOverrides}
        onClose={() => setDetailTarget(null)}
        onEditDish={setEditingDish}
        onTestNotification={(meal, dateIso) =>
          dispatchMealAlert(meal, dateIso, { isTest: true })
        }
      />

      {/* Fix Dish Modal */}
      <FixDishModal
        item={editingDish}
        onClose={() => setEditingDish(null)}
        onSave={handleSaveDishOverride}
        onRestoreOriginal={handleRestoreDishOriginal}
      />

      {/* Concise 4-Step First-Time Onboarding */}
      {!settings.hasCompletedOnboarding && (
        <OnboardingModal
          todayIso={todayIso}
          initialSettings={settings}
          notificationPermission={permission}
          onRequestPermission={handleRequestPermission}
          onComplete={(updated) => handleUpdateSettings(updated)}
        />
      )}
    </div>
  );
}
