import React from 'react';
import { Link } from '@tanstack/react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageMeta } from '../components/PageMeta';
import { Flame } from 'lucide-react';
import { useHeroPackages } from '../hooks/usePackages';
import { TrustBar } from '../components/TrustBar';
import { PackageCard } from '../components/PackageCard';

const CATEGORIES = [
  { type: 'golf',    label: 'Golf Weekends',   emoji: '⛳' },
  { type: 'fishing', label: 'Fishing Trips',   emoji: '🎣' },
  { type: 'sports',  label: 'Sports Weekends', emoji: '🏉' },
  { type: 'custom',  label: 'Custom Trips',    emoji: '✨' },
];

export function PackagesListPage() {
  const { data: heroPackages, isLoading } = useHeroPackages();

  return (
    <div className="min-h-screen">
      <PageMeta
        title="Our Packages — Golf, Fishing &amp; Sports | BlokesTrips"
        description="Golf weekends, fishing charters and sports weekends across Australia. Fully organised group trips from $299pp."
      />
      <Navbar />
      <main id="main-content" className="pt-28 pb-24 bg-page transition-colors duration-300">
        <div className="container mx-auto px-6">

          {/* Page heading */}
          <div className="text-center mb-16">
            <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Pick Your Trip</span>
            <h1 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter mb-6 text-page">
              Golf. Fishing. Blokes Trips. <span className="text-accent">All Sorted.</span>
            </h1>
            <p className="text-page-muted text-lg max-w-2xl mx-auto mb-3">
              Every package includes full organisation — invites, payments, accommodation, gear and itinerary.
              You just show up. Don't see what you want? We'll build it for your crew.
            </p>
            <p className="inline-flex items-center gap-1.5 text-amber-400 text-sm font-bold">
              <Flame size={14} /> Popular weekends fill 8–12 weeks out — lock yours in early.
            </p>
          </div>

          {/* Hero packages from database */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-[2rem] bg-white/5 h-96 animate-pulse" />
              ))}
            </div>
          ) : heroPackages && heroPackages.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {heroPackages.map((pkg, index) => (
                <PackageCard key={pkg.id} pkg={pkg} index={index} />
              ))}
            </div>
          ) : null}

          {/* Category browse section */}
          <div className="border-t border-white/10 pt-16">
            <h2 className="text-2xl font-display font-black uppercase italic mb-8 text-center text-page">Browse by Category</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.type}
                  to="/packages/$type"
                  params={{ type: cat.type }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-glass border border-glass text-page rounded-full text-sm font-black uppercase tracking-widest hover:bg-accent hover:text-primary hover:border-accent transition-all duration-200"
                >
                  <span>{cat.emoji}</span> {cat.label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>
      <TrustBar dark />
      <Footer />
    </div>
  );
}
