import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageMeta } from '../components/PageMeta';

type LegalType = 'terms' | 'privacy' | 'cancellation';

const CONTENT: Record<LegalType, { title: string; metaTitle: string; metaDesc: string; sections: { heading: string; body: string }[] }> = {
  terms: {
    title: 'Terms & Conditions',
    metaTitle: 'Terms & Conditions | BlokesTrips',
    metaDesc: 'BlokesTrips terms and conditions for group trip planning and booking services across Australia.',
    sections: [
      { heading: '1. Agreement', body: 'By using BlokesTrips services or submitting an enquiry, you agree to these terms. Please read them carefully.' },
      { heading: '2. Bookings', body: 'A booking is only confirmed when a written quote is accepted and a 30% deposit per person is received. Submitting an enquiry does not constitute a booking.' },
      { heading: '3. Payments', body: 'A 30% deposit is required to confirm a booking. The remaining balance is due 4 weeks prior to departure. All prices are in AUD and include GST where applicable.' },
      { heading: '4. Cancellations', body: 'Cancellations more than 6 weeks before departure: 70% refund. Cancellations within 6 weeks: no refund. Spot transfers are permitted. We strongly recommend travel insurance.' },
      { heading: '5. Liability', body: 'BlokesTrips acts as an organiser. We are not liable for injury, loss, or events outside our reasonable control.' },
      { heading: '6. Governing Law', body: 'These terms are governed by the laws of Australia.' },
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    metaTitle: 'Privacy Policy | BlokesTrips',
    metaDesc: 'How BlokesTrips collects, uses and protects your personal information under the Australian Privacy Act 1988.',
    sections: [
      { heading: '1. Who We Are', body: 'BlokesTrips is a group trip organiser operating in Australia. We comply with the Australian Privacy Act 1988 and, where applicable, the GDPR.' },
      { heading: '2. Information We Collect', body: 'When you submit an enquiry we collect your name, email, phone number, trip preferences and message content. We also collect server logs for security purposes.' },
      { heading: '3. How We Use It', body: 'We use your information to respond to enquiries, prepare quotes, communicate about bookings, and improve our services. We do not sell or rent your data.' },
      { heading: '4. Your Rights', body: 'You have the right to access, correct, or delete your personal data. Contact us at admin@blokestrips.com.au to exercise these rights. We respond within 30 days.' },
      { heading: '5. Cookies', body: 'We use essential cookies and optional analytics cookies (PostHog). Analytics cookies are only loaded with your consent via our cookie banner.' },
      { heading: '6. Data Retention', body: 'Enquiry data is retained for 2 years. Booking records are retained for 7 years for legal and tax purposes.' },
    ]
  },
  cancellation: {
    title: 'Cancellation Policy',
    metaTitle: 'Cancellation Policy | BlokesTrips',
    metaDesc: 'BlokesTrips refund and cancellation policy for group trip bookings.',
    sections: [
      { heading: 'More than 6 weeks before departure', body: '70% refund of all amounts paid. You may also transfer your spot to another person at no charge.' },
      { heading: '2–6 weeks before departure', body: 'No refund. Spot transfers permitted. A $50 administration fee applies.' },
      { heading: 'Less than 2 weeks before departure', body: 'No refund. Spot transfers at our discretion only.' },
      { heading: 'Cancellation by BlokesTrips', body: 'Full refund of all amounts paid within 5 business days.' },
      { heading: 'How to Cancel', body: 'Submit a cancellation request via our contact page. Cancellations are effective from the date we receive your written request.' },
      { heading: 'Travel Insurance', body: 'We strongly recommend comprehensive travel insurance for all participants. BlokesTrips is not responsible for costs incurred due to participant cancellations.' },
    ]
  }
};

export function LegalPage({ type }: { type: LegalType }) {
  const content = CONTENT[type];
  return (
    <div className="min-h-screen">
      <PageMeta title={content.metaTitle} description={content.metaDesc} />
      <Navbar />
      <main id="main-content" className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="text-4xl font-display font-black uppercase italic mb-2">{content.title}</h1>
          <p className="text-muted-foreground text-sm mb-12">Last updated: June 2026</p>
          <div className="space-y-8">
            {content.sections.map((s, i) => (
              <div key={i}>
                <h2 className="font-bold text-lg mb-2">{s.heading}</h2>
                <p className="text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
