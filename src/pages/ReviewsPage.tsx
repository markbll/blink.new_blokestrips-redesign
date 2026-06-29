import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageMeta } from '../components/PageMeta';

const REVIEWS = [
  { name: "Jake Thompson", trip: "Thurgoona Golf Trip", rating: 5, quote: "Honestly the best weekend we've had in years. Turned up, shirts were waiting, beer was cold, tee times were sorted. I didn't have to organise a single thing." },
  { name: "Mick O'Brien",  trip: "Albury Golf Weekend", rating: 5, quote: "As the usual group organiser I'm always stressed before the trip starts. Having BlokesTrips run everything was an absolute game changer. Worth every cent." },
  { name: "Dave Carter",   trip: "Murray River Weekend", rating: 5, quote: "Even as a non-golfer I had the best time. Everything was thought of. Already locked in next year's trip and bringing three more of the boys." },
];

const reviewsSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BlokesTrips",
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "3", "bestRating": "5" },
  "review": REVIEWS.map(r => ({
    "@type": "Review",
    "author": { "@type": "Person", "name": r.name },
    "reviewBody": r.quote,
    "reviewRating": { "@type": "Rating", "ratingValue": "5" }
  }))
};

export function ReviewsPage() {
  return (
    <div className="min-h-screen">
      <PageMeta
        title="Real Blokes. Real Trips. | BlokesTrips"
        description="Hear from crews who've already locked in their legend status. 5-star rated group trip organiser across Australia."
        schema={reviewsSchema}
        schemaId="reviews-schema"
      />
      <Navbar />
      <main id="main-content" className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Reviews</span>
            <h1 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter">
              Real Blokes. <span className="text-primary/20">Real Trips.</span>
            </h1>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {REVIEWS.map((r, i) => (
              <div key={i} className="bg-secondary/20 p-10 rounded-[2.5rem] hover:scale-[1.02] transition-transform duration-300 shadow-sm hover:shadow-xl">
                <div className="text-accent text-5xl font-serif mb-6">"</div>
                <p className="text-lg font-medium leading-relaxed mb-8 italic">{r.quote}</p>
                <div>
                  <h4 className="font-display font-black uppercase italic tracking-tight text-lg leading-none">{r.name}</h4>
                  <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mt-2">{r.trip}</p>
                  <div className="flex mt-2">{Array.from({ length: r.rating }).map((_, j) => <span key={j} className="text-accent">★</span>)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
