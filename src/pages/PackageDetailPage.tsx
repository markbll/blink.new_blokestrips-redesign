import React, { useState, useMemo } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { PageMeta } from '../components/PageMeta'
import { TestimonialSnippet } from '../components/TestimonialSnippet'
import { usePackageBySlug, usePackagesByType, TripPackage } from '../hooks/usePackages'
import { TripInquiryForm } from '../components/TripInquiryForm'
import { OptionalExtrasSelector } from '../components/OptionalExtrasSelector'
import { OptionalExtra } from '../hooks/useExtras'
import { Button, Card } from '@blinkdotnew/ui'
import { motion } from 'framer-motion'
import { MapPin, Users, Check, Clock, ArrowRight, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_LABELS: Record<string, string> = {
  golf:    'Golf Weekends',
  fishing: 'Fishing Trips',
  custom:  'Custom Trips',
  sports:  'Sports Weekends',
}

export function PackageDetailPage() {
  const { type, slug } = useParams({ from: '/packages/$type/$slug' })
  const { data: pkg, isLoading } = usePackageBySlug(slug)
  const { data: similar } = usePackagesByType(type)
  const label = TYPE_LABELS[type] || type

  // Filter out current package from similar
  const similarPackages = (similar || []).filter((p: TripPackage) => p.id !== slug).slice(0, 3)

  // Optional Extras — selection lifted here so the sidebar price updates live
  const [selectedExtras, setSelectedExtras] = useState<OptionalExtra[]>([])
  const toggleExtra = (extra: OptionalExtra) => {
    setSelectedExtras(prev =>
      prev.some(e => e.id === extra.id) ? prev.filter(e => e.id !== extra.id) : [...prev, extra]
    )
  }
  const isPoa = !!pkg?.price_on_application
  const basePrice = pkg && !isPoa ? parseFloat(String(pkg.price).replace(/[^0-9.]/g, '')) || 0 : 0
  const hasPoaExtra = selectedExtras.some(e => e.priceOnApplication)
  const extrasTotal = selectedExtras.filter(e => !e.priceOnApplication).reduce((sum, e) => sum + e.price, 0)
  const totalPrice = basePrice + extrasTotal
  const showPoaHeadline = isPoa || hasPoaExtra

  const extrasNote = useMemo(() => {
    if (selectedExtras.length === 0) return undefined
    const lines = selectedExtras.map(e => `- ${e.name} (${e.priceOnApplication ? 'POA' : `+$${e.price.toFixed(0)}pp`})`)
    const totalLine = showPoaHeadline
      ? 'OPTIONAL EXTRAS SELECTED (final price on application):'
      : `OPTIONAL EXTRAS SELECTED (total from $${totalPrice.toFixed(0)}pp):`
    return `${totalLine}\n${lines.join('\n')}`
  }, [selectedExtras, totalPrice, showPoaHeadline])

  // Omit "offers" entirely for POA packages — no real price to declare in structured data
  const productSchema = pkg ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": pkg.title,
    "description": pkg.description,
    "image": pkg.image_url,
    "brand": { "@type": "Brand", "name": "BlokesTrips" },
    ...(isPoa ? {} : { "offers": { "@type": "Offer", "priceCurrency": "AUD", "price": pkg.price.replace(/[^0-9.]/g, ''), "availability": "https://schema.org/InStock", "seller": { "@type": "Organization", "name": "BlokesTrips" } } })
  } : null

  const breadcrumbSchema = pkg ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home",     "item": "https://blokestrips.com.au/" },
      { "@type": "ListItem", "position": 2, "name": "Packages", "item": "https://blokestrips.com.au/packages" },
      { "@type": "ListItem", "position": 3, "name": label,      "item": `https://blokestrips.com.au/packages/${type}` },
      { "@type": "ListItem", "position": 4, "name": pkg.title }
    ]
  } : null

  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content">
        {isLoading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
          </div>
        ) : !pkg ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
            <PageMeta title="Trip Not Found | BlokesTrips" description="This trip doesn't exist or has been removed." />
            <p className="text-8xl font-display font-black text-accent mb-4">404</p>
            <h1 className="text-3xl font-display font-black uppercase italic mb-4">This Trip Doesn't Exist.</h1>
            <p className="text-muted-foreground mb-8">It may have been removed or the link is incorrect.</p>
            <a href="/packages" className="inline-flex items-center h-12 px-8 bg-accent text-primary font-black uppercase italic rounded-xl hover:bg-primary hover:text-white transition-colors">
              Browse All Trips
            </a>
          </div>
        ) : (
          <>
            <PageMeta
              title={`${pkg.title}, ${pkg.location} | BlokesTrips`}
              description={pkg.description}
              image={pkg.image_url}
              schema={[productSchema!, breadcrumbSchema!]}
              schemaId="pkg-schema"
            />
            {/* Breadcrumb nav */}
            <div className="pt-24 pb-0 container mx-auto px-6 bg-page">
              <nav aria-label="Breadcrumb" className="py-4">
                <ol className="flex flex-wrap items-center gap-1 text-xs text-white/50 font-medium">
                  <li><a href="/" className="hover:text-accent transition-colors">Home</a></li>
                  <li><ChevronRight size={12} /></li>
                  <li><a href="/packages" className="hover:text-accent transition-colors">Packages</a></li>
                  <li><ChevronRight size={12} /></li>
                  <li><a href={`/packages/${type}`} className="hover:text-accent transition-colors">{label}</a></li>
                  <li><ChevronRight size={12} /></li>
                  <li aria-current="page" className="text-white font-semibold truncate max-w-[200px]">{pkg.title}</li>
                </ol>
              </nav>
            </div>
            {/* Hero */}
            <div className="relative h-[50vh] min-h-[380px] overflow-hidden">
              <img
                src={pkg.image_url}
                alt={pkg.title}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-16 container mx-auto">
                <h1 className="text-4xl lg:text-6xl font-display font-black uppercase italic leading-tight text-white mb-4">
                  {pkg.title}
                </h1>
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <MapPin size={14} className="text-accent" /> {pkg.location}
                  </span>
                  <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <Users size={14} className="text-accent" /> {pkg.group_size}
                  </span>
                  {pkg.duration && (
                    <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <Clock size={14} className="text-accent" /> {pkg.duration}
                    </span>
                  )}
                  <span className="px-4 py-1.5 bg-accent/90 backdrop-blur-md rounded-full text-sm font-black uppercase tracking-widest text-primary">
                    {isPoa ? 'Price on Application' : `From ${pkg.price} pp`}
                  </span>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="bg-page">
            <div className="container mx-auto px-6 py-16">
              <div className="grid lg:grid-cols-3 gap-16">

                {/* Left column */}
                <div className="lg:col-span-2 space-y-12">

                  {/* Description */}
                  <div>
                    <p className="text-xl text-page-muted leading-relaxed">{pkg.description}</p>
                  </div>

                  {/* What We Handle (features) */}
                  {pkg.features && pkg.features.length > 0 && (
                    <div>
                      <h2 className="text-3xl font-display font-black uppercase italic mb-6 text-white">
                        What We <span className="text-accent">Handle For You</span>
                      </h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {pkg.features.map((feature: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-4 bg-glass border border-glass rounded-xl">
                            <span className="text-accent mt-1 bg-accent/20 p-1 rounded-full flex-shrink-0">
                              <Check size={14} />
                            </span>
                            <span className="font-medium text-page">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Package Highlights */}
                  {pkg.included && pkg.included.length > 0 && (
                    <div>
                      <h3 className="text-lg font-display font-black uppercase italic mb-4 text-white/50 tracking-wide">
                        Package Highlights
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {pkg.included.map((item: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-full text-xs font-semibold text-white"
                          >
                            <span className="text-accent font-black">✓</span>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Optional Extras — selection drives the live sidebar price */}
                  <OptionalExtrasSelector
                    basePrice={basePrice}
                    priceOnApplication={isPoa}
                    packageId={pkg.id}
                    selected={selectedExtras}
                    onToggle={toggleExtra}
                  />

                  {/* Quote */}
                  <div className="bg-primary border border-white/10 rounded-[2rem] p-8 lg:p-12">
                    <blockquote className="text-xl font-display italic text-white/80 leading-relaxed">
                      "Every trip is fully organised for your group. We handle absolutely everything —
                      from the moment you enquire to the moment you're back home with stories to tell."
                    </blockquote>
                    <p className="mt-4 font-black uppercase tracking-widest text-sm text-white">— The BlokesTrips Team</p>
                  </div>
                </div>

                {/* Sticky enquiry sidebar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:sticky lg:top-24 self-start"
                >
                  <div className="bg-glass p-8 rounded-[2rem] border border-glass">
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="text-2xl font-display font-black uppercase italic leading-tight text-white">
                        Step 1. Tell Us<br />
                        <span className="text-accent">The Vision</span>
                      </h3>
                      <span className="text-right flex-shrink-0">
                        {showPoaHeadline ? (
                          <span className="text-accent font-black text-2xl uppercase italic block leading-none">POA</span>
                        ) : (
                          <>
                            <span className="block text-page-subtle text-[10px] uppercase tracking-widest font-bold">From</span>
                            <span className="text-accent font-black text-2xl uppercase italic block leading-none">${totalPrice.toFixed(0)}<span className="text-page-subtle text-xs font-normal">pp</span></span>
                          </>
                        )}
                      </span>
                    </div>
                    {!showPoaHeadline && extrasTotal > 0 && (
                      <p className="text-[11px] text-page-subtle mb-2">
                        ${basePrice.toFixed(0)} base + ${extrasTotal.toFixed(0)} in extras
                      </p>
                    )}
                    {showPoaHeadline && (extrasTotal > 0 || hasPoaExtra) && (
                      <p className="text-[11px] text-page-subtle mb-2">
                        {isPoa ? 'Base price on application' : `$${basePrice.toFixed(0)} base`}
                        {extrasTotal > 0 && ` + $${extrasTotal.toFixed(0)} in extras`}
                        {hasPoaExtra && ' + add-ons on application'}
                      </p>
                    )}
                    <p className="text-sm text-page-subtle mb-5">
                      Fill the form and we'll get back within 24 hours with a custom itinerary.
                    </p>
                    <div className="mb-6 pb-6 border-b border-white/10">
                      <TestimonialSnippet variant="dark" />
                    </div>
                    <TripInquiryForm
                      initialTripType={label}
                      showTitle={false}
                      extrasNote={extrasNote}
                      onSuccess={() => toast.success("Enquiry sent! We'll be in touch within 24 hours.")}
                    />
                  </div>
                </motion.div>
              </div>
            </div>

            </div>{/* end bg-page wrapper */}

            {/* Similar Packages */}
            {similarPackages.length > 0 && (
              <section className="py-20 bg-primary">
                <div className="container mx-auto px-6">
                  <div className="mb-12">
                    <span className="text-accent font-black tracking-widest uppercase text-sm mb-3 block italic">More Like This</span>
                    <h2 className="text-3xl lg:text-5xl font-display font-black uppercase italic leading-tight text-white">
                      Similar <span className="text-accent">Trips</span>
                    </h2>
                  </div>
                  <div className="grid md:grid-cols-3 gap-8">
                    {similarPackages.map((p: TripPackage, i: number) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <Card className="overflow-hidden border-none shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-[1.5rem] bg-white group">
                          <div className="relative h-52 overflow-hidden">
                            <img
                              src={p.image_url}
                              alt={p.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="absolute bottom-4 left-4">
                              <span className="px-3 py-1 bg-accent text-primary rounded-full text-xs font-black uppercase tracking-widest">
                                {p.price_on_application ? 'POA' : `From ${p.price} pp`}
                              </span>
                            </div>
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-display font-black uppercase italic mb-2 leading-tight">
                              {p.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                              <MapPin size={12} className="text-accent" /> {p.location}
                            </p>
                            <Button asChild className="w-full bg-primary text-white hover:bg-accent hover:text-primary border-none font-black uppercase italic text-sm">
                              <Link to="/packages/$type/$slug" params={{ type, slug: p.slug }}>
                                View Trip <ArrowRight size={14} className="ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
