import type { CSSProperties } from 'react';
import type { Order } from '@/types/product';
import { siteConfig } from '@/config/site';
import { formatPKR } from '@/lib/shop-logic';
import { lineUnitPrice } from '@/lib/pricing';

/** A4 at 96 dpi. The PDF generator renders the slip at this width. */
export const SLIP_WIDTH = 794;

// Inline styles on purpose: the slip is captured off-screen, so it must not depend on page layout classes.
const INK = '#111111';
const MUTED = '#555555';
const RULE = '#CFC7BA';

const cell: CSSProperties = { border: `1px solid ${RULE}`, padding: '6px 8px', fontSize: 12, verticalAlign: 'top' };
const head: CSSProperties = { ...cell, background: '#F3ECE1', fontWeight: 700, fontSize: 11, textAlign: 'left' };
const label: CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: MUTED, marginBottom: 4 };

/** Printable order document. 'customer' = order confirmation, 'admin' = COD dispatch slip. */
export default function OrderSlip({ order, variant }: { order: Order; variant: 'customer' | 'admin' }) {
  const isAdmin = variant === 'admin';
  const c = order.customer;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://zarinajewels.pk';
  const placed = new Date(order.createdAt).toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        width: SLIP_WIDTH,
        boxSizing: 'border-box',
        padding: 40,
        background: '#FFFFFF',
        color: INK,
        fontFamily: 'var(--font-sans), var(--font-urdu), sans-serif',
        fontSize: 12,
        lineHeight: 1.45,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${INK}`, paddingBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 26, fontWeight: 600 }}>
            {siteConfig.name}
          </div>
          <div style={{ color: MUTED }}>Artisanal Artificial Jewellery, Pakistan</div>
          <div style={{ color: MUTED, fontSize: 11 }}>{siteConfig.contact.address}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              display: 'inline-block',
              background: INK,
              color: '#FFFFFF',
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            {isAdmin ? 'COD Dispatch Slip' : 'Order Confirmation'}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, marginTop: 6 }}>#{order.orderNumber}</div>
          <div style={{ color: MUTED, fontSize: 11 }}>{placed}</div>
        </div>
      </div>

      {/* Customer and delivery */}
      <div style={{ display: 'flex', gap: 24, padding: '16px 0', borderBottom: `1px solid ${RULE}` }}>
        <div style={{ flex: 1 }}>
          <div style={label}>Customer</div>
          <div dir="auto" style={{ fontWeight: 700, fontSize: 14 }}>{c.fullName}</div>
          <div style={{ fontFamily: 'monospace' }}>Phone: {c.phone}</div>
          {c.whatsapp && <div style={{ fontFamily: 'monospace' }}>WhatsApp: {c.whatsapp}</div>}
          {c.email && <div>Email: {c.email}</div>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={label}>Delivery address</div>
          <div dir="auto">{c.address}</div>
          <div dir="auto" style={{ fontWeight: 700 }}>
            {c.city}, {c.province}
          </div>
          {c.notes && (
            <div dir="auto" style={{ marginTop: 6, color: MUTED, fontStyle: 'italic' }}>
              Note: {c.notes}
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr>
            {isAdmin && <th style={{ ...head, width: 44, textAlign: 'center' }}>Packed</th>}
            <th style={{ ...head, width: 28 }}>#</th>
            <th style={head}>Jewellery piece</th>
            <th style={head}>Variant</th>
            <th style={{ ...head, width: 36, textAlign: 'center' }}>Qty</th>
            <th style={{ ...head, width: 82, textAlign: 'right' }}>Unit price</th>
            <th style={{ ...head, width: 90, textAlign: 'right' }}>Line total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => {
            const unit = lineUnitPrice(item);
            const variantText =
              item.variantLabel ?? ([item.selectedColor, item.selectedSize].filter(Boolean).join(' / ') || 'Default');
            return (
              <tr key={item.cartItemId}>
                {isAdmin && (
                  <td style={{ ...cell, textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', width: 14, height: 14, border: `1.5px solid ${INK}` }} />
                  </td>
                )}
                <td style={cell}>{i + 1}</td>
                <td style={{ ...cell, fontWeight: 600 }}>
                  {item.product.name}
                  {isAdmin && item.sku && (
                    <div style={{ fontWeight: 400, fontSize: 10, color: MUTED, fontFamily: 'monospace' }}>SKU {item.sku}</div>
                  )}
                </td>
                <td style={cell}>{variantText}</td>
                <td style={{ ...cell, textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ ...cell, textAlign: 'right' }}>{formatPKR(unit)}</td>
                <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{formatPKR(unit * item.quantity)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <table style={{ width: 300, borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '3px 0', color: MUTED }}>Subtotal</td>
              <td style={{ padding: '3px 0', textAlign: 'right' }}>{formatPKR(order.subtotal)}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 0', color: MUTED }}>Nationwide delivery</td>
              <td style={{ padding: '3px 0', textAlign: 'right' }}>{order.shipping === 0 ? 'FREE' : formatPKR(order.shipping)}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0 0', borderTop: `2px solid ${INK}`, fontWeight: 700, fontSize: 14 }}>
                Total payable on delivery (COD)
              </td>
              <td style={{ padding: '8px 0 0', borderTop: `2px solid ${INK}`, textAlign: 'right', fontWeight: 700, fontSize: 16 }}>
                {formatPKR(order.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {isAdmin ? (
        <>
          {(order.courier || order.trackingNumber) && (
            <div style={{ marginTop: 14, fontSize: 12 }}>
              <strong>Courier:</strong> {order.courier ?? 'Not assigned'}
              {order.trackingNumber && (
                <>
                  {' '}
                  &nbsp;|&nbsp; <strong>Tracking:</strong> <span style={{ fontFamily: 'monospace' }}>{order.trackingNumber}</span>
                </>
              )}
            </div>
          )}

          <div style={{ marginTop: 16, border: `2px dashed ${INK}`, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>
                Cash to collect from customer (COD)
              </div>
              <div style={{ fontSize: 11, color: MUTED }}>Rider note: collect the exact amount before handing over the parcel.</div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700 }}>{formatPKR(order.total)}</div>
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 34, textAlign: 'center' }}>
            {['Packed & checked by', 'Courier rider signature', 'Customer signature'].map((text) => (
              <div key={text} style={{ flex: 1 }}>
                <div style={{ borderBottom: `1px solid ${INK}`, height: 30 }} />
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>{text}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ marginTop: 22, padding: '12px 14px', background: '#FAF7F2', border: `1px solid ${RULE}` }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>What happens next</div>
          <div>
            Our team will call or WhatsApp you within 24 hours to confirm your delivery address. You pay the courier
            in cash when the parcel arrives.
          </div>
          <div style={{ marginTop: 6 }}>
            Track your order any time at <strong>{origin}/track-order</strong> with order number{' '}
            <strong style={{ fontFamily: 'monospace' }}>{order.orderNumber}</strong> and the phone number above.
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, paddingTop: 10, borderTop: `1px solid ${RULE}`, fontSize: 10, color: MUTED, textAlign: 'center' }}>
        {siteConfig.name} • 7-day exchange and return on unworn pieces with tags intact • WhatsApp{' '}
        {siteConfig.contact.whatsappDisplay} • {siteConfig.contact.email}
      </div>
    </div>
  );
}
