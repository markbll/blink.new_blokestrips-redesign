import React from 'react';
import { useExtras, OptionalExtra } from '../hooks/useExtras';
import { Check } from 'lucide-react';

/**
 * Ticklist of admin-managed Optional Extras shown on a package page.
 * Selecting extras raises `onTotalChange` with the running per-person total
 * (base price + selected extras) so the page can show a live price.
 */
export function OptionalExtrasSelector({
  basePrice,
  priceOnApplication = false,
  packageId,
  selected,
  onToggle,
}: {
  basePrice: number
  priceOnApplication?: boolean
  packageId?: string
  selected: OptionalExtra[]
  onToggle: (extra: OptionalExtra) => void
}) {
  const { data: extras, isLoading } = useExtras(packageId);

  if (isLoading || !extras || extras.length === 0) return null;

  const selectedIds = new Set(selected.map(e => e.id));
  const pricedSelected = selected.filter(e => !e.priceOnApplication);
  const poaSelected = selected.filter(e => e.priceOnApplication);
  const extrasTotal = pricedSelected.reduce((sum, e) => sum + e.price, 0);
  const hasPoaSelected = poaSelected.length > 0;
  const showSummary = selected.length > 0;

  return (
    <div>
      <h3 className="text-lg font-display font-black uppercase italic mb-1 text-white/50 tracking-wide">
        Optional Extras
      </h3>
      <p className="text-page-subtle text-xs mb-4">Tick anything you want added — your price updates as you go.</p>
      <div className="space-y-2 mb-4">
        {extras.map((extra: OptionalExtra) => {
          const checked = selectedIds.has(extra.id);
          return (
            <button
              key={extra.id}
              type="button"
              onClick={() => onToggle(extra)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                checked
                  ? 'bg-accent/10 border-accent/50'
                  : 'bg-glass border-glass hover:border-accent/30'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  checked ? 'bg-accent border-accent' : 'border-gray-500'
                }`}>
                  {checked && <Check size={12} className="text-primary" strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-page text-sm">{extra.name}</span>
                  {extra.description && <span className="block text-page-subtle text-xs">{extra.description}</span>}
                </span>
              </div>
              <span className="flex-shrink-0 text-accent font-bold text-sm">
                {extra.priceOnApplication ? 'POA' : `+$${extra.price.toFixed(0)}`}
              </span>
            </button>
          );
        })}
      </div>
      {showSummary && (
        <div className="flex items-center justify-between text-sm border-t border-white/10 pt-3">
          {priceOnApplication || hasPoaSelected ? (
            <>
              <span className="text-page-subtle">
                {priceOnApplication ? 'Base price on application' : `Base $${basePrice.toFixed(0)}`}
                {extrasTotal > 0 && ` + $${extrasTotal.toFixed(0)} extras`}
                {hasPoaSelected && ' + POA add-ons'}
              </span>
              <span className="text-accent font-black text-lg">
                {priceOnApplication ? 'POA' : `$${(basePrice + extrasTotal).toFixed(0)}+`} pp
              </span>
            </>
          ) : (
            <>
              <span className="text-page-subtle">Base {`$${basePrice.toFixed(0)}`} + extras ${extrasTotal.toFixed(0)}</span>
              <span className="text-accent font-black text-lg">${(basePrice + extrasTotal).toFixed(0)} pp</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
