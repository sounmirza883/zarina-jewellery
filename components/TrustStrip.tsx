import { ShieldCheck, RotateCcw, Truck, MessageCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';

export default function TrustStrip() {
  const trustItems = [
    {
      icon: ShieldCheck,
      title: 'Cash on Delivery',
      desc: 'Pay at your doorstep after inspecting the parcel safely.',
    },
    {
      icon: RotateCcw,
      title: '7-Day Easy Returns',
      desc: 'Hassle-free exchanges or returns on unworn items.',
    },
    {
      icon: Truck,
      title: 'Nationwide Delivery',
      desc: 'Swift 2 to 4 working days dispatch to every city & town in Pakistan.',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Support',
      desc: 'Friendly real-time customer care on WhatsApp from 11 AM - 10 PM.',
    },
  ];

  return (
    <section className="bg-white border-y border-[#B8893B]/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-lg bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] transition-colors border border-[#FAF7F2] hover:border-[#B8893B]/30"
              >
                <div className="w-12 h-12 rounded-full bg-[#0B0D12] text-[#D9B66A] flex items-center justify-center shrink-0 shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-semibold text-[#1F1F1F] mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#575757] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
