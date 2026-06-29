import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { HowItWorks } from '../components/HowItWorks';
import { PageMeta } from '../components/PageMeta';

export function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      <PageMeta
        title="How It Works | BlokesTrips"
        description="Four steps. Tell us the vision, the boys lock in, we sort the logistics, you show up. No group chat chaos required."
      />
      <Navbar />
      <main id="main-content" className="pt-20">
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
