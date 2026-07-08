import React from 'react';
import { motion } from 'framer-motion';

const STATS = [
  { value: '1400+', label: "Blokes Who Don't Lift a Finger" },
  { value: '98%',   label: 'Would Book Again' },
  { value: '24hr',  label: 'Reply Guaranteed' },
];

export const TrustBar: React.FC<{ dark?: boolean }> = ({ dark = false }) => {
  return (
    <section className={`py-12 ${dark ? 'bg-primary' : 'bg-background border-y border-secondary'}`}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className={`text-3xl md:text-5xl font-display font-black italic ${dark ? 'text-accent' : 'text-accent'}`}>
                {stat.value}
              </div>
              <div className={`text-xs md:text-sm uppercase tracking-widest font-bold mt-1 ${dark ? 'text-white/60' : 'text-muted-foreground'}`}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
