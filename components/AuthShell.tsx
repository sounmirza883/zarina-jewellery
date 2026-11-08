import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

// Shared card layout and field styles for the login, signup, reset and account pages.

export const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5';
export const inputClass =
  'w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] placeholder-[#8A8A8A] focus:outline-hidden focus:border-[#B8893B]';
export const primaryButtonClass =
  'w-full py-3.5 px-4 bg-[#0B0D12] hover:bg-[#B8893B] disabled:bg-[#8A8A8A] text-white text-xs uppercase tracking-widest font-semibold rounded-md transition-colors cursor-pointer';

export function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="p-3 rounded-lg border border-[#991B1B]/30 bg-rose-50 text-xs text-[#991B1B] flex items-start gap-2"
    >
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  wide = false,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  wide?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="py-12 sm:py-20">
      <div className={`${wide ? 'max-w-2xl' : 'max-w-md'} mx-auto px-4 sm:px-6`}>
        <div className="mb-8 text-center">
          <span className="text-xs uppercase tracking-[0.25em] text-[#B8893B] font-semibold block mb-1">
            {eyebrow}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0B0D12] font-normal">{title}</h1>
          {subtitle && <p className="mt-2 text-xs sm:text-sm text-[#575757]">{subtitle}</p>}
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#B8893B]/20 shadow-xs">{children}</div>
        {footer && <div className="mt-6 text-center text-xs text-[#575757]">{footer}</div>}
      </div>
    </div>
  );
}
