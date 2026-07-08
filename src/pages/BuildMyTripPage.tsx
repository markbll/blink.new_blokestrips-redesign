import React, { useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageMeta } from '../components/PageMeta';
import { CustomTripForm, CustomTripResumeData } from '../components/CustomTripForm';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const PERKS = [
  'Pick exactly what you want included',
  'Any destination, any group size',
  'Options and pricing back within 24 hours',
  'You do nothing except show up',
];

export function BuildMyTripPage() {
  const resumeFrom = useMemo<CustomTripResumeData | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('email') && !params.has('name')) return undefined;
    return {
      name:      params.get('name')      || undefined,
      email:     params.get('email')     || undefined,
      phone:     params.get('phone')     || undefined,
      groupSize: params.get('groupSize') || undefined,
      partialId: params.get('partialId') ? Number(params.get('partialId')) : undefined,
    };
  }, []);

  return (
    <div className="min-h-screen">
      <PageMeta
        title="Build Your Custom Trip | BlokesTrips"
        description="Design your own trip from scratch. Pick the features and highlights you want and we'll build it around you — options and pricing back within 24 hours."
      />
      <Navbar />
      <main id="main-content" className="pt-32 pb-24 bg-page transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Custom Trip</span>
              <h1 className="text-4xl lg:text-6xl font-display font-black uppercase italic leading-[0.9] tracking-tighter mb-8 text-page">
                Build Your<br /><span className="text-accent">Custom Trip</span>
              </h1>
              <p className="text-page-muted text-lg mb-10">
                Can't find the perfect package? Build your own. Tell us who's coming and tick
                exactly what you want included — we'll handle the rest and come back with
                full options and pricing.
              </p>

              <ul className="space-y-4">
                {PERKS.map(perk => (
                  <li key={perk} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center mt-0.5">
                      <Check size={13} className="text-accent" strokeWidth={3} />
                    </span>
                    <span className="text-page font-medium">{perk}</span>
                  </li>
                ))}
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-glass p-10 rounded-[2.5rem] border border-glass"
            >
              <CustomTripForm resumeFrom={resumeFrom} />
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
