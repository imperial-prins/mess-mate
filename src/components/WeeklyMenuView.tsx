import React, { useMemo, useState } from 'react';
import { CalendarCheck, Clock, Pencil, ArrowUpRight } from 'lucide-react';
import { MEAL_META, MEAL_ORDER } from '../data/initialMenuData';
import type {
  DishOverride,
  MealType,
  ResolvedFoodItem,
  UserSettings,
} from '../types/mess';
import {
  formatReadableDate,
  formatShortCalendarDate,
  getCurrentCycleDates,
  getMealWindowMinutes,
  resolveMealCategories,
} from '../utils/cycleCalculator';

interface WeeklyMenuViewProps {
  todayIso: string;
  settings: UserSettings;
  dishOverrides: Record<string, DishOverride>;
  onOpenMealDetail: (mealType: MealType, targetDateIso: string) => void;
  onEditDish: (item: ResolvedFoodItem) => void;
}

export const WeeklyMenuView: React.FC<WeeklyMenuViewProps> = ({
  todayIso,
  settings,
  dishOverrides,
  onOpenMealDetail,
  onEditDish,
}) => {
  const cycleDays = useMemo(
    () => getCurrentCycleDates(todayIso, settings),
    [todayIso, settings]
  );

  const todayEntry = cycleDays.find((d) => d.isToday) ?? cycleDays[0];
  const [selectedWeek, setSelectedWeek] = useState<1 | 2>(todayEntry.dayMenu.weekNumber);
  const [selectedDateIso, setSelectedDateIso] = useState<string>(todayEntry.dateIso);

  const weekDays = useMemo(
    () => cycleDays.filter((d) => d.dayMenu.weekNumber === selectedWeek),
    [cycleDays, selectedWeek]
  );

  const selectedEntry =
    cycleDays.find((d) => d.dateIso === selectedDateIso) ?? weekDays[0] ?? todayEntry;

  const isViewingToday = selectedEntry.dateIso === todayIso;

  const handleSelectWeek = (week: 1 | 2) => {
    setSelectedWeek(week);
    const matchingWeekday = cycleDays.find(
      (d) =>
        d.dayMenu.weekNumber === week &&
        d.dayMenu.dayOfWeekIndex === selectedEntry.dayMenu.dayOfWeekIndex
    );
    if (matchingWeekday) {
      setSelectedDateIso(matchingWeekday.dateIso);
    }
  };

  const handleBackToToday = () => {
    setSelectedWeek(todayEntry.dayMenu.weekNumber);
    setSelectedDateIso(todayEntry.dateIso);
  };

  return (
    <div className="space-y-6">
      {/* Header & Week 1 / Week 2 Segmented Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#5A625A] dark:text-[#A4B0A6]">
            14-Day Rotating Hostel Timetable
          </p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-semibold text-[#242824] dark:text-[#F2F3EE]">
            Weekly Menu
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isViewingToday && (
            <button
              type="button"
              onClick={handleBackToToday}
              className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-[#244C3A] dark:text-[#8BB69F] border border-[#C9D4C9] dark:border-[#324037] hover:bg-[#FFFFFF] dark:hover:bg-[#1A201C] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <CalendarCheck className="w-4 h-4" />
              Back to Today
            </button>
          )}

          <div
            role="tablist"
            aria-label="Menu cycle week"
            className="inline-flex items-center p-1 rounded-xl bg-[#EFEFE9] dark:bg-[#1A201C] border border-[#E4E7E2] dark:border-[#2C352F]"
          >
            {([1, 2] as const).map((week) => (
              <button
                key={week}
                type="button"
                role="tab"
                aria-selected={selectedWeek === week}
                onClick={() => handleSelectWeek(week)}
                className={`min-h-[40px] px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  selectedWeek === week
                    ? 'bg-[#FFFFFF] dark:bg-[#244C3A] text-[#244C3A] dark:text-[#F2F3EE] shadow-xs'
                    : 'text-[#5A625A] dark:text-[#A4B0A6] hover:text-[#242824] dark:hover:text-[#F2F3EE]'
                }`}
              >
                Week {week}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal 7-Day Calendar Selector */}
      <div
        role="group"
        aria-label={`Week ${selectedWeek} days`}
        className="grid grid-cols-7 gap-2 overflow-x-auto pb-1"
      >
        {weekDays.map((entry) => {
          const isSelected = entry.dateIso === selectedEntry.dateIso;
          const short = formatShortCalendarDate(entry.dateIso);

          return (
            <button
              key={entry.dateIso}
              type="button"
              onClick={() => setSelectedDateIso(entry.dateIso)}
              aria-pressed={isSelected}
              className={`min-h-[76px] min-w-[68px] px-2 py-2.5 rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isSelected
                  ? 'bg-[#244C3A] text-white border-[#244C3A] dark:bg-[#8BB69F] dark:text-[#121613] dark:border-[#8BB69F]'
                  : entry.isToday
                  ? 'bg-[#FFFFFF] dark:bg-[#1A201C] text-[#244C3A] dark:text-[#8BB69F] border-[#244C3A]/60 dark:border-[#8BB69F]/60'
                  : 'bg-[#FFFFFF] dark:bg-[#1A201C] text-[#242824] dark:text-[#F2F3EE] border-[#E4E7E2] dark:border-[#2C352F] hover:border-[#A5B9A5]'
              }`}
            >
              <span className="text-[11px] font-medium opacity-80">{short.weekdayShort}</span>
              <span className="text-lg font-bold font-mono tabular-nums leading-tight">
                {short.dayNum}
              </span>
              <span className="text-[10px] font-medium opacity-80">
                {entry.isToday ? 'Today' : short.monthShort}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Day Context Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-[#E4E7E2] dark:border-[#2C352F]">
        <div>
          <h2 className="text-2xl font-semibold text-[#242824] dark:text-[#F2F3EE]">
            {formatReadableDate(selectedEntry.dateIso)}
          </h2>
          <p className="text-sm text-[#5A625A] dark:text-[#A4B0A6]">
            {selectedEntry.dayMenu.pdfColumnName} · Day {selectedEntry.cycleDayIndex} of 14
            {selectedEntry.isToday ? ' · Today' : ''}
          </p>
        </div>
      </div>

      {/* 4 Meals Grid for Selected Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MEAL_ORDER.map((mealType) => {
          const window = getMealWindowMinutes(
            mealType,
            selectedEntry.dateIso,
            settings.timingScheduleMode
          );
          const categories = resolveMealCategories(
            selectedEntry.dayMenu,
            mealType,
            selectedEntry.dateIso,
            dishOverrides
          );

          return (
            <section
              key={mealType}
              aria-label={`${MEAL_META[mealType].title} menu`}
              className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#DCE1DA] dark:border-[#2C352F] p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#ECEEE9] dark:border-[#262F29]">
                  <div>
                    <h3 className="text-xl font-semibold text-[#242824] dark:text-[#F2F3EE]">
                      {MEAL_META[mealType].title}
                    </h3>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-mono tabular-nums text-[#5A625A] dark:text-[#A4B0A6]">
                      <Clock className="w-3.5 h-3.5" />
                      {window.timingDisplay}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenMealDetail(mealType, selectedEntry.dateIso)}
                    aria-label={`Open ${MEAL_META[mealType].title} details`}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold text-[#244C3A] dark:text-[#8BB69F] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    Details
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {categories.map((cat) => (
                    <div key={cat.sectionTitle}>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#244C3A] dark:text-[#8BB69F]">
                        {cat.sectionTitle}
                      </p>
                      <ul className="mt-1.5 space-y-1.5">
                        {cat.items.map((item) => (
                          <li
                            key={item.itemId}
                            className="flex items-start justify-between gap-2 text-sm leading-snug"
                          >
                            <div className="min-w-0">
                              <span
                                className={
                                  item.isPrimaryDish
                                    ? 'font-semibold text-[#242824] dark:text-[#F2F3EE]'
                                    : 'text-[#4A524A] dark:text-[#C5CDC6]'
                                }
                              >
                                {item.dishName}
                              </span>
                              {item.accompaniment && (
                                <span className="text-xs text-[#5A625A] dark:text-[#A4B0A6]">
                                  {' '}
                                  · with {item.accompaniment}
                                </span>
                              )}
                              {item.needsVerification && (
                                <span className="ml-1.5 text-xs font-medium text-[#8C5F12] dark:text-[#E8B86D]">
                                  (Unverified)
                                </span>
                              )}
                              {item.isEditedByUser && (
                                <span className="ml-1.5 text-xs font-medium text-[#244C3A] dark:text-[#8BB69F]">
                                  (Edited)
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => onEditDish(item)}
                              aria-label={`Fix dish ${item.dishName}`}
                              className="min-h-[32px] min-w-[32px] -mt-0.5 flex items-center justify-center rounded-lg text-[#737B73] dark:text-[#849086] hover:text-[#244C3A] dark:hover:text-[#8BB69F] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] shrink-0"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
