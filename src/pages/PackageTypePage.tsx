import React from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { PageMeta } from '../components/PageMeta'
import { usePackagesByType } from '../hooks/usePackages'
import { Button } from '@blinkdotnew/ui'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { TrustBar } from '../components/TrustBar'
import { PackageCard } from '../components/PackageCard'

export const TYPE_LABELS: Record<string, { label: string; emoji: string; description: string }> = {
  golf:    { label: 'Golf Weekends',   emoji: '⛳', description: 'Championship courses, luxury stays and cold beer waiting at the 19th hole.' },
  fishing: { label: 'Fishing Trips',   emoji: '🎣', description: 'Deep sea charters, lake escapes and guided fishing adventures across Australia.' },
  sports:  { label: 'Sports Weekends', emoji: '🏉', description: 'Premium seats, pre-match events and accommodation for AFL and NRL weekends.' },
  custom:  { label: 'Custom Trips',    emoji: '✨', description: "Can't find what you're after? We'll build the perfect trip from scratch." },
}

const ALL_CATEGORIES = Object.entries(TYPE_LABELS).map(([type, meta]) => ({ type, ...meta }))

export function PackageTypePage() {
  const { type } = useParams({ from: '/packages/$type' })
  const { data: packages, isLoading } = usePackagesByType(type)
  const meta = TYPE_LABELS[type] || { label: type, emoji: '🗺️', description: 'Browse our packages.' }

  const PAGE_META: Record<string, { title: string; desc: string }> = {
    golf:    { title: 'Golf Weekend Packages | BlokesTrips',   desc: 'Championship courses, luxury accommodation and cold beer waiting at the 19th hole. Fully organised golf weekends from $599pp.' },
    fishing: { title: 'Fishing Charter Packages | BlokesTrips', desc: 'Deep sea fishing charters with experienced guides. Accommodation and gear all sorted. From $550pp.' },
    sports:  { title: 'Sports Weekend Packages | BlokesTrips', desc: 'AFL and NRL game day weekends — premium seats, accommodation and transport sorted. From $299pp.' },
    custom:  { title: 'Custom Trip Packages | BlokesTrips',    desc: "Can't find what you're after? Tell us the vision and we'll build it. Every detail handled end-to-end." },
  }
  const pm = PAGE_META[type] || { title: `${meta.label} | BlokesTrips`, desc: meta.description }

  return (
    <div className="min-h-screen">
      <PageMeta title={pm.title} description={pm.desc} />
      <Navbar />
      <main id="main-content">
        {/* Category hero */}
        <section className="pt-32 pb-16 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-grid-white pointer-events-none" />
          <div className="container mx-auto px-6 relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-bold uppercase tracking-widest mb-8 transition-colors">
              <ArrowLeft size={14} /> Home
            </Link>
            <div className="max-w-3xl">
              <span className="text-6xl mb-4 block">{meta.emoji}</span>
              <h1 className="text-5xl lg:text-8xl font-display font-black uppercase italic leading-[0.9] tracking-tighter text-white mb-6">
                {meta.label}
              </h1>
              <p className="text-xl text-white/60 leading-relaxed">{meta.description}</p>
              {type === 'custom' && (
                <Button asChild size="lg" className="mt-8 bg-accent text-primary hover:bg-accent/90 border-none font-black h-16 px-8 text-lg uppercase italic tracking-tight">
                  <Link to="/build-my-trip">Build Your Custom Trip <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Category tabs */}
        <div className="bg-page border-b border-glass sticky top-[72px] z-40">
          <div className="container mx-auto px-6">
            <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
              {ALL_CATEGORIES.map(cat => (
                <Link
                  key={cat.type}
                  to="/packages/$type"
                  params={{ type: cat.type }}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                    cat.type === type
                      ? 'bg-accent text-primary'
                      : 'text-page-muted hover:text-page hover:bg-glass'
                  }`}
                >
                  <span>{cat.emoji}</span> {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Packages grid */}
        <section className="py-16 bg-page">
          <div className="container mx-auto px-6">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-[2rem] bg-glass h-96 animate-pulse" />
                ))}
              </div>
            ) : !packages || packages.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-2xl font-display font-black uppercase italic text-page-muted mb-6">
                  No {meta.label} yet
                </p>
                <p className="text-page-subtle mb-8">Check back soon or build your own trip from scratch.</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button asChild className="bg-accent text-primary border-none font-black uppercase italic">
                    <Link to="/build-my-trip">Build Your Custom Trip</Link>
                  </Button>
                  <Button asChild variant="outline" className="font-black uppercase italic">
                    <Link to="/">Back to Home</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-page-subtle uppercase font-bold tracking-widest mb-8">
                  {packages.length} {packages.length === 1 ? 'package' : 'packages'} available
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {packages.map((pkg, index) => (
                    <PackageCard key={pkg.id} pkg={pkg} index={index} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <TrustBar dark />
      <Footer />
    </div>
  )
}
