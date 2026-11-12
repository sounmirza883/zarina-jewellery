import { siteConfig } from '@/config/site';

// Layout and helpers shared by every email the shop sends (orders, contact messages).
// Anything a customer typed must go through escapeHtml (or multiline) before it reaches the HTML.

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

// Same address as metadataBase in app/layout.tsx.
export const SITE_URL = 'https://zarinajewels.pk';
export const GOLD = '#B8893B';
export const INK = '#0B0D12';
export const LINE = '#EADFCF';

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Subject lines must not carry line breaks (header injection). */
export const oneLine = (value: string): string => value.replace(/\s+/g, ' ').trim();

export const multiline = (value: string): string => escapeHtml(value).replace(/\r?\n/g, '<br>');

/** Takes HTML: escape any customer text before passing it in. */
export const heading = (value: string) =>
  `<h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;font-weight:normal;color:${INK}">${value}</h1>`;

/** `title` is escaped here; `inner` is HTML and must already be escaped. */
export const section = (title: string, inner: string) =>
  `<p style="margin:24px 0 6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${GOLD}">${escapeHtml(title)}</p><div style="font-size:14px;line-height:1.6">${inner}</div>`;

/** A dark "button" link (email clients ignore <button>). */
export const buttonLink = (href: string, label: string) =>
  `<p style="margin:28px 0 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:${INK};color:#ffffff;padding:10px 20px;text-decoration:none;font-size:13px;letter-spacing:1px">${escapeHtml(label)}</a></p>`;

export function shell(title: string, inner: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#FAF7F2;font-family:Arial,Helvetica,sans-serif;color:#1F1F1F">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${LINE}">
<tr><td style="background:${INK};padding:18px 24px;color:#D9B66A;font-family:Georgia,serif;font-size:20px;letter-spacing:3px">${escapeHtml(siteConfig.name.toUpperCase())}</td></tr>
<tr><td style="padding:24px">${inner}</td></tr>
</table></td></tr></table></body></html>`;
}

/** The sender address from the server's environment ('' when emails are not set up). */
export const emailFrom = (): string => process.env.ORDER_EMAIL_FROM ?? '';

/** The shop owner's addresses from ORDER_NOTIFY_EMAIL (comma separated). */
export function notifyRecipients(): string[] {
  return (process.env.ORDER_NOTIFY_EMAIL ?? '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);
}
