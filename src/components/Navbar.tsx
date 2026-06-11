import React, { useState, useEffect } from 'react';
import { Button } from '@blinkdotnew/ui';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Packages', href: '#packages' },
    { name: 'Franchise', href: '#franchise' },
    { name: 'Reviews', href: '#reviews' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
        isScrolled ? 'bg-background/95 backdrop-blur-md shadow-sm border-b' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <span className={cn(
            "text-2xl font-display font-black tracking-tighter italic uppercase",
            isScrolled ? "text-primary" : "text-primary lg:text-white"
          )}>
            Blokes<span className="text-accent">Trips</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-accent",
                isScrolled ? "text-foreground" : "text-white"
              )}
            >
              {link.name}
            </a>
          ))}
          <Button 
            className="bg-accent text-primary hover:bg-accent/90 border-none font-bold"
            onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Plan My Trip
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden text-primary"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} className={cn(!isScrolled && "text-white")} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-background border-b shadow-xl animate-fade-in p-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-lg font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <Button 
            className="w-full bg-accent text-primary hover:bg-accent/90 border-none font-bold mt-2"
            onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Plan My Trip
          </Button>
        </div>
      )}
    </nav>
  );
};
