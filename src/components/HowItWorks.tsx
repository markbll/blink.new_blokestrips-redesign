import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Users, CheckCircle2, GlassWater } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      icon: <ClipboardList className="h-8 w-8" />,
      title: "Tell Us What You're After",
      points: [
        "Group size, trip type, rough dates",
        "Takes two minutes",
        "No phone calls, no lengthy forms",
        "No commitment",
      ],
      number: "01"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Everyone Pays Their Own Way",
      points: [
        "Individual payment links sent to every bloke",
        "No more being the bank",
        "No more awkward \"you still owe me\" chats",
      ],
      number: "02"
    },
    {
      icon: <CheckCircle2 className="h-8 w-8" />,
      title: "We Sort It All",
      points: [
        "Accommodation, tee times, transport",
        "Gear, competition, itineraries",
        "This is where most organisers spend 40 hours",
        "You spend zero",
      ],
      number: "03"
    },
    {
      icon: <GlassWater className="h-8 w-8" />,
      title: "Show Up. That's Your Only Job.",
      points: [
        "Cold beer waiting",
        "Custom shirts ready",
        "Tee times confirmed",
        "You didn't have to do a thing",
      ],
      number: "04"
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-page overflow-hidden transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block">How It Works</span>
            <h2 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter text-page">
              Here's What We <br />
              <span className="text-accent">Take Off Your Plate</span>
            </h2>
          </div>
          <p className="text-page-muted text-lg max-w-sm mb-4">
            Most group trip organisers spend 40+ hours on admin. Our clients spend zero. Here's why.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative p-8 bg-glass rounded-3xl border border-glass hover:border-accent/40 hover:scale-[1.02] transition-all duration-300"
            >
              <div className="absolute top-6 right-8 text-5xl font-display font-black text-page-subtle/30 group-hover:text-accent/20 transition-colors">
                {step.number}
              </div>
              <div className="bg-accent text-primary w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
                {step.icon}
              </div>
              <h3 className="text-2xl font-display font-black uppercase italic mb-4 tracking-tight text-page">
                {step.title}
              </h3>
              <ul className="space-y-2">
                {step.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-page-muted leading-snug">
                    <span className="text-accent font-black mt-0.5 flex-shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
