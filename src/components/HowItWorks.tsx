import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Users, CheckCircle2, GlassWater } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      icon: <ClipboardList className="h-8 w-8" />,
      title: "Tell Us The Vision",
      description: "Quickly submit your group's details — dates, size, and what you're after. We handle the research and build the perfect itinerary.",
      number: "01"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "The Boys Lock In",
      description: "We provide a custom booking link for your crew. Everyone pays their own deposit. No more chasing mates for cash.",
      number: "02"
    },
    {
      icon: <CheckCircle2 className="h-8 w-8" />,
      title: "Logistics Handled",
      description: "Accommodation, tee times, charter boats, transport — everything is booked and confirmed. You get a full digital itinerary.",
      number: "03"
    },
    {
      icon: <GlassWater className="h-8 w-8" />,
      title: "Show Up & Send It",
      description: "Turn up to cold beers in the fridge and custom gear waiting. No admin, no stress, just a legendary weekend with the boys.",
      number: "04"
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block">Process</span>
            <h2 className="text-4xl lg:text-7xl font-display font-black uppercase italic leading-[0.9] tracking-tighter">
              Four Steps to a <br />
              <span className="text-primary/20">Legendary Weekend</span>
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-sm mb-4">
            Every bit of group-chat chaos — removed. From first enquiry to cold beer in your room, it's all covered.
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
              className="group relative p-8 bg-secondary/50 rounded-3xl border border-transparent hover:border-accent/20 hover:bg-white hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-xl"
            >
              <div className="absolute top-6 right-8 text-5xl font-display font-black text-primary/5 group-hover:text-accent/10 transition-colors">
                {step.number}
              </div>
              <div className="bg-primary text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-accent group-hover:text-primary transition-colors duration-300">
                {step.icon}
              </div>
              <h3 className="text-2xl font-display font-black uppercase italic mb-4 tracking-tight">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
