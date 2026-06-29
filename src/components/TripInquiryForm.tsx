import React, { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const MAX_MSG = 2000;
const PHONE_PATTERN = '^(\\+61|0)[2-9]\\d{8}$';

interface TripInquiryFormProps {
  initialTripType?: string;
  onSuccess?: () => void;
  showTitle?: boolean;
}

export const TripInquiryForm: React.FC<TripInquiryFormProps> = ({
  initialTripType,
  onSuccess,
  showTitle = true,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded]   = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    tripType:  initialTripType || '',
    groupSize: '',
    message:   '',
    website:   '', // honeypot — bots fill this; humans don't
  });

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim())    errs.name      = 'Please enter your name.';
    if (!form.email.trim())   errs.email     = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email address.';
    if (!form.tripType)       errs.tripType  = 'Please select a trip type.';
    if (!form.groupSize)      errs.groupSize = 'Please select a group size.';
    if (form.phone && !new RegExp(PHONE_PATTERN).test(form.phone.replace(/\s/g, '')))
      errs.phone = 'Australian numbers only, e.g. 0400 000 000';
    if (form.message.length > MAX_MSG) errs.message = `Message must be ${MAX_MSG} characters or fewer.`;
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setSubmitting(true);
    try {
      await api.enquiries.create({
        name:      form.name.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim(),
        tripType:  form.tripType,
        groupSize: form.groupSize,
        message:   form.message.trim() || 'Enquiry submitted via website.',
        website:   form.website, // honeypot
        captcha:   'disabled',
      });
      setSucceeded(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const data = err?.data;
      if (data?.errors) setFieldErrors(data.errors);
      else setGlobalError(data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-white h-12 px-4 rounded-xl border-2 text-sm transition-colors focus:outline-none ${
      fieldErrors[field] ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-accent'
    } shadow-sm`;

  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? (
      <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors[field]}</p>
    ) : null;

  if (succeeded) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="font-display font-black text-xl uppercase italic mb-2">Ripper!</h3>
        <p className="text-muted-foreground leading-relaxed">
          We'll be back within 24 hours with a full itinerary and pricing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <h3 className="text-3xl font-display font-black uppercase italic mb-8 tracking-tight">Plan My Trip</h3>
      )}

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {/* Honeypot — hidden from real users */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={set('website')}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {globalError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {globalError}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="field-name" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
              Full Name <span aria-hidden="true">*</span>
            </label>
            <input
              id="field-name"
              type="text"
              name="name"
              value={form.name}
              onChange={set('name')}
              required
              autoComplete="name"
              placeholder="John Smith"
              className={inputClass('name')}
            />
            <FieldError field="name" />
          </div>

          <div>
            <label htmlFor="field-phone" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
              Mobile
            </label>
            <input
              id="field-phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={set('phone')}
              autoComplete="tel"
              pattern={PHONE_PATTERN}
              placeholder="0400 000 000"
              className={inputClass('phone')}
            />
            {fieldErrors.phone
              ? <FieldError field="phone" />
              : <p className="text-[10px] text-muted-foreground mt-1">Australian numbers only, e.g. 0400 000 000</p>}
          </div>
        </div>

        <div>
          <label htmlFor="field-email" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id="field-email"
            type="email"
            name="email"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
            placeholder="john@example.com"
            className={inputClass('email')}
          />
          <FieldError field="email" />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="field-trip-type" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
              Trip Type <span aria-hidden="true">*</span>
            </label>
            <select
              id="field-trip-type"
              name="tripType"
              value={form.tripType}
              onChange={set('tripType')}
              required
              className={`${inputClass('tripType')} cursor-pointer`}
            >
              <option value="">Select trip type</option>
              <option value="Golf Weekend">Golf Weekend</option>
              <option value="Fishing Trip">Fishing Trip</option>
              <option value="Bucks Party">Bucks Party</option>
              <option value="AFL / NRL Event">AFL / NRL Event</option>
              <option value="Custom Trip">Custom Trip</option>
            </select>
            <FieldError field="tripType" />
          </div>

          <div>
            <label htmlFor="field-group-size" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
              Group Size <span aria-hidden="true">*</span>
            </label>
            <select
              id="field-group-size"
              name="groupSize"
              value={form.groupSize}
              onChange={set('groupSize')}
              required
              className={`${inputClass('groupSize')} cursor-pointer`}
            >
              <option value="">Select group size</option>
              <option value="4-8 blokes">4–8 blokes</option>
              <option value="8-16 blokes">8–16 blokes</option>
              <option value="16-24 blokes">16–24 blokes</option>
              <option value="24+ blokes">24+ blokes</option>
            </select>
            <FieldError field="groupSize" />
          </div>
        </div>

        <div>
          <label htmlFor="field-message" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
            Anything Else?
          </label>
          <textarea
            id="field-message"
            name="message"
            value={form.message}
            onChange={set('message')}
            maxLength={MAX_MSG}
            rows={4}
            placeholder="Tell us about preferred dates, locations, or special requests..."
            className={`w-full bg-white px-4 py-3 rounded-xl border-2 text-sm transition-colors focus:outline-none resize-none shadow-sm ${
              fieldErrors.message ? 'border-red-400' : 'border-transparent focus:border-accent'
            }`}
          />
          <div className="flex justify-between items-center mt-1">
            <FieldError field="message" />
            <span className={`text-xs ml-auto ${form.message.length > 1800 ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
              {form.message.length} / {MAX_MSG} characters
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-16 bg-accent text-primary hover:bg-primary hover:text-white disabled:opacity-60 disabled:cursor-not-allowed font-black uppercase italic tracking-tight text-lg rounded-xl shadow-xl shadow-accent/20 transition-all duration-300 flex items-center justify-center gap-2"
        >
          {submitting
            ? <><Loader2 className="animate-spin h-5 w-5" /> Sending…</>
            : <><Send className="h-5 w-5" /> Send Enquiry</>}
        </button>

        <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">
          By submitting you agree to our{' '}
          <a href="/terms" className="underline hover:text-foreground">Terms &amp; Conditions</a>.
        </p>
      </form>
    </div>
  );
};
