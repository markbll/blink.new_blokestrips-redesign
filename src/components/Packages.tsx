import React, { useState } from 'react';
import { Button, Card, Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, toast } from '@blinkdotnew/ui';
import { motion } from 'framer-motion';
import { MapPin, Users, Calendar, ArrowRight, X } from 'lucide-react';
import { TripInquiryForm } from './TripInquiryForm';

export const Packages = () => {
  const packages = [
    {
      id: 1,
      title: "The Ultimate Golf Weekend",
      price: "$499",
      location: "Murray River",
      group: "8+ Blokes",
      image: "https://images.unsplash.com/photo-1593398737367-bbc0298eed88?q=80&w=2072&auto=format&fit=crop",
      features: [
        "2 Nights Luxury Accommodation",
        "36 Holes of Championship Golf",
        "Golf Carts & Bar Tab Included",
        "Custom Polos & Merch Pack",
        "Organised Comp & Prizes"
      ]
    },
    {
      id: 2,
      title: "Deep Sea Fishing Charter",
      price: "$550",
      location: "Gold Coast",
      group: "6-12 Blokes",
      image: "https://images.unsplash.com/photo-1651242475142-32a37ac8cf88?q=80&w=2072&auto=format&fit=crop",
      features: [
        "2 Nights Waterfront Villa",
        "8-Hour Private Boat Charter",
        "All Bait, Tackle & Guide",
        "BBQ Seafood Dinner",
        "Biggest Catch Trophy"
      ]
    },
    {
      id: 3,
      title: "Custom Bucks Party",
      price: "Enquiry",
      location: "Melbourne / Sydney",
      group: "12+ Blokes",
      image: "https://images.unsplash.com/photo-1559307729-18e182c10bb0?q=80&w=2072&auto=format&fit=crop",
      features: [
        "Private VIP Transport",
        "Brewery & Distillery Tours",
        "AFL/NRL Premium Seats",
        "Custom Nightlife Itinerary",
        "Everything Booked & Sorted"
      ]
    }
  ];

  return (
    <section id="packages" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Our Experiences</span>
          <h2 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter mb-8">
            Choose Your <span className="text-accent">Legend</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Every package includes full organisation, custom polos, prizes and cold beer waiting in your room. 
            Don't see exactly what you want? We'll build it for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
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
                    src={pkg.image} 
                    alt={pkg.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <MapPin size={10} className="text-accent" /> {pkg.location}
                    </span>
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <Users size={10} className="text-accent" /> {pkg.group}
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
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-medium text-muted-foreground">
                        <span className="text-accent mt-0.5 font-bold">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full h-14 bg-primary text-white hover:bg-accent hover:text-primary border-none font-black uppercase italic tracking-tight"
                      >
                        Lock It In <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[2.5rem]">
                      <DialogHeader>
                        <DialogTitle className="text-3xl font-display font-black uppercase italic tracking-tight mb-2">
                          Inquire about {pkg.title}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Fill out the form below and we'll get back to you with a custom itinerary for {pkg.location}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-6">
                        <TripInquiryForm 
                          initialTripType={pkg.id === 1 ? 'golf' : pkg.id === 2 ? 'fishing' : 'custom'} 
                          showTitle={false}
                          onSuccess={() => {
                            toast.success("Enquiry sent!", { description: "We'll be in touch within 24 hours." });
                          }}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

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
  );
};
