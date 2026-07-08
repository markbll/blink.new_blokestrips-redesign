import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageMeta } from '../components/PageMeta';
import { useReviews } from '../hooks/useReviews';

export function ReviewsPage() {
  const { reviews, enabled, isLoading } = useReviews();

  const featured = reviews[0];
  const rest     = reviews.slice(1);

  const reviewsSchema = reviews.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BlokesTrips",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1),
      "reviewCount": String(reviews.length),
      "bestRating": "5"
    },
    "review": reviews.map(r => ({
      "@type": "Review",
      "author": { "@type": "Person", "name": r.name },
      "reviewBody": r.text,
      "reviewRating": { "@type": "Rating", "ratingValue": String(r.rating || 5) }
    }))
  } : undefined;

  return (
    <div className="min-h-screen">
      <PageMeta
        title="Real Blokes. Real Trips. | BlokesTrips"
        description="Hear from crews who've already locked in their legend status. 5-star rated group trip organiser across Australia."
        schema={reviewsSchema}
        schemaId="reviews-schema"
      />
      <Navbar />
      <main id="main-content" className="pt-32 pb-24 bg-page transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Reviews</span>
            <h1 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter text-page">
              What Happens When <span className="text-accent">Someone Else<br />Does All the Work</span>
            </h1>
          </div>

          {isLoading ? (
            <div className="space-y-8">
              {[1, 2].map(i => <div key={i} className="h-48 bg-glass border border-glass rounded-[2.5rem] animate-pulse" />)}
            </div>
          ) : !enabled || reviews.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-page-subtle text-lg">
                Reviews are coming soon. In the meantime, <a href="/plan-my-trip" className="text-accent font-bold hover:underline">plan your trip</a> and be the first to leave one.
              </p>
            </div>
          ) : (
            <>
              {featured && (
                <div className="bg-primary rounded-[2.5rem] p-10 lg:p-14 mb-8 border border-white/10">
                  <div className="text-accent text-5xl font-serif mb-6">"</div>
                  <p className="text-white text-xl lg:text-2xl font-medium leading-relaxed mb-8 italic">
                    {featured.text}
                  </p>
                  <div>
                    <h4 className="font-display font-black uppercase italic tracking-tight text-lg text-white leading-none">{featured.name}</h4>
                    <p className="text-white/50 text-xs uppercase tracking-widest font-bold mt-2">{featured.trip}</p>
                    <div className="flex mt-2">{Array.from({ length: featured.rating || 5 }).map((_, j) => <span key={j} className="text-accent">★</span>)}</div>
                  </div>
                </div>
              )}

              {rest.length > 0 && (
                <div className="grid md:grid-cols-2 gap-8">
                  {rest.map((r, i) => (
                    <div key={r.id ?? i} className="bg-glass border border-glass p-10 rounded-[2.5rem] hover:scale-[1.02] transition-all duration-300">
                      <div className="text-accent text-5xl font-serif mb-6">"</div>
                      <p className="text-lg font-medium leading-relaxed mb-8 italic text-page">{r.text}</p>
                      <div>
                        <h4 className="font-display font-black uppercase italic tracking-tight text-lg leading-none text-page">{r.name}</h4>
                        <p className="text-page-subtle text-xs uppercase tracking-widest font-bold mt-2">{r.trip}</p>
                        <div className="flex mt-2">{Array.from({ length: r.rating || 5 }).map((_, j) => <span key={j} className="text-accent">★</span>)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
