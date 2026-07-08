import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent, Calendar } from '@blinkdotnew/ui';
import { CalendarIcon } from 'lucide-react';

function formatDisplay(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toIso(d: Date | undefined): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function DateField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-2 bg-white h-12 px-3 rounded-xl border-2 border-transparent focus:border-accent focus:outline-none text-sm shadow-sm text-left"
          >
            <CalendarIcon size={15} className="text-muted-foreground flex-shrink-0" />
            <span className={value ? 'text-gray-700' : 'text-gray-400'}>
              {value ? formatDisplay(value) : 'Pick a date'}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value + 'T00:00:00') : undefined}
            onSelect={(d: Date | undefined) => { onChange(toIso(d)); setOpen(false); }}
            disabled={{ before: today }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Three optional preferred-date pickers (calendar popovers). Values are ISO
 * date strings (YYYY-MM-DD) and map to the backend's date1 / date2 / date3
 * enquiry fields.
 */
export function PreferredDates({
  dates,
  onChange,
}: {
  dates: [string, string, string]
  onChange: (index: number, value: string) => void
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
        Preferred Dates{' '}
        <span className="normal-case font-medium tracking-normal">(optional — give us up to 3 options)</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[0, 1, 2].map(i => (
          <DateField
            key={i}
            label={`Option ${i + 1}`}
            value={dates[i]}
            onChange={v => onChange(i, v)}
          />
        ))}
      </div>
    </div>
  );
}
