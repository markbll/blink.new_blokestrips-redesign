import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const VIBES = [
  { type: 'golf',    label: 'Golf',    emoji: '⛳' },
  { type: 'fishing', label: 'Fishing', emoji: '🎣' },
  { type: 'sports',  label: 'Sport',   emoji: '🏉' },
  { type: 'custom',  label: 'Not Sure / Custom', emoji: '✨' },
];

const SIZES = ['4-8 blokes', '8-16 blokes', '16-24 blokes', '24+ blokes'];

export const TripFinder: React.FC = () => {
  const [vibe, setVibe] = useState('');
  const [size, setSize] = useState('');

  const go = () => {
    if (!vibe) return;
    window.location.href = `/packages/${vibe}`;
  };

  return (
    <section className="py-20 bg-page transition-colors duration-300">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="bg-glass border border-glass rounded-[2.5rem] p-8 lg:p-12">
          <div className="text-center mb-10">
            <span className="text-accent font-black tracking-widest uppercase text-sm mb-3 block italic">Not Sure Where To Start?</span>
            <h2 className="text-3xl lg:text-5xl font-display font-black uppercase italic leading-[0.9] tracking-tighter text-page">
              Find Your <span className="text-accent">Trip</span>
            </h2>
          </div>

          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-widest text-page-subtle mb-3">What's the vibe?</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {VIBES.map(v => (
                <button
                  key={v.type}
                  onClick={() => setVibe(v.type)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-sm font-bold ${
                    vibe === v.type
                      ? 'border-accent bg-accent text-primary'
                      : 'border-btn-muted hover:border-accent/40 text-page-muted'
                  }`}
                >
                  <span className="text-2xl">{v.emoji}</span>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-page-subtle mb-3">How many blokes?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`p-3 rounded-xl border-2 transition-all text-sm font-bold ${
                    size === s
                      ? 'border-accent bg-accent text-primary'
                      : 'border-btn-muted hover:border-accent/40 text-page-muted'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={go}
            disabled={!vibe}
            className="w-full h-16 flex items-center justify-center gap-2 bg-accent text-primary hover:bg-primary hover:text-white disabled:opacity-40 disabled:cursor-not-allowed font-black uppercase italic tracking-tight text-lg rounded-xl shadow-xl shadow-accent/20 transition-all duration-300"
          >
            Show Me Trips <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
};
