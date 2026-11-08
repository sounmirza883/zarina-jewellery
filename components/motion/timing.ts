// Plain values (no 'use client') so server components can use them too.
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Grid cards reveal in columns: 0, 60, 120, 180 ms, so a long grid never waits. */
export const columnDelay = (index: number, columns = 4) => (index % columns) * 0.06;
