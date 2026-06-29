import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageMeta } from '../components/PageMeta';

interface NotFoundPageProps { packageNotFound?: boolean }

export function NotFoundPage({ packageNotFound = false }: NotFoundPageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <PageMeta title="Page Not Found | BlokesTrips" description="The page you're after doesn't exist or may have moved." />
      <Navbar />
      <main id="main-content" className="flex-1 flex items-center justify-center px-6 pt-24 pb-16 bg-background">
        <div className="text-center max-w-lg">
          <p className="text-8xl font-display font-black text-accent mb-4">404</p>
          <h1 className="text-4xl font-display font-black uppercase italic mb-3">Page Not Found</h1>
          <p className="text-xl text-accent italic font-bold mb-4">Looks like this one's gone fishing.</p>
          <p className="text-muted-foreground mb-8">
            {packageNotFound
              ? "This trip doesn't exist or may have been removed."
              : "The page you're after doesn't exist or may have moved."}
          </p>
          {packageNotFound ? (
            <a href="/packages"
              className="inline-flex items-center justify-center h-14 px-8 bg-accent text-primary font-black uppercase italic tracking-tight rounded-xl hover:bg-primary hover:text-white transition-colors">
              Browse All Trips
            </a>
          ) : (
            <a href="/"
              className="inline-flex items-center justify-center h-14 px-8 bg-accent text-primary font-black uppercase italic tracking-tight rounded-xl hover:bg-primary hover:text-white transition-colors">
              Back to Home
            </a>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
