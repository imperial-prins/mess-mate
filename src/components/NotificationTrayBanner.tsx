import React, { useState } from 'react';
import { Bell, ChevronDown, ChevronUp, Clock, X, ArrowUpRight } from 'lucide-react';
import type { FormattedNotificationPayload, MealType } from '../types/mess';

interface NotificationCardProps {
  payload: FormattedNotificationPayload;
  defaultExpanded?: boolean;
  onOpenMeal: (mealType: MealType, targetDateIso: string) => void;
  onSnooze30m: (mealType: MealType, targetDateIso: string) => void;
  onDismiss?: () => void;
  isFloating?: boolean;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  payload,
  defaultExpanded = false,
  onOpenMeal,
  onSnooze30m,
  onDismiss,
  isFloating = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      role={isFloating ? 'status' : 'region'}
      aria-label={payload.title}
      className={`rounded-2xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#DCE1DA] dark:border-[#2C352F] ${
        isFloating ? 'shadow-2xl' : 'shadow-xs'
      } overflow-hidden`}
    >
      <div className="p-4">
        {/* Top meta line */}
        <div className="flex items-center justify-between gap-2 text-xs text-[#5A625A] dark:text-[#A4B0A6]">
          <div className="flex items-center gap-1.5 min-w-0">
            <Bell className="w-3.5 h-3.5 text-[#244C3A] dark:text-[#8BB69F] shrink-0" />
            <span className="font-semibold text-[#244C3A] dark:text-[#8BB69F]">MessMate</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{payload.channelName}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse notification' : 'Expand notification'}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] text-[#5A625A] dark:text-[#A4B0A6] transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss notification"
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] text-[#5A625A] dark:text-[#A4B0A6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title & Collapsed / Expanded Menu */}
        <button
          type="button"
          onClick={() => onOpenMeal(payload.mealType, payload.targetDateIso)}
          className="mt-1.5 w-full text-left group"
        >
          <p className="text-base font-bold text-[#242824] dark:text-[#F2F3EE] group-hover:text-[#244C3A] dark:group-hover:text-[#8BB69F] transition-colors">
            {payload.title}
          </p>
          {!expanded ? (
            <p className="mt-1 text-sm text-[#3A403A] dark:text-[#D8DDD8] leading-snug">
              {payload.collapsedSummary}
            </p>
          ) : (
            <div className="mt-2.5 space-y-3">
              <p className="text-xs font-medium text-[#5A625A] dark:text-[#A4B0A6]">
                {payload.dateHeading}
              </p>
              {payload.expandedSections.map((section) => (
                <div key={section.title}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#244C3A] dark:text-[#8BB69F]">
                    {section.title}
                  </p>
                  <ul className="mt-1 space-y-0.5 text-sm text-[#242824] dark:text-[#E8ECE8]">
                    {section.lines.map((line, i) => (
                      <li key={i}>· {line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs font-mono tabular-nums text-[#5A625A] dark:text-[#A4B0A6]">
            {payload.footerTiming}
          </p>
        </button>

        {/* Action Row: Snooze 30m + Open Meal */}
        <div className="mt-3 pt-2.5 border-t border-[#ECEEE9] dark:border-[#262F29] flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSnooze30m(payload.mealType, payload.targetDateIso)}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#244C3A]/10 dark:bg-[#8BB69F]/15 text-[#244C3A] dark:text-[#8BB69F] hover:bg-[#244C3A]/15 dark:hover:bg-[#8BB69F]/25 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Clock className="w-3.5 h-3.5" />
            Snooze 30m
          </button>
          <button
            type="button"
            onClick={() => onOpenMeal(payload.mealType, payload.targetDateIso)}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#5A625A] dark:text-[#A4B0A6] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] inline-flex items-center gap-1 transition-colors whitespace-nowrap"
          >
            Open Meal Details
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
