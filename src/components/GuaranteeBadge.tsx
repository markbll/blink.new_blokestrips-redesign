import React from 'react';
import { ShieldCheck, CalendarClock } from 'lucide-react';

/**
 * Risk-reversal trust badge — addresses the group organiser's real fear:
 * being the one who copped the blame if a trip falls through.
 */
export const GuaranteeBadge: React.FC<{ className?: string; variant?: 'light' | 'dark' }> = ({
  className = '',
  variant = 'light',
}) => {
  const textColor = variant === 'dark' ? 'text-white/70' : 'text-muted-foreground';
  const iconColor = 'text-accent';

  return (
    <div className={`flex flex-col sm:flex-row gap-3 sm:gap-6 ${className}`}>
      <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${textColor}`}>
        <ShieldCheck size={16} className={iconColor} />
        70% Refund 6+ Weeks Out
      </div>
      <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${textColor}`}>
        <CalendarClock size={16} className={iconColor} />
        Free Spot Transfers, Anytime
      </div>
    </div>
  );
};
