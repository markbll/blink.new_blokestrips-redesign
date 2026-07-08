import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageMeta } from '../components/PageMeta';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const VALUES = [
  { emoji: '🤝', title: 'Mateship First',  desc: "Every trip we build is about getting the crew together. The golf, the fishing, the footy — that's just the excuse." },
  { emoji: '✅', title: 'Actually Sorted', desc: 'When we say everything is handled, we mean everything. Accommodation, bookings, payments, gear, reminders — all confirmed before you pack a bag.' },
  { emoji: '🇦🇺', title: 'Proudly Australian', desc: 'Australian owned and operated, working with local courses, charters and venues across the country.' },
];

export function AboutPage() {
  return (
    <div className="min-h-screen">
      <PageMeta
        title="About Us | BlokesTrips"
        description="BlokesTrips is Australia's done-for-you group trip organiser. You bring the crew — we handle absolutely everything else."
      />
      <Navbar />
      <main id="main-content" className="pt-32 pb-24 bg-page transition-colors duration-300">
        <div className="container mx-auto px-6">
          {/* Hero */}
          <div className="text-center mb-20 max-w-4xl mx-auto">
            <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">About Us</span>
            <h1 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter text-page mb-8">
              We Sell Freedom<br /><span className="text-accent">From Organising</span>
            </h1>
            <p className="text-lg lg:text-xl text-page-subtle leading-relaxed">
              BlokesTrips exists for one reason: every group has that one bloke who ends up
              organising everything — and never actually enjoys the trip he built.
              We take that whole job off his plate.
            </p>
          </div>

          {/* Story */}
          <div className="bg-primary rounded-[2.5rem] p-10 lg:p-14 mb-16 max-w-4xl mx-auto">
            <h2 className="text-2xl lg:text-4xl font-display font-black uppercase italic tracking-tighter text-white mb-6">
              The Story
            </h2>
            <div className="space-y-4 text-white/80 text-lg leading-relaxed">
              <p>
                It started the way most good ideas do — with a group chat that went nowhere.
                Twelve blokes, one golf weekend, three months of "yeah I'm keen" and zero bookings.
              </p>
              <p>
                The bloke doing the organising spent 40+ hours chasing RSVPs, collecting deposits,
                comparing accommodation, booking tee times and allocating rooms.
                By the time the weekend arrived, he needed a holiday from planning the holiday.
              </p>
              <p>
                So we built BlokesTrips: a done-for-you trip organiser for Australian men.
                You bring the crew. We handle absolutely everything else —
                invitations, payments, reminders, bookings and logistics.
                You do nothing except show up.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {VALUES.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-glass border border-glass rounded-[2rem] p-10 text-center hover:scale-[1.02] transition-all duration-300"
              >
                <div className="text-5xl mb-5">{v.emoji}</div>
                <h3 className="text-2xl font-display font-black uppercase italic mb-3 text-page">{v.title}</h3>
                <p className="text-page-subtle leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <a href="/plan-my-trip"
              className="inline-flex items-center gap-2 bg-accent text-primary font-black uppercase italic px-10 py-5 rounded-xl text-lg hover:bg-accent/90 transition-colors">
              Plan My Trip <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
