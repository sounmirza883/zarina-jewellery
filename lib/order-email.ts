import type { Order } from '@/types/product';
import { siteConfig } from '@/config/site';
import { lineUnitPrice } from './pricing';
import { cartItemLabel, formatPKR, normalizePakistaniPhone } from './shop-logic';
import { sendEmail } from './resend';

// The two emails sent when an order is placed. Everything here is built from the order that
// place_order returned (never from what the browser sent) and every customer-typed value is escaped.

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

// Same address as metadataBase in app/layout.tsx.
const SITE_URL = 'https://zarinajewels.pk';
const GOLD = '#B8893B';
const INK = '#0B0D12';
const LINE = '#EADFCF';

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Subject lines must not carry line breaks (header injection). */
const oneLine = (value: string): string => value.replace(/\s+/g, ' ').trim();

const multiline = (value: string): string => escapeHtml(value).replace(/\r?\n/g, '<br>');

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

const heading = (value: string) =>
  `<h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;font-weight:normal;color:${INK}">${value}</h1>`;

const section = (title: string, inner: string) =>
  `<p style="margin:24px 0 6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${GOLD}">${escapeHtml(title)}</p><div style="font-size:14px;line-height:1.6">${inner}</div>`;

function shell(title: string, inner: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#FAF7F2;font-family:Arial,Helvetica,sans-serif;color:#1F1F1F">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${LINE}">
<tr><td style="background:${INK};padding:18px 24px;color:#D9B66A;font-family:Georgia,serif;font-size:20px;letter-spacing:3px">${escapeHtml(siteConfig.name.toUpperCase())}</td></tr>
<tr><td style="padding:24px">${inner}</td></tr>
</table></td></tr></table></body></html>`;
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
      `<p style="margin:28px 0 0"><a href="${adminUrl}" style="display:inline-block;background:${INK};color:#ffffff;padding:10px 20px;text-decoration:none;font-size:13px;letter-spacing:1px">OPEN ADMIN</a></p>`
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
  const from = process.env.ORDER_EMAIL_FROM ?? '';
  const owners = (process.env.ORDER_NOTIFY_EMAIL ?? '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);
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
