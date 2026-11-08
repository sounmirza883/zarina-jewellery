'use client';

import { LazyMotion, MotionConfig } from 'motion/react';

const loadFeatures = () => import('./features').then((mod) => mod.default);

/**
 * Wraps the site once. `m` components (Reveal, drawers, toast) get their animation code on demand, and
 * visitors who ask their device for less motion get no movement (fades only).
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures}>{children}</LazyMotion>
    </MotionConfig>
  );
}
