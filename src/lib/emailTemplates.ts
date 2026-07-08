// 5 standard reply templates for enquiries. Each merges fields from the enquiry
// so remote staff can send with only minor edits. Bodies are plain text — the
// backend wraps them in the branded HTML shell and adds the sign-off.

export interface EnquiryLike {
  name?: string
  email?: string
  tripType?: string
  groupSize?: string
  dates?: string
  packageName?: string
}

export interface EmailTemplate {
  id: string
  label: string
  description: string
  build: (e: EnquiryLike) => { subject: string; body: string }
}

function firstName(name?: string): string {
  const n = (name || '').trim()
  if (!n) return 'mate'
  return n.split(/\s+/)[0]
}

function tripLabel(e: EnquiryLike): string {
  if (e.packageName) return e.packageName
  if (e.tripType && e.tripType !== 'General Enquiry') return e.tripType.toLowerCase()
  return 'trip'
}

function datesLine(e: EnquiryLike): string {
  return e.dates ? `\n\nYou mentioned these preferred dates: ${e.dates}.` : ''
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'acknowledge',
    label: 'Thanks / Acknowledgement',
    description: 'Confirm you\'ve received the enquiry and set expectations.',
    build: e => ({
      subject: `Thanks for your enquiry — BlokesTrips`,
      body:
`Hi ${firstName(e.name)},

Thanks for reaching out to BlokesTrips about your ${tripLabel(e)}${e.groupSize ? ` for ${e.groupSize}` : ''}.${datesLine(e)}

We've got everything we need to start putting some options together. One of the team will be back to you within 24 hours with full details and pricing.

In the meantime, if anything changes or you've got a question, just reply to this email.

Cheers,
The BlokesTrips Team`,
    }),
  },
  {
    id: 'options',
    label: 'Options & Pricing',
    description: 'Send trip options and pricing.',
    build: e => ({
      subject: `Your ${tripLabel(e)} options — BlokesTrips`,
      body:
`Hi ${firstName(e.name)},

Good news — we've pulled together some options for your ${tripLabel(e)}${e.groupSize ? ` for ${e.groupSize}` : ''}.${datesLine(e)}

Here's what we're thinking:

• Option 1: [accommodation / activity / inclusions] — $[price] per person
• Option 2: [accommodation / activity / inclusions] — $[price] per person

Everything's fully organised — accommodation, bookings, transport, gear and payments all handled. You bring the crew, we sort the rest.

Have a read and let me know which way you're leaning, or if you'd like anything tweaked. Happy to jump on a quick call if that's easier.

Cheers,
The BlokesTrips Team`,
    }),
  },
  {
    id: 'more-info',
    label: 'Need a Bit More Info',
    description: 'Ask for dates, numbers or preferences before quoting.',
    build: e => ({
      subject: `A couple of quick questions about your ${tripLabel(e)}`,
      body:
`Hi ${firstName(e.name)},

Thanks for your enquiry about a ${tripLabel(e)}! To put together the best options and accurate pricing, could you let me know a few things:

• Rough dates or a weekend you've got in mind${e.dates ? ` (you mentioned ${e.dates} — is that still the plan?)` : ''}
• Final headcount${e.groupSize ? ` (you said ${e.groupSize} — roughly right?)` : ''}
• Any must-haves — course/venue, accommodation style, budget per person

As soon as I've got those I'll get options straight back to you.

Cheers,
The BlokesTrips Team`,
    }),
  },
  {
    id: 'follow-up',
    label: 'Follow-Up / Still Keen?',
    description: 'Gentle nudge when a lead has gone quiet.',
    build: e => ({
      subject: `Still keen on your ${tripLabel(e)}?`,
      body:
`Hi ${firstName(e.name)},

Just circling back on your ${tripLabel(e)} enquiry — didn't want it to slip through the cracks.

If you're still keen, I can have full options and pricing back to you within 24 hours. If the timing's changed or the plan's shifted, no worries at all — just let me know and we'll work around it.

Want me to get started?

Cheers,
The BlokesTrips Team`,
    }),
  },
  {
    id: 'lock-in',
    label: 'Lock It In / Deposit',
    description: 'Confirm the booking and explain how to secure it.',
    build: e => ({
      subject: `Let's lock in your ${tripLabel(e)}`,
      body:
`Hi ${firstName(e.name)},

Ripper — let's lock it in! Here's how it works from here:

1. To secure your ${tripLabel(e)}${e.dates ? ` for ${e.dates}` : ''}, each of the crew pays their own deposit via a personal payment link — no chasing mates for cash.
2. Once deposits are in, we confirm every booking — accommodation, activities, transport and gear.
3. You get a full itinerary, and from there you do nothing except turn up.

I'll send through the payment links now. Just confirm the final headcount${e.groupSize ? ` (currently ${e.groupSize})` : ''} and we're away.

Cheers,
The BlokesTrips Team`,
    }),
  },
]
