import React from 'react'
import { Link } from '@tanstack/react-router'
import { Button, Card } from '@blinkdotnew/ui'
import { motion } from 'framer-motion'
import { MapPin, Users, ArrowRight } from 'lucide-react'
import { TestimonialSnippet } from './TestimonialSnippet'
import { TripPackage } from '../hooks/usePackages'

/**
 * The single package-tile layout used everywhere a package is listed
 * (homepage, /packages, /packages/$type) — image + badges, title/price row,
 * feature bullets, trust signal, and a full-width thumb-friendly CTA button.
 * Keeping one shared component means every listing gets the same
 * mobile-tested layout instead of drifting hand-rolled copies.
 */
export function PackageCard({ pkg, index = 0 }: { pkg: TripPackage; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08 }}
      viewport={{ once: true }}
      className="flex"
    >
      <Card className="flex flex-col w-full overflow-hidden border-none shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 rounded-[2rem] bg-white group">
        <div className="relative h-64 overflow-hidden">
          <img
            src={pkg.image_url}
            alt={pkg.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
          <div className="absolute top-6 left-6 flex flex-col gap-2">
            <span className="px-3 py-1 bg-[#0F172A]/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 text-white">
              <MapPin size={10} className="text-accent" /> {pkg.location}
            </span>
            <span className="px-3 py-1 bg-[#0F172A]/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 text-white">
              <Users size={10} className="text-accent" /> {pkg.group_size}
            </span>
          </div>
        </div>
        <div className="p-8 flex-1 flex flex-col">
          {/* Price moved up next to title — the #1 thing being compared */}
          <div className="flex items-start justify-between mb-3 gap-3">
            <h3 className="text-2xl font-display font-black uppercase italic leading-tight text-gray-900 group-hover:text-accent transition-colors">
              {pkg.title}
            </h3>
            <div className="text-right flex-shrink-0">
              {pkg.price_on_application ? (
                <span className="text-accent font-black text-xl uppercase italic block leading-none">POA</span>
              ) : (
                <>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold block">From</span>
                  <span className="text-accent font-black text-xl uppercase italic block leading-none">{pkg.price}</span>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">Per Person</span>
                </>
              )}
            </div>
          </div>
          <ul className="space-y-3 mb-6 flex-1">
            {(Array.isArray(pkg.features) ? pkg.features : []).slice(0, 3).map((feature: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm font-medium text-muted-foreground">
                <span className="text-accent mt-0.5 font-bold">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <div className="mb-5 pt-4 border-t border-secondary">
            <TestimonialSnippet />
          </div>
          <Button asChild className="w-full h-14 bg-primary text-white hover:bg-accent hover:text-primary border-none font-black uppercase italic tracking-tight">
            <Link to="/packages/$type/$slug" params={{ type: pkg.package_type, slug: pkg.slug }}>
              Sort This Trip <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
