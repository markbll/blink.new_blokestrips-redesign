// ---------------------------------------------------------------------------
// Backlink outreach — data layer + guest-post pitch generation
// ---------------------------------------------------------------------------
// This powers the "Backlinks" admin page. It is a submission *manager*: it
// tracks the sites you're reaching out to and drafts personalised pitches for
// you to review and send yourself. Nothing is posted automatically — a human
// approves and sends every pitch. That is deliberate: mass-automated posting
// to build links is treated as spam by search engines and can get a site
// penalised. This tool is built for legitimate, editorial guest-post outreach.
//
// Persistence lives in localStorage so the page is fully self-contained. To
// move it server-side later, swap `loadState`/`saveState` for API calls — the
// rest of the module and the UI stay unchanged.
// ---------------------------------------------------------------------------

export type SubmissionType =
  | 'guest-post'
  | 'form'
  | 'email'
  | 'resource'
  | 'directory'
  | 'pr'

export const SUBMISSION_TYPES: { value: SubmissionType; label: string; hint: string }[] = [
  { value: 'guest-post', label: 'Guest post',        hint: 'Site accepts contributed articles' },
  { value: 'resource',   label: 'Resource page',     hint: 'A curated links / resources page' },
  { value: 'form',       label: 'Submission form',   hint: 'Has a public "submit an article" form' },
  { value: 'email',      label: 'Email pitch',       hint: 'Pitch the editor directly by email' },
  { value: 'directory',  label: 'Directory listing', hint: 'Relevant business / niche directory' },
  { value: 'pr',         label: 'PR / press',        hint: 'Press release or news syndication' },
]

export type PipelineStatus =
  | 'prospect'
  | 'pitched'
  | 'accepted'
  | 'submitted'
  | 'published'
  | 'rejected'

export const PIPELINE_STAGES: { value: PipelineStatus; label: string; color: string }[] = [
  { value: 'prospect',  label: 'Prospect',  color: '#64748b' },
  { value: 'pitched',   label: 'Pitched',   color: '#3b82f6' },
  { value: 'accepted',  label: 'Accepted',  color: '#8b5cf6' },
  { value: 'submitted', label: 'Submitted', color: '#f59e0b' },
  { value: 'published', label: 'Published', color: '#22c55e' },
  { value: 'rejected',  label: 'Rejected',  color: '#ef4444' },
]

export interface OutreachProfile {
  authorName: string
  siteName: string
  siteUrl: string
  email: string
  bio: string
  defaultTargetUrl: string
  defaultAnchor: string
}

export interface Prospect {
  id: string
  name: string
  url: string
  domain: string
  contactName: string
  contactEmail: string
  submissionType: SubmissionType
  authority: number | null // DA / DR, 0–100
  guidelinesUrl: string
  topics: string[]
  notes: string
  createdAt: string
}

export interface Submission {
  id: string
  prospectId: string
  articleTitle: string
  targetUrl: string // the page on your site the backlink should point to
  anchorText: string
  status: PipelineStatus
  backlinkUrl: string // the live URL once the article is published
  notes: string
  createdAt: string
  updatedAt: string
}

export interface BacklinksState {
  version: number
  profile: OutreachProfile
  prospects: Prospect[]
  submissions: Submission[]
}

const STORAGE_KEY = 'bt_backlinks_v1'
const VERSION = 1

const DEFAULT_PROFILE: OutreachProfile = {
  authorName: '',
  siteName: 'Blokes Trips',
  siteUrl: 'https://blokestrips.com.au',
  email: '',
  bio: 'the team behind Blokes Trips, who plan fully-organised group getaways for blokes across Australia',
  defaultTargetUrl: 'https://blokestrips.com.au',
  defaultAnchor: 'blokes trips',
}

export function emptyState(): BacklinksState {
  return { version: VERSION, profile: { ...DEFAULT_PROFILE }, prospects: [], submissions: [] }
}

export function loadState(): BacklinksState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<BacklinksState>
    return {
      version: VERSION,
      profile: { ...DEFAULT_PROFILE, ...(parsed.profile || {}) },
      prospects: Array.isArray(parsed.prospects) ? parsed.prospects : [],
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
    }
  } catch {
    return emptyState()
  }
}

export function saveState(state: BacklinksState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: VERSION }))
  } catch {
    /* storage full or unavailable — non-fatal */
  }
}

// ── helpers ────────────────────────────────────────────────────────────────

export function uid(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  } catch { /* fall through */ }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export function hostFromUrl(url: string): string {
  const trimmed = (url || '').trim()
  if (!trimmed) return ''
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    return new URL(withProto).hostname.replace(/^www\./, '')
  } catch {
    return trimmed.replace(/^https?:\/\//i, '').replace(/^www\./, '').split('/')[0]
  }
}

export function parseTopics(raw: string): string[] {
  return (raw || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .slice(0, 12)
}

// ── pitch generation ─────────────────────────────────────────────────────

export type PitchTone = 'friendly' | 'professional' | 'concise'

export interface PitchInput {
  profile: OutreachProfile
  prospect: Prospect
  topic: string
  angle: string
  tone: PitchTone
}

export interface GeneratedPitch {
  subject: string
  body: string
  titleIdeas: string[]
  outline: string[]
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1))
}

function siteLabel(prospect: Prospect): string {
  return prospect.name?.trim() || prospect.domain || 'your site'
}

export function generateTitleIdeas(topic: string): string[] {
  const t = (topic || '').trim().replace(/\.$/, '')
  if (!t) return []
  const lower = t.charAt(0).toLowerCase() + t.slice(1)
  return [
    titleCase(t),
    `The Complete Guide to ${titleCase(t)}`,
    `7 Things Nobody Tells You About ${titleCase(t)}`,
    `How to Get ${titleCase(t)} Right (Without the Stress)`,
    `${titleCase(t)}: A Practical Checklist`,
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4)
}

function buildOutline(topic: string, angle: string): string[] {
  const t = titleCase((topic || 'the topic').trim())
  const base = [
    `Why ${t} matters right now`,
    `The most common mistakes people make`,
    `A step-by-step approach that actually works`,
    `Real-world examples and lessons learned`,
    `A quick checklist to take away`,
  ]
  if (angle?.trim()) base.splice(2, 0, `${titleCase(angle.trim())}`)
  return base.slice(0, 6)
}

export function generatePitch(input: PitchInput): GeneratedPitch {
  const { profile, prospect, topic, angle, tone } = input
  const site = siteLabel(prospect)
  const titleIdeas = generateTitleIdeas(topic)
  const outline = buildOutline(topic, angle)
  const greetName = prospect.contactName?.trim() ? prospect.contactName.trim() : `${site} team`
  const author = profile.authorName?.trim() || 'the Blokes Trips team'
  const bio = profile.bio?.trim() || DEFAULT_PROFILE.bio
  const readLine = prospect.topics.length
    ? `I've been reading ${site} for a while — your pieces on ${prospect.topics.slice(0, 2).join(' and ')} really resonate with our audience.`
    : `I've been following ${site} and love the practical, no-fluff angle you take.`
  const angleLine = angle?.trim()
    ? `The angle I have in mind: ${angle.trim()}.`
    : ''
  const titlesBlock = titleIdeas.length
    ? titleIdeas.map(t => `  • ${t}`).join('\n')
    : '  • (add a topic above to generate title ideas)'

  const linkLine =
    `Naturally, I'd include one relevant, in-context link back to ${profile.siteName || 'our site'} only where it genuinely helps the reader — nothing forced, and I'm happy to follow your editorial guidelines to the letter.`

  let subject: string
  let opener: string
  let closer: string

  if (tone === 'professional') {
    subject = `Guest article proposal for ${site}: ${topic || 'a topic your readers will value'}`
    opener = `Hi ${greetName},\n\nI'm ${author} — ${bio}. ${readLine}`
    closer = `I write the full draft to your spec at no cost, and there's no obligation to publish if it isn't the right fit. Would you be open to a contribution along these lines?\n\nKind regards,\n${author}\n${profile.siteUrl || ''}${profile.email ? `\n${profile.email}` : ''}`
  } else if (tone === 'concise') {
    subject = `Quick guest-post idea for ${site}`
    opener = `Hi ${greetName},\n\n${readLine} I'd love to write a piece for you.`
    closer = `I'll deliver a polished, original draft — free, no obligation to run it. Worth a go?\n\nCheers,\n${author}${profile.email ? `\n${profile.email}` : ''}`
  } else {
    // friendly (default)
    subject = `Loved your work on ${site} — a guest post idea for you`
    opener = `Hi ${greetName},\n\n${readLine}\n\nI'm ${author} — ${bio}. I'd genuinely enjoy putting together a piece for your readers.`
    closer = `Happy to write the whole thing to match your style and guidelines, completely free and with no obligation to publish. If it's not a fit, no worries at all.\n\nWould any of those angles work for you?\n\nCheers,\n${author}\n${profile.siteName || ''}${profile.siteUrl ? ` · ${profile.siteUrl}` : ''}${profile.email ? `\n${profile.email}` : ''}`
  }

  const body = [
    opener,
    '',
    `A few title ideas I could develop into a genuinely useful, well-researched article:`,
    titlesBlock,
    angleLine ? `\n${angleLine}` : '',
    '',
    linkLine,
    '',
    closer,
  ]
    .filter(line => line !== null && line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { subject, body, titleIdeas, outline }
}

// ── derived stats ────────────────────────────────────────────────────────

export interface BacklinkStats {
  prospects: number
  active: number // in pipeline, not rejected/published
  published: number
  avgAuthority: number | null
}

export function computeStats(state: BacklinksState): BacklinkStats {
  const active = state.submissions.filter(
    s => s.status !== 'published' && s.status !== 'rejected',
  ).length
  const published = state.submissions.filter(s => s.status === 'published').length
  const withAuthority = state.prospects.filter(p => typeof p.authority === 'number')
  const avgAuthority = withAuthority.length
    ? Math.round(withAuthority.reduce((sum, p) => sum + (p.authority || 0), 0) / withAuthority.length)
    : null
  return { prospects: state.prospects.length, active, published, avgAuthority }
}
