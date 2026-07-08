import React from 'react';
import { TripInquiryForm } from './TripInquiryForm';
import { motion } from 'framer-motion';
import { Zap, CreditCard, Shirt, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';

export const InquiryForm = () => {
  return (
    <section id="register" className="py-24 bg-page relative overflow-hidden transition-colors duration-300">
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Get Started</span>
            <h2 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter mb-8 text-page">
              Hand It Over. <br />
              <span className="text-accent">We'll Sort It.</span>
            </h2>
            <p className="text-page-muted text-lg mb-12">
              Tell us what you're after and we'll come back within 24 hours with full trip options and pricing.
              No commitment required.
            </p>

            <div className="space-y-8">
              {[
                { icon: Zap,        title: 'Response within 24 hours',   sub: 'Full trip options and pricing sent directly to you.' },
                { icon: CreditCard, title: '$200 deposit locks your spot', sub: "Protects your group's allocation." },
                { icon: Shirt,      title: 'Customise your trip',         sub: 'Pick your polos, prizes, gear and extras.' },
                { icon: ListChecks, title: 'You do nothing',              sub: 'We manage all registrations, payments and logistics.' },
              ].map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex gap-4 items-start">
                  <div className="bg-icon p-3 rounded-xl text-accent flex-shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-black uppercase italic tracking-tight text-lg text-page">{title}</h4>
                    <p className="text-page-subtle text-sm">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-glass p-10 rounded-[2.5rem] border border-glass"
          >
            <TripInquiryForm
              onSuccess={() => {
                toast.success("Enquiry sent! We'll be in touch within 24 hours.");
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
