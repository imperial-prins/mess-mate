import React from 'react';
import { X, Pencil, Clock, Bell, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MEAL_META } from '../data/initialMenuData';
import type {
  DayMenu,
  DishOverride,
  MealOperationalStatus,
  MealType,
  ResolvedFoodItem,
  TimingScheduleMode,
} from '../types/mess';
import {
  formatReadableDate,
  getMealWindowMinutes,
  resolveMealCategories,
} from '../utils/cycleCalculator';

interface MealDetailDrawerProps {
  mealType: MealType | null;
  targetDateIso: string | null;
  dayMenu: DayMenu | null;
  status: MealOperationalStatus | null;
  scheduleMode: TimingScheduleMode;
  dishOverrides: Record<string, DishOverride>;
  onClose: () => void;
  onEditDish: (item: ResolvedFoodItem) => void;
  onTestNotification: (mealType: MealType, targetDateIso: string) => void;
}

export const MealDetailDrawer: React.FC<MealDetailDrawerProps> = ({
  mealType,
  targetDateIso,
  dayMenu,
  status,
  scheduleMode,
  dishOverrides,
  onClose,
  onEditDish,
  onTestNotification,
}) => {
  if (!mealType || !targetDateIso || !dayMenu) return null;

  const meta = MEAL_META[mealType];
  const window = getMealWindowMinutes(mealType, targetDateIso, scheduleMode);
  const categories = resolveMealCategories(dayMenu, mealType, targetDateIso, dishOverrides);

  const statusText =
    status === 'OPEN_NOW'
      ? 'Open now'
      : status === 'SERVED'
      ? 'Served'
      : status === 'CLOSED'
      ? 'Mess closed'
      : 'Upcoming';

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meal-detail-heading"
    >
      <div className="w-full sm:max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[#FAF9F6] dark:bg-[#121613] border border-[#E4E7E2] dark:border-[#2C352F] shadow-2xl overflow-hidden">
        <div className="sm:hidden w-10 h-1.5 bg-[#D4D9D3] dark:bg-[#3A453E] rounded-full mx-auto mt-3 shrink-0" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 bg-[#FFFFFF] dark:bg-[#1A201C] border-b border-[#ECEEE9] dark:border-[#262F29] flex items-start justify-between gap-4 shrink-0">
          <div>
            <p className="text-xs font-medium text-[#5A625A] dark:text-[#A4B0A6]">
              {formatReadableDate(targetDateIso)} · {dayMenu.pdfColumnName} · {statusText}
            </p>
            <h2
              id="meal-detail-heading"
              className="mt-1 text-2xl sm:text-3xl font-semibold text-[#242824] dark:text-[#F2F3EE]"
            >
              {meta.title}
            </h2>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-mono tabular-nums text-[#244C3A] dark:text-[#8BB69F] font-medium">
              <Clock className="w-4 h-4 shrink-0" />
              {window.timingDisplay}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close meal details"
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-xl text-[#5A625A] dark:text-[#A4B0A6] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Complete Categorized Menu */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {categories.map((group) => (
            <section key={group.sectionTitle} aria-label={group.sectionTitle}>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-[#244C3A] dark:text-[#8BB69F] mb-2.5">
                {group.sectionTitle}
              </h3>

              <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#E4E7E2] dark:border-[#2C352F] divide-y divide-[#ECEEE9] dark:divide-[#262F29]">
                {group.items.map((item) => (
                  <div
                    key={item.itemId}
                    className="px-4 py-3.5 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#5A625A] dark:text-[#A4B0A6]">
                        {item.subCategory}
                        {item.seasonalNote ? ` · ${item.seasonalNote}` : ''}
                      </p>
                      <p
                        className={`mt-0.5 text-base leading-snug ${
                          item.isPrimaryDish
                            ? 'font-semibold text-[#242824] dark:text-[#F2F3EE]'
                            : 'font-medium text-[#3A403A] dark:text-[#D8DDD8]'
                        }`}
                      >
                        {item.dishName}
                      </p>
                      {item.accompaniment && (
                        <p className="mt-0.5 text-sm text-[#5A625A] dark:text-[#A4B0A6]">
                          Served with {item.accompaniment}
                        </p>
                      )}
                      {(item.needsVerification || item.isEditedByUser || item.isUserVerified) && (
                        <div className="mt-1.5 flex items-center gap-2 text-xs">
                          {item.needsVerification && (
                            <span className="inline-flex items-center gap-1 font-medium text-[#8C5F12] dark:text-[#E8B86D]">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Unverified PDF variant
                            </span>
                          )}
                          {item.isEditedByUser && (
                            <span className="inline-flex items-center gap-1 font-medium text-[#244C3A] dark:text-[#8BB69F]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Edited by you
                            </span>
                          )}
                          {!item.isEditedByUser && item.isUserVerified && (
                            <span className="inline-flex items-center gap-1 font-medium text-[#244C3A] dark:text-[#8BB69F]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Verified
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onEditDish(item)}
                      aria-label={`Fix dish ${item.dishName}`}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-[#244C3A] dark:text-[#8BB69F] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] inline-flex items-center gap-1.5 shrink-0 transition-colors whitespace-nowrap"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Fix Dish
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer action */}
        <div className="px-6 py-4 bg-[#FFFFFF] dark:bg-[#1A201C] border-t border-[#ECEEE9] dark:border-[#262F29] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onTestNotification(mealType, targetDateIso)}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#244C3A] dark:text-[#8BB69F] border border-[#C9D4C9] dark:border-[#324037] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] inline-flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Bell className="w-4 h-4" />
            Preview Alert
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold bg-[#244C3A] text-white hover:bg-[#1C3D2E] dark:bg-[#8BB69F] dark:text-[#121613] transition-colors whitespace-nowrap"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
