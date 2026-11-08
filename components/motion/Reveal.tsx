'use client';

import { m } from 'motion/react';

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Grid cards reveal in columns: 0, 60, 120, 180 ms, so a long grid never waits. */
export const columnDelay = (index: number, columns = 4) => (index % columns) * 0.06;

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds. */
  delay?: number;
  /** Start this many pixels lower. */
  y?: number;
}

/**
 * Fades and rises once when it scrolls into view. It starts hidden, so use it below the fold only
 * (the hero uses CSS animation instead). The <noscript> rule in app/layout.tsx shows it without JavaScript.
 */
export default function Reveal({ children, className, delay = 0, y = 16 }: RevealProps) {
  return (
    <m.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: EASE_OUT }}
    >
      {children}
    </m.div>
  );
}
