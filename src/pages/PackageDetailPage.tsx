import React from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { PageMeta } from '../components/PageMeta'
import { usePackageBySlug, usePackagesByType, TripPackage } from '../hooks/usePackages'
import { TripInquiryForm } from '../components/TripInquiryForm'
import { Button, Card } from '@blinkdotnew/ui'
import { motion } from 'framer-motion'
import { MapPin, Users, Check, Clock, ArrowRight, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_LABELS: Record<string, string> = {
  golf:    'Golf Weekends',
  fishing: 'Fishing Trips',
  bucks:   'Bucks Parties',
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

  const productSchema = pkg ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": pkg.title,
    "description": pkg.description,
    "image": pkg.image_url,
    "brand": { "@type": "Brand", "name": "BlokesTrips" },
    "offers": { "@type": "Offer", "priceCurrency": "AUD", "price": pkg.price.replace(/[^0-9.]/g, ''), "availability": "https://schema.org/InStock", "seller": { "@type": "Organization", "name": "BlokesTrips" } }
  } : null

  const breadcrumbSchema = pkg ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home",     "item": "https://staging.blokestrips.com.au/" },
      { "@type": "ListItem", "position": 2, "name": "Packages", "item": "https://staging.blokestrips.com.au/packages" },
      { "@type": "ListItem", "position": 3, "name": label,      "item": `https://staging.blokestrips.com.au/packages/${type}` },
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
            <div className="pt-24 pb-0 container mx-auto px-6">
              <nav aria-label="Breadcrumb" className="py-4">
                <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground font-medium">
                  <li><a href="/" className="hover:text-accent transition-colors">Home</a></li>
                  <li><ChevronRight size={12} /></li>
                  <li><a href="/packages" className="hover:text-accent transition-colors">Packages</a></li>
                  <li><ChevronRight size={12} /></li>
                  <li><a href={`/packages/${type}`} className="hover:text-accent transition-colors">{label}</a></li>
                  <li><ChevronRight size={12} /></li>
                  <li aria-current="page" className="text-foreground font-semibold truncate max-w-[200px]">{pkg.title}</li>
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
                    {pkg.price} pp
                  </span>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="container mx-auto px-6 py-16">
              <div className="grid lg:grid-cols-3 gap-16">

                {/* Left column */}
                <div className="lg:col-span-2 space-y-12">

                  {/* Description */}
                  <div>
                    <p className="text-xl text-muted-foreground leading-relaxed">{pkg.description}</p>
                  </div>

                  {/* What's Included (features) */}
                  {pkg.features && pkg.features.length > 0 && (
                    <div>
                      <h2 className="text-3xl font-display font-black uppercase italic mb-6">
                        What's <span className="text-accent">Included</span>
                      </h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {pkg.features.map((feature: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-4 bg-secondary/30 rounded-xl">
                            <span className="text-accent mt-1 bg-accent/10 p-1 rounded-full flex-shrink-0">
                              <Check size={14} />
                            </span>
                            <span className="font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Package Highlights (included field) — compact, below features */}
                  {pkg.included && pkg.included.length > 0 && (
                    <div>
                      <h3 className="text-lg font-display font-black uppercase italic mb-4 text-muted-foreground tracking-wide">
                        Package Highlights
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {pkg.included.map((item: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/8 border border-accent/20 rounded-full text-xs font-semibold text-foreground/80"
                          >
                            <span className="text-accent font-black">✓</span>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quote */}
                  <div className="bg-secondary/20 rounded-[2rem] p-8 lg:p-12">
                    <blockquote className="text-xl font-display italic text-muted-foreground leading-relaxed">
                      "Every trip is fully customised to your group. We handle absolutely everything —
                      from the moment you enquire to the moment you're back home with stories to tell."
                    </blockquote>
                    <p className="mt-4 font-black uppercase tracking-widest text-sm">— The BlokesTrips Team</p>
                  </div>
                </div>

                {/* Sticky enquiry sidebar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:sticky lg:top-24 self-start"
                >
                  <div className="bg-secondary/30 p-8 rounded-[2rem] border border-secondary">
                    <h3 className="text-2xl font-display font-black uppercase italic mb-1 leading-tight">
                      Step 1. Tell Us<br />
                      <span className="text-accent">The Vision</span>
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Fill the form and we'll get back within 24 hours with a custom itinerary.
                    </p>
                    <TripInquiryForm
                      initialTripType={label}
                      showTitle={false}
                      onSuccess={() => toast.success("Enquiry sent! We'll be in touch within 24 hours.")}
                    />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Similar Packages */}
            {similarPackages.length > 0 && (
              <section className="py-20 bg-secondary/20">
                <div className="container mx-auto px-6">
                  <div className="mb-12">
                    <span className="text-accent font-black tracking-widest uppercase text-sm mb-3 block italic">More Like This</span>
                    <h2 className="text-3xl lg:text-5xl font-display font-black uppercase italic leading-tight">
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
                                {p.price} pp
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
