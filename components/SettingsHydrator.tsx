'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store/cart';

/** Hands the admin-controlled shipping rules (read on the server) to the client cart totals. */
export default function SettingsHydrator({
  flatRate,
  freeShippingThreshold,
}: {
  flatRate: number;
  freeShippingThreshold: number;
}) {
  const setShipping = useCartStore((s) => s.setShipping);

  useEffect(() => {
    setShipping(flatRate, freeShippingThreshold);
  }, [setShipping, flatRate, freeShippingThreshold]);

  return null;
}
