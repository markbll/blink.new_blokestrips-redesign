import React, { useState } from 'react';
import { Send, CheckCircle, Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { usePresets } from '../hooks/usePresets';
import { PreferredDates } from './PreferredDates';
import { isValidEmail, isValidAuMobile, AU_MOBILE_HINT } from '@/lib/validation';
import { getRecaptchaToken } from '@/lib/recaptcha';

const MAX_MSG = 2000;

function OptionGrid({ options, selected, onToggle }: {
  options: string[]
  selected: string[]
  onToggle: (item: string) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map(item => {
        const checked = selected.includes(item)
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition-all ${
              checked
                ? 'bg-accent/10 border-accent text-page'
                : 'bg-white border-transparent text-gray-600 shadow-sm hover:border-gray-200'
            }`}
          >
            <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              checked ? 'bg-accent border-accent' : 'border-gray-300'
            }`}>
              {checked && <Check size={11} className="text-white" strokeWidth={3} />}
            </span>
            {item}
          </button>
        )
      })}
    </div>
  )
}

export interface CustomTripResumeData {
  name?: string;
  email?: string;
  phone?: string;
  groupSize?: string;
  partialId?: number;
}

/**
 * Build Your Custom Trip — two-step form.
 * Step 1 gathers contact details (name, email, AU mobile, group size) and
 * captures a partial enquiry so abandoned leads are still recoverable.
 * Step 2 shows all admin-managed Features and Package Highlights to pick from.
 */
export function CustomTripForm({ resumeFrom }: { resumeFrom?: CustomTripResumeData } = {}) {
  const { features, highlights } = usePresets();
  const isResuming = !!(resumeFrom?.email || resumeFrom?.name);
  const [step, setStep] = useState(isResuming ? 2 : 1);
  const [submitting, setSubmitting] = useState(false);
  const [partialId, setPartialId] = useState<number | null>(resumeFrom?.partialId ?? null);
  const [succeeded, setSucceeded] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');

  const [form, setForm] = useState({
    name: resumeFrom?.name || '',
    email: resumeFrom?.email || '',
    phone: resumeFrom?.phone || '',
    groupSize: resumeFrom?.groupSize || '',
    message: '',
    website: '', // honeypot
  });
  const [selectedFeatures, setSelectedFeatures]     = useState<string[]>([]);
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);
  const [dates, setDates] = useState<[string, string, string]>(['', '', '']);

  const setDate = (i: number, v: string) =>
    setDates(prev => { const next = [...prev] as [string, string, string]; next[i] = v; return next; });

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    };

  const toggleIn = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (item: string) =>
    setter(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim())  errs.name  = 'Please enter your name.';
    if (!form.email.trim()) errs.email = 'Please enter your email.';
    else if (!isValidEmail(form.email)) errs.email = 'Please enter a valid email address.';
    if (!form.phone.trim()) errs.phone = 'Please enter your mobile number.';
    else if (!isValidAuMobile(form.phone)) errs.phone = AU_MOBILE_HINT;
    if (!form.groupSize)    errs.groupSize = 'Please select a group size.';
    return errs;
  };

  const goToStep2 = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});

    // Advance immediately — don't make the user wait on a network call to turn the page.
    setStep(2);

    // Capture the lead in the background — if they abandon step 2 we still have
    // name/email/mobile to follow up on. Never blocks the UX.
    api.enquiries.createPartial({
      name:      form.name.trim(),
      email:     form.email.trim(),
      phone:     form.phone.trim(),
      tripType:  'Custom Trip',
      groupSize: form.groupSize,
      website:   form.website,
    }).then(res => {
      if (res?.id) setPartialId(res.id);
    }).catch(() => {
      // partial capture never blocks the funnel
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    if (form.message.length > MAX_MSG) {
      setFieldErrors({ message: `Message must be ${MAX_MSG} characters or fewer.` });
      return;
    }

    const parts: string[] = [];
    if (selectedFeatures.length)   parts.push('FEATURES WANTED:\n- ' + selectedFeatures.join('\n- '));
    if (selectedHighlights.length) parts.push('HIGHLIGHTS WANTED:\n- ' + selectedHighlights.join('\n- '));
    if (form.message.trim())       parts.push('MESSAGE:\n' + form.message.trim());
    const message = parts.join('\n\n') || 'Custom trip enquiry submitted via website.';

    setSubmitting(true);
    try {
      const captchaToken = await getRecaptchaToken('submit_enquiry');
      await api.enquiries.create({
        name:      form.name.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim(),
        tripType:  'Custom Trip',
        groupSize: form.groupSize,
        message,
        date1:     dates[0] || undefined,
        date2:     dates[1] || undefined,
        date3:     dates[2] || undefined,
        website:   form.website,
        captcha:   captchaToken,
        ...(partialId ? { partialId } : {}),
      });
      setSucceeded(true);
    } catch (err: any) {
      const data = err?.data;
      setGlobalError(data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-white text-gray-900 h-12 px-4 rounded-xl border-2 text-sm transition-colors focus:outline-none ${
      fieldErrors[field] ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-accent'
    } shadow-sm`;

  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors[field]}</p> : null;

  if (succeeded) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="font-display font-black text-xl uppercase italic mb-2">Ripper!</h3>
        <p className="text-muted-foreground leading-relaxed">
          Your custom trip enquiry is in. We'll be back within 24 hours with options and pricing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        Step {step} of 2 — {step === 1 ? 'Your Details' : 'Build Your Trip'}
      </p>

      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{globalError}</div>
      )}

      {/* ── Step 1: contact details first ── */}
      {step === 1 && (
        <div className="space-y-5">
          <div style={{ display: 'none' }} aria-hidden="true">
            <input type="text" name="website" value={form.website} onChange={set('website')} tabIndex={-1} autoComplete="off" />
          </div>

          <div>
            <label htmlFor="ct-name" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
              Full Name <span aria-hidden="true">*</span>
            </label>
            <input id="ct-name" type="text" value={form.name} onChange={set('name')} required
              autoComplete="name" placeholder="John Smith" className={inputClass('name')} />
            <FieldError field="name" />
          </div>

          <div>
            <label htmlFor="ct-email" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
              Email <span aria-hidden="true">*</span>
            </label>
            <input id="ct-email" type="email" value={form.email} onChange={set('email')} required
              autoComplete="email" placeholder="john@example.com" className={inputClass('email')} />
            <FieldError field="email" />
          </div>

          <div>
            <label htmlFor="ct-phone" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
              Mobile <span aria-hidden="true">*</span>
            </label>
            <input id="ct-phone" type="tel" value={form.phone} onChange={set('phone')} required
              autoComplete="tel" placeholder="0400 000 000" className={inputClass('phone')} />
            {fieldErrors.phone
              ? <FieldError field="phone" />
              : <p className="text-[10px] text-muted-foreground mt-1">{AU_MOBILE_HINT}</p>}
          </div>

          <div>
            <label htmlFor="ct-group" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
              Group Size <span aria-hidden="true">*</span>
            </label>
            <select id="ct-group" value={form.groupSize} onChange={set('groupSize')} required
              className={`${inputClass('groupSize')} cursor-pointer`}>
              <option value="">Select group size</option>
              <option value="4-8 blokes">4–8 blokes</option>
              <option value="8-16 blokes">8–16 blokes</option>
              <option value="16-24 blokes">16–24 blokes</option>
              <option value="24+ blokes">24+ blokes</option>
            </select>
            <FieldError field="groupSize" />
          </div>

          <button type="button" onClick={goToStep2}
            className="w-full h-16 bg-accent text-primary hover:bg-primary hover:text-white font-black uppercase italic tracking-tight text-lg rounded-xl shadow-xl shadow-accent/20 transition-all duration-300 flex items-center justify-center gap-2">
            Build My Trip <ArrowRight className="h-5 w-5" />
          </button>
          <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">
            Takes 60 seconds · No commitment
          </p>
        </div>
      )}

      {/* ── Step 2: pick features & highlights ── */}
      {step === 2 && (
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
              What do you want included? <span className="normal-case font-medium tracking-normal">(pick as many as you like)</span>
            </p>
            <OptionGrid options={features} selected={selectedFeatures} onToggle={toggleIn(setSelectedFeatures)} />
          </div>

          {highlights.length > 0 && (
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
                Package Highlights
              </p>
              <OptionGrid options={highlights} selected={selectedHighlights} onToggle={toggleIn(setSelectedHighlights)} />
            </div>
          )}

          <PreferredDates dates={dates} onChange={setDate} />

          <div>
            <label htmlFor="ct-message" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
              Anything Else?
            </label>
            <textarea id="ct-message" value={form.message} onChange={set('message')} maxLength={MAX_MSG} rows={4}
              placeholder="Preferred dates, destination ideas, special requests..."
              className={`w-full bg-white text-gray-900 px-4 py-3 rounded-xl border-2 text-sm transition-colors focus:outline-none resize-none shadow-sm ${
                fieldErrors.message ? 'border-red-400' : 'border-transparent focus:border-accent'
              }`} />
            <FieldError field="message" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)}
              className="h-16 px-5 flex items-center justify-center gap-2 border-2 border-secondary hover:border-accent text-muted-foreground hover:text-foreground font-bold rounded-xl transition-colors">
              <ArrowLeft size={18} />
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 h-16 bg-accent text-primary hover:bg-primary hover:text-white disabled:opacity-60 font-black uppercase italic tracking-tight text-lg rounded-xl shadow-xl shadow-accent/20 transition-all duration-300 flex items-center justify-center gap-2">
              {submitting
                ? <><Loader2 className="animate-spin h-5 w-5" /> Sending…</>
                : <><Send className="h-5 w-5" /> Build My Custom Trip</>}
            </button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">
            By submitting you agree to our{' '}
            <a href="/terms" className="underline hover:text-foreground">Terms &amp; Conditions</a>.
          </p>
        </form>
      )}
    </div>
  );
}
