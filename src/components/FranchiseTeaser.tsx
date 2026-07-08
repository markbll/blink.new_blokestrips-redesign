import React from 'react';
import { Button } from '@blinkdotnew/ui';

/**
 * Separated from the booking flow on purpose — a B2B franchise pitch sitting
 * mid-browse competes with and distracts the customer who's ready to book.
 */
export const FranchiseTeaser: React.FC = () => {
  return (
    <section id="franchise" className="py-20 bg-[#0a0e1a]">
      <div className="container mx-auto px-6">
        <div className="p-12 bg-primary rounded-[2.5rem] relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-grid-white" />
          <div className="relative z-10 max-w-xl">
            <h3 className="text-3xl lg:text-5xl font-display font-black text-white uppercase italic leading-none mb-4">
              Own a <span className="text-accent">BlokesTrips</span> Territory
            </h3>
            <p className="text-white/60 text-lg">
              We're building a nationwide network. You get the brand, leads, booking system and supplier network. You deliver the trips.
            </p>
          </div>
          <Button asChild className="relative z-10 bg-accent text-primary hover:bg-white hover:text-primary h-16 px-10 rounded-2xl font-black uppercase italic tracking-tight text-lg shadow-xl shadow-accent/20">
            <a href="/franchise">Get Franchise Kit</a>
          </Button>
        </div>
      </div>
    </section>
  );
};
