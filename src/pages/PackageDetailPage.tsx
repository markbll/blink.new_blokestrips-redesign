import React from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { usePackageBySlug } from '../hooks/usePackages'
import { TripInquiryForm } from '../components/TripInquiryForm'
import { Button } from '@blinkdotnew/ui'
import { motion } from 'framer-motion'
import { MapPin, Users, ArrowLeft, Check } from 'lucide-react'
import { toast } from '@blinkdotnew/ui'

const TYPE_LABELS: Record<string, string> = {
  golf: 'Golf Weekends',
  fishing: 'Fishing Trips',
  bucks: 'Bucks Parties',
  custom: 'Custom Trips',
}

export function PackageDetailPage() {
  const { type, slug } = useParams({ from: '/packages/$type/$slug' })
  const { data: pkg, isLoading } = usePackageBySlug(slug)
  const label = TYPE_LABELS[type] || type

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        {isLoading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
          </div>
        ) : !pkg ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
            <h2 className="text-3xl font-display font-black uppercase italic mb-4">Package Not Found</h2>
            <p className="text-muted-foreground mb-8">The trip you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link to="/packages/$type" params={{ type }}>Browse {label}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
              <img src={pkg.image_url} alt={pkg.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-16 container mx-auto">
                <Link to="/packages/$type" params={{ type }} className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 text-sm font-bold uppercase tracking-widest">
                  <ArrowLeft size={16} /> Back to {label}
                </Link>
                <h1 className="text-4xl lg:text-6xl font-display font-black uppercase italic leading-tight text-white mb-4">
                  {pkg.title}
                </h1>
                <div className="flex flex-wrap gap-4">
                  <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <MapPin size={14} className="text-accent" /> {pkg.location}
                  </span>
                  <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <Users size={14} className="text-accent" /> {pkg.group_size}
                  </span>
                  <span className="px-4 py-1.5 bg-accent/20 backdrop-blur-md rounded-full text-sm font-black uppercase tracking-widest text-accent">
                    {pkg.price}
                  </span>
                </div>
              </div>
            </div>

            <div className="container mx-auto px-6 py-16">
              <div className="grid lg:grid-cols-3 gap-16">
                <div className="lg:col-span-2">
                  <h2 className="text-3xl font-display font-black uppercase italic mb-6">What's Included</h2>
                  <p className="text-lg text-muted-foreground mb-10 leading-relaxed">{pkg.description}</p>

                  <div className="grid sm:grid-cols-2 gap-4 mb-12">
                    {(Array.isArray(pkg.features) ? pkg.features : []).map((feature: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-secondary/30 rounded-xl">
                        <span className="text-accent mt-1 bg-accent/10 p-1 rounded-full"><Check size={14} /></span>
                        <span className="font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-secondary/20 rounded-[2rem] p-8 lg:p-12">
                    <blockquote className="text-xl font-display italic text-muted-foreground leading-relaxed">
                      "Every trip is fully customised to your group. We handle absolutely everything — 
                      from the moment you enquire to the moment you're back home with stories to tell."
                    </blockquote>
                    <p className="mt-4 font-black uppercase tracking-widest text-sm">— The BlokesTrips Team</p>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:sticky lg:top-24 self-start"
                >
                  <div className="bg-secondary/30 p-8 rounded-[2rem] border border-secondary">
                    <h3 className="text-2xl font-display font-black uppercase italic mb-2">Enquire Now</h3>
                    <p className="text-sm text-muted-foreground mb-6">Fill the form and we'll get back within 24 hours with a custom itinerary.</p>
                    <TripInquiryForm
                      initialTripType={type}
                      showTitle={false}
                      onSuccess={() => {
                        toast.success("Enquiry sent!", { description: "We'll be in touch within 24 hours." })
                      }}
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
