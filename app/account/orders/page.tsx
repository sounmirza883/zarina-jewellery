'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell, { FormError } from '@/components/AuthShell';
import AccountNav from '@/components/AccountNav';
import OrderPdfButton from '@/components/OrderPdfButton';
import { NOT_CONFIGURED, fetchMyOrders, getCurrentUser } from '@/lib/account';
import { lineUnitPrice } from '@/lib/pricing';
import { formatPKR } from '@/lib/shop-logic';
import { supabaseConfigured } from '@/lib/supabase/config';
import type { Order, OrderStatus } from '@/types/product';

const statusStyle: Record<OrderStatus, string> = {
  'Pending Phone Confirmation': 'bg-amber-50 text-amber-800 border-amber-200',
  Confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
  Dispatched: 'bg-purple-50 text-purple-800 border-purple-200',
  Delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
};

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        if (!(await getCurrentUser())) {
          router.replace('/login?next=/account/orders');
          return;
        }
        const list = await fetchMyOrders();
        if (!cancelled) setOrders(list);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load your orders.');
          setOrders([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <AuthShell eyebrow="My Account" title="My Orders" wide>
      {!supabaseConfigured ? (
        <FormError message={NOT_CONFIGURED} />
      ) : orders === null ? (
        <p className="text-center text-xs text-[#575757]">Loading your orders…</p>
      ) : (
        <>
          <AccountNav />
          {error && <FormError message={error} />}

          {orders.length === 0 && !error ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-[#575757]">You have not placed any orders with this account yet.</p>
              <Link
                href="/shop"
                className="inline-flex px-6 py-2.5 bg-[#0B0D12] text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#B8893B] transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {orders.map((order) => (
                <li key={order.orderNumber} className="rounded-xl border border-[#E8DDD0] p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm font-bold text-[#0B0D12]">#{order.orderNumber}</p>
                      <p className="text-[11px] text-[#575757]">
                        {new Date(order.createdAt).toLocaleDateString('en-PK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle[order.status]}`}
                    >
                      {order.status === 'Pending Phone Confirmation' ? 'Pending Call' : order.status}
                    </span>
                  </div>

                  <ul className="divide-y divide-[#FAF7F2] text-xs">
                    {order.items.map((item) => (
                      <li key={item.cartItemId} className="py-2 flex justify-between gap-3">
                        <span className="min-w-0">
                          <span className="font-medium text-[#1F1F1F]">{item.product.name}</span>
                          <span className="block text-[11px] text-[#575757]">
                            {item.variantLabel ?? ([item.selectedColor, item.selectedSize].filter(Boolean).join(' / ') || 'Default')}
                            {' • '}Qty {item.quantity} × {formatPKR(lineUnitPrice(item))}
                          </span>
                        </span>
                        <span className="font-semibold text-[#1F1F1F] shrink-0">
                          {formatPKR(lineUnitPrice(item) * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {!!order.discount && (
                    <div className="flex justify-between text-xs text-emerald-700 pt-2">
                      <span>Coupon{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                      <span className="font-semibold">-{formatPKR(order.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-bold text-[#1F1F1F] pt-2 border-t border-[#E8DDD0]">
                    <span>Total (Payable on Delivery)</span>
                    <span className="text-[#B8893B]">{formatPKR(order.total)}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <OrderPdfButton order={order} variant="customer" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </AuthShell>
  );
}
