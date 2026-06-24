import React from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { usePackagesByType } from '../hooks/usePackages'
import { Button, Card } from '@blinkdotnew/ui'
import { motion } from 'framer-motion'
import { MapPin, Users, ArrowRight } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  golf: 'Golf Weekends',
  fishing: 'Fishing Trips',
  bucks: 'Bucks Parties',
  custom: 'Custom Trips',
}

export function PackageTypePage() {
  const { type } = useParams({ from: '/packages/$type' })
  const { data: packages, isLoading } = usePackagesByType(type)
  const label = TYPE_LABELS[type] || type

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-12 pb-24">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Our Experiences</span>
            <h1 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter mb-8">
              {label}
            </h1>
            <p className="text-muted-foreground text-lg">
              Every package includes full organisation, custom polos, prizes and cold beer waiting in your room.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-[2rem] bg-secondary/30 h-96 animate-pulse" />
              ))}
            </div>
          ) : !packages || packages.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-xl text-muted-foreground">No packages found in this category yet.</p>
              <Button className="mt-6" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map((pkg: any, index: number) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex"
                >
                  <Link
                    to="/packages/$type/$slug"
                    params={{ type: pkg.package_type, slug: pkg.slug }}
                    className="flex flex-col w-full"
                  >
                    <Card className="flex flex-col w-full overflow-hidden border-none shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 rounded-[2rem] bg-white group">
                      <div className="relative h-72 overflow-hidden">
                        <img 
                          src={pkg.image_url} 
                          alt={pkg.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
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
                          {(Array.isArray(pkg.features) ? pkg.features : []).slice(0, 3).map((f: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm font-medium text-muted-foreground">
                              <span className="text-accent mt-0.5 font-bold">✓</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                        <Button className="w-full h-14 bg-primary text-white hover:bg-accent hover:text-primary border-none font-black uppercase italic tracking-tight">
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
