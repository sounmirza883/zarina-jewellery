import test from 'node:test';
import assert from 'node:assert/strict';
import { toWhatsAppNumber, whatsappLink } from './whatsapp';

test('toWhatsAppNumber turns every Pakistani format into international digits', () => {
  for (const phone of ['03001234567', '0300 1234567', '0300-1234567', '+923001234567', '+92 300 1234567', '923001234567', '00923001234567', '0092 300 1234567']) {
    assert.equal(toWhatsAppNumber(phone), '923001234567', phone);
  }
});

test('toWhatsAppNumber leaves other numbers as digits only', () => {
  assert.equal(toWhatsAppNumber('+44 7700 900123'), '447700900123');
  assert.equal(toWhatsAppNumber(''), '');
});

test('whatsappLink builds a wa.me link with the text encoded', () => {
  assert.equal(whatsappLink('0300 1234567'), 'https://wa.me/923001234567');
  assert.equal(
    whatsappLink('0300 1234567', 'Assalam o Alaikum Ayesha & team'),
    'https://wa.me/923001234567?text=Assalam%20o%20Alaikum%20Ayesha%20%26%20team'
  );
});
