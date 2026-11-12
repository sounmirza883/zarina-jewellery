import test from 'node:test';
import assert from 'node:assert/strict';
import type { ContactMessage } from '../types/product';
import { contactOwnerEmail, replyToFor, sendContactAlert } from './contact-email';
import type { Email } from './resend';
import { makeContactMessage } from './test-fixtures';

test('owner alert shows who wrote, the subject, the message and the admin link', () => {
  const mail = contactOwnerEmail(makeContactMessage());
  assert.equal(mail.subject, 'New message: Noor Bridal Set delivery - Fatima Ali');
  for (const part of ['Fatima Ali', '03001234567', 'fatima@example.com', 'Noor Bridal Set delivery', 'reach Multan by Friday?', 'https://zarinajewels.pk/admin']) {
    assert.ok(mail.html.includes(part), `html: ${part}`);
    assert.ok(mail.text.includes(part), `text: ${part}`);
  }
});

test('owner alert has a tel: link and a WhatsApp chat link with the greeting ready', () => {
  const mail = contactOwnerEmail(makeContactMessage({ phone: '+923001234567' }));
  assert.ok(mail.html.includes('href="tel:+923001234567"'));
  assert.ok(mail.html.includes('https://wa.me/923001234567?text=Assalam%20o%20Alaikum%20Fatima%20Ali!'));
  assert.ok(mail.text.includes('WhatsApp: https://wa.me/923001234567?text='));
});

test('message line breaks become <br> in the HTML and stay as lines in the text', () => {
  const mail = contactOwnerEmail(makeContactMessage({ message: 'First line\r\nSecond line\nThird line' }));
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
  const mail = contactOwnerEmail(evil);
  assert.equal(mail.html.includes('<script>'), false);
  assert.equal(mail.html.includes('<img'), false);
  assert.equal(mail.html.includes('<b>'), false);
  assert.ok(mail.html.includes('Eve&lt;script&gt;alert(1)&lt;/script&gt;&quot;'));
  assert.ok(mail.html.includes('&quot;&gt;&lt;b&gt;bold&lt;/b&gt;'));
  assert.equal(/[\r\n]/.test(mail.subject), false);
  assert.ok(mail.subject.includes('Bcc: spam@example.com'));
});

test('the email line is left out when the visitor gave none', () => {
  const mail = contactOwnerEmail(makeContactMessage({ email: '' }));
  assert.equal(mail.html.includes('Email:'), false);
  assert.equal(mail.text.includes('Email:'), false);
});

// ---- sendContactAlert ------------------------------------------------------

async function runSend(message: ContactMessage, env: { from?: string; notify?: string }, send?: (mail: Email) => Promise<boolean>) {
  const sent: Email[] = [];
  const record = async (mail: Email) => {
    sent.push(mail);
    return true;
  };
  const before = { from: process.env.ORDER_EMAIL_FROM, notify: process.env.ORDER_NOTIFY_EMAIL };
  const set = (name: string, value: string | undefined) => {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  };
  set('ORDER_EMAIL_FROM', env.from);
  set('ORDER_NOTIFY_EMAIL', env.notify);
  try {
    await sendContactAlert(message, send ?? record);
  } finally {
    set('ORDER_EMAIL_FROM', before.from);
    set('ORDER_NOTIFY_EMAIL', before.notify);
  }
  return sent;
}

test('alerts every owner address with an idempotency key, replying to the visitor', async () => {
  const message = makeContactMessage();
  const sent = await runSend(message, { from: 'Zarina Jewels <orders@example.com>', notify: 'owner@example.com, helper@example.com' });
  assert.equal(sent.length, 1);
  const [mail] = sent;
  assert.equal(mail.from, 'Zarina Jewels <orders@example.com>');
  assert.deepEqual(mail.to, ['owner@example.com', 'helper@example.com']);
  assert.equal(mail.replyTo, 'fatima@example.com');
  assert.equal(mail.idempotencyKey, `contact-${message.id}`);
  assert.ok(mail.subject.startsWith('New message:'));
});

test('no reply-to when the visitor gave no email', async () => {
  const sent = await runSend(makeContactMessage({ email: '' }), { from: 'a@example.com', notify: 'owner@example.com' });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].replyTo, undefined);
});

test('an email Resend would refuse is not used as reply-to, so the alert still goes out', async () => {
  for (const email of ['a"b@example.com', 'x@example.com, y@example.com', '<x@example.com>', 'x@example']) {
    assert.equal(replyToFor(email), undefined, email);
    const sent = await runSend(makeContactMessage({ email }), { from: 'a@example.com', notify: 'owner@example.com' });
    assert.equal(sent.length, 1);
    assert.equal(sent[0].replyTo, undefined);
  }
  assert.equal(replyToFor(' fatima.ali+shop@mail.example.pk '), 'fatima.ali+shop@mail.example.pk');
});

test('nothing is sent without ORDER_NOTIFY_EMAIL', async () => {
  assert.equal((await runSend(makeContactMessage(), { from: 'a@example.com' })).length, 0);
  assert.equal((await runSend(makeContactMessage(), { from: 'a@example.com', notify: ' , ' })).length, 0);
});

test('a failing send never makes sendContactAlert reject', async () => {
  const boom = async (): Promise<boolean> => {
    throw new Error('network down');
  };
  await assert.doesNotReject(runSend(makeContactMessage(), { from: 'a@example.com', notify: 'owner@example.com' }, boom));
});
