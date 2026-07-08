import React from 'react'
import { Navbar }    from '../components/Navbar'
import { Hero }      from '../components/Hero'
import { HowItWorks } from '../components/HowItWorks'
import { Packages }  from '../components/Packages'
import { TripFinder } from '../components/TripFinder'
import { TrustBar }  from '../components/TrustBar'
import { InquiryForm } from '../components/InquiryForm'
import { Footer }    from '../components/Footer'
import { PageMeta }  from '../components/PageMeta'
import { useReviews } from '../hooks/useReviews'

const homeSchema = [
  {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "BlokesTrips",
    "description": "Done-for-you group trip planning for Australian men.",
    "url": "https://blokestrips.com.au",
    "areaServed": "Australia",
    "priceRange": "$$",
    "sameAs": ["https://www.instagram.com/blokestrips","https://www.facebook.com/blokestrips"],
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "3", "bestRating": "5" }
  }
]

export function HomePage() {
  const { reviews, enabled: reviewsEnabled } = useReviews()
  const featuredReview = reviews[0]
  const otherReviews   = reviews.slice(1, 3)
  return (
    <div className="min-h-screen">
      <PageMeta
        title="BlokesTrips — Australia's #1 Group Trip Organiser"
        description="Golf trips, fishing getaways, sports weekends — fully organised end-to-end. You bring the crew. We handle absolutely everything else."
        schema={homeSchema}
        schemaId="home-schema"
      />
      <Navbar />
      <main id="main-content">
        <Hero />

        <TrustBar dark />

        {/* What We Handle — the core product, front and centre */}
        <section className="py-20 bg-primary text-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <p className="text-accent font-black tracking-widest uppercase text-sm mb-4">What We Actually Do</p>
              <h3 className="text-3xl lg:text-5xl font-display font-black uppercase italic leading-[0.95] tracking-tighter mb-6">
                Most trip organisers spend 40+ hours on admin.<br />
                <span className="text-accent">Our clients spend zero.</span>
              </h3>
              <p className="text-white/70 text-lg mb-12">
                Here's what you won't have to do when Blokes Trips handles your next trip:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  'Chase RSVPs from the group',
                  'Collect deposits one by one',
                  'Allocate rooms and beds',
                  'Book tee times or charters',
                  'Organise transport',
                  'Handle last-minute dropouts',
                  'Send reminder emails',
                  'Manage the group chat admin',
                  'Coordinate meal bookings',
                  'Organise competition scoring',
                  'Prepare trip itineraries',
                  'Deal with last-minute changes',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-5 py-4 border border-white/10">
                    <span className="text-accent font-black text-lg flex-shrink-0">✓</span>
                    <span className="text-white text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-white/50 text-sm mt-8 text-center italic">
                You send us the individuals contacts, group size and dates. We handle everything above and more.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-accent text-primary relative overflow-hidden">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-4xl lg:text-6xl font-display font-black uppercase italic leading-[0.9] tracking-tighter mb-8">
                You Shouldn't Have to Work<br />
                This Hard for a Weekend Away.
              </h3>
              <p className="text-xl lg:text-2xl font-medium leading-relaxed opacity-90">
                The organiser always does all the work — and never gets to enjoy it.
                Blokes Trips changes that.
              </p>
            </div>
          </div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        </section>

        <HowItWorks />
        <Packages />
        <TripFinder />

        {reviewsEnabled && reviews.length > 0 && (
          <section id="reviews" className="py-24 bg-page transition-colors duration-300">
            <div className="container mx-auto px-6">
              <div className="text-center mb-20">
                <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Real Blokes</span>
                <h2 className="text-4xl lg:text-6xl font-display font-black uppercase italic leading-[0.9] tracking-tighter text-page">
                  What Happens When<br /><span className="text-accent">Someone Else Does All the Work</span>
                </h2>
              </div>

              {/* Feature the first review front and centre */}
              {featuredReview && (
                <div className="bg-primary rounded-[2.5rem] p-10 lg:p-14 mb-8">
                  <div className="text-accent text-5xl font-serif mb-6">"</div>
                  <p className="text-white text-xl lg:text-2xl font-medium leading-relaxed mb-8 italic">
                    {featuredReview.text}
                  </p>
                  <div>
                    <h4 className="font-display font-black uppercase italic tracking-tight text-lg text-white leading-none">{featuredReview.name}</h4>
                    <p className="text-white/50 text-xs uppercase tracking-widest font-bold mt-2">{featuredReview.trip}</p>
                  </div>
                </div>
              )}

              {otherReviews.length > 0 && (
                <div className="grid md:grid-cols-2 gap-8">
                  {otherReviews.map((t, i) => (
                    <div key={t.id ?? i} className="bg-glass border border-glass p-10 rounded-[2.5rem] relative hover:scale-[1.02] transition-all duration-300">
                      <div className="text-accent text-5xl font-serif mb-6">"</div>
                      <p className="text-lg font-medium leading-relaxed mb-8 italic text-page">{t.text}</p>
                      <div>
                        <h4 className="font-display font-black uppercase italic tracking-tight text-lg leading-none text-page">{t.name}</h4>
                        <p className="text-page-subtle text-xs uppercase tracking-widest font-bold mt-2">{t.trip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <InquiryForm />
      </main>
      <Footer />
    </div>
  )
}
