import test from 'node:test';
import assert from 'node:assert/strict';
import { sendEmail, type Email } from './resend';

const mail: Email = {
  from: 'Zarina Jewels <orders@example.com>',
  to: 'buyer@example.com',
  subject: 'Hello',
  html: '<p>Hi</p>',
  text: 'Hi',
  replyTo: 'owner@example.com',
  idempotencyKey: 'order-ZJ-1-customer',
};

type Call = { url: string; init: RequestInit };
const stub = (status: number, body = '{"id":"abc"}') => {
  const calls: Call[] = [];
  const doFetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(body, { status });
  }) as unknown as typeof fetch;
  return { calls, doFetch };
};

async function withKey<T>(key: string | undefined, run: () => Promise<T>): Promise<T> {
  const before = process.env.RESEND_API_KEY;
  if (key === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = key;
  try {
    return await run();
  } finally {
    if (before === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = before;
  }
}

test('sends the message to Resend with the key, idempotency key and reply_to', async () => {
  const { calls, doFetch } = stub(200);
  const ok = await withKey('re_test', () => sendEmail(mail, doFetch));

  assert.equal(ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal(calls[0].init.method, 'POST');
  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(headers.Authorization, 'Bearer re_test');
  assert.equal(headers['Idempotency-Key'], 'order-ZJ-1-customer');
  const body = JSON.parse(String(calls[0].init.body));
  assert.deepEqual(body, {
    from: mail.from,
    to: 'buyer@example.com',
    subject: 'Hello',
    html: '<p>Hi</p>',
    text: 'Hi',
    reply_to: ['owner@example.com'],
  });
});

test('leaves out reply_to and the idempotency header when not given', async () => {
  const { calls, doFetch } = stub(200);
  await withKey('re_test', () =>
    sendEmail({ ...mail, replyTo: undefined, idempotencyKey: undefined }, doFetch)
  );
  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal('Idempotency-Key' in headers, false);
  assert.equal('reply_to' in JSON.parse(String(calls[0].init.body)), false);
});

test('returns false without throwing when Resend refuses (for example an unverified domain)', async () => {
  const { doFetch } = stub(403, '{"message":"domain not verified"}');
  const ok = await withKey('re_test', () => sendEmail(mail, doFetch));
  assert.equal(ok, false);
});

test('returns false without throwing when the network fails', async () => {
  const doFetch = (async () => {
    throw new Error('offline');
  }) as unknown as typeof fetch;
  assert.equal(await withKey('re_test', () => sendEmail(mail, doFetch)), false);
});

test('does nothing without an API key or a sender', async () => {
  const { calls, doFetch } = stub(200);
  assert.equal(await withKey(undefined, () => sendEmail(mail, doFetch)), false);
  assert.equal(await withKey('re_test', () => sendEmail({ ...mail, from: '' }, doFetch)), false);
  assert.equal(calls.length, 0);
});
