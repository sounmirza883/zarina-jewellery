'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, MessageCircle, Phone, RotateCcw, Trash2 } from 'lucide-react';
import { deleteMessage, fetchMessages, setMessageStatus } from '@/lib/admin-messages';
import { contactReplyText, toWhatsAppNumber, whatsappLink } from '@/lib/whatsapp';
import type { ContactMessage } from '@/types/product';

type Filter = 'all' | 'new' | 'handled';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'handled', label: 'Handled' },
  { value: 'all', label: 'All' },
];

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.');

export default function MessagesTab({ onChanged }: { onChanged?: () => void }) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState<Filter>('new');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages()
      .then(setMessages)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(
    () => ({
      all: messages.length,
      new: messages.filter((m) => m.status === 'new').length,
      handled: messages.filter((m) => m.status === 'handled').length,
    }),
    [messages]
  );

  const visible = useMemo(
    () => (filter === 'all' ? messages : messages.filter((m) => m.status === filter)),
    [messages, filter]
  );

  const run = async (id: string, action: () => Promise<void>, apply: (list: ContactMessage[]) => ContactMessage[]) => {
    setBusyId(id);
    try {
      await action();
      setMessages(apply);
      setError('');
      onChanged?.();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const toggleHandled = (message: ContactMessage) => {
    const next = message.status === 'new' ? 'handled' : 'new';
    return run(
      message.id,
      () => setMessageStatus(message.id, next),
      (list) => list.map((m) => (m.id === message.id ? { ...m, status: next } : m))
    );
  };

  const remove = (message: ContactMessage) => {
    if (!confirm(`Delete the message from ${message.fullName}? This cannot be undone.`)) return;
    return run(
      message.id,
      () => deleteMessage(message.id),
      (list) => list.filter((m) => m.id !== message.id)
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="shrink-0 font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter messages by status">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              filter === value
                ? 'bg-[#0B0D12] text-white border-[#0B0D12]'
                : 'bg-white text-[#575757] border-[#E8DDD0] hover:border-[#B8893B]'
            }`}
          >
            {label} ({counts[value]})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[#575757]">Loading messages...</p>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8DDD0] p-10 text-center text-sm text-[#575757]">
          {filter === 'new' ? 'No new messages.' : 'No messages to show.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((message) => {
            const busy = busyId === message.id;
            return (
              <li key={message.id} className="bg-white rounded-xl border border-[#B8893B]/20 shadow-xs p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif text-base text-[#0B0D12] break-words">{message.subject}</p>
                    <p className="mt-0.5 text-[11px] text-[#575757]">
                      <span className="font-medium text-[#1F1F1F]">{message.fullName}</span>
                      {' · '}
                      {new Date(message.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  {message.status === 'new' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      New
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Handled
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm text-[#1F1F1F] leading-relaxed whitespace-pre-line break-words">
                  {message.message}
                </p>

                <p className="mt-3 text-[11px] text-[#575757]">
                  Phone: <span className="font-medium text-[#1F1F1F]">{message.phone}</span>
                  {message.email && (
                    <>
                      {' · '}Email:{' '}
                      <a href={`mailto:${message.email}`} className="font-medium text-[#1F1F1F] hover:text-[#B8893B]">
                        {message.email}
                      </a>
                    </>
                  )}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={whatsappLink(message.phone, contactReplyText(message))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:+${toWhatsAppNumber(message.phone)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E8DDD0] hover:border-[#B8893B] text-xs font-semibold text-[#1F1F1F]"
                  >
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                    Call
                  </a>
                  <button
                    type="button"
                    onClick={() => toggleHandled(message)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E8DDD0] hover:border-[#B8893B] disabled:opacity-60 text-xs font-semibold text-[#1F1F1F] cursor-pointer"
                  >
                    {message.status === 'new' ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        Mark handled
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        Reopen
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(message)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-60 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
