import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Flame } from 'lucide-react'
import { useHeroPackages } from '../hooks/usePackages'
import { PackageCard } from './PackageCard'

const CATEGORIES = [
  { type: 'golf',    label: 'Golf Weekends',   emoji: '⛳' },
  { type: 'fishing', label: 'Fishing Trips',   emoji: '🎣' },
  { type: 'sports',  label: 'Sports Weekends', emoji: '🏉' },
  { type: 'custom',  label: 'Custom Trips',    emoji: '✨' },
]

export const Packages = () => {
  const { data: heroPackages, isLoading } = useHeroPackages()
  const featured = (heroPackages || []).slice(0, 3)

  return (
    <section id="packages" className="py-24 bg-primary">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Pick Your Trip</span>
          <h2 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter mb-8 text-white">
            Golf. Fishing. Blokes Trips. <span className="text-accent">All Sorted.</span>
          </h2>
          <p className="text-white/70 text-lg mb-3">
            Every package includes full organisation — invites, payments, accommodation, gear and itinerary.
            You just show up. Don't see what you want? We'll build it for your crew.
          </p>
          <p className="inline-flex items-center gap-1.5 text-amber-400 text-sm font-bold">
            <Flame size={14} /> Popular weekends fill 8–12 weeks out — lock yours in early.
          </p>
        </div>

        {/* Category navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-14">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.type}
              to="/packages/$type"
              params={{ type: cat.type }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 text-white rounded-full text-sm font-black uppercase tracking-widest hover:bg-accent hover:text-primary hover:border-accent transition-all duration-200"
            >
              <span>{cat.emoji}</span> {cat.label}
            </Link>
          ))}
        </div>

        {/* Hero packages — max 3 from DB */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="rounded-[2rem] bg-secondary/50 h-96 animate-pulse flex items-center justify-center">
                <span className="text-muted-foreground text-sm uppercase font-bold tracking-widest">Loading...</span>
              </div>
            ))
          ) : featured.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <p className="text-muted-foreground text-lg">No featured packages yet. Check back soon!</p>
            </div>
          ) : (
            featured.map((pkg, index) => (
              <PackageCard key={pkg.id} pkg={pkg} index={index} />
            ))
          )}
        </div>

        {/* Browse all */}
        <div className="text-center mt-12">
          <a href="/packages" className="inline-flex items-center gap-2 text-white/50 hover:text-accent font-bold uppercase tracking-widest text-sm transition-colors">
            Browse all packages <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}
