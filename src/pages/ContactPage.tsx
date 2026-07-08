import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageMeta } from '../components/PageMeta';
import { motion } from 'framer-motion';
import { Mail, MapPin, Send, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { isValidEmail, isValidAuMobile, AU_MOBILE_HINT } from '@/lib/validation';
import { getRecaptchaToken } from '@/lib/recaptcha';

const MAX_MSG = 2000;

function BasicContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', message: '',
    website: '', // honeypot
  });

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim())  errs.name  = 'Please enter your name.';
    if (!form.email.trim()) errs.email = 'Please enter your email.';
    else if (!isValidEmail(form.email)) errs.email = 'Please enter a valid email address.';
    if (!form.phone.trim()) errs.phone = 'Please enter your mobile number.';
    else if (!isValidAuMobile(form.phone)) errs.phone = AU_MOBILE_HINT;
    if (!form.message.trim()) errs.message = 'Please enter a message.';
    else if (form.message.length > MAX_MSG) errs.message = `Message must be ${MAX_MSG} characters or fewer.`;
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setSubmitting(true);
    try {
      const captchaToken = await getRecaptchaToken('submit_enquiry');
      await api.enquiries.create({
        name:      form.name.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim(),
        tripType:  'General Enquiry',
        groupSize: 'N/A',
        message:   form.message.trim(),
        website:   form.website,
        captcha:   captchaToken,
      });
      setSucceeded(true);
    } catch (err: any) {
      setGlobalError(err?.data?.error || 'Something went wrong. Please try again.');
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
        <h3 className="font-display font-black text-xl uppercase italic mb-2">Message Sent!</h3>
        <p className="text-muted-foreground leading-relaxed">
          Thanks for getting in touch — we'll get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{globalError}</div>
      )}

      <div style={{ display: 'none' }} aria-hidden="true">
        <input type="text" name="website" value={form.website} onChange={set('website')} tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="c-name" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
          Full Name <span aria-hidden="true">*</span>
        </label>
        <input id="c-name" type="text" value={form.name} onChange={set('name')} required
          autoComplete="name" placeholder="John Smith" className={inputClass('name')} />
        <FieldError field="name" />
      </div>

      <div>
        <label htmlFor="c-email" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
          Email <span aria-hidden="true">*</span>
        </label>
        <input id="c-email" type="email" value={form.email} onChange={set('email')} required
          autoComplete="email" placeholder="john@example.com" className={inputClass('email')} />
        <FieldError field="email" />
      </div>

      <div>
        <label htmlFor="c-phone" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
          Mobile <span aria-hidden="true">*</span>
        </label>
        <input id="c-phone" type="tel" value={form.phone} onChange={set('phone')} required
          autoComplete="tel" placeholder="0400 000 000" className={inputClass('phone')} />
        {fieldErrors.phone
          ? <FieldError field="phone" />
          : <p className="text-[10px] text-muted-foreground mt-1">{AU_MOBILE_HINT}</p>}
      </div>

      <div>
        <label htmlFor="c-message" className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea id="c-message" value={form.message} onChange={set('message')} maxLength={MAX_MSG} rows={5}
          placeholder="How can we help?"
          className={`w-full bg-white text-gray-900 px-4 py-3 rounded-xl border-2 text-sm transition-colors focus:outline-none resize-none shadow-sm ${
            fieldErrors.message ? 'border-red-400' : 'border-transparent focus:border-accent'
          }`} />
        <FieldError field="message" />
      </div>

      <button type="submit" disabled={submitting}
        className="w-full h-16 bg-accent text-primary hover:bg-primary hover:text-white disabled:opacity-60 font-black uppercase italic tracking-tight text-lg rounded-xl shadow-xl shadow-accent/20 transition-all duration-300 flex items-center justify-center gap-2">
        {submitting
          ? <><Loader2 className="animate-spin h-5 w-5" /> Sending…</>
          : <><Send className="h-5 w-5" /> Send Message</>}
      </button>

      <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">
        By submitting you agree to our{' '}
        <a href="/terms" className="underline hover:text-foreground">Terms &amp; Conditions</a>.
      </p>
    </form>
  );
}

export function ContactPage() {
  return (
    <div className="min-h-screen">
      <PageMeta
        title="Contact Us | BlokesTrips"
        description="Get in touch with BlokesTrips. Questions about a trip or just want to chat it through? Drop us a message and we'll get back to you within 24 hours."
      />
      <Navbar />
      <main id="main-content" className="pt-32 pb-24 bg-page transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-accent font-black tracking-widest uppercase text-sm mb-4 block italic">Contact</span>
              <h1 className="text-4xl lg:text-6xl font-display font-black uppercase italic leading-[0.9] tracking-tighter mb-8 text-page">
                Get In<br /><span className="text-accent">Touch</span>
              </h1>
              <p className="text-page-muted text-lg mb-12">
                Got a question or just want to talk it through? Drop us a message and we'll
                get back to you within 24 hours.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="bg-icon p-3 rounded-xl text-accent flex-shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-black uppercase italic tracking-tight text-lg text-page">Email Us</h4>
                    <a href="mailto:accounts@blokestrips.com.au" className="text-page-subtle text-sm hover:text-accent transition-colors">
                      accounts@blokestrips.com.au
                    </a>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-icon p-3 rounded-xl text-accent flex-shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-black uppercase italic tracking-tight text-lg text-page">Where We Operate</h4>
                    <p className="text-page-subtle text-sm">Serving all of Australia</p>
                  </div>
                </div>

                {/* Nudge toward the custom trip builder */}
                <div className="flex gap-4 items-start pt-2">
                  <div className="bg-icon p-3 rounded-xl text-accent flex-shrink-0">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-black uppercase italic tracking-tight text-lg text-page">Planning a Trip?</h4>
                    <a href="/build-my-trip" className="text-accent text-sm font-bold hover:underline">
                      Build your custom trip →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-glass p-10 rounded-[2.5rem] border border-glass"
            >
              <BasicContactForm />
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
