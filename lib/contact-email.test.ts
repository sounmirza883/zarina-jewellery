import test from 'node:test';
import assert from 'node:assert/strict';
import type { ContactMessage } from '../types/product';
import { contactCustomerEmail, contactSupportEmail, replyToFor, sendContactEmails } from './contact-email';
import type { Email } from './resend';
import { makeContactMessage } from './test-fixtures';

// ---- the support alert -----------------------------------------------------

test('support alert shows who wrote, the subject, the message and the admin link', () => {
  const mail = contactSupportEmail(makeContactMessage());
  assert.equal(mail.subject, 'New message: Noor Bridal Set delivery - Fatima Ali');
  for (const part of ['Fatima Ali', '03001234567', 'fatima@example.com', 'Noor Bridal Set delivery', 'reach Multan by Friday?', 'https://zarinajewels.pk/admin']) {
    assert.ok(mail.html.includes(part), `html: ${part}`);
    assert.ok(mail.text.includes(part), `text: ${part}`);
  }
});

test('support alert has a tel: link and a WhatsApp chat link with the greeting ready', () => {
  const mail = contactSupportEmail(makeContactMessage({ phone: '+923001234567' }));
  assert.ok(mail.html.includes('href="tel:+923001234567"'));
  assert.ok(mail.html.includes('https://wa.me/923001234567?text=Assalam%20o%20Alaikum%20Fatima%20Ali!'));
  assert.ok(mail.text.includes('WhatsApp: https://wa.me/923001234567?text='));
});

test('message line breaks become <br> in the HTML and stay as lines in the text', () => {
  const mail = contactSupportEmail(makeContactMessage({ message: 'First line\r\nSecond line\nThird line' }));
  assert.ok(mail.html.includes('First line<br>Second line<br>Third line'));
  assert.ok(mail.text.includes('First line\r\nSecond line\nThird line'));
});

test('visitor-typed values cannot inject HTML or break the subject', () => {
  const evil = makeContactMessage({
    fullName: 'Eve<script>alert(1)</script>"\r\nBcc: spam@example.com',
    subject: '<img src=x onerror=alert(1)>"\nTo: x@example.com',
    message: '"><b>bold</b><script>steal()</script>',
    email: 'eve"<b>@example.com',
  });
  const mail = contactSupportEmail(evil);
  assert.equal(mail.html.includes('<script>'), false);
  assert.equal(mail.html.includes('<img'), false);
  assert.equal(mail.html.includes('<b>'), false);
  assert.ok(mail.html.includes('Eve&lt;script&gt;alert(1)&lt;/script&gt;&quot;'));
  assert.ok(mail.html.includes('&quot;&gt;&lt;b&gt;bold&lt;/b&gt;'));
  assert.equal(/[\r\n]/.test(mail.subject), false);
  assert.ok(mail.subject.includes('Bcc: spam@example.com'));
});

test('the email line is left out of the alert for an older message that has none', () => {
  const mail = contactSupportEmail(makeContactMessage({ email: '' }));
  assert.equal(mail.html.includes('Email:'), false);
  assert.equal(mail.text.includes('Email:'), false);
});

// ---- the visitor's confirmation --------------------------------------------

test('confirmation thanks the visitor by first name and says support will be in touch', () => {
  const mail = contactCustomerEmail(makeContactMessage());
  assert.equal(mail.subject, 'We have received your message - Zarina Jewels');
  for (const part of ['Thank you, Fatima!', 'We have received your query', 'support team will contact you very soon', '03001234567']) {
    assert.ok(mail.html.includes(part), `html: ${part}`);
    assert.ok(mail.text.includes(part), `text: ${part}`);
  }
  assert.ok(mail.html.includes('https://wa.me/923001234567'));
});

test('confirmation never repeats the subject or the message the visitor typed', () => {
  const mail = contactCustomerEmail(
    makeContactMessage({ subject: 'Secret subject words', message: 'Private message body that must not be relayed.' })
  );
  for (const leaked of ['Secret subject words', 'Private message body']) {
    assert.equal(mail.html.includes(leaked), false, `html leaked: ${leaked}`);
    assert.equal(mail.text.includes(leaked), false, `text leaked: ${leaked}`);
    assert.equal(mail.subject.includes(leaked), false, `subject leaked: ${leaked}`);
  }
});

test('confirmation escapes the name and phone and keeps the subject line clean', () => {
  const mail = contactCustomerEmail(makeContactMessage({ fullName: '<script>alert(1)</script> Eve', phone: '03001234567"><b>' }));
  assert.equal(mail.html.includes('<script>'), false);
  assert.equal(mail.html.includes('<b>'), false);
  assert.ok(mail.html.includes('Thank you, &lt;script&gt;alert(1)&lt;/script&gt;!'));
  assert.equal(/[\r\n]/.test(mail.subject), false);
});

// ---- replyToFor ------------------------------------------------------------

test('replyToFor accepts plain addresses and refuses ones an email provider would reject', () => {
  for (const email of ['a"b@example.com', 'x@example.com, y@example.com', '<x@example.com>', 'x@example', '']) {
    assert.equal(replyToFor(email), undefined, email);
  }
  assert.equal(replyToFor(' fatima.ali+shop@mail.example.pk '), 'fatima.ali+shop@mail.example.pk');
});

// ---- sendContactEmails -----------------------------------------------------

interface Env {
  orderFrom?: string;
  orderNotify?: string;
  supportFrom?: string;
  supportNotify?: string;
}

const ENV_NAMES = {
  orderFrom: 'ORDER_EMAIL_FROM',
  orderNotify: 'ORDER_NOTIFY_EMAIL',
  supportFrom: 'SUPPORT_EMAIL_FROM',
  supportNotify: 'SUPPORT_NOTIFY_EMAIL',
} as const;

/** Runs sendContactEmails with exactly this environment (and restores the real one afterwards). */
async function runSend(message: ContactMessage, env: Env, send?: (mail: Email) => Promise<boolean>) {
  const sent: Email[] = [];
  const record = async (mail: Email) => {
    sent.push(mail);
    return true;
  };
  const before: Record<string, string | undefined> = {};
  for (const [key, name] of Object.entries(ENV_NAMES)) {
    before[name] = process.env[name];
    const value = env[key as keyof Env];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  try {
    await sendContactEmails(message, send ?? record);
  } finally {
    for (const [name, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
  return sent;
}

const SUPPORT_ENV: Env = {
  supportFrom: 'Zarina Support <support@example.com>',
  supportNotify: 'support@example.com, admin@example.com',
};

test('sends a confirmation to the visitor and an alert to support, both from the support sender', async () => {
  const message = makeContactMessage();
  const sent = await runSend(message, SUPPORT_ENV);
  assert.equal(sent.length, 2);
  const customer = sent.find((mail) => mail.to === 'fatima@example.com');
  const support = sent.find((mail) => Array.isArray(mail.to));
  assert.ok(customer && support);

  assert.equal(customer.from, 'Zarina Support <support@example.com>');
  assert.deepEqual(customer.replyTo, ['support@example.com', 'admin@example.com']);
  assert.ok(customer.subject.startsWith('We have received your message'));

  assert.equal(support.from, 'Zarina Support <support@example.com>');
  assert.deepEqual(support.to, ['support@example.com', 'admin@example.com']);
  assert.equal(support.replyTo, 'fatima@example.com');
  assert.ok(support.subject.startsWith('New message:'));
});

test('the two emails have different idempotency keys', async () => {
  const message = makeContactMessage();
  const sent = await runSend(message, SUPPORT_ENV);
  const keys = sent.map((mail) => mail.idempotencyKey);
  assert.deepEqual(new Set(keys), new Set([`contact-${message.id}-customer`, `contact-${message.id}-support`]));
});

test('SUPPORT_* settings win over ORDER_* ones', async () => {
  const sent = await runSend(makeContactMessage(), {
    ...SUPPORT_ENV,
    orderFrom: 'orders@example.com',
    orderNotify: 'owner@example.com',
  });
  assert.equal(sent.length, 2);
  assert.ok(sent.every((mail) => mail.from === 'Zarina Support <support@example.com>'));
  assert.deepEqual(sent.find((mail) => Array.isArray(mail.to))?.to, ['support@example.com', 'admin@example.com']);
});

test('falls back to the ORDER_* settings when the SUPPORT_* ones are empty', async () => {
  const sent = await runSend(makeContactMessage(), { orderFrom: 'orders@example.com', orderNotify: 'owner@example.com', supportFrom: '  ', supportNotify: ' , ' });
  assert.equal(sent.length, 2);
  assert.ok(sent.every((mail) => mail.from === 'orders@example.com'));
  assert.deepEqual(sent.find((mail) => Array.isArray(mail.to))?.to, ['owner@example.com']);
});

test('without any support address only the confirmation is sent', async () => {
  const sent = await runSend(makeContactMessage(), { supportFrom: 'support@example.com' });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'fatima@example.com');
  assert.deepEqual(sent[0].replyTo, []);
});

test('an email address the provider would refuse gets no confirmation, but support still hears about it', async () => {
  for (const email of ['a"b@example.com', 'x@example', '']) {
    const sent = await runSend(makeContactMessage({ email }), SUPPORT_ENV);
    assert.equal(sent.length, 1, email);
    assert.deepEqual(sent[0].to, ['support@example.com', 'admin@example.com']);
    assert.equal(sent[0].replyTo, undefined);
  }
});

test('one email failing does not stop the other', async () => {
  const attempted: Email[] = [];
  const failCustomer = async (mail: Email): Promise<boolean> => {
    attempted.push(mail);
    if (typeof mail.to === 'string') throw new Error('network down');
    return true;
  };
  await assert.doesNotReject(runSend(makeContactMessage(), SUPPORT_ENV, failCustomer));
  assert.equal(attempted.length, 2);
});

test('sendContactEmails never rejects, even when every send fails', async () => {
  const boom = async (): Promise<boolean> => {
    throw new Error('network down');
  };
  await assert.doesNotReject(runSend(makeContactMessage(), SUPPORT_ENV, boom));
});
