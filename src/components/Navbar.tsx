import React, { useState, useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Packages',     href: '/packages' },
  { label: 'Franchise',    href: '/franchise' },
  { label: 'Reviews',      href: '/reviews' },
];

export const Navbar = () => {
  const [scrolled,       setScrolled]  = useState(false);
  const [mobileOpen,     setMobileOpen] = useState(false);
  const router     = useRouter();
  const isHomepage = router.state.location.pathname === '/';

  // Solid background required when not on homepage, or when scrolled past 80px
  const showSolidBg = !isHomepage || scrolled;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // run once on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [router.state.location.pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 ${
        showSolidBg ? 'py-3 bg-[#0F172A] shadow-lg' : 'py-4 bg-transparent'
      }`}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl font-display font-black tracking-tighter italic uppercase text-white">
            Blokes<span className="text-accent">Trips</span>
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white transition-colors hover:text-accent"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/plan-my-trip"
            className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-accent text-primary font-bold text-sm hover:bg-accent/90 transition-colors"
          >
            Plan My Trip
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          className="lg:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="lg:hidden absolute top-full left-0 right-0 bg-[#0F172A] border-t border-white/10 shadow-xl p-6 flex flex-col gap-3"
        >
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-lg font-medium text-white py-2 hover:text-accent transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/plan-my-trip"
            className="mt-2 w-full text-center py-3 rounded-lg bg-accent text-primary font-bold uppercase italic tracking-tight hover:bg-accent/90 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Plan My Trip
          </a>
        </div>
      )}
    </nav>
  );
};
