'use client';

import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useCartStore } from '@/store/cart';

export default function ToastNotification() {
  const { toastMessage, clearToast } = useCartStore();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        clearToast();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, clearToast]);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-20 left-4 sm:left-6 z-50 max-w-sm w-full animate-bounce-in">
      <div className="bg-[#0B0D12] text-white p-3.5 rounded-lg shadow-2xl border border-[#B8893B]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <CheckCircle2 className="w-5 h-5 text-[#D9B66A] shrink-0" />
          <p className="text-xs text-[#FAF7F2] font-medium truncate">
            {toastMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={clearToast}
          className="text-[#8A8A8A] hover:text-white p-1 rounded-sm"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
