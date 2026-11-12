'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { isValidPakistaniPhone } from '@/lib/shop-logic';
import { sendContactMessage } from '@/app/actions/send-contact';
import { siteConfig } from '@/config/site';

const contactSchema = z.object({
  // Lengths match the checks in submit_contact (supabase/schema.sql).
  fullName: z
    .string()
    .trim()
    .min(3, { message: 'Please enter your name' })
    .max(100, { message: 'Name must be 100 characters or fewer' }),
  phone: z
    .string()
    .min(10, { message: 'Phone number is required' })
    .refine((val) => isValidPakistaniPhone(val), {
      message: 'Enter a valid Pakistani phone number',
    }),
  email: z.string().email({ message: 'Enter a valid email' }).or(z.literal('')),
  subject: z
    .string()
    .trim()
    .min(3, { message: 'Please enter a subject' })
    .max(150, { message: 'Subject must be 150 characters or fewer' }),
  message: z
    .string()
    .trim()
    .min(10, { message: 'Message must be at least 10 characters' })
    .max(2000, { message: 'Message must be 2000 characters or fewer' }),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactFormClient() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  // Hidden field: real visitors never see it, bots tend to fill it in.
  const [honeypot, setHoneypot] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setServerError('');
    try {
      const result = await sendContactMessage(values, honeypot);
      if ('error' in result) {
        setServerError(result.error);
        return;
      }
    } catch {
      // The request itself failed (offline, server unreachable): nothing was saved.
      setServerError('We could not send your message. Please check your connection and try again, or message us on WhatsApp.');
      return;
    }
    setSubmitted(true);
    reset();
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#B8893B]/20 shadow-xs">
      <h3 className="font-serif text-2xl text-[#1F1F1F] font-normal mb-2">
        Send Us a Message
      </h3>
      <p className="text-xs text-[#575757] mb-6">
        Have a question about a product, customization, or an existing order? Send us a message and our team will get back to you promptly.
      </p>

      {submitted ? (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h4 className="font-serif text-lg font-semibold text-emerald-900">
            Thank you for reaching out!
          </h4>
          <p className="text-xs text-emerald-700 leading-relaxed max-w-sm mx-auto">
            Your inquiry has been received. A Zarina Jewels customer representative will respond to your phone or WhatsApp shortly.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-2 text-xs text-emerald-900 underline font-medium hover:text-emerald-700"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="contact-name" className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
              Your Name <span className="text-[#991B1B]">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              {...register('fullName')}
              placeholder="e.g. Fatima Ali"
              className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF7F2] border rounded-md text-[#1F1F1F] focus:outline-hidden ${
                errors.fullName ? 'border-[#991B1B]' : 'border-[#E8DDD0] focus:border-[#B8893B]'
              }`}
            />
            {errors.fullName && (
              <p className="text-[11px] text-[#991B1B] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.fullName.message}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-phone" className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
                Phone Number <span className="text-[#991B1B]">*</span>
              </label>
              <input
                id="contact-phone"
                type="tel"
                {...register('phone')}
                placeholder="0300 1234567"
                className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF7F2] border rounded-md text-[#1F1F1F] focus:outline-hidden ${
                  errors.phone ? 'border-[#991B1B]' : 'border-[#E8DDD0] focus:border-[#B8893B]'
                }`}
              />
              {errors.phone && (
                <p className="text-[11px] text-[#991B1B] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.phone.message}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
                Email Address (Optional)
              </label>
              <input
                id="contact-email"
                type="email"
                {...register('email')}
                placeholder="fatima@example.com"
                className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF7F2] border rounded-md text-[#1F1F1F] focus:outline-hidden ${
                  errors.email ? 'border-[#991B1B]' : 'border-[#E8DDD0] focus:border-[#B8893B]'
                }`}
              />
              {errors.email && (
                <p className="text-[11px] text-[#991B1B] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="contact-subject" className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
              Subject <span className="text-[#991B1B]">*</span>
            </label>
            <input
              id="contact-subject"
              type="text"
              {...register('subject')}
              placeholder="e.g. Inquiry about Noor Bridal Set delivery"
              className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF7F2] border rounded-md text-[#1F1F1F] focus:outline-hidden ${
                errors.subject ? 'border-[#991B1B]' : 'border-[#E8DDD0] focus:border-[#B8893B]'
              }`}
            />
            {errors.subject && (
              <p className="text-[11px] text-[#991B1B] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.subject.message}</span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
              Message <span className="text-[#991B1B]">*</span>
            </label>
            <textarea
              id="contact-message"
              rows={4}
              {...register('message')}
              placeholder="How can we assist you with our jewellery collections?"
              className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF7F2] border rounded-md text-[#1F1F1F] focus:outline-hidden ${
                errors.message ? 'border-[#991B1B]' : 'border-[#E8DDD0] focus:border-[#B8893B]'
              }`}
            />
            {errors.message && (
              <p className="text-[11px] text-[#991B1B] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.message.message}</span>
              </p>
            )}
          </div>

          {serverError && (
            <div role="alert" className="p-3 rounded-lg border border-[#991B1B]/30 bg-rose-50 text-xs text-[#991B1B] space-y-1">
              <p className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{serverError}</span>
              </p>
              <a
                href={siteConfig.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-semibold underline underline-offset-2 hover:text-[#0B0D12]"
              >
                Message us on WhatsApp instead
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-[#0B0D12] hover:bg-[#B8893B] disabled:bg-[#8A8A8A] text-white text-xs uppercase tracking-widest font-semibold rounded-md transition-colors shadow flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Sending...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
