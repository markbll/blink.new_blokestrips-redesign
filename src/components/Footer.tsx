import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

export const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-primary text-white pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-6">
              <span className="text-3xl font-display font-black tracking-tighter italic uppercase">
                Blokes<span className="text-accent">Trips</span>
              </span>
            </a>
            <p className="text-white/60 mb-8 max-w-xs leading-relaxed">
              Done-for-you guys weekends. Golf trips, fishing, bucks parties and more —
              fully organised so you just show up.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/blokestrips" target="_blank" rel="noopener noreferrer"
                aria-label="Follow BlokesTrips on Instagram"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-primary transition-colors">
                <InstagramIcon />
              </a>
              <a href="https://www.facebook.com/blokestrips" target="_blank" rel="noopener noreferrer"
                aria-label="Follow BlokesTrips on Facebook"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-primary transition-colors">
                <FacebookIcon />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-black uppercase italic tracking-tight text-lg mb-6">Trips</h4>
            <ul className="space-y-4">
              <li><a href="/packages/golf"    className="text-white/60 hover:text-accent transition-colors">Golf Weekends</a></li>
              <li><a href="/packages/fishing" className="text-white/60 hover:text-accent transition-colors">Fishing Trips</a></li>
              <li><a href="/packages/bucks"   className="text-white/60 hover:text-accent transition-colors">Bucks Parties</a></li>
              <li><a href="/packages/custom"  className="text-white/60 hover:text-accent transition-colors">Custom Trips</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-black uppercase italic tracking-tight text-lg mb-6">Company</h4>
            <ul className="space-y-4">
              <li><a href="/how-it-works" className="text-white/60 hover:text-accent transition-colors">How It Works</a></li>
              <li><a href="/packages"     className="text-white/60 hover:text-accent transition-colors">Packages</a></li>
              <li><a href="/franchise"    className="text-white/60 hover:text-accent transition-colors">Franchise</a></li>
              <li><a href="/reviews"      className="text-white/60 hover:text-accent transition-colors">Reviews</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-black uppercase italic tracking-tight text-lg mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-white/60">
                <Mail size={18} className="text-accent flex-shrink-0" />
                <a href="/plan-my-trip" className="hover:text-accent transition-colors">Send us a message</a>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <MapPin size={18} className="text-accent flex-shrink-0" />
                <span>Serving all of Australia</span>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <Phone size={18} className="text-accent flex-shrink-0" />
                <span>1300 BLOKES</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/40 text-sm">© {year} BlokesTrips.com.au — All rights reserved.</p>
          <div className="flex gap-8">
            <a href="/terms"        className="text-white/40 text-xs hover:text-white transition-colors">Terms &amp; Conditions</a>
            <a href="/privacy"      className="text-white/40 text-xs hover:text-white transition-colors">Privacy Policy</a>
            <a href="/cancellation" className="text-white/40 text-xs hover:text-white transition-colors">Cancellation Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
