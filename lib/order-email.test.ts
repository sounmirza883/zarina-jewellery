import test from 'node:test';
import assert from 'node:assert/strict';
import type { Order } from '../types/product';
import { customerEmail, escapeHtml, ownerEmail, sendOrderEmails } from './order-email';
import type { Email } from './resend';
import { makeItem, makeProduct } from './test-fixtures';

const makeOrder = (o: Partial<Order> = {}): Order => ({
  orderNumber: 'ZJ-260101-ABCD',
  items: [
    makeItem({ product: makeProduct({ name: 'Kundan Chandbali' }), quantity: 2, unitPrice: 2000, selectedColor: 'Gold', selectedSize: '' }),
    makeItem({ cartItemId: 'v2', variantId: 'v2', product: makeProduct({ id: 'p2', name: 'Zircon Studs' }), quantity: 1, unitPrice: 1500, selectedColor: '', variantLabel: 'Silver / 7' }),
  ],
  subtotal: 5500,
  discount: 0,
  couponCode: null,
  shipping: 0,
  total: 5500,
  customer: {
    fullName: 'Ayesha Khan',
    phone: '0300 1234567',
    whatsapp: '0300 1234567',
    email: 'ayesha@example.com',
    province: 'Punjab',
    city: 'Lahore',
    address: 'House 5, Street 2\nGulberg III',
  },
  createdAt: '2026-01-01T10:00:00Z',
  paymentMethod: 'Cash on Delivery',
  status: 'Pending Phone Confirmation',
  ...o,
});

test('escapeHtml neutralises markup', () => {
  assert.equal(escapeHtml(`<script>alert("x")</script> & 'y'`), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;');
});

test('customer email shows order number, items, totals and the Cash on Delivery note', () => {
  const mail = customerEmail(makeOrder());
  assert.equal(mail.subject, 'Your Zarina Jewels order ZJ-260101-ABCD is received');
  for (const part of ['ZJ-260101-ABCD', 'Kundan Chandbali', 'Zircon Studs', 'Silver / 7', 'Rs. 4,000', 'Rs. 5,500', 'Cash on Delivery', 'Gulberg III', 'Thank you, Ayesha!']) {
    assert.ok(mail.html.includes(part), `html: ${part}`);
    assert.ok(mail.text.includes(part), `text: ${part}`);
  }
  assert.ok(mail.html.includes('Delivery</td>') && mail.html.includes('Free'));
});

test('discount line appears only when a coupon took something off', () => {
  assert.equal(customerEmail(makeOrder()).text.includes('Discount'), false);
  const withCoupon = makeOrder({ discount: 550, couponCode: 'EID10', total: 4950 });
  const mail = customerEmail(withCoupon);
  assert.ok(mail.text.includes('Discount (EID10): - Rs. 550'));
  assert.ok(mail.html.includes('Discount (EID10)'));
});

test('shows the delivery charge when there is one', () => {
  const mail = customerEmail(makeOrder({ subtotal: 2000, shipping: 250, total: 2250 }));
  assert.ok(mail.text.includes('Delivery: Rs. 250'));
});

test('customer-typed values cannot inject HTML or break the subject', () => {
  const evil = makeOrder({
    customer: {
      ...makeOrder().customer,
      fullName: 'Eve<script>alert(1)</script>\r\nBcc: spam@example.com',
      address: '<img src=x onerror=alert(1)> street 5',
      notes: '"><b>bold</b>',
    },
  });
  for (const mail of [customerEmail(evil), ownerEmail(evil)]) {
    assert.equal(mail.html.includes('<script>'), false);
    assert.equal(mail.html.includes('<img'), false);
    assert.equal(mail.html.includes('<b>bold'), false);
    assert.equal(/[\r\n]/.test(mail.subject), false);
  }
  assert.ok(ownerEmail(evil).subject.includes('Eve<script>alert(1)</script> Bcc: spam@example.com'));
});

test('owner email has the contact details, a WhatsApp link and the admin link', () => {
  const mail = ownerEmail(makeOrder({ customer: { ...makeOrder().customer, notes: 'Call after 5pm' } }));
  assert.equal(mail.subject, 'New order ZJ-260101-ABCD - Rs. 5,500 - Ayesha Khan');
  for (const part of ['0300 1234567', 'tel:03001234567', 'https://wa.me/923001234567', 'ayesha@example.com', 'Call after 5pm', 'https://zarinajewels.pk/admin', 'Pending Phone Confirmation']) {
    assert.ok(mail.html.includes(part), `html: ${part}`);
  }
  assert.ok(mail.text.includes('https://wa.me/923001234567'));
});

test('owner email leaves out the WhatsApp link for a number it cannot read', () => {
  const mail = ownerEmail(makeOrder({ customer: { ...makeOrder().customer, phone: '12345', whatsapp: '' } }));
  assert.equal(mail.html.includes('wa.me'), false);
});

// ---- sendOrderEmails -------------------------------------------------------

async function runSend(order: Order, env: { from?: string; notify?: string }) {
  const sent: Email[] = [];
  const send = async (mail: Email) => {
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
    await sendOrderEmails(order, send);
  } finally {
    set('ORDER_EMAIL_FROM', before.from);
    set('ORDER_NOTIFY_EMAIL', before.notify);
  }
  return sent;
}

test('sends the customer confirmation and the owner alert, each with its own idempotency key', async () => {
  const sent = await runSend(makeOrder(), { from: 'Zarina Jewels <orders@example.com>', notify: 'owner@example.com, helper@example.com' });
  assert.equal(sent.length, 2);
  const [customer, owner] = sent;
  assert.equal(customer.to, 'ayesha@example.com');
  assert.deepEqual(customer.replyTo, ['owner@example.com', 'helper@example.com']);
  assert.equal(customer.idempotencyKey, 'order-ZJ-260101-ABCD-customer');
  assert.deepEqual(owner.to, ['owner@example.com', 'helper@example.com']);
  assert.equal(owner.replyTo, 'ayesha@example.com');
  assert.equal(owner.idempotencyKey, 'order-ZJ-260101-ABCD-owner');
  assert.ok(owner.subject.startsWith('New order'));
});

test('an order without a customer email only alerts the owner', async () => {
  const order = makeOrder({ customer: { ...makeOrder().customer, email: undefined } });
  const sent = await runSend(order, { from: 'a@example.com', notify: 'owner@example.com' });
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0].to, ['owner@example.com']);
  assert.equal(sent[0].replyTo, undefined);
});

test('without ORDER_NOTIFY_EMAIL only the customer is emailed', async () => {
  const sent = await runSend(makeOrder(), { from: 'a@example.com' });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'ayesha@example.com');
});
