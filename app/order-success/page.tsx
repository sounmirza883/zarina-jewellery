'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Package,
  Phone,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { Order } from '@/types/product';
import { formatPKR, cartItemLabel } from '@/lib/shop-logic';
import { lineUnitPrice } from '@/lib/pricing';
import OrderPdfButton from '@/components/OrderPdfButton';
import { siteConfig } from '@/config/site';
import ProductImage from '@/components/ProductImage';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('orderId');

  const [order] = useState<Order | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('zarina_last_order');
        if (stored) {
          const parsed: Order = JSON.parse(stored);
          if (!orderIdParam || parsed.orderNumber === orderIdParam) {
            return parsed;
          }
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  const activeOrderNumber = order ? order.orderNumber : orderIdParam || 'ZJ-ORDER';

  const whatsappConfirmUrl = `https://wa.me/${siteConfig.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Assalam o Alaikum Zarina Jewels, I just placed order #${activeOrderNumber}. Kindly confirm and expedite dispatch.`
  )}`;

  return (
    <div className="py-12 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Celebration Banner */}
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-[#B8893B]/30 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>

          <span className="text-xs uppercase tracking-[0.25em] text-[#B8893B] font-semibold block">
            Thank You for Shopping with Us
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#0B0D12] font-normal">
            Your Order Has Been Placed!
          </h1>

          <div className="inline-block bg-[#FAF7F2] border border-[#B8893B]/30 px-5 py-2.5 rounded-lg">
            <span className="text-xs text-[#575757] block">Order Reference Number</span>
            <strong className="text-lg sm:text-xl text-[#0B0D12] font-mono tracking-wider">
              {activeOrderNumber}
            </strong>
          </div>

          <div className="p-4 bg-[#F5EDE1] rounded-xl border border-[#B8893B]/30 text-left space-y-2 mt-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1F1F1F]">
              <Phone className="w-4 h-4 text-[#B8893B]" />
              <span>Next Step: Phone / WhatsApp Confirmation</span>
            </div>
            <p className="text-xs text-[#575757] leading-relaxed">
              Our customer care representative will contact you via <strong>phone call or WhatsApp</strong> within 24 hours to verify your delivery address before the parcel is dispatched with our courier partners (TCS / Leopards / Trax).
            </p>
          </div>

          {/* Quick WhatsApp Confirmation Button */}
          <div className="pt-2">
            <a
              href={whatsappConfirmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs uppercase tracking-wider font-semibold shadow transition-colors w-full sm:w-auto"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirm Instantly via WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Order Details & Summary Card */}
        {order && (
          <div className="mt-8 bg-white p-6 sm:p-8 rounded-xl border border-[#E8DDD0] shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#FAF7F2]">
              <h2 className="font-serif text-lg font-medium text-[#1F1F1F] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#B8893B]" />
                <span>Order Summary</span>
              </h2>
              <span className="text-xs text-[#575757] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </span>
            </div>

            {/* Items list */}
            <div className="divide-y divide-[#FAF7F2]">
              {order.items.map((item) => (
                <div key={item.cartItemId} className="py-3.5 flex items-center gap-3">
                  <div className="relative w-14 h-16 rounded overflow-hidden bg-[#F5EDE1] shrink-0">
                    <ProductImage
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      sizes="56px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-sm font-medium text-[#1F1F1F] truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-[11px] text-[#575757]">
                      Qty: {item.quantity} • {cartItemLabel(item)}
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-[#1F1F1F]">
                    {formatPKR(lineUnitPrice(item) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals & Delivery Address */}
            <div className="pt-4 border-t border-[#E8DDD0] grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1.5 text-[#575757]">
                <h4 className="font-semibold text-[#1F1F1F] uppercase tracking-wider text-[11px] mb-2">
                  Delivery Details
                </h4>
                <p><strong>Name:</strong> {order.customer.fullName}</p>
                <p><strong>Phone:</strong> {order.customer.phone}</p>
                {order.customer.whatsapp && <p><strong>WhatsApp:</strong> {order.customer.whatsapp}</p>}
                <p><strong>City:</strong> {order.customer.city}, {order.customer.province}</p>
                <p><strong>Address:</strong> {order.customer.address}</p>
                {order.customer.notes && <p><strong>Notes:</strong> {order.customer.notes}</p>}
              </div>

              <div className="space-y-2 bg-[#FAF7F2] p-4 rounded-lg border border-[#E8DDD0]">
                <h4 className="font-semibold text-[#1F1F1F] uppercase tracking-wider text-[11px] mb-2">
                  Payment Summary
                </h4>
                <div className="flex justify-between text-[#575757]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#1F1F1F]">{formatPKR(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#575757]">
                  <span>Nationwide Shipping</span>
                  <span className="font-medium text-[#1F1F1F]">
                    {order.shipping === 0 ? 'FREE' : formatPKR(order.shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#1F1F1F] pt-2 border-t border-[#E8DDD0]">
                  <span>Total Payable (COD)</span>
                  <span className="text-[#B8893B]">{formatPKR(order.total)}</span>
                </div>
                <div className="pt-2 text-[11px] text-emerald-800 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Payment Method: Cash on Delivery (COD)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {order && (
            <OrderPdfButton
              order={order}
              variant="customer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#0B0D12] text-[#0B0D12] hover:bg-[#FAF7F2] text-xs uppercase tracking-widest font-semibold rounded transition-colors w-full sm:w-auto"
              label="Download Order PDF"
            />
          )}
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs uppercase tracking-widest font-semibold rounded transition-colors shadow w-full sm:w-auto"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-[#B8893B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs uppercase tracking-wider text-[#575757]">Loading order confirmation...</p>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
