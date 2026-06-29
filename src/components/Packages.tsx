import React from 'react'
import { Link } from '@tanstack/react-router'
import { Button, Card } from '@blinkdotnew/ui'
import { motion } from 'framer-motion'
import { MapPin, Users, ArrowRight } from 'lucide-react'
import { useHeroPackages } from '../hooks/usePackages'

const CATEGORIES = [
  { type: 'golf',    label: 'Golf Weekends',   emoji: '⛳' },
  { type: 'fishing', label: 'Fishing Trips',   emoji: '🎣' },
  { type: 'bucks',   label: 'Bucks Parties',   emoji: '🏆' },
  { type: 'sports',  label: 'Sports Weekends', emoji: '🏉' },
  { type: 'custom',  label: 'Custom Trips',    emoji: '✨' },
]

export const Packages = () => {
  const { data: heroPackages, isLoading } = useHeroPackages()
  const featured = (heroPackages || []).slice(0, 3)

  return (
    <section id="packages" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Our Experiences</span>
          <h2 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter mb-8">
            Choose Your <span className="text-accent">Legend</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Every package includes full organisation, custom polos, prizes and cold beer waiting in your room.
            Don't see exactly what you want? We'll build it for you.
          </p>
        </div>

        {/* Category navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-14">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.type}
              to="/packages/$type"
              params={{ type: cat.type }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-secondary rounded-full text-sm font-black uppercase tracking-widest hover:bg-accent hover:text-primary hover:border-accent transition-all duration-200 shadow-sm"
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
            featured.map((pkg: any, index: number) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex"
              >
                <Card className="flex flex-col w-full overflow-hidden border-none shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 rounded-[2rem] bg-white group">
                  <div className="relative h-72 overflow-hidden">
                    <img
                      src={pkg.image_url}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading={index === 0 ? 'eager' : 'lazy'}
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
                    <h3 className="text-2xl font-display font-black uppercase italic mb-6 leading-tight group-hover:text-accent transition-colors">
                      {pkg.title}
                    </h3>
                    <ul className="space-y-4 mb-10 flex-1">
                      {(Array.isArray(pkg.features) ? pkg.features : []).slice(0, 3).map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-muted-foreground">
                          <span className="text-accent mt-0.5 font-bold">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="w-full h-14 bg-primary text-white hover:bg-accent hover:text-primary border-none font-black uppercase italic tracking-tight">
                      <Link to="/packages/$type/$slug" params={{ type: pkg.package_type, slug: pkg.slug }}>
                        Lock It In <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Browse all */}
        <div className="text-center mt-12">
          <a href="/packages" className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent font-bold uppercase tracking-widest text-sm transition-colors">
            Browse all packages <ArrowRight size={16} />
          </a>
        </div>

        {/* Franchise block */}
        <div id="franchise" className="mt-20 p-12 bg-primary rounded-[2.5rem] relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-grid-white" />
          <div className="relative z-10 max-w-xl">
            <h3 className="text-3xl lg:text-5xl font-display font-black text-white uppercase italic leading-none mb-4">
              Own a <span className="text-accent">BlokesTrips</span> Territory
            </h3>
            <p className="text-white/60 text-lg">
              We're building a nationwide network. You get the brand, leads, booking system and supplier network. You deliver the trips.
            </p>
          </div>
          <Button className="relative z-10 bg-accent text-primary hover:bg-white hover:text-primary h-16 px-10 rounded-2xl font-black uppercase italic tracking-tight text-lg shadow-xl shadow-accent/20">
            Get Franchise Kit
          </Button>
        </div>
      </div>
    </section>
  )
}
