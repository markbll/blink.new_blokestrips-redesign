import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageMeta } from '../components/PageMeta';
import { CheckCircle2 } from 'lucide-react';

export function FranchisePage() {
  return (
    <div className="min-h-screen">
      <PageMeta
        title="Own a BlokesTrips Territory | BlokesTrips"
        description="Join Australia's fastest growing group travel business. Territory licences from $15K. Full training and support included."
      />
      <Navbar />
      <main id="main-content" className="pt-32 pb-24">
        <section className="bg-primary py-24">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <span className="text-accent font-black tracking-widest uppercase text-sm mb-6 block italic">Business Opportunity</span>
            <h1 className="text-5xl lg:text-8xl font-display font-black uppercase italic leading-[0.9] tracking-tighter text-white mb-8">
              Own a <span className="text-accent">BlokesTrips</span> Territory
            </h1>
            <p className="text-xl text-white/70 leading-relaxed mb-10 max-w-2xl mx-auto">
              We're building a nationwide network. You get the brand, leads, booking system and supplier network. You deliver the trips.
            </p>
            <a href="/plan-my-trip"
              className="inline-flex items-center h-16 px-10 bg-accent text-primary font-black uppercase italic tracking-tight text-lg rounded-2xl hover:bg-white transition-colors">
              Get the Franchise Kit
            </a>
          </div>
        </section>

        <section className="py-24 bg-background">
          <div className="container mx-auto px-6 max-w-4xl">
            <h2 className="text-3xl font-display font-black uppercase italic text-center mb-16">What's Included</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'BlokesTrips brand licence for your territory',
                'Full trip planning system and supplier network',
                'Lead generation and marketing support',
                'Comprehensive training and onboarding',
                'Ongoing support from the national team',
                'Territories from $15K — limited availability',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-6 bg-secondary/20 rounded-2xl">
                  <CheckCircle2 className="text-accent flex-shrink-0 mt-0.5" size={20} />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
