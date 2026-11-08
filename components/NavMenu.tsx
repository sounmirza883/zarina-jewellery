'use client';

import { useEffect, useId, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface NavMenuProps {
  /** Accessible name of the button that opens the menu. */
  label: string;
  /** Trigger content: text or an icon. */
  trigger: ReactNode;
  /** Classes for the trigger (the link when `href` is set, otherwise the button). */
  triggerClassName?: string;
  /** When set, the trigger is a link (still navigates) and a small chevron button toggles the menu. */
  href?: string;
  /** Which edge of the trigger the menu lines up with. */
  align?: 'left' | 'right';
  /** The menu content. Call `close` after a choice that does not change the page. */
  children: (close: () => void) => ReactNode;
}

const CLOSE_DELAY_MS = 150;

/**
 * Small hover menu for the desktop header. It opens on hover and on keyboard focus, toggles when the
 * trigger/chevron is clicked (touch), and closes on Escape, an outside click or a page change.
 */
export default function NavMenu({
  label,
  trigger,
  triggerClassName = '',
  href,
  align = 'left',
  children,
}: NavMenuProps) {
  const pathname = usePathname();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True while the menu was opened by hover or focus, so the click that follows does not close it again.
  const autoOpened = useRef(false);

  // The menu is open for one page only: when the path changes it closes without needing an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  const clearTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openNow = () => {
    clearTimer();
    if (!open) autoOpened.current = true;
    setOpenOn(pathname);
  };

  const closeNow = () => {
    clearTimer();
    autoOpened.current = false;
    setOpenOn(null);
  };

  // Handed to the menu content (state only, so it is safe to pass while rendering).
  const closeFromChild = () => setOpenOn(null);

  const closeSoon = () => {
    clearTimer();
    closeTimer.current = setTimeout(closeNow, CLOSE_DELAY_MS);
  };

  const handleToggle = () => {
    clearTimer();
    if (autoOpened.current) {
      // Opened by hover or focus a moment ago: keep it open and pin it.
      autoOpened.current = false;
      return;
    }
    setOpenOn(open ? null : pathname);
  };

  // After Escape the focus goes back to the trigger; that focus must not open the menu again.
  const ignoreFocusOpen = useRef(false);

  const handleFocus = () => {
    if (ignoreFocusOpen.current) return;
    openNow();
  };

  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!rootRef.current?.contains(e.relatedTarget as Node | null)) closeSoon();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closeNow();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeNow();
        ignoreFocusOpen.current = true;
        buttonRef.current?.focus(); // the focus event fires synchronously, so the flag can be cleared right after
        ignoreFocusOpen.current = false;
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
    // closeNow only touches refs and the stable state setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => clearTimer, []);

  const buttonProps = {
    ref: buttonRef,
    type: 'button' as const,
    'aria-label': label,
    'aria-expanded': open,
    'aria-haspopup': 'true' as const,
    'aria-controls': open ? menuId : undefined,
    onClick: handleToggle,
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {href ? (
        <div className="flex items-center gap-0.5">
          <Link href={href} className={triggerClassName}>
            {trigger}
          </Link>
          <button
            {...buttonProps}
            className="p-1 text-[#575757] hover:text-[#B8893B] focus-visible:outline-2 focus-visible:outline-[#B8893B] rounded-sm transition-colors"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
      ) : (
        <button
          {...buttonProps}
          className={`${triggerClassName} focus-visible:outline-2 focus-visible:outline-[#B8893B] rounded-sm`}
        >
          {trigger}
        </button>
      )}

      {open && (
        // The padding-top wrapper keeps the pointer inside the menu while it crosses the gap.
        <div
          id={menuId}
          className={`absolute top-full z-50 pt-2 ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          <div className="min-w-52 rounded-lg border border-[#E8DDD0] bg-white py-1.5 shadow-lg">
            {children(closeFromChild)}
          </div>
        </div>
      )}
    </div>
  );
}
