import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Packages } from './components/Packages';
import { InquiryForm } from './components/InquiryForm';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen">
        <Navbar />
        <main>
          <Hero />
          
          {/* Vibe Section inspired by BigCaddy */}
          <section className="py-24 bg-accent text-primary relative overflow-hidden">
            <div className="container mx-auto px-6 text-center">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter mb-8">
                  Think Group Chat Chaos <br />
                  <span className="text-primary/40">Minus the Chaos.</span>
                </h3>
                <p className="text-xl lg:text-3xl font-medium leading-relaxed opacity-90">
                  We handle the tee times, the bookings, the gear, and the payments. 
                  You just turn up with the boys and send it.
                </p>
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          </section>

          <HowItWorks />
          <Packages />
          
          {/* Testimonials section */}
          <section id="reviews" className="py-24 bg-background">
            <div className="container mx-auto px-6">
              <div className="text-center mb-20">
                <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Reviews</span>
                <h2 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter">
                  Real Blokes. <span className="text-primary/20">Real Trips.</span>
                </h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    name: "Jake Thompson",
                    trip: "Thurgoona Golf Trip",
                    quote: "Honestly the best weekend we've had in years. Turned up, shirts were waiting, beer was cold, tee times were sorted. I didn't have to organise a single thing."
                  },
                  {
                    name: "Mick O'Brien",
                    trip: "Albury Golf Weekend",
                    quote: "As the usual group organiser I'm always stressed before the trip starts. Having BlokesTrips run everything was an absolute game changer. Worth every cent."
                  },
                  {
                    name: "Dave Carter",
                    trip: "Murray River Weekend",
                    quote: "Even as a non-golfer I had the best time. Everything was thought of. Already locked in next year's trip and bringing three more of the boys."
                  }
                ].map((testimonial, i) => (
                  <div key={i} className="bg-secondary/20 p-10 rounded-[2.5rem] relative hover:scale-[1.02] transition-transform duration-300 shadow-sm hover:shadow-xl hover:bg-secondary/30">
                    <div className="text-accent text-5xl font-serif mb-6">"</div>
                    <p className="text-lg font-medium leading-relaxed mb-8 italic">
                      {testimonial.quote}
                    </p>
                    <div>
                      <h4 className="font-display font-black uppercase italic tracking-tight text-lg leading-none">{testimonial.name}</h4>
                      <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mt-2">{testimonial.trip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <InquiryForm />
        </main>
        <Footer />
    </div>
  );
}

export default App;
