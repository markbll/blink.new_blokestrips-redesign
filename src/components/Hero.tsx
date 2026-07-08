import React from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@blinkdotnew/ui';
import { motion } from 'framer-motion';
import { ArrowRight, Trophy, CheckCircle2, ClipboardList } from 'lucide-react';
import { useFeaturedPackage } from '../hooks/usePackages';
import { useReviews } from '../hooks/useReviews';
import { PriceAnchor } from './PriceAnchor';

export const Hero = () => {
  const { data: featuredTrip } = useFeaturedPackage();
  const { enabled: reviewsEnabled, reviews } = useReviews();

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[#0F172A]">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1593398737367-bbc0298eed88?q=80&w=2072&auto=format&fit=crop"
          alt="Golf sunset"
          className="w-full h-full object-cover opacity-30"
          loading="eager"
          decoding="async"
        />
        {/* Dark overlays — hardcoded so they always stay dark regardless of theme */}
        <div className="absolute inset-0 bg-[#0F172A]/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/50 to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase bg-accent text-primary rounded-full">
              Australia's #1 Group Trip Organiser
            </span>
            <h1 className="text-5xl lg:text-8xl font-display font-black text-white leading-[0.9] mb-8 uppercase italic tracking-tighter">
              Guys' Weekends. <br />
              <span className="text-accent">Sorted.</span>
            </h1>
            <p className="text-lg lg:text-2xl text-white mb-10 max-w-2xl leading-relaxed">
              Stop being the unpaid travel agent for every trip. Blokes Trips handles
              invitations, payments, bookings and logistics — so you can actually enjoy
              the weekend you organised.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Button
                size="lg"
                className="bg-accent text-primary hover:bg-accent/90 border-none font-black h-16 px-8 text-lg uppercase italic tracking-tight"
                onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Sort My Trip <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 border-none font-black h-16 px-8 text-lg uppercase italic tracking-tight"
                onClick={() => { window.location.href = '/build-my-trip'; }}
              >
                Custom Trip <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-white border-white/40 hover:bg-white/10 h-16 px-8 text-lg font-bold"
                onClick={() => { window.location.href = '/how-it-works'; }}
              >
                See How It Works
              </Button>
            </div>

            {/* Price anchor — answers "can I afford this" before they scroll */}
            <PriceAnchor className="mb-16" />

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/20 pt-10">
              <div className="flex items-center gap-3 text-white">
                <CheckCircle2 className="text-accent h-6 w-6 flex-shrink-0" />
                <span className="text-sm font-medium leading-tight">RSVPs &amp; deposits<br/>handled for you</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <ClipboardList className="text-accent h-6 w-6 flex-shrink-0" />
                <span className="text-sm font-medium leading-tight">Zero admin<br/>on your end</span>
              </div>
{reviewsEnabled && reviews.length > 0 && (
                <div className="flex items-center gap-3 text-white">
                  <div className="flex flex-shrink-0">
                    {[1,2,3,4,5].map(i => <span key={i} className="text-accent">★</span>)}
                  </div>
                  <span className="text-sm font-medium leading-tight">5-star<br/>reviews</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Featured Trip card — only shown when a hero package exists */}
      {featuredTrip && (
        <motion.div
          className="absolute bottom-10 right-10 hidden xl:block w-96 h-96"
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <Link
            to="/packages/$type/$slug"
            params={{ type: featuredTrip.package_type, slug: featuredTrip.slug }}
            className="block relative w-full h-full bg-accent/20 rounded-3xl backdrop-blur-3xl border border-accent/20 shadow-2xl overflow-hidden group"
          >
            <img
              src={featuredTrip.image_url}
              alt={featuredTrip.title}
              className="w-full h-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent p-6 flex flex-col justify-end">
              <span className="text-accent font-black text-xs uppercase tracking-widest mb-1">Featured Trip</span>
              <h3 className="text-white font-display text-2xl font-black italic uppercase leading-tight mb-2">
                {featuredTrip.title}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{featuredTrip.location}</span>
                <span className="text-accent font-black text-lg">
                  {featuredTrip.price_on_application ? 'POA' : <>From {featuredTrip.price}<span className="text-white/40 text-xs font-normal"> pp</span></>}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1 text-accent text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                View Trip <ArrowRight size={12} className="ml-1" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}
    </section>
  );
};
