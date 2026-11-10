'use server';

import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/config';
import { sendOrderEmails } from '@/lib/order-email';
import type { CustomerDetails, Order } from '@/types/product';

export interface PlaceOrderInput {
  lines: Array<{ variantId: string; quantity: number }>;
  customer: CustomerDetails;
  coupon: string | null;
}

export type PlaceOrderResult = { order: Order } | { error: string };

const GENERIC_ERROR = 'We could not place your order. Please try again or order through WhatsApp.';

/**
 * Places the order with the same place_order function as before (prices, stock, coupon and checks all
 * stay in the database), then emails the customer and the shop owner. It runs on the server so the
 * Resend key stays secret and the emails are built from the order the database confirmed.
 * The cookie-aware client keeps signed-in customers linked to their order.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (!supabaseConfigured) {
    return { error: 'Online ordering is not available right now. Please order through WhatsApp.' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('place_order', {
      p_lines: input.lines,
      p_customer: input.customer,
      p_coupon: input.coupon,
    });

    if (error || !data) {
      // P0001 is a validation message written for customers inside place_order; anything else is a server fault.
      return { error: error?.code === 'P0001' ? error.message : GENERIC_ERROR };
    }

    const order = data as Order;
    // After the response, so checkout is not slowed down and an email problem can never undo the order.
    after(() => sendOrderEmails(order));
    return { order };
  } catch {
    return { error: GENERIC_ERROR };
  }
}
