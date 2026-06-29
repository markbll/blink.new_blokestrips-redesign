import React from 'react';
import { TripInquiryForm } from './TripInquiryForm';
import { motion } from 'framer-motion';
import { Zap, CreditCard, Shirt, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';

export const InquiryForm = () => {
  return (
    <section id="register" className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Get Started</span>
            <h2 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter mb-8">
              Ready to <br />
              <span className="text-primary/20">Plan Your</span> Next Trip?
            </h2>
            <p className="text-muted-foreground text-lg mb-12">
              Tell us what you're after and we'll come back within 24 hours with full trip options and pricing. 
              No commitment required.
            </p>

            <div className="space-y-8">
              <div className="flex gap-4 items-start">
                <div className="bg-secondary p-3 rounded-xl text-accent">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-display font-black uppercase italic tracking-tight text-lg">Response within 24 hours</h4>
                  <p className="text-muted-foreground text-sm">Full trip options and pricing sent directly to you.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-secondary p-3 rounded-xl text-accent">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-display font-black uppercase italic tracking-tight text-lg">$200 deposit locks your spot</h4>
                  <p className="text-muted-foreground text-sm">Non-refundable. Protects your group's allocation.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-secondary p-3 rounded-xl text-accent">
                  <Shirt className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-display font-black uppercase italic tracking-tight text-lg">Everything included</h4>
                  <p className="text-muted-foreground text-sm">Polos, prizes, stubby holders, beer on arrival.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-secondary p-3 rounded-xl text-accent">
                  <ListChecks className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-display font-black uppercase italic tracking-tight text-lg">You do nothing</h4>
                  <p className="text-muted-foreground text-sm">We manage all registrations, payments and logistics.</p>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-secondary/30 p-10 rounded-[2.5rem] border border-secondary"
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
