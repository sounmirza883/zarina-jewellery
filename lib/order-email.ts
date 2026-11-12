import type { Order } from '@/types/product';
import { siteConfig } from '@/config/site';
import { lineUnitPrice } from './pricing';
import { cartItemLabel, formatPKR, normalizePakistaniPhone } from './shop-logic';
import { sendEmail } from './resend';
import {
  type BuiltEmail,
  GOLD,
  LINE,
  SITE_URL,
  buttonLink,
  emailFrom,
  escapeHtml,
  heading,
  multiline,
  notifyRecipients,
  oneLine,
  section,
  shell,
} from './email-shared';

export { escapeHtml, type BuiltEmail };

// The two emails sent when an order is placed. Everything here is built from the order that
// place_order returned (never from what the browser sent) and every customer-typed value is escaped.

function itemLines(order: Order) {
  return order.items.map((item) => ({
    name: item.product.name,
    label: cartItemLabel(item),
    qty: item.quantity,
    total: lineUnitPrice(item) * item.quantity,
  }));
}

function totalRows(order: Order): Array<[string, string]> {
  const rows: Array<[string, string]> = [['Subtotal', formatPKR(order.subtotal)]];
  if (order.discount && order.discount > 0) {
    rows.push([`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, `- ${formatPKR(order.discount)}`]);
  }
  rows.push(['Delivery', order.shipping === 0 ? 'Free' : formatPKR(order.shipping)]);
  rows.push(['Total (Cash on Delivery)', formatPKR(order.total)]);
  return rows;
}

function itemsHtml(order: Order): string {
  const rows = itemLines(order)
    .map(
      (l) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px"><strong>${escapeHtml(l.name)}</strong><br><span style="color:#575757;font-size:13px">${escapeHtml(l.label)} &times; ${l.qty}</span></td>
<td align="right" style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;white-space:nowrap">${escapeHtml(formatPKR(l.total))}</td>
</tr>`
    )
    .join('');
  const totals = totalRows(order)
    .map(([label, value], i, all) => {
      const last = i === all.length - 1;
      const style = `padding:${last ? '12px' : '4px'} 0 4px;font-size:${last ? '16px' : '14px'};${last ? 'font-weight:bold;' : ''}`;
      return `<tr><td style="${style}">${escapeHtml(label)}</td><td align="right" style="${style}white-space:nowrap">${escapeHtml(value)}</td></tr>`;
    })
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}${totals}</table>`;
}

function itemsText(order: Order): string {
  const items = itemLines(order).map((l) => `- ${l.name} (${l.label}) x ${l.qty} - ${formatPKR(l.total)}`);
  const totals = totalRows(order).map(([label, value]) => `${label}: ${value}`);
  return [...items, '', ...totals].join('\n');
}

/** The confirmation the customer gets (only sent when they typed an email at checkout). */
export function customerEmail(order: Order): BuiltEmail {
  const { customer } = order;
  const firstName = oneLine(customer.fullName).split(' ')[0] || 'there';
  const { whatsappDisplay, whatsappUrl } = siteConfig.contact;
  const eta = `${siteConfig.shipping.deliveryTime} after we confirm your order`;

  const html = shell(
    `Your order ${order.orderNumber}`,
    heading(`Thank you, ${escapeHtml(firstName)}!`) +
      `<p style="margin:0 0 4px;font-size:14px;line-height:1.6">We have received your order <strong>${escapeHtml(order.orderNumber)}</strong>. Our team will call you on <strong>${escapeHtml(customer.phone)}</strong> to confirm it before we dispatch it.</p>` +
      section('Your order', itemsHtml(order)) +
      section(
        'Delivery address',
        `${escapeHtml(customer.fullName)}<br>${multiline(customer.address)}<br>${escapeHtml(customer.city)}, ${escapeHtml(customer.province)}<br>${escapeHtml(customer.phone)}`
      ) +
      section('Payment and delivery', `Cash on Delivery: pay the rider when your parcel arrives.<br>Expected delivery: ${escapeHtml(eta)}.`) +
      `<p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#575757">Questions? Message us on WhatsApp: <a href="${escapeHtml(whatsappUrl)}" style="color:${GOLD}">${escapeHtml(whatsappDisplay)}</a>.<br>If you did not place this order, please tell us on WhatsApp and we will cancel it.</p>`
  );

  const text = [
    `Thank you, ${firstName}!`,
    '',
    `We have received your order ${order.orderNumber}. Our team will call you on ${customer.phone} to confirm it before we dispatch it.`,
    '',
    itemsText(order),
    '',
    'Delivery address:',
    customer.fullName,
    customer.address,
    `${customer.city}, ${customer.province}`,
    customer.phone,
    '',
    'Payment: Cash on Delivery, pay the rider when your parcel arrives.',
    `Expected delivery: ${eta}.`,
    '',
    `Questions? Message us on WhatsApp: ${whatsappDisplay}`,
    'If you did not place this order, please tell us on WhatsApp and we will cancel it.',
  ].join('\n');

  return { subject: `Your ${siteConfig.name} order ${order.orderNumber} is received`, html, text };
}

/** wa.me link for a Pakistani mobile number, or null when the number is not in a known format. */
function whatsappLink(phone: string): string | null {
  const local = normalizePakistaniPhone(phone);
  return /^03\d{9}$/.test(local) ? `https://wa.me/92${local.slice(1)}` : null;
}

/** The "new order" alert for the shop owner. */
export function ownerEmail(order: Order): BuiltEmail {
  const { customer } = order;
  const wa = whatsappLink(customer.whatsapp || customer.phone);
  const adminUrl = `${SITE_URL}/admin`;

  const contactHtml = [
    `<strong>${escapeHtml(customer.fullName)}</strong>`,
    `Phone: <a href="tel:${escapeHtml(customer.phone.replace(/[^\d+]/g, ''))}" style="color:${GOLD}">${escapeHtml(customer.phone)}</a>`,
    wa ? `WhatsApp: <a href="${wa}" style="color:${GOLD}">Open chat</a>` : '',
    customer.email ? `Email: ${escapeHtml(customer.email)}` : '',
    `${multiline(customer.address)}<br>${escapeHtml(customer.city)}, ${escapeHtml(customer.province)}`,
    customer.notes ? `Notes: ${multiline(customer.notes)}` : '',
  ]
    .filter(Boolean)
    .join('<br>');

  const html = shell(
    `New order ${order.orderNumber}`,
    heading(`New order ${escapeHtml(order.orderNumber)}`) +
      `<p style="margin:0;font-size:14px;color:#575757">Status: ${escapeHtml(order.status)}. Please phone the customer to confirm.</p>` +
      section('Customer', contactHtml) +
      section('Items', itemsHtml(order)) +
      buttonLink(adminUrl, 'OPEN ADMIN')
  );

  const contactText = [
    customer.fullName,
    `Phone: ${customer.phone}`,
    wa ? `WhatsApp: ${wa}` : '',
    customer.email ? `Email: ${customer.email}` : '',
    customer.address,
    `${customer.city}, ${customer.province}`,
    customer.notes ? `Notes: ${customer.notes}` : '',
  ].filter(Boolean);

  const text = [
    `New order ${order.orderNumber} (${order.status})`,
    '',
    ...contactText,
    '',
    itemsText(order),
    '',
    `Admin: ${adminUrl}`,
  ].join('\n');

  return {
    subject: `New order ${order.orderNumber} - ${formatPKR(order.total)} - ${oneLine(customer.fullName)}`,
    html,
    text,
  };
}

/**
 * Sends the customer confirmation (when the order has an email) and the owner alert.
 * Recipients and sender come from the server's environment; nothing here can throw.
 */
export async function sendOrderEmails(order: Order, send: typeof sendEmail = sendEmail): Promise<void> {
  const from = emailFrom();
  const owners = notifyRecipients();
  const buyer = order.customer.email?.trim();

  const jobs: Array<Promise<boolean>> = [];
  if (buyer) {
    jobs.push(
      send({ from, to: buyer, replyTo: owners, ...customerEmail(order), idempotencyKey: `order-${order.orderNumber}-customer` })
    );
  }
  if (owners.length > 0) {
    jobs.push(
      send({ from, to: owners, replyTo: buyer, ...ownerEmail(order), idempotencyKey: `order-${order.orderNumber}-owner` })
    );
  } else {
    console.warn('ORDER_NOTIFY_EMAIL is not set: no new-order alert was sent.');
  }
  await Promise.allSettled(jobs);
}
