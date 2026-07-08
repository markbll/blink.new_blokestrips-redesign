import React from 'react';
import { useAllPackages } from '../hooks/usePackages';

const TYPE_LABELS: Record<string, string> = {
  golf: 'Golf', fishing: 'Fishing', sports: 'Sports', custom: 'Custom',
};

/**
 * Shows real "from $X" pricing per category, computed live from the database.
 * Removes the #1 silent objection ("can I afford this?") before the visitor scrolls.
 */
export const PriceAnchor: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { data: packages } = useAllPackages();

  if (!packages || packages.length === 0) return null;

  const floors: Record<string, number> = {};
  packages.forEach(p => {
    const price = parseFloat(String(p.price).replace(/[^0-9.]/g, ''));
    if (!isNaN(price) && (!floors[p.package_type] || price < floors[p.package_type])) {
      floors[p.package_type] = price;
    }
  });

  const entries = Object.entries(floors)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);

  if (entries.length === 0) return null;

  return (
    <p className={`text-white/70 text-sm font-medium flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      {entries.map(([type, price], i) => (
        <React.Fragment key={type}>
          {i > 0 && <span className="text-white/30">·</span>}
          <span>
            {TYPE_LABELS[type] || type} from <strong className="text-accent">${price}</strong>pp
          </span>
        </React.Fragment>
      ))}
    </p>
  );
};
