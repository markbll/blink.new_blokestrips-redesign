import React, { useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { TripInquiryForm, ResumeData } from '../components/TripInquiryForm';
import { PageMeta } from '../components/PageMeta';

export function PlanMyTripPage() {
  // "Still keen, mate?" recovery emails link back here with the enquiry's
  // known details in the query string so returning users don't retype them.
  const resumeFrom = useMemo<ResumeData | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('email') && !params.has('name')) return undefined;
    return {
      name:      params.get('name')      || undefined,
      email:     params.get('email')     || undefined,
      phone:     params.get('phone')     || undefined,
      tripType:  params.get('tripType')  || undefined,
      groupSize: params.get('groupSize') || undefined,
      partialId: params.get('partialId') ? Number(params.get('partialId')) : undefined,
    };
  }, []);

  return (
    <div className="min-h-screen">
      <PageMeta
        title="Plan My Trip — Get a Fast Quote | BlokesTrips"
        description="Tell us what you're after and we'll come back within 24 hours with full trip options and pricing. No commitment required."
      />
      <Navbar />
      <main id="main-content" className="pt-32 pb-24 bg-secondary/10">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="text-center mb-12">
            <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Get Started</span>
            <h1 className="text-4xl lg:text-6xl font-display font-black uppercase italic leading-[0.9] tracking-tighter mb-4">
              Plan My Trip
            </h1>
            <p className="text-muted-foreground text-lg">Tell us the vision and we'll handle everything else. Back to you within 24 hours.</p>
          </div>
          <div className="bg-white rounded-[2rem] p-8 shadow-xl">
            <TripInquiryForm showTitle={false} resumeFrom={resumeFrom} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
