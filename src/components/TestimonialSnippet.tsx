import React, { useState, useEffect } from 'react';
import { useReviews } from '../hooks/useReviews';

/**
 * Compact rotating testimonial — placed next to price/CTA where doubt peaks.
 * Pulls from admin-managed reviews; hides entirely when reviews are disabled.
 */
export const TestimonialSnippet: React.FC<{ variant?: 'light' | 'dark'; className?: string }> = ({
  variant = 'light',
  className = '',
}) => {
  const { reviews, enabled } = useReviews();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reviews.length < 2) return;
    const interval = setInterval(() => setIndex(i => (i + 1) % reviews.length), 5000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  if (!enabled || reviews.length === 0) return null;

  const snippet = reviews[index % reviews.length];
  const textColor = variant === 'dark' ? 'text-white/80' : 'text-foreground/80';
  const nameColor = variant === 'dark' ? 'text-white/50' : 'text-muted-foreground';

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <div className="flex flex-shrink-0 mt-0.5">
        {[1, 2, 3, 4, 5].map(i => <span key={i} className="text-accent text-xs">★</span>)}
      </div>
      <div>
        <p className={`text-xs italic leading-snug ${textColor}`}>"{snippet.text}"</p>
        <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${nameColor}`}>— {snippet.name}</p>
      </div>
    </div>
  );
};
