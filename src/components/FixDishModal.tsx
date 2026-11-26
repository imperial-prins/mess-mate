import React, { useEffect, useState } from 'react';
import { RotateCcw, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { DishOverride, ResolvedFoodItem } from '../types/mess';

interface FixDishModalProps {
  item: ResolvedFoodItem | null;
  onClose: () => void;
  onSave: (itemId: string, override: DishOverride) => void;
  onRestoreOriginal: (itemId: string) => void;
}

export const FixDishModal: React.FC<FixDishModalProps> = ({
  item,
  onClose,
  onSave,
  onRestoreOriginal,
}) => {
  const [dishName, setDishName] = useState('');
  const [accompaniment, setAccompaniment] = useState('');
  const [isVerified, setIsVerified] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setDishName(item.dishName);
    setAccompaniment(item.accompaniment ?? '');
    setIsVerified(item.isUserVerified || !item.needsVerification);
    setError(null);
  }, [item]);

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDish = dishName.trim();
    if (!trimmedDish) {
      setError('Please enter a dish name before saving.');
      return;
    }

    onSave(item.itemId, {
      customDishName: trimmedDish,
      customAccompaniment: accompaniment.trim(),
      isUserVerified: isVerified,
      updatedAtIso: new Date().toISOString(),
    });
    onClose();
  };

  const handleRestore = () => {
    onRestoreOriginal(item.itemId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fix-dish-title"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-[#FFFFFF] dark:bg-[#1A201C] border border-[#E4E7E2] dark:border-[#2C352F] shadow-2xl overflow-hidden">
        <div className="sm:hidden w-10 h-1.5 bg-[#D4D9D3] dark:bg-[#3A453E] rounded-full mx-auto mt-3" />

        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-[#ECEEE9] dark:border-[#262F29]">
          <div>
            <p className="text-xs font-medium text-[#5A625A] dark:text-[#A4B0A6]">
              {item.subCategory}
            </p>
            <h2
              id="fix-dish-title"
              className="mt-0.5 text-xl font-semibold text-[#242824] dark:text-[#F2F3EE]"
            >
              Fix Dish Entry
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Fix Dish dialog"
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-xl text-[#5A625A] dark:text-[#A4B0A6] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {item.needsVerification && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#E8B86D]/15 dark:bg-[#E8B86D]/10 text-[#6F4C12] dark:text-[#F0CB8B] text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                This dish comes from a seasonal lookup or slash variant in the PDF. Confirm or edit
                the exact dish served in your hostel mess.
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="fix-dish-name"
              className="block text-sm font-medium text-[#242824] dark:text-[#F2F3EE] mb-1.5"
            >
              Dish Name
            </label>
            <input
              id="fix-dish-name"
              type="text"
              value={dishName}
              onChange={(e) => {
                setDishName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter dish name"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#121613] border border-[#D7DDD6] dark:border-[#323D36] text-[#242824] dark:text-[#F2F3EE] text-base focus:outline-none focus:ring-2 focus:ring-[#244C3A] dark:focus:ring-[#8BB69F]"
            />
            {error && (
              <p role="alert" className="mt-1.5 text-sm text-[#A63A2B] dark:text-[#F28B7D]">
                {error}
              </p>
            )}
            <p className="mt-1.5 text-xs text-[#5A625A] dark:text-[#A4B0A6]">
              Extracted from PDF: <span className="font-medium">{item.originalDishName}</span>
            </p>
          </div>

          <div>
            <label
              htmlFor="fix-dish-accompaniment"
              className="block text-sm font-medium text-[#242824] dark:text-[#F2F3EE] mb-1.5"
            >
              Accompaniment (Optional)
            </label>
            <input
              id="fix-dish-accompaniment"
              type="text"
              value={accompaniment}
              onChange={(e) => setAccompaniment(e.target.value)}
              placeholder="e.g., Sambhar, Coconut Chutney, Packed Curd"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#121613] border border-[#D7DDD6] dark:border-[#323D36] text-[#242824] dark:text-[#F2F3EE] text-base focus:outline-none focus:ring-2 focus:ring-[#244C3A] dark:focus:ring-[#8BB69F]"
            />
            {item.originalAccompaniment && (
              <p className="mt-1.5 text-xs text-[#5A625A] dark:text-[#A4B0A6]">
                Original accompaniment:{' '}
                <span className="font-medium">{item.originalAccompaniment}</span>
              </p>
            )}
          </div>

          <label className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-[#ECEEE9] dark:border-[#262F29] cursor-pointer min-h-[48px]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#244C3A] dark:text-[#8BB69F] shrink-0" />
              <span className="text-sm font-medium text-[#242824] dark:text-[#F2F3EE]">
                Mark this dish as verified
              </span>
            </div>
            <input
              type="checkbox"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="w-5 h-5 accent-[#244C3A] rounded"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleRestore}
              disabled={!item.isEditedByUser && !item.isUserVerified}
              className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#5A625A] dark:text-[#A4B0A6] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              Restore Original
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#242824] dark:text-[#F2F3EE] border border-[#D7DDD6] dark:border-[#323D36] hover:bg-[#FAF9F6] dark:hover:bg-[#232B26] transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold bg-[#244C3A] text-white hover:bg-[#1C3D2E] dark:bg-[#8BB69F] dark:text-[#121613] dark:hover:bg-[#A1C6B2] transition-colors whitespace-nowrap"
              >
                Save Dish
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
