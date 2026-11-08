'use client';

import { m } from 'motion/react';
import { EASE_OUT } from './timing';

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
