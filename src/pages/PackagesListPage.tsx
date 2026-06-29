import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageMeta } from '../components/PageMeta';
import { Card } from '@blinkdotnew/ui';
import { motion } from 'framer-motion';
import { MapPin, Users, ArrowRight } from 'lucide-react';
import { useHeroPackages, TripPackage } from '../hooks/usePackages';

const CATEGORIES = [
  { type: 'golf',    label: 'Golf Weekends',   emoji: '⛳' },
  { type: 'fishing', label: 'Fishing Trips',   emoji: '🎣' },
  { type: 'bucks',   label: 'Bucks Parties',   emoji: '🏆' },
  { type: 'sports',  label: 'Sports Weekends', emoji: '🏉' },
  { type: 'custom',  label: 'Custom Trips',    emoji: '✨' },
];

export function PackagesListPage() {
  const { data: heroPackages, isLoading } = useHeroPackages();

  return (
    <div className="min-h-screen">
      <PageMeta
        title="Our Packages — Golf, Fishing, Bucks &amp; Sports | BlokesTrips"
        description="Golf weekends, fishing charters, bucks parties and sports weekends across Australia. Fully organised group trips from $299pp."
      />
      <Navbar />
      <main id="main-content" className="pt-28 pb-24 bg-secondary/10">
        <div className="container mx-auto px-6">

          {/* Page heading */}
          <div className="text-center mb-16">
            <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Our Experiences</span>
            <h1 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter mb-6">
              Choose Your <span className="text-accent">Legend</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every package includes full organisation, custom gear and cold beer waiting in your room.
              Don't see exactly what you want? We'll build it for you.
            </p>
          </div>

          {/* Hero packages from database — same cards as homepage */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-[2rem] bg-secondary/50 h-96 animate-pulse" />
              ))}
            </div>
          ) : heroPackages && heroPackages.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {heroPackages.map((pkg: TripPackage, index: number) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.08 }}
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
                      <h2 className="text-2xl font-display font-black uppercase italic mb-4 leading-tight group-hover:text-accent transition-colors">
                        {pkg.title}
                      </h2>
                      <ul className="space-y-3 mb-8 flex-1">
                        {(Array.isArray(pkg.features) ? pkg.features : []).slice(0, 3).map((f: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-sm font-medium text-muted-foreground">
                            <span className="text-accent mt-0.5 font-bold">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                      <a
                        href={`/packages/${pkg.package_type}/${pkg.slug}`}
                        className="w-full h-14 flex items-center justify-center bg-primary text-white hover:bg-accent hover:text-primary font-black uppercase italic tracking-tight transition-colors rounded-xl gap-2"
                      >
                        Lock It In <ArrowRight size={16} />
                      </a>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : null}

          {/* Category browse section */}
          <div className="border-t border-secondary pt-16">
            <h2 className="text-2xl font-display font-black uppercase italic mb-8 text-center">Browse by Category</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {CATEGORIES.map(cat => (
                <a
                  key={cat.type}
                  href={`/packages/${cat.type}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-secondary rounded-full text-sm font-black uppercase tracking-widest hover:bg-accent hover:text-primary hover:border-accent transition-all duration-200 shadow-sm"
                >
                  <span>{cat.emoji}</span> {cat.label}
                </a>
              ))}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
