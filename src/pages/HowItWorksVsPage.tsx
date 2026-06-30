import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageMeta } from '../components/PageMeta';
import { MessageSquare, FileText, CheckCircle2, Calendar, Users, Trophy, Clock, DollarSign, Zap, ArrowRight, ClipboardCheck } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: MessageSquare,
    title: 'Tell Us The Vision',
    description: 'Share your dates, location, group size and what you\'re after. Whether it\'s a golf weekend, fishing adventure, or custom escape — we handle all the research and planning.',
    bullets: [
      { icon: Calendar,  text: 'Pick your preferred dates and duration' },
      { icon: Users,     text: 'Tell us your group size' },
      { icon: Trophy,    text: 'Choose your activities and preferences' },
    ],
    panel: {
      title: 'Example Enquiry',
      items: [
        { label: 'Trip Type',   value: 'Golf Weekend' },
        { label: 'Group Size',  value: '12 blokes' },
        { label: 'Dates',       value: '15–17 March 2025' },
        { label: 'Location',    value: 'Murray River region' },
        { label: 'Notes',       value: 'Championship course, accommodation nearby, and maybe a brewery tour' },
      ]
    }
  },
  {
    number: '02',
    icon: FileText,
    title: 'We Build the Itinerary',
    description: 'We create a custom itinerary with accommodation, activities and pricing. Everything is locked in and ready to go — you just need to approve it.',
    bullets: [
      { icon: null, text: 'Hand-picked accommodation options' },
      { icon: null, text: 'Pre-booked tee times, charters, or activities' },
      { icon: null, text: 'Transparent pricing breakdown per person' },
      { icon: null, text: 'Add-ons and customisation options' },
    ],
    panel: {
      title: 'Your Custom Itinerary',
      timeline: [
        { day: 'Friday',   events: ['3pm — Check-in & welcome beers'] },
        { day: 'Saturday', events: ['8am — Championship golf round', '6pm — Brewery tour & dinner'] },
        { day: 'Sunday',   events: ['9am — Final round & awards', '2pm — Check-out'] },
      ]
    }
  },
  {
    number: '03',
    icon: ClipboardCheck,
    title: 'We Handle The Heavy Lifting',
    description: "Once your group is confirmed, BlokesTrips takes over the admin that normally turns a fun trip into a full-time job. We follow up with your guests and keep everything moving so you don't have to.",
    bullets: [
      { icon: null, text: 'Collect contact details for all invited guests' },
      { icon: null, text: 'Send invitations and manage RSVPs' },
      { icon: null, text: 'Follow up with non-responders and late confirmations' },
      { icon: null, text: 'Collect deposits and final balance payments' },
    ],
    panel: {
      title: 'Group Admin, Sorted',
      tasklist: [
        'Payment reminders & outstanding balances',
        'Polo shirt sizes & apparel orders',
        'Additional merchandise & welcome packs',
        'Trophies, prizes & competition extras',
        'Hotel room configurations & allocations',
        'Dietary requirements & special requests',
        'All guest info tracked in one place',
      ]
    }
  },
  {
    number: '04',
    icon: CheckCircle2,
    title: 'Confirm & Enjoy',
    description: 'Your crew confirms attendance, pays deposits and we handle everything else. Just show up and have the time of your life.',
    bullets: [
      { icon: null, text: 'Easy deposit payment system for your group' },
      { icon: null, text: 'We coordinate all bookings and confirmations' },
      { icon: null, text: 'Receive custom gear before departure' },
      { icon: null, text: '24/7 support during your trip' },
    ],
    panel: {
      title: 'You\'re All Set!',
      emoji: '🍻',
      subtitle: 'Everything is organised. Custom gear on its way. Cold beers waiting.',
      checklist: [
        'Accommodation booked',
        'Activities confirmed',
        'Custom gear delivered',
        'Welcome pack ready',
        '24/7 support available',
      ]
    }
  },
];

const WHY = [
  { emoji: '⏱️', title: 'Save Time',    desc: 'No more chasing mates, comparing accommodation or organising activities. We do it all.' },
  { emoji: '💰', title: 'Better Value', desc: 'Group discounts and local partnerships mean better pricing than booking yourself.' },
  { emoji: '🎯', title: 'Zero Stress',  desc: 'From booking to check-out, we handle every detail so you can just enjoy.' },
];

export function HowItWorksVsPage() {
  return (
    <div className="min-h-screen">
      <PageMeta
        title="How It Works — BlokesTrips Group Trip Planning"
        description="Four steps. Tell us the vision, the boys lock in, we sort the logistics, you show up. No group chat chaos required."
      />
      <Navbar />
      <main id="main-content">

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="bg-primary pt-32 pb-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          <div className="container mx-auto px-6 relative z-10 max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase bg-accent text-primary rounded-full">
                The Process
              </span>
              <h1 className="text-5xl lg:text-8xl font-display font-black text-white leading-[0.9] mb-8 uppercase italic tracking-tighter">
                How It <span className="text-accent">Works</span>
              </h1>
              <p className="text-xl lg:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed">
                From idea to unforgettable weekend in three simple steps. We handle everything so you can focus on having a great time.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── 3 Steps ─────────────────────────────────────────────────── */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6 space-y-32">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isReversed = idx % 2 !== 0;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${isReversed ? 'lg:flex lg:flex-row-reverse' : ''}`}
                >
                  {/* Text side */}
                  <div className={isReversed ? 'lg:order-2' : ''}>
                    <div className="text-[8rem] font-display font-black leading-none text-primary/5 -mb-6 select-none">
                      {step.number}
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h2 className="text-3xl lg:text-5xl font-display font-black uppercase italic tracking-tighter leading-tight">
                        {step.title}
                      </h2>
                    </div>
                    <p className="text-muted-foreground text-lg mb-8 leading-relaxed">{step.description}</p>
                    <ul className="space-y-3">
                      {step.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2.5" />
                          <span className="text-foreground/80">{b.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Panel side */}
                  <div className={`${isReversed ? 'lg:order-1' : ''}`}>
                    {'items' in step.panel && (
                      <div className="bg-primary rounded-[2rem] p-8 shadow-2xl">
                        <h3 className="text-white font-display font-black uppercase italic text-xl mb-6">{step.panel.title}</h3>
                        <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                          {step.panel.items!.map((item, i) => (
                            <div key={i}>
                              <span className="text-accent font-black text-xs uppercase tracking-widest">{item.label}</span>
                              <p className="text-white/80 text-sm mt-0.5">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {'timeline' in step.panel && (
                      <div className="bg-primary rounded-[2rem] p-8 shadow-2xl">
                        <h3 className="text-white font-display font-black uppercase italic text-xl mb-6">{step.panel.title}</h3>
                        <div className="space-y-5">
                          {step.panel.timeline!.map((t, i) => (
                            <div key={i} className="border-l-2 border-accent pl-5">
                              <p className="text-accent font-black text-xs uppercase tracking-widest mb-1">{t.day}</p>
                              {t.events.map((ev, j) => (
                                <p key={j} className="text-white/70 text-sm">{ev}</p>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {'tasklist' in step.panel && (
                      <div className="bg-primary rounded-[2rem] p-8 shadow-2xl">
                        <h3 className="text-white font-display font-black uppercase italic text-xl mb-6">{step.panel.title}</h3>
                        <div className="bg-white/5 rounded-2xl p-5">
                          <div className="grid sm:grid-cols-1 gap-3">
                            {step.panel.tasklist!.map((item, i) => (
                              <div key={i} className="flex items-start gap-2.5 text-sm text-white/80">
                                <span className="text-accent font-black mt-0.5 flex-shrink-0">✓</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {'checklist' in step.panel && (
                      <div className="bg-primary rounded-[2rem] p-8 shadow-2xl text-center">
                        <div className="text-7xl mb-4">{step.panel.emoji}</div>
                        <h3 className="text-white font-display font-black uppercase italic text-2xl mb-2">{step.panel.title}</h3>
                        <p className="text-white/60 text-sm mb-6 leading-relaxed">{step.panel.subtitle}</p>
                        <div className="bg-white/5 rounded-2xl p-5 text-left space-y-2">
                          <p className="text-accent font-black text-xs uppercase tracking-widest mb-3">What's Taken Care Of</p>
                          {step.panel.checklist!.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                              <span className="text-accent font-black">✓</span> {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Why BlokesTrips ─────────────────────────────────────────── */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Why Us</span>
              <h2 className="text-4xl lg:text-6xl font-display font-black uppercase italic leading-[0.9] tracking-tighter">
                Why <span className="text-accent">BlokesTrips?</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {WHY.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-[2rem] p-10 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-center group"
                >
                  <div className="text-5xl mb-5">{item.emoji}</div>
                  <h3 className="text-2xl font-display font-black uppercase italic mb-3 group-hover:text-accent transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <section className="py-24 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          <div className="container mx-auto px-6 text-center relative z-10 max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl lg:text-6xl font-display font-black uppercase italic text-white leading-[0.9] tracking-tighter mb-6">
                Ready to <span className="text-accent">Start Planning?</span>
              </h2>
              <p className="text-white/60 text-lg mb-10 leading-relaxed">
                Get your free quote within 24 hours. No obligation, just good vibes.
              </p>
              <a
                href="/plan-my-trip"
                className="inline-flex items-center gap-2 h-16 px-10 bg-accent text-primary hover:bg-white font-black uppercase italic tracking-tight text-lg rounded-2xl shadow-xl shadow-accent/20 transition-all duration-300"
              >
                Get Started <ArrowRight size={20} />
              </a>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
