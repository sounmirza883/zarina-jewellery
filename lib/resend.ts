// Sends one email through Resend's REST API. Server only: the key must never reach the browser.

const RESEND_URL = 'https://api.resend.com/emails';

export interface Email {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string | string[];
  /** Resend ignores a repeat of the same key for 24 hours, so a retried request cannot send twice. */
  idempotencyKey?: string;
}

let warnedNotConfigured = false;

/**
 * Never throws: an email problem must not break the order that triggered it.
 * Returns true only when Resend accepted the message; failures are logged without the message text.
 * `doFetch` is a parameter so tests can stub the network.
 */
export async function sendEmail(mail: Email, doFetch: typeof fetch = fetch): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !mail.from) {
    if (!warnedNotConfigured) {
      warnedNotConfigured = true;
      console.warn('Emails are switched off: set RESEND_API_KEY and ORDER_EMAIL_FROM.');
    }
    return false;
  }

  try {
    const replyTo = [mail.replyTo ?? []].flat();
    const res = await doFetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(mail.idempotencyKey ? { 'Idempotency-Key': mail.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: mail.from,
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(replyTo.length > 0 ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(`Resend rejected an email (${res.status}): ${(await res.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Resend request failed:', err instanceof Error ? err.message : err);
    return false;
  }
}
