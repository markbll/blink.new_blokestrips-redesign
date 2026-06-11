import React from 'react';
import { Globe, Mail, MapPin, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-primary text-white pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-6">
              <span className="text-3xl font-display font-black tracking-tighter italic uppercase">
                Blokes<span className="text-accent">Trips</span>
              </span>
            </a>
            <p className="text-white/60 mb-8 max-w-xs leading-relaxed">
              Done-for-you guys weekends. Golf trips, fishing, bucks parties and more — 
              fully organised so you just show up.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-primary transition-colors">
                <Globe size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-primary transition-colors">
                <Globe size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-black uppercase italic tracking-tight text-lg mb-6">Trips</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-white/60 hover:text-accent transition-colors">Golf Weekends</a></li>
              <li><a href="#" className="text-white/60 hover:text-accent transition-colors">Fishing Trips</a></li>
              <li><a href="#" className="text-white/60 hover:text-accent transition-colors">Bucks Parties</a></li>
              <li><a href="#" className="text-white/60 hover:text-accent transition-colors">Custom Trips</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-black uppercase italic tracking-tight text-lg mb-6">Company</h4>
            <ul className="space-y-4">
              <li><a href="#how-it-works" className="text-white/60 hover:text-accent transition-colors">How It Works</a></li>
              <li><a href="#packages" className="text-white/60 hover:text-accent transition-colors">Packages</a></li>
              <li><a href="#franchise" className="text-white/60 hover:text-accent transition-colors">Franchise</a></li>
              <li><a href="#reviews" className="text-white/60 hover:text-accent transition-colors">Reviews</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-black uppercase italic tracking-tight text-lg mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-white/60">
                <Mail size={18} className="text-accent" />
                <span>info@blokestrips.com.au</span>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <MapPin size={18} className="text-accent" />
                <span>Serving all of Australia</span>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <Phone size={18} className="text-accent" />
                <span>1300 BLOKES</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/40 text-sm">
            © 2026 BlokesTrips.com.au — All rights reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-white/40 text-xs hover:text-white transition-colors">Terms & Conditions</a>
            <a href="#" className="text-white/40 text-xs hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-white/40 text-xs hover:text-white transition-colors">Cancellation Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
