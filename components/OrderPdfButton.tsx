'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';
import type { Order } from '@/types/product';

/** Downloads the order as a PDF: 'customer' = order confirmation, 'admin' = COD dispatch slip. */
export default function OrderPdfButton({
  order,
  variant,
  className,
  label = 'Download PDF',
}: {
  order: Order;
  variant: 'customer' | 'admin';
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const download = async () => {
    setBusy(true);
    setError('');
    try {
      // The PDF code (and jspdf / html2canvas-pro) is fetched only when someone asks for a PDF.
      const { generateOrderPdf } = await import('@/lib/order-pdf');
      const blob = await generateOrderPdf(order, variant);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Zarina-Order-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setError('Could not create the PDF. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className={
          className ??
          'inline-flex items-center gap-1.5 px-4 py-2.5 border border-[#B8893B] text-[#B8893B] hover:bg-[#B8893B] hover:text-white disabled:opacity-60 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors'
        }
      >
        <FileDown className="w-4 h-4" />
        <span>{busy ? 'Preparing PDF…' : label}</span>
      </button>
      {error && (
        <span role="alert" className="text-[11px] text-[#991B1B]">
          {error}
        </span>
      )}
    </span>
  );
}
