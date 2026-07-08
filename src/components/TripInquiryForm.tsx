import React, { useState } from 'react';
import { Send, CheckCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { GuaranteeBadge } from './GuaranteeBadge';
import { isValidEmail, isValidAuMobile, AU_MOBILE_HINT } from '@/lib/validation';
import { getRecaptchaToken } from '@/lib/recaptcha';
import { PreferredDates } from './PreferredDates';

const MAX_MSG = 2000;

export interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  tripType?: string;
  groupSize?: string;
  partialId?: number;
}

interface TripInquiryFormProps {
  initialTripType?: string;
  onSuccess?: () => void;
  showTitle?: boolean;
  /** Pre-fill from an abandoned "Still keen?" recovery email link — skips straight to step 2. */
  resumeFrom?: ResumeData;
  /** Selected Optional Extras summary — prepended to the enquiry message so nothing gets lost. */
  extrasNote?: string;
}

export const TripInquiryForm: React.FC<TripInquiryFormProps> = ({
  initialTripType,
  onSuccess,
  showTitle = true,
  resumeFrom,
  extrasNote,
}) => {
  const isResuming = !!(resumeFrom?.email || resumeFrom?.name);
  const [step, setStep] = useState(isResuming ? 2 : 1);
  const [submitting, setSubmitting] = useState(false);
  const [partialId, setPartialId] = useState<number | null>(resumeFrom?.partialId ?? null);
  const [succeeded, setSucceeded]   = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [form, setForm] = useState({
    name: resumeFrom?.name || '',
    phone: resumeFrom?.phone || '',
    email: resumeFrom?.email || '',
    tripType:  resumeFrom?.tripType || initialTripType || '',
    groupSize: resumeFrom?.groupSize || '',
    message:   '',
    website:   '', // honeypot — bots fill this; humans don't
  });
  const [dates, setDates] = useState<[string, string, string]>(['', '', '']);

  const setDate = (i: number, v: string) =>
    setDates(prev => { const next = [...prev] as [string, string, string]; next[i] = v; return next; });

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.tripType)       errs.tripType  = 'Please select a trip type.';
    if (!form.groupSize)      errs.groupSize = 'Please select a group size.';
    if (!form.email.trim())   errs.email     = 'Please enter your email.';
    else if (!isValidEmail(form.email)) errs.email = 'Please enter a valid email address.';
    if (!form.phone.trim())   errs.phone     = 'Please enter your mobile number.';
    else if (!isValidAuMobile(form.phone)) errs.phone = AU_MOBILE_HINT;
    return errs;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Please enter your name.';
    if (form.message.length > MAX_MSG) errs.message = `Message must be ${MAX_MSG} characters or fewer.`;
    return errs;
  };

  const goToStep2 = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});

    // Advance immediately — don't make the user wait on a network call to turn the page.
    setStep(2);

    // Capture the lead in the background — if they abandon step 2, we still have
    // tripType/groupSize/email to follow up on. Never blocks the UX: if this fails,
    // the final submit just falls back to a normal full insert.
    api.enquiries.createPartial({
      email:     form.email.trim(),
      phone:     form.phone.trim(),
      tripType:  form.tripType,
      groupSize: form.groupSize,
      website:   form.website,
    }).then(res => {
      if (res?.id) setPartialId(res.id);
    }).catch(() => {
      // silent — partial capture is a nice-to-have, never blocks the funnel
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    const errs = validateStep2();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setSubmitting(true);
    try {
      const captchaToken = await getRecaptchaToken('submit_enquiry');
      const baseMessage = form.message.trim() || 'Enquiry submitted via website.';
      const message = extrasNote ? `${extrasNote}\n\n${baseMessage}` : baseMessage;
      await api.enquiries.create({
        name:      form.name.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim(),
        tripType:  form.tripType,
        groupSize: form.groupSize,
        message,
        date1:     dates[0] || undefined,
        date2:     dates[1] || undefined,
        date3:     dates[2] || undefined,
        website:   form.website, // honeypot
        captcha:   captchaToken,
        ...(partialId ? { partialId } : {}),
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
    `w-full bg-white text-gray-900 h-12 px-4 rounded-xl border-2 text-sm transition-colors focus:outline-none ${
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
        <h3 className="text-3xl font-display font-black uppercase italic mb-2 tracking-tight">Plan My Trip</h3>
      )}

      {isResuming && (
        <div className="bg-accent/10 border border-accent/30 text-sm rounded-xl px-4 py-3">
          Welcome back{form.name ? `, ${form.name.split(' ')[0]}` : ''}! We've saved what you told us — just finish up below.
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-accent' : 'bg-secondary'}`} />
        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-accent' : 'bg-secondary'}`} />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Step {step} of 2 — {step === 1 ? 'The Basics' : 'Your Details'}
      </p>

      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {globalError}
        </div>
      )}

      {/* ── Step 1: low friction — trip type, group size, email ──────────── */}
      {step === 1 && (
        <div className="space-y-5">
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

          <div>
            <label htmlFor="field-phone" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
              Mobile <span aria-hidden="true">*</span>
            </label>
            <input
              id="field-phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={set('phone')}
              required
              autoComplete="tel"
              placeholder="0400 000 000"
              className={inputClass('phone')}
            />
            {fieldErrors.phone
              ? <FieldError field="phone" />
              : <p className="text-[10px] text-muted-foreground mt-1">{AU_MOBILE_HINT}</p>}
          </div>

          <button
            type="button"
            onClick={goToStep2}
            className="w-full h-16 bg-accent text-primary hover:bg-primary hover:text-white font-black uppercase italic tracking-tight text-lg rounded-xl shadow-xl shadow-accent/20 transition-all duration-300 flex items-center justify-center gap-2"
          >
            Continue <ArrowRight className="h-5 w-5" />
          </button>
          <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">
            Takes 30 seconds · No commitment
          </p>
        </div>
      )}

      {/* ── Step 2: full details + submit ─────────────────────────────────── */}
      {step === 2 && (
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'none' }} aria-hidden="true">
            <input
              type="text" name="website" value={form.website}
              onChange={set('website')} tabIndex={-1} autoComplete="off"
            />
          </div>

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

          {extrasNote && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 text-xs text-muted-foreground whitespace-pre-line">
              {extrasNote}
            </div>
          )}

          <PreferredDates dates={dates} onChange={setDate} />

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
              className={`w-full bg-white text-gray-900 px-4 py-3 rounded-xl border-2 text-sm transition-colors focus:outline-none resize-none shadow-sm ${
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

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-16 px-5 flex items-center justify-center gap-2 border-2 border-secondary hover:border-accent text-muted-foreground hover:text-foreground font-bold rounded-xl transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-16 bg-accent text-primary hover:bg-primary hover:text-white disabled:opacity-60 disabled:cursor-not-allowed font-black uppercase italic tracking-tight text-lg rounded-xl shadow-xl shadow-accent/20 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {submitting
                ? <><Loader2 className="animate-spin h-5 w-5" /> Sending…</>
                : <><Send className="h-5 w-5" /> Send Enquiry</>}
            </button>
          </div>

          <GuaranteeBadge className="justify-center pt-2" />

          <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">
            By submitting you agree to our{' '}
            <a href="/terms" className="underline hover:text-foreground">Terms &amp; Conditions</a>.
          </p>
        </form>
      )}
    </div>
  );
};
