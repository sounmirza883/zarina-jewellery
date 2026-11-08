import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import OrderSlip, { SLIP_WIDTH } from '@/components/OrderSlip';
import type { Order } from '@/types/product';

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Renders the order slip off-screen in the browser and returns it as an A4 PDF.
 * The browser draws the text (so Urdu names and addresses come out right) and html2canvas-pro
 * copies it to an image; the PDF text is therefore an image, which is fine for a slip.
 * Browser only: call it from a click handler.
 */
export async function generateOrderPdf(order: Order, variant: 'customer' | 'admin'): Promise<Blob> {
  // Loaded on demand so these libraries never weigh down normal page views.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')]);

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${SLIP_WIDTH}px;background:#fff;`;
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    flushSync(() => root.render(createElement(OrderSlip, { order, variant })));
    // Two frames so the browser starts loading any font the slip needs, then wait for it.
    await nextFrame();
    await nextFrame();
    await document.fonts.ready;

    const canvas = await html2canvas(host, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      width: SLIP_WIDTH,
      windowWidth: SLIP_WIDTH,
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const pxPerPage = Math.floor((canvas.width * pageH) / pageW);

    for (let y = 0, page = 0; y < canvas.height; y += pxPerPage, page++) {
      const sliceH = Math.min(pxPerPage, canvas.height - y);
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = sliceH;
      const ctx = slice.getContext('2d');
      if (!ctx) throw new Error('Could not prepare the PDF.');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      if (page > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageW, (sliceH * pageW) / canvas.width);
    }

    return pdf.output('blob');
  } finally {
    root.unmount();
    host.remove();
  }
}
