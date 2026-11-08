'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ShieldCheck,
  Truck,
  ShoppingBag,
  ArrowRight,
  Phone,
  MessageCircle,
  MapPin,
  User,
  Mail,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPKR, isValidPakistaniPhone, generateOrderNumber } from '@/lib/shop-logic';
import { siteConfig } from '@/config/site';
import { Order } from '@/types/product';
import ProductImage from '@/components/ProductImage';

// Form validation schema using Zod
const checkoutSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: 'Please enter your full name (at least 3 characters)' }),
  phone: z
    .string()
    .min(10, { message: 'Phone number is required' })
    .refine((val) => isValidPakistaniPhone(val), {
      message: 'Enter a valid Pakistani mobile number (e.g. 0300 1234567 or +923001234567)',
    }),
  whatsapp: z
    .string()
    .optional()
    .refine((val) => !val || isValidPakistaniPhone(val), {
      message: 'Enter a valid Pakistani mobile number or leave blank',
    }),
  email: z
    .string()
    .email({ message: 'Enter a valid email address' })
    .or(z.literal('')),
  province: z.string().min(1, { message: 'Please select your province / region' }),
  city: z.string().min(2, { message: 'Please specify your city / town' }),
  address: z
    .string()
    .min(10, { message: 'Please enter complete delivery address (House #, Street, Area)' }),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, getTotals } = useCartStore();
  const totals = getTotals();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      whatsapp: '',
      email: '',
      province: siteConfig.provinces[0],
      city: '',
      address: '',
      notes: '',
    },
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    if (items.length === 0) return;

    setIsSubmitting(true);

    try {
      // Generate authentic order reference
      const orderNumber = generateOrderNumber();

      const newOrder: Order = {
        orderNumber,
        items: [...items],
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        total: totals.total,
        customer: {
          fullName: data.fullName,
          phone: data.phone,
          whatsapp: data.whatsapp || data.phone,
          email: data.email || undefined,
          province: data.province,
          city: data.city,
          address: data.address,
          notes: data.notes || undefined,
        },
        createdAt: new Date().toISOString(),
        paymentMethod: 'Cash on Delivery',
        status: 'Pending Phone Confirmation',
      };

      // Store order in localStorage for access on /order-success
      if (typeof window !== 'undefined') {
        localStorage.setItem('zarina_last_order', JSON.stringify(newOrder));

        // Append to order history list
        try {
          const historyRaw = localStorage.getItem('zarina_order_history');
          const history: Order[] = historyRaw ? JSON.parse(historyRaw) : [];
          history.unshift(newOrder);
          localStorage.setItem('zarina_order_history', JSON.stringify(history.slice(0, 10)));
        } catch {
          // Ignore history storage errors
        }
      }

      // Clear shopping bag
      clearCart();

      // Redirect to success page
      router.push(`/order-success?orderId=${orderNumber}`);
    } catch {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-[#F5EDE1] text-[#B8893B] flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl text-[#1F1F1F] font-normal mb-2">
          Your bag is empty
        </h1>
        <p className="text-xs text-[#575757] mb-6">
          Add some jewellery items before proceeding to checkout.
        </p>
        <Link
          href="/shop"
          className="inline-flex px-6 py-2.5 bg-[#0B0D12] text-white text-xs font-semibold uppercase tracking-wider rounded"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.25em] text-[#B8893B] font-semibold block mb-1">
            Safe & Direct Delivery
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0B0D12] font-normal">
            Guest Checkout
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#575757]">
            Pay cash on delivery when your parcel reaches your hands. No credit card required.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Form Fields Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Customer Contact & Delivery Address Card */}
              <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#B8893B]/20 shadow-xs space-y-6">
                <div>
                  <h2 className="font-serif text-xl font-medium text-[#1F1F1F] flex items-center gap-2">
                    <User className="w-5 h-5 text-[#B8893B]" />
                    <span>Customer & Delivery Details</span>
                  </h2>
                  <p className="text-xs text-[#575757] mt-1">
                    Please provide an active mobile number so our team and courier can coordinate delivery.
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                    Full Name <span className="text-[#991B1B]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('fullName')}
                    placeholder="e.g. Ayesha Khan"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border rounded-md text-[#1F1F1F] placeholder-[#8A8A8A] focus:outline-hidden ${
                      errors.fullName ? 'border-[#991B1B]' : 'border-[#E8DDD0] focus:border-[#B8893B]'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-[11px] text-[#991B1B] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.fullName.message}</span>
                    </p>
                  )}
                </div>

                {/* Phone & WhatsApp Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#B8893B]" />
                      <span>Mobile Phone Number <span className="text-[#991B1B]">*</span></span>
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      placeholder="0300 1234567"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border rounded-md text-[#1F1F1F] placeholder-[#8A8A8A] focus:outline-hidden ${
                        errors.phone ? 'border-[#991B1B]' : 'border-[#E8DDD0] focus:border-[#B8893B]'
                      }`}
                    />
                    {errors.phone ? (
                      <p className="text-[11px] text-[#991B1B] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.phone.message}</span>
                      </p>
                    ) : (
                      <span className="text-[10px] text-[#8A8A8A] block mt-1">
                        Format: 03XX XXXXXXX or +923XXXXXXXXX
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Number (Optional)</span>
                    </label>
                    <input
                      type="tel"
                      {...register('whatsapp')}
                      placeholder="Same as mobile or different"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] placeholder-[#8A8A8A] focus:outline-hidden focus:border-[#B8893B]"
                    />
                    {errors.whatsapp && (
                      <p className="text-[11px] text-[#991B1B] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.whatsapp.message}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#B8893B]" />
                    <span>Email Address (Optional for order tracking receipt)</span>
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="ayesha@example.com"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border rounded-md text-[#1F1F1F] placeholder-[#8A8A8A] focus:outline-hidden ${
                      errors.email ? 'border-[#991B1B]' : 'border-[#E8DDD0] focus:border-[#B8893B]'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-[11px] text-[#991B1B] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.email.message}</span>
                    </p>
                  )}
                </div>

                {/* Province & City Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                      Province / Region <span className="text-[#991B1B]">*</span>
                    </label>
                    <select
                      {...register('province')}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                    >
                      {siteConfig.provinces.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                      City / Town <span className="text-[#991B1B]">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('city')}
                      placeholder="e.g. Lahore, Karachi, Rawalpindi"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border rounded-md text-[#1F1F1F] placeholder-[#8A8A8A] focus:outline-hidden ${
                        errors.city ? 'border-[#991B1B]' : 'border-[#E8DDD0] focus:border-[#B8893B]'
                      }`}
                    />
                    {errors.city && (
                      <p className="text-[11px] text-[#991B1B] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.city.message}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Full Address */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#B8893B]" />
                    <span>Complete Street Address <span className="text-[#991B1B]">*</span></span>
                  </label>
                  <textarea
                    rows={3}
                    {...register('address')}
                    placeholder="House/Apartment #, Street #, Block/Sector, Area name, Landmark..."
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border rounded-md text-[#1F1F1F] placeholder-[#8A8A8A] focus:outline-hidden ${
                      errors.address ? 'border-[#991B1B]' : 'border-[#E8DDD0] focus:border-[#B8893B]'
                    }`}
                  />
                  {errors.address && (
                    <p className="text-[11px] text-[#991B1B] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.address.message}</span>
                    </p>
                  )}
                </div>

                {/* Order Special Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#575757]" />
                    <span>Order Notes & Delivery Instructions (Optional)</span>
                  </label>
                  <input
                    type="text"
                    {...register('notes')}
                    placeholder="e.g. Call before delivery, deliver after 2 PM, gift packing request"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] placeholder-[#8A8A8A] focus:outline-hidden focus:border-[#B8893B]"
                  />
                </div>
              </div>

              {/* Fixed Payment Method Section */}
              <div className="bg-white p-6 rounded-xl border border-[#B8893B]/20 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-serif text-lg font-medium text-[#1F1F1F]">
                      Payment Method: Cash on Delivery (COD)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                    Fixed & Guaranteed
                  </span>
                </div>
                <p className="text-xs text-[#575757] leading-relaxed">
                  You only pay the courier when the parcel arrives at your door. You do not need any credit/debit card, Easypaisa, or JazzCash for online payment.
                </p>
              </div>
            </div>

            {/* Order Summary & Submit Button Column */}
            <div className="lg:col-span-5">
              <div className="bg-white p-6 rounded-xl border border-[#B8893B]/20 shadow-sm space-y-5 sticky top-24">
                <h2 className="font-serif text-xl font-medium text-[#1F1F1F] pb-3 border-b border-[#FAF7F2]">
                  Order Review ({totals.totalItemCount} {totals.totalItemCount === 1 ? 'item' : 'items'})
                </h2>

                {/* Line items preview */}
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-[#FAF7F2]">
                  {items.map((item) => (
                    <div key={item.cartItemId} className="pt-2.5 first:pt-0 flex items-center gap-3">
                      <div className="relative w-14 h-16 rounded overflow-hidden bg-[#F5EDE1] shrink-0">
                        <ProductImage
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          sizes="56px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-xs font-medium text-[#1F1F1F] truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-[11px] text-[#575757]">
                          Qty: {item.quantity} • {item.selectedColor}
                          {item.selectedSize ? ` (${item.selectedSize})` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#1F1F1F]">
                        {formatPKR(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Cost breakdown */}
                <div className="space-y-2.5 text-xs pt-3 border-t border-[#E8DDD0]">
                  <div className="flex justify-between text-[#575757]">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-[#1F1F1F]">{formatPKR(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#575757]">
                    <span>Nationwide Delivery</span>
                    <span className="font-semibold text-[#1F1F1F]">
                      {totals.isFreeShipping ? (
                        <span className="text-emerald-700">FREE</span>
                      ) : (
                        formatPKR(totals.shipping)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-[#1F1F1F] pt-3 border-t border-[#FAF7F2]">
                    <span>Total (Payable on Delivery)</span>
                    <span className="text-xl text-[#B8893B]">{formatPKR(totals.total)}</span>
                  </div>
                </div>

                {/* Delivery timing note */}
                <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DDD0] flex items-start gap-2 text-xs text-[#575757]">
                  <Truck className="w-4 h-4 text-[#B8893B] shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Estimated delivery time: <strong>2-4 working days</strong> across all Pakistani cities. Our support team will contact you to confirm the order before dispatch.
                  </p>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-4 bg-[#0B0D12] hover:bg-[#B8893B] disabled:bg-[#8A8A8A] text-white text-xs uppercase tracking-widest font-semibold rounded-md transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Confirming Order...</span>
                    </div>
                  ) : (
                    <>
                      <span>Place Order with Cash on Delivery</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-[#8A8A8A]">
                  By placing this order you agree to our 7-Day return policy and cash on delivery verification.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
