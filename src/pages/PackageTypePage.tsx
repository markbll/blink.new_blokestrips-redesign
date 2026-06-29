import React from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { PageMeta } from '../components/PageMeta'
import { usePackagesByType } from '../hooks/usePackages'
import { Button, Card } from '@blinkdotnew/ui'
import { motion } from 'framer-motion'
import { MapPin, Users, ArrowRight, ArrowLeft } from 'lucide-react'

export const TYPE_LABELS: Record<string, { label: string; emoji: string; description: string }> = {
  golf:    { label: 'Golf Weekends',   emoji: '⛳', description: 'Championship courses, luxury stays and cold beer waiting at the 19th hole.' },
  fishing: { label: 'Fishing Trips',   emoji: '🎣', description: 'Deep sea charters, lake escapes and guided fishing adventures across Australia.' },
  bucks:   { label: 'Bucks Parties',   emoji: '🏆', description: 'Epic send-offs with activities, accommodation and surprises all sorted.' },
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
    bucks:   { title: 'Bucks Party Packages | BlokesTrips',    desc: 'The ultimate send-off — fully planned, zero stress. Activities, accommodation and surprises all handled. From $399pp.' },
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
            </div>
          </div>
        </section>

        {/* Category tabs */}
        <div className="bg-background border-b sticky top-[72px] z-40">
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
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <span>{cat.emoji}</span> {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Packages grid */}
        <section className="py-16 bg-secondary/20">
          <div className="container mx-auto px-6">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-[2rem] bg-secondary/30 h-96 animate-pulse" />
                ))}
              </div>
            ) : !packages || packages.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-2xl font-display font-black uppercase italic text-muted-foreground mb-6">
                  No {meta.label} yet
                </p>
                <p className="text-muted-foreground mb-8">Check back soon or get in touch to build a custom trip.</p>
                <Button asChild className="bg-accent text-primary border-none font-black uppercase italic">
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest mb-8">
                  {packages.length} {packages.length === 1 ? 'package' : 'packages'} available
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {packages.map((pkg: any, index: number) => (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.08 }}
                      viewport={{ once: true }}
                      className="flex"
                    >
                      <Link
                        to="/packages/$type/$slug"
                        params={{ type: pkg.package_type, slug: pkg.slug }}
                        className="flex flex-col w-full"
                      >
                        <Card className="flex flex-col w-full overflow-hidden border-none shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 rounded-[2rem] bg-white group cursor-pointer">
                          <div className="relative h-72 overflow-hidden">
                            <img
                              src={pkg.image_url}
                              alt={pkg.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="absolute top-6 left-6 flex flex-col gap-2">
                              <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <MapPin size={10} className="text-accent" /> {pkg.location}
                              </span>
                              <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Users size={10} className="text-accent" /> {pkg.group_size}
                              </span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                              <span className="text-accent font-black text-2xl uppercase italic">{pkg.price}</span>
                              <p className="text-white/60 text-xs uppercase tracking-widest font-bold">Per person</p>
                            </div>
                          </div>
                          <div className="p-8 flex-1 flex flex-col">
                            <h3 className="text-2xl font-display font-black uppercase italic mb-4 leading-tight group-hover:text-accent transition-colors">
                              {pkg.title}
                            </h3>
                            {pkg.description && (
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{pkg.description}</p>
                            )}
                            <ul className="space-y-3 mb-8 flex-1">
                              {(Array.isArray(pkg.features) ? pkg.features : []).slice(0, 3).map((f: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-medium text-muted-foreground">
                                  <span className="text-accent mt-0.5 font-bold">✓</span> {f}
                                </li>
                              ))}
                            </ul>
                            <div className="flex items-center justify-between pt-4 border-t border-secondary">
                              <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{pkg.duration}</span>
                              <span className="inline-flex items-center gap-1 text-accent font-black text-sm uppercase italic">
                                View Trip <ArrowRight size={14} />
                              </span>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
