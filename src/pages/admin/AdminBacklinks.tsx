import React, { useEffect, useMemo, useState } from 'react'
import {
  Link, Send, Sparkles, FileText, Mail, Globe, ExternalLink, Trash2, Pencil,
  Plus, Check, X, ClipboardList, ClipboardCheck, TrendingUp, Loader2, Users,
  Save, ShieldCheck, Zap, Trophy, Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  loadState, saveState, uid, hostFromUrl, parseTopics, generatePitch, computeStats,
  SUBMISSION_TYPES, PIPELINE_STAGES,
  type BacklinksState, type Prospect, type Submission, type SubmissionType,
  type PipelineStatus, type PitchTone, type GeneratedPitch,
} from '../../lib/backlinks'

type Tab = 'pipeline' | 'prospects' | 'pitch' | 'profile'

const stageMeta = (s: PipelineStatus) => PIPELINE_STAGES.find(x => x.value === s)!
const typeLabel = (t: SubmissionType) => SUBMISSION_TYPES.find(x => x.value === t)?.label || t

const inputCls =
  'w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f59e0b]'
const labelCls = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5'

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Could not copy — select and copy manually')
    }
  }
  return (
    <button onClick={copy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-300 bg-[#1e2a3a] hover:bg-[#263348] border border-gray-700 rounded-lg transition-colors">
      {copied ? <><ClipboardCheck size={13} className="text-green-400" /> Copied</> : <><ClipboardList size={13} /> {label}</>}
    </button>
  )
}

export function AdminBacklinks() {
  const [state, setState] = useState<BacklinksState>(() => loadState())
  const [tab, setTab] = useState<Tab>('pipeline')

  // Persist on every change.
  useEffect(() => { saveState(state) }, [state])

  const stats = useMemo(() => computeStats(state), [state])
  const prospectById = useMemo(() => {
    const m: Record<string, Prospect> = {}
    state.prospects.forEach(p => { m[p.id] = p })
    return m
  }, [state.prospects])

  // ── prospect mutations ──
  const upsertProspect = (p: Prospect) =>
    setState(s => ({
      ...s,
      prospects: s.prospects.some(x => x.id === p.id)
        ? s.prospects.map(x => (x.id === p.id ? p : x))
        : [p, ...s.prospects],
    }))

  const deleteProspect = (id: string) =>
    setState(s => ({
      ...s,
      prospects: s.prospects.filter(x => x.id !== id),
      submissions: s.submissions.filter(x => x.prospectId !== id),
    }))

  // ── submission mutations ──
  const addSubmission = (sub: Submission) =>
    setState(s => ({ ...s, submissions: [sub, ...s.submissions] }))
  const updateSubmission = (id: string, patch: Partial<Submission>) =>
    setState(s => ({
      ...s,
      submissions: s.submissions.map(x =>
        x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x),
    }))
  const deleteSubmission = (id: string) =>
    setState(s => ({ ...s, submissions: s.submissions.filter(x => x.id !== id) }))

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Link size={22} className="text-[#f59e0b]" /> Backlink Outreach
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Find sites that accept articles, draft personalised guest-post pitches, and track every submission through to a live backlink.
          </p>
        </div>
      </div>

      {/* Compliance note — keeps this on the right side of the line */}
      <div className="flex items-start gap-3 bg-[#111827] border border-gray-800 rounded-xl p-4 mb-6">
        <ShieldCheck size={18} className="text-[#22c55e] flex-shrink-0 mt-0.5" />
        <p className="text-gray-400 text-xs leading-relaxed">
          <strong className="text-gray-300">Editorial outreach only.</strong> This tool helps you pitch genuine, useful articles to sites that welcome contributions — you review and send every pitch yourself. It does <em>not</em> auto-post. Automated mass submission is treated as link spam by search engines and can get <span className="text-gray-300">blokestrips.com.au</span> penalised, so keep pitches relevant and follow each site's guidelines.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Globe size={16} />}       label="Prospects"       value={stats.prospects} />
        <StatCard icon={<Send size={16} />}         label="Active outreach" value={stats.active} />
        <StatCard icon={<Trophy size={16} />}       label="Live backlinks"  value={stats.published} accent />
        <StatCard icon={<TrendingUp size={16} />}   label="Avg. authority"  value={stats.avgAuthority ?? '—'} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-800 mb-6">
        {([
          ['pipeline',  'Pipeline',        <ClipboardList size={15} key="i" />],
          ['prospects', 'Prospects',       <Globe size={15} key="i" />],
          ['pitch',     'Pitch Generator', <Sparkles size={15} key="i" />],
          ['profile',   'My Profile',      <Users size={15} key="i" />],
        ] as [Tab, string, React.ReactNode][]).map(([id, label, icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === id ? 'border-[#f59e0b] text-[#f59e0b]' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {tab === 'pipeline' && (
        <PipelineTab
          submissions={state.submissions}
          prospectById={prospectById}
          onUpdate={updateSubmission}
          onDelete={deleteSubmission}
          onGoProspects={() => setTab('prospects')}
        />
      )}
      {tab === 'prospects' && (
        <ProspectsTab
          prospects={state.prospects}
          submissions={state.submissions}
          onUpsert={upsertProspect}
          onDelete={deleteProspect}
          onStartOutreach={(p) => {
            addSubmission({
              id: uid(), prospectId: p.id, articleTitle: '',
              targetUrl: state.profile.defaultTargetUrl, anchorText: state.profile.defaultAnchor,
              status: 'prospect', backlinkUrl: '', notes: '',
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            })
            toast.success(`Added ${p.name || p.domain} to the pipeline`)
            setTab('pipeline')
          }}
          onPitch={() => setTab('pitch')}
        />
      )}
      {tab === 'pitch' && (
        <PitchTab
          state={state}
          onSaveToPipeline={(sub) => { addSubmission(sub); toast.success('Saved to pipeline as "Pitched"'); setTab('pipeline') }}
          onAddProspect={() => setTab('prospects')}
        />
      )}
      {tab === 'profile' && (
        <ProfileTab
          state={state}
          onSave={(profile) => { setState(s => ({ ...s, profile })); toast.success('Profile saved') }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
      <div className={`flex items-center gap-1.5 text-xs uppercase tracking-wider ${accent ? 'text-[#22c55e]' : 'text-gray-500'}`}>
        {icon}{label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${accent ? 'text-[#22c55e]' : 'text-white'}`}>{value}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────── PIPELINE ──
function PipelineTab({
  submissions, prospectById, onUpdate, onDelete, onGoProspects,
}: {
  submissions: Submission[]
  prospectById: Record<string, Prospect>
  onUpdate: (id: string, patch: Partial<Submission>) => void
  onDelete: (id: string) => void
  onGoProspects: () => void
}) {
  if (submissions.length === 0) {
    return (
      <EmptyState icon={<Send size={32} />} title="No outreach yet"
        body="Add prospects, then start outreach to track each pitch from first contact to a live backlink.">
        <button onClick={onGoProspects}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm">
          <Globe size={15} /> Go to Prospects
        </button>
      </EmptyState>
    )
  }

  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-2">
      <div className="flex gap-4 min-w-max">
        {PIPELINE_STAGES.map(stage => {
          const items = submissions.filter(s => s.status === stage.value)
          return (
            <div key={stage.value} className="w-72 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-sm font-bold text-gray-300">{stage.label}</span>
                <span className="text-gray-600 text-xs">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map(sub => (
                  <SubmissionCard key={sub.id} sub={sub} prospect={prospectById[sub.prospectId]}
                    onUpdate={onUpdate} onDelete={onDelete} />
                ))}
                {items.length === 0 && (
                  <div className="border border-dashed border-gray-800 rounded-xl py-6 text-center text-gray-700 text-xs">Nothing here</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SubmissionCard({
  sub, prospect, onUpdate, onDelete,
}: {
  sub: Submission
  prospect?: Prospect
  onUpdate: (id: string, patch: Partial<Submission>) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const meta = stageMeta(sub.status)
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-3.5" style={{ borderLeft: `3px solid ${meta.color}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-white text-sm font-semibold truncate">
            <Globe size={12} className="text-gray-500 flex-shrink-0" />
            {prospect?.name || prospect?.domain || 'Unknown site'}
          </div>
          {prospect?.url && (
            <a href={prospect.url} target="_blank" rel="noopener noreferrer"
              className="text-gray-600 hover:text-[#f59e0b] text-xs inline-flex items-center gap-1 mt-0.5">
              {prospect.domain} <ExternalLink size={10} />
            </a>
          )}
        </div>
        <button onClick={() => onDelete(sub.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={13} /></button>
      </div>

      <p className="text-gray-400 text-xs mt-2 line-clamp-2">
        {sub.articleTitle || <span className="italic text-gray-600">No article title yet</span>}
      </p>

      {sub.status === 'published' && sub.backlinkUrl && (
        <a href={sub.backlinkUrl} target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[#22c55e] text-xs font-medium hover:underline">
          <Link size={11} /> View live backlink
        </a>
      )}

      <div className="flex items-center gap-2 mt-3">
        <select value={sub.status}
          onChange={e => onUpdate(sub.id, { status: e.target.value as PipelineStatus })}
          className="flex-1 bg-[#0a0e1a] border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#f59e0b]">
          {PIPELINE_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={() => setOpen(o => !o)}
          className="p-1.5 text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors">
          <Pencil size={13} />
        </button>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-gray-800 space-y-2.5">
          <div>
            <label className={labelCls}>Article title</label>
            <input className={inputCls} value={sub.articleTitle}
              onChange={e => onUpdate(sub.id, { articleTitle: e.target.value })} placeholder="Working title of the piece" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Anchor text</label>
              <input className={inputCls} value={sub.anchorText}
                onChange={e => onUpdate(sub.id, { anchorText: e.target.value })} placeholder="blokes trips" />
            </div>
            <div>
              <label className={labelCls}>Links to</label>
              <input className={inputCls} value={sub.targetUrl}
                onChange={e => onUpdate(sub.id, { targetUrl: e.target.value })} placeholder="https://blokestrips.com.au/…" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Live backlink URL</label>
            <input className={inputCls} value={sub.backlinkUrl}
              onChange={e => onUpdate(sub.id, { backlinkUrl: e.target.value })} placeholder="Paste once published" />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={inputCls} rows={2} value={sub.notes}
              onChange={e => onUpdate(sub.id, { notes: e.target.value })} placeholder="Editor replies, follow-up dates…" />
          </div>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────── PROSPECTS ──
const BLANK_PROSPECT = (): Prospect => ({
  id: uid(), name: '', url: '', domain: '', contactName: '', contactEmail: '',
  submissionType: 'guest-post', authority: null, guidelinesUrl: '', topics: [],
  notes: '', createdAt: new Date().toISOString(),
})

function ProspectsTab({
  prospects, submissions, onUpsert, onDelete, onStartOutreach, onPitch,
}: {
  prospects: Prospect[]
  submissions: Submission[]
  onUpsert: (p: Prospect) => void
  onDelete: (id: string) => void
  onStartOutreach: (p: Prospect) => void
  onPitch: () => void
}) {
  const [editing, setEditing] = useState<Prospect | null>(null)
  const [topicsRaw, setTopicsRaw] = useState('')
  const [query, setQuery] = useState('')

  const startNew = () => { const p = BLANK_PROSPECT(); setEditing(p); setTopicsRaw('') }
  const startEdit = (p: Prospect) => { setEditing({ ...p }); setTopicsRaw(p.topics.join(', ')) }

  const save = () => {
    if (!editing) return
    if (!editing.name.trim() && !editing.url.trim()) { toast.error('Add at least a site name or URL'); return }
    const domain = editing.domain || hostFromUrl(editing.url)
    onUpsert({ ...editing, domain, topics: parseTopics(topicsRaw) })
    toast.success('Prospect saved')
    setEditing(null)
  }

  const inPipeline = (id: string) => submissions.some(s => s.prospectId === id)
  const filtered = query.trim()
    ? prospects.filter(p => `${p.name} ${p.domain} ${p.topics.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
    : prospects

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search prospects…"
            className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-[#f59e0b]" />
        </div>
        <button onClick={startNew}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm">
          <Plus size={15} /> Add Prospect
        </button>
      </div>

      {editing && (
        <ProspectForm prospect={editing} topicsRaw={topicsRaw} setTopicsRaw={setTopicsRaw}
          onChange={setEditing} onSave={save} onCancel={() => setEditing(null)} />
      )}

      {filtered.length === 0 && !editing ? (
        <EmptyState icon={<Globe size={32} />} title="No prospects yet"
          body="Add sites in your niche that publish guest posts or accept contributions. Not sure where to start? Search for “write for us” + your topic, or relevant industry blogs and resource pages." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-[#111827] border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-white font-semibold text-sm truncate">{p.name || p.domain || 'Untitled'}</h3>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-500 hover:text-[#f59e0b] text-xs inline-flex items-center gap-1 mt-0.5">
                      {p.domain} <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(p)} className="p-1.5 text-gray-500 hover:text-white transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => { if (confirm(`Remove ${p.name || p.domain}? Its pipeline items go too.`)) onDelete(p.id) }}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide bg-[#0a0e1a] border border-gray-800 text-gray-400 rounded px-1.5 py-0.5">
                  {typeLabel(p.submissionType)}
                </span>
                {typeof p.authority === 'number' && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#f59e0b] font-bold bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded px-1.5 py-0.5">
                    <TrendingUp size={10} /> DA {p.authority}
                  </span>
                )}
                {inPipeline(p.id) && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded px-1.5 py-0.5">
                    <Check size={10} /> In pipeline
                  </span>
                )}
              </div>

              {p.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {p.topics.slice(0, 5).map((t, i) => (
                    <span key={i} className="text-[10px] text-gray-400 bg-[#0a0e1a] border border-gray-800 rounded px-1.5 py-0.5">{t}</span>
                  ))}
                </div>
              )}

              {(p.contactEmail || p.guidelinesUrl) && (
                <div className="flex flex-wrap gap-3 mt-2.5 text-xs text-gray-500">
                  {p.contactEmail && <span className="inline-flex items-center gap-1"><Mail size={11} />{p.contactEmail}</span>}
                  {p.guidelinesUrl && (
                    <a href={p.guidelinesUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[#f59e0b]">
                      <FileText size={11} /> Guidelines
                    </a>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-3.5">
                <button onClick={() => onStartOutreach(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1e2a3a] text-white text-xs font-bold rounded-lg hover:bg-[#263348] border border-gray-700 transition-colors">
                  <Send size={12} /> Start outreach
                </button>
                <button onClick={onPitch}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#f59e0b] text-black text-xs font-bold rounded-lg hover:bg-[#d97706] transition-colors">
                  <Sparkles size={12} /> Pitch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProspectForm({
  prospect, topicsRaw, setTopicsRaw, onChange, onSave, onCancel,
}: {
  prospect: Prospect
  topicsRaw: string
  setTopicsRaw: (v: string) => void
  onChange: (p: Prospect) => void
  onSave: () => void
  onCancel: () => void
}) {
  const set = (patch: Partial<Prospect>) => onChange({ ...prospect, ...patch })
  return (
    <div className="bg-[#111827] border border-[#f59e0b]/40 rounded-xl p-5 mb-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Site name</label>
          <input className={inputCls} value={prospect.name} onChange={e => set({ name: e.target.value })} placeholder="Aussie Travel Blog" />
        </div>
        <div>
          <label className={labelCls}>URL</label>
          <input className={inputCls} value={prospect.url}
            onChange={e => set({ url: e.target.value, domain: hostFromUrl(e.target.value) })}
            placeholder="https://example.com/write-for-us" />
        </div>
        <div>
          <label className={labelCls}>Submission type</label>
          <select className={inputCls} value={prospect.submissionType}
            onChange={e => set({ submissionType: e.target.value as SubmissionType })}>
            {SUBMISSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} — {t.hint}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Domain authority (0–100, optional)</label>
          <input className={inputCls} type="number" min={0} max={100} value={prospect.authority ?? ''}
            onChange={e => set({ authority: e.target.value === '' ? null : Math.max(0, Math.min(100, Number(e.target.value))) })}
            placeholder="e.g. 42" />
        </div>
        <div>
          <label className={labelCls}>Contact name</label>
          <input className={inputCls} value={prospect.contactName} onChange={e => set({ contactName: e.target.value })} placeholder="Editor's name (if known)" />
        </div>
        <div>
          <label className={labelCls}>Contact email</label>
          <input className={inputCls} value={prospect.contactEmail} onChange={e => set({ contactEmail: e.target.value })} placeholder="editor@example.com" />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Guidelines URL</label>
          <input className={inputCls} value={prospect.guidelinesUrl} onChange={e => set({ guidelinesUrl: e.target.value })} placeholder="Link to their contributor guidelines" />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Topics they cover (comma-separated)</label>
          <input className={inputCls} value={topicsRaw} onChange={e => setTopicsRaw(e.target.value)} placeholder="travel, mateship, weekends away, fishing" />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Notes</label>
          <textarea className={inputCls} rows={2} value={prospect.notes} onChange={e => set({ notes: e.target.value })} placeholder="Anything worth remembering about this site" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm"><Save size={15} /> Save prospect</button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2 text-gray-400 border border-gray-700 rounded-lg hover:text-white transition-colors text-sm"><X size={15} /> Cancel</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────── PITCH ──
function PitchTab({
  state, onSaveToPipeline, onAddProspect,
}: {
  state: BacklinksState
  onSaveToPipeline: (sub: Submission) => void
  onAddProspect: () => void
}) {
  const [prospectId, setProspectId] = useState<string>(state.prospects[0]?.id || '')
  const [topic, setTopic] = useState('')
  const [angle, setAngle] = useState('')
  const [tone, setTone] = useState<PitchTone>('friendly')
  const [result, setResult] = useState<GeneratedPitch | null>(null)
  const [busy, setBusy] = useState(false)

  const prospect = state.prospects.find(p => p.id === prospectId)

  if (state.prospects.length === 0) {
    return (
      <EmptyState icon={<Sparkles size={32} />} title="Add a prospect first"
        body="The pitch generator personalises each draft to a specific site, so add at least one prospect to get started.">
        <button onClick={onAddProspect}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm">
          <Plus size={15} /> Add a Prospect
        </button>
      </EmptyState>
    )
  }

  const generate = () => {
    if (!prospect) { toast.error('Pick a prospect'); return }
    if (!topic.trim()) { toast.error('Add an article topic'); return }
    setBusy(true)
    // Local, synchronous generation — the tiny delay is just for feedback.
    setTimeout(() => {
      setResult(generatePitch({ profile: state.profile, prospect, topic, angle, tone }))
      setBusy(false)
    }, 250)
  }

  const saveToPipeline = () => {
    if (!prospect || !result) return
    onSaveToPipeline({
      id: uid(), prospectId: prospect.id,
      articleTitle: result.titleIdeas[0] || topic,
      targetUrl: state.profile.defaultTargetUrl, anchorText: state.profile.defaultAnchor,
      status: 'pitched', backlinkUrl: '',
      notes: `Pitched topic: ${topic}${angle ? ` — angle: ${angle}` : ''}`,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 space-y-4">
        <div>
          <label className={labelCls}>Target site</label>
          <select className={inputCls} value={prospectId} onChange={e => { setProspectId(e.target.value); setResult(null) }}>
            {state.prospects.map(p => <option key={p.id} value={p.id}>{p.name || p.domain}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Article topic</label>
          <input className={inputCls} value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="e.g. planning a mates' weekend away in the Hunter Valley" />
        </div>
        <div>
          <label className={labelCls}>Angle / hook (optional)</label>
          <input className={inputCls} value={angle} onChange={e => setAngle(e.target.value)}
            placeholder="e.g. what to get right so nobody's left organising it all" />
        </div>
        <div>
          <label className={labelCls}>Tone</label>
          <div className="flex gap-2">
            {(['friendly', 'professional', 'concise'] as PitchTone[]).map(t => (
              <button key={t} onClick={() => setTone(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize border transition-colors ${
                  tone === t ? 'bg-[#f59e0b] text-black border-[#f59e0b]' : 'text-gray-400 border-gray-700 hover:text-white'
                }`}>{t}</button>
            ))}
          </div>
        </div>
        <button onClick={generate} disabled={busy}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm disabled:opacity-50">
          {busy ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Zap size={16} /> Generate pitch</>}
        </button>
        {prospect?.guidelinesUrl && (
          <a href={prospect.guidelinesUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-[#f59e0b] transition-colors">
            <FileText size={12} /> Check {prospect.name || prospect.domain}'s guidelines before sending
          </a>
        )}
      </div>

      {/* Output */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
        {!result ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <Sparkles size={30} className="text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">Your personalised pitch email and article outline will appear here.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={labelCls + ' mb-0'}>Subject line</span>
                <CopyButton text={result.subject} />
              </div>
              <div className="bg-[#0a0e1a] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm">{result.subject}</div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={labelCls + ' mb-0'}>Pitch email</span>
                <CopyButton text={result.body} label="Copy email" />
              </div>
              <pre className="bg-[#0a0e1a] border border-gray-800 rounded-lg px-3 py-3 text-gray-200 text-xs leading-relaxed whitespace-pre-wrap font-sans max-h-80 overflow-y-auto">{result.body}</pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={labelCls + ' mb-0'}>Suggested article outline</span>
                <CopyButton text={result.outline.map((o, i) => `${i + 1}. ${o}`).join('\n')} label="Copy outline" />
              </div>
              <ol className="bg-[#0a0e1a] border border-gray-800 rounded-lg px-4 py-3 text-gray-300 text-xs space-y-1 list-decimal list-inside">
                {result.outline.map((o, i) => <li key={i}>{o}</li>)}
              </ol>
            </div>

            <button onClick={saveToPipeline}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1e2a3a] text-white font-bold rounded-lg hover:bg-[#263348] border border-gray-700 transition-colors text-sm">
              <Send size={15} /> Save to pipeline as “Pitched”
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────── PROFILE ──
function ProfileTab({ state, onSave }: { state: BacklinksState; onSave: (p: BacklinksState['profile']) => void }) {
  const [p, setP] = useState(state.profile)
  const set = (patch: Partial<BacklinksState['profile']>) => setP(prev => ({ ...prev, ...patch }))
  return (
    <div className="max-w-2xl">
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 space-y-4">
        <p className="text-gray-500 text-xs">These details prefill every pitch you generate, so you don't retype them each time.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Your name</label>
            <input className={inputCls} value={p.authorName} onChange={e => set({ authorName: e.target.value })} placeholder="e.g. Mark Llewellyn" />
          </div>
          <div>
            <label className={labelCls}>Your email</label>
            <input className={inputCls} value={p.email} onChange={e => set({ email: e.target.value })} placeholder="you@blokestrips.com.au" />
          </div>
          <div>
            <label className={labelCls}>Site name</label>
            <input className={inputCls} value={p.siteName} onChange={e => set({ siteName: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Site URL</label>
            <input className={inputCls} value={p.siteUrl} onChange={e => set({ siteUrl: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Short bio (one line about you / the site)</label>
          <textarea className={inputCls} rows={2} value={p.bio} onChange={e => set({ bio: e.target.value })} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Default link target</label>
            <input className={inputCls} value={p.defaultTargetUrl} onChange={e => set({ defaultTargetUrl: e.target.value })} placeholder="Page you most want backlinks to" />
          </div>
          <div>
            <label className={labelCls}>Default anchor text</label>
            <input className={inputCls} value={p.defaultAnchor} onChange={e => set({ defaultAnchor: e.target.value })} placeholder="blokes trips" />
          </div>
        </div>
        <button onClick={() => onSave(p)}
          className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm">
          <Save size={15} /> Save profile
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
function EmptyState({ icon, title, body, children }: { icon: React.ReactNode; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-12 text-center">
      <div className="text-gray-600 mx-auto mb-3 w-fit">{icon}</div>
      <p className="text-gray-300 font-semibold">{title}</p>
      <p className="text-gray-600 text-sm mt-1 max-w-md mx-auto">{body}</p>
      {children}
    </div>
  )
}
