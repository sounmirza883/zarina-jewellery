'use client';

import { useMemo, useSyncExternalStore } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingUp, Calendar, ShoppingBag } from 'lucide-react';
import { Order } from '@/types/product';
import { getDailyOrderVolume } from '@/lib/admin-store';
import { formatPKR } from '@/lib/shop-logic';

interface AdminOrderChartProps {
  orders: Order[];
}

function subscribe() {
  return () => {};
}

// Custom tooltip styled with luxury dark gold theme
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0B0D12] text-white p-3.5 rounded-xl border border-[#B8893B]/40 shadow-2xl text-xs space-y-1.5 min-w-[180px]">
        <div className="flex items-center gap-1.5 text-[#D9B66A] font-semibold text-xs border-b border-white/10 pb-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{data.fullDate}</span>
        </div>
        <div className="flex items-center justify-between text-white pt-0.5">
          <span className="text-[#A0A0A0] flex items-center gap-1">
            <ShoppingBag className="w-3 h-3 text-[#B8893B]" />
            Order Volume:
          </span>
          <span className="font-bold text-sm text-white">
            {data.orders} {data.orders === 1 ? 'order' : 'orders'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[#A0A0A0] text-[11px] pt-1 border-t border-white/10">
          <span>Sales (COD):</span>
          <span className="text-[#D9B66A] font-bold">{formatPKR(data.revenue)}</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function AdminOrderChart({ orders }: AdminOrderChartProps) {
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const dailyStats = useMemo(() => {
    return getDailyOrderVolume(orders);
  }, [orders]);

  const summary = useMemo(() => {
    const totalOrders7Days = dailyStats.reduce((sum, d) => sum + d.orders, 0);
    const totalRevenue7Days = dailyStats.reduce((sum, d) => sum + d.revenue, 0);
    const maxOrdersDay = [...dailyStats].sort((a, b) => b.orders - a.orders)[0];
    return {
      totalOrders7Days,
      totalRevenue7Days,
      peakDay: maxOrdersDay ? `${maxOrdersDay.dayLabel} (${maxOrdersDay.orders})` : '—',
    };
  }, [dailyStats]);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#B8893B]/20 shadow-xs space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FAF7F2]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#B8893B]/30 text-[#B8893B] flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-[#0B0D12]">
              Daily Order Volume (Last 7 Days)
            </h3>
            <p className="text-xs text-[#575757] mt-0.5">
              Cash on Delivery parcel bookings across Pakistan
            </p>
          </div>
        </div>

        {/* 7-Day Quick Metric Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8DDD0] flex items-center gap-1.5">
            <span className="text-[#7A7A7A]">7-Day Volume:</span>
            <strong className="text-[#0B0D12] font-semibold">
              {summary.totalOrders7Days} {summary.totalOrders7Days === 1 ? 'Order' : 'Orders'}
            </strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8DDD0] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#B8893B]" />
            <span className="text-[#7A7A7A]">7-Day Sales:</span>
            <strong className="text-[#B8893B] font-semibold">
              {formatPKR(summary.totalRevenue7Days)}
            </strong>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {!isMounted ? (
          <div className="h-full w-full bg-[#FAF7F2]/50 animate-pulse rounded-lg flex items-center justify-center text-xs text-[#8A8A8A]">
            Loading 7-day order analytics...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={dailyStats}
              margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E8DDD0"
                opacity={0.7}
              />
              <XAxis
                dataKey="dayLabel"
                axisLine={{ stroke: '#E8DDD0' }}
                tickLine={false}
                tick={{ fill: '#575757', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8A8A8A', fontSize: 11 }}
                domain={[0, 'auto']}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(184, 137, 59, 0.08)' }}
              />
              <Bar
                dataKey="orders"
                name="Orders"
                fill="#B8893B"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
                activeBar={{ fill: '#D9B66A' }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
