import React from 'react';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { MEAL_META, MEAL_ORDER } from '../data/initialMenuData';
import type {
  DayMenu,
  DishOverride,
  MealType,
  TimingScheduleMode,
  UpcomingMealState,
  WidgetSize,
} from '../types/mess';
import {
  formatReadableDate,
  getHeroDishesForMeal,
  getMealStatusForDate,
  getMealWindowMinutes,
} from '../utils/cycleCalculator';

interface HomeScreenWidgetProps {
  todayIso: string;
  now: Date;
  todayMenu: DayMenu;
  tomorrowMenu: DayMenu;
  upcomingMeal: UpcomingMealState;
  scheduleMode: TimingScheduleMode;
  dishOverrides: Record<string, DishOverride>;
  size: WidgetSize;
  onSizeChange?: (size: WidgetSize) => void;
  widgetTheme?: 'light' | 'dark';
  lastUpdatedText: string;
  onRefresh: () => void;
  onOpenMealDetail: (mealType: MealType, targetDateIso: string) => void;
  showSizeControls?: boolean;
}

export const HomeScreenWidget: React.FC<HomeScreenWidgetProps> = ({
  todayIso,
  now,
  todayMenu,
  tomorrowMenu,
  upcomingMeal,
  scheduleMode,
  dishOverrides,
  size,
  onSizeChange,
  widgetTheme,
  lastUpdatedText,
  onRefresh,
  onOpenMealDetail,
  showSizeControls = true,
}) => {
  const heroMenu = upcomingMeal.isToday ? todayMenu : tomorrowMenu;
  const heroDishes = getHeroDishesForMeal(
    heroMenu,
    upcomingMeal.mealType,
    upcomingMeal.targetDateIso,
    dishOverrides,
    4
  );

  const statusLabel =
    upcomingMeal.status === 'OPEN_NOW'
      ? 'Open now'
      : upcomingMeal.status === 'CLOSED'
      ? 'Closed · Tomorrow'
      : 'Next meal';

  const forceDark = widgetTheme === 'dark';
  const forceLight = widgetTheme === 'light';

  const surfaceClass = forceDark
    ? 'bg-[#1A201C] text-[#F2F3EE] border-[#2C352F]'
    : forceLight
    ? 'bg-[#FAF9F6] text-[#242824] border-[#DCE1DA]'
    : 'bg-[#FAF9F6] dark:bg-[#1A201C] text-[#242824] dark:text-[#F2F3EE] border-[#DCE1DA] dark:border-[#2C352F]';

  const innerCardClass = forceDark
    ? 'bg-[#232B26] border-[#313C35]'
    : forceLight
    ? 'bg-[#FFFFFF] border-[#E6EAE4]'
    : 'bg-[#FFFFFF] dark:bg-[#232B26] border-[#E6EAE4] dark:border-[#313C35]';

  const accentTextClass = forceDark
    ? 'text-[#8BB69F]'
    : forceLight
    ? 'text-[#244C3A]'
    : 'text-[#244C3A] dark:text-[#8BB69F]';

  const mutedTextClass = forceDark
    ? 'text-[#A4B0A6]'
    : forceLight
    ? 'text-[#5A625A]'
    : 'text-[#5A625A] dark:text-[#A4B0A6]';

  const dividerClass = forceDark
    ? 'divide-[#2C352F]'
    : forceLight
    ? 'divide-[#E6EAE4]'
    : 'divide-[#E6EAE4] dark:divide-[#2C352F]';

  const widthConstraint =
    size === '2x2' ? 'max-w-[260px]' : size === '4x2' ? 'max-w-[440px]' : 'max-w-[440px]';

  return (
    <div className="space-y-3">
      {showSizeControls && onSizeChange && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            role="group"
            aria-label="Home screen widget size"
            className="inline-flex items-center p-1 rounded-xl bg-[#EFEFE9] dark:bg-[#1A201C] border border-[#E4E7E2] dark:border-[#2C352F]"
          >
            {(['2x2', '4x2', '4x4'] as WidgetSize[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSizeChange(s)}
                aria-pressed={size === s}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold font-mono tabular-nums transition-colors whitespace-nowrap ${
                  size === s
                    ? 'bg-[#FFFFFF] dark:bg-[#244C3A] text-[#244C3A] dark:text-[#F2F3EE] shadow-xs'
                    : 'text-[#5A625A] dark:text-[#A4B0A6] hover:text-[#242824] dark:hover:text-[#F2F3EE]'
                }`}
              >
                {s.replace('x', '×')}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh home screen widget"
            className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium text-[#5A625A] dark:text-[#A4B0A6] hover:bg-[#EFEFE9] dark:hover:bg-[#232B26] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      )}

      {/* Widget Shell */}
      <div
        data-testid={`widget-shell-${size}`}
        className={`w-full ${widthConstraint} rounded-3xl border shadow-md p-4 transition-all ${surfaceClass}`}
      >
        {/* Widget Header */}
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-current/10">
          <div className="min-w-0">
            <p className={`text-[11px] font-semibold tracking-wider uppercase ${accentTextClass}`}>
              MessMate
            </p>
            <p className="text-xs font-semibold truncate">{formatReadableDate(todayIso)}</p>
          </div>
          <span className={`text-[11px] font-mono tabular-nums shrink-0 ${mutedTextClass}`}>
            {size === '2x2' ? todayMenu.pdfColumnName : `Updated ${lastUpdatedText}`}
          </span>
        </div>

        {/* 2x2: Next meal + top 4 important dishes */}
        {size === '2x2' && (
          <button
            type="button"
            onClick={() => onOpenMealDetail(upcomingMeal.mealType, upcomingMeal.targetDateIso)}
            className={`mt-3 w-full text-left rounded-2xl border p-3.5 transition-colors hover:border-[#244C3A] dark:hover:border-[#8BB69F] ${innerCardClass}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] font-semibold uppercase tracking-wide ${accentTextClass}`}>
                {statusLabel}
              </span>
              <span className={`text-[11px] font-mono tabular-nums ${mutedTextClass}`}>
                {upcomingMeal.startTimeFormatted}
              </span>
            </div>
            <p className="mt-1 text-base font-bold font-display">
              {MEAL_META[upcomingMeal.mealType].title}
            </p>
            <ul className="mt-2 space-y-1 text-xs leading-snug">
              {heroDishes.map((dish) => (
                <li key={dish.itemId} className="truncate font-medium">
                  · {dish.dishName}
                </li>
              ))}
            </ul>
            <p className={`mt-2.5 text-[11px] font-mono tabular-nums ${mutedTextClass}`}>
              {upcomingMeal.countdownText}
            </p>
          </button>
        )}

        {/* 4x2: Next meal prominently + other meals summarized */}
        {size === '4x2' && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-3">
            <button
              type="button"
              onClick={() => onOpenMealDetail(upcomingMeal.mealType, upcomingMeal.targetDateIso)}
              className={`sm:col-span-6 text-left rounded-2xl border p-3 transition-colors hover:border-[#244C3A] dark:hover:border-[#8BB69F] ${innerCardClass}`}
            >
              <p className={`text-[11px] font-semibold uppercase tracking-wide ${accentTextClass}`}>
                {statusLabel} · {upcomingMeal.startTimeFormatted}
              </p>
              <p className="mt-0.5 text-base font-bold font-display">
                {MEAL_META[upcomingMeal.mealType].title}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed font-medium">
                {heroDishes.map((d) => d.dishName).join(', ')}
              </p>
              <p className={`mt-2 text-[11px] font-mono tabular-nums ${mutedTextClass}`}>
                {upcomingMeal.countdownText}
              </p>
            </button>

            <div className={`sm:col-span-6 rounded-2xl border divide-y ${innerCardClass} ${dividerClass}`}>
              {MEAL_ORDER.filter((m) => !(upcomingMeal.isToday && m === upcomingMeal.mealType)).map(
                (mealType) => {
                  const status = getMealStatusForDate(mealType, todayIso, now, scheduleMode);
                  const isServed = status === 'SERVED';
                  const summary = getHeroDishesForMeal(
                    todayMenu,
                    mealType,
                    todayIso,
                    dishOverrides,
                    2
                  )
                    .map((d) => d.dishName)
                    .join(', ');

                  return (
                    <button
                      key={mealType}
                      type="button"
                      onClick={() => onOpenMealDetail(mealType, todayIso)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04] ${
                        isServed ? 'opacity-55' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold">
                          {MEAL_META[mealType].shortTitle}
                          {isServed ? ' · Served' : ''}
                        </p>
                        <p className={`text-xs truncate ${mutedTextClass}`}>{summary}</p>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${mutedTextClass}`} />
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* 4x4: All four meals with important food items & subtle separators */}
        {size === '4x4' && (
          <div className={`mt-3 rounded-2xl border divide-y ${innerCardClass} ${dividerClass}`}>
            {MEAL_ORDER.map((mealType) => {
              const status = getMealStatusForDate(mealType, todayIso, now, scheduleMode);
              const isServed = status === 'SERVED';
              const isNext = upcomingMeal.isToday && upcomingMeal.mealType === mealType;
              const window = getMealWindowMinutes(mealType, todayIso, scheduleMode);
              const dishes = getHeroDishesForMeal(
                todayMenu,
                mealType,
                todayIso,
                dishOverrides,
                4
              );

              return (
                <button
                  key={mealType}
                  type="button"
                  onClick={() => onOpenMealDetail(mealType, todayIso)}
                  className={`w-full text-left px-3.5 py-2.5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04] ${
                    isServed ? 'opacity-55' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold ${
                        isNext ? accentTextClass : ''
                      }`}
                    >
                      {MEAL_META[mealType].title}
                      {isNext ? ` · ${statusLabel}` : isServed ? ' · Served' : ''}
                    </span>
                    <span className={`text-[11px] font-mono tabular-nums ${mutedTextClass}`}>
                      {window.timingDisplay.split('–')[0].trim()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-snug font-medium">
                    {dishes.map((d) => d.dishName).join(' · ')}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div className={`mt-2.5 flex items-center justify-between text-[11px] ${mutedTextClass}`}>
          <span>{todayMenu.pdfColumnName} · Week {todayMenu.weekNumber}</span>
          <span>Tap any meal to inspect</span>
        </div>
      </div>
    </div>
  );
};
