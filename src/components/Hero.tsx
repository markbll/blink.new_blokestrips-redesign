import React from 'react';
import { Button } from '@blinkdotnew/ui';
import { motion } from 'framer-motion';
import { ArrowRight, Trophy, Beer, Calendar } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-primary">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1593398737367-bbc0298eed88?q=80&w=2072&auto=format&fit=crop"
          alt="Golf sunset"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
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
              Guys Weekends <br />
              <span className="text-accent">Sorted.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-white/80 mb-10 max-w-2xl leading-relaxed">
              Golf trips, fishing getaways, bucks parties — fully organised end-to-end. 
              You bring the crew. We handle absolutely everything else.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Button 
                size="lg" 
                className="bg-accent text-primary hover:bg-accent/90 border-none font-black h-16 px-8 text-lg uppercase italic tracking-tight"
                onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Packages <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-white border-white/20 hover:bg-white/10 h-16 px-8 text-lg font-bold"
                onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Start a Trip
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-10">
              <div className="flex items-center gap-3 text-white/60">
                <Trophy className="text-accent h-6 w-6" />
                <span className="text-sm font-medium leading-tight">Legendary <br/>Itineraries</span>
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <Beer className="text-accent h-6 w-6" />
                <span className="text-sm font-medium leading-tight">Cold Beer <br/>Waiting</span>
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <Calendar className="text-accent h-6 w-6" />
                <span className="text-sm font-medium leading-tight">Expert <br/>Coordination</span>
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className="text-accent">★</span>
                  ))}
                </div>
                <span className="text-sm font-medium leading-tight">5-Star <br/>Reviews</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Elements Inspired by BigCaddy */}
      <motion.div 
        className="absolute bottom-10 right-10 hidden xl:block w-96 h-96 pointer-events-none"
        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <div className="relative w-full h-full bg-accent/20 rounded-3xl backdrop-blur-3xl p-8 border border-accent/20 perspective-1000 rotate-y-12 shadow-2xl overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1593398737367-bbc0298eed88?q=80&w=2072&auto=format&fit=crop" 
            className="w-full h-full object-cover rounded-xl"
            alt="Golf"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent p-6 flex flex-col justify-end">
            <span className="text-accent font-black text-xs uppercase tracking-widest mb-1">Featured Trip</span>
            <h3 className="text-white font-display text-2xl font-black italic uppercase leading-none">Murray River <br/>Ultimate</h3>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
