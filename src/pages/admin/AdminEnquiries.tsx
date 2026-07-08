import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Eye, Trash2, Clock, Send, Loader2, Mail, CornerDownRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { EMAIL_TEMPLATES } from '../../lib/emailTemplates'

const STATUS_COLORS: Record<string, string> = {
  partial:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  new:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  contacted: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  converted: 'bg-green-500/10 text-green-400 border-green-500/20',
  closed:    'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const STATUS_OPTIONS = ['partial', 'new', 'contacted', 'converted', 'closed']

function ReplyPanel({ enquiry, onSent }: { enquiry: any; onSent: () => void }) {
  const [replies, setReplies] = useState<any[]>([])
  const [loadingReplies, setLoadingReplies] = useState(true)
  const [templateId, setTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    setLoadingReplies(true)
    setSubject(''); setBody(''); setTemplateId('')
    api.admin.enquiryReplies(String(enquiry.id))
      .then(setReplies).catch(() => setReplies([])).finally(() => setLoadingReplies(false))
  }, [enquiry.id])

  const applyTemplate = (id: string) => {
    setTemplateId(id)
    const tpl = EMAIL_TEMPLATES.find(t => t.id === id)
    if (!tpl) return
    const { subject: s, body: b } = tpl.build(enquiry)
    setSubject(s); setBody(b)
  }

  const send = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('Add a subject and message first'); return }
    setSending(true)
    try {
      const res = await api.admin.replyToEnquiry(String(enquiry.id), { subject: subject.trim(), body: body.trim() })
      if (res?.reply) setReplies(r => [...r, res.reply])
      setSubject(''); setBody(''); setTemplateId('')
      toast.success('Reply sent from enquiries@blokestrips.com.au')
      onSent()
    } catch (err: any) {
      toast.error(err?.data?.error || 'Could not send reply')
    } finally {
      setSending(false)
    }
  }

  const canReply = !!enquiry.email

  return (
    <div className="mt-5 border-t border-gray-800 pt-5">
      <div className="flex items-center gap-2 mb-4">
        <Mail size={15} className="text-[#f59e0b]" />
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Respond</h3>
      </div>

      {/* Reply history */}
      {loadingReplies ? (
        <div className="h-10 bg-[#0a0e1a] rounded-lg animate-pulse mb-4" />
      ) : replies.length > 0 && (
        <div className="space-y-3 mb-5">
          {replies.map(r => (
            <div key={r.id} className="bg-[#0a0e1a] border border-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                <CornerDownRight size={12} className="text-green-500" />
                <span className="text-green-400 font-semibold">Sent</span>
                {r.admin_email && <span>by {r.admin_email}</span>}
                <span className="ml-auto">{r.created_at ? new Date(r.created_at.replace(' ', 'T')).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</span>
              </div>
              <p className="text-white text-sm font-medium mb-1">{r.subject}</p>
              <p className="text-gray-400 text-xs whitespace-pre-wrap line-clamp-4">{r.body}</p>
            </div>
          ))}
        </div>
      )}

      {!canReply ? (
        <p className="text-gray-500 text-sm italic">No email address on this enquiry — can't send a reply.</p>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Start from a template</label>
            <select
              value={templateId}
              onChange={e => applyTemplate(e.target.value)}
              className="mt-1 w-full bg-[#0a0e1a] border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#f59e0b]"
            >
              <option value="">— Choose a template —</option>
              {EMAIL_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            {templateId && <p className="text-gray-600 text-[11px] mt-1">{EMAIL_TEMPLATES.find(t => t.id === templateId)?.description}</p>}
          </div>

          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full bg-[#0a0e1a] border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#f59e0b]"
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={10}
            placeholder="Write your reply, or pick a template above and tweak it…"
            className="w-full bg-[#0a0e1a] border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#f59e0b] resize-y font-mono leading-relaxed"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-gray-600 text-[11px]">
              Sends to <span className="text-gray-400">{enquiry.email}</span> from enquiries@blokestrips.com.au · a copy is kept on file.
            </p>
            <button
              onClick={send} disabled={sending}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors disabled:opacity-50 text-sm flex-shrink-0"
            >
              {sending ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Send size={15} /> Send Reply</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'partial' | 'complete'>('all')

  const load = () => {
    api.admin.enquiries().then(setEnquiries).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    await api.admin.updateEnquiry(id, { status })
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    if (selected?.id === id) setSelected((s: any) => ({ ...s, status }))
  }

  const deleteEnquiry = async (id: string) => {
    if (!confirm('Delete this enquiry?')) return
    await api.admin.deleteEnquiry(id)
    setEnquiries(prev => prev.filter(e => e.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const partialCount = enquiries.filter(e => e.status === 'partial').length

  const filtered = enquiries.filter(e => {
    if (filter === 'partial') return e.status === 'partial'
    if (filter === 'complete') return e.status !== 'partial'
    return true
  })

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white">Enquiries</h1>
        <span className="text-gray-400 text-sm">Total: {enquiries.length}</span>
      </div>

      {partialCount > 0 && (
        <div className="flex items-center gap-2 mb-6 text-orange-400 text-sm bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-2.5">
          <Clock size={14} />
          <span><strong>{partialCount}</strong> {partialCount === 1 ? 'lead' : 'leads'} started the form but didn't finish — worth a follow-up.</span>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {(['all', 'partial', 'complete'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
              filter === f ? 'bg-[#f59e0b] text-black' : 'bg-[#111827] text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            {f === 'all' ? 'All' : f === 'partial' ? `Abandoned (${partialCount})` : 'Completed'}
          </button>
        ))}
      </div>

      {selected && (
        <div className="bg-[#111827] border border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-white font-bold text-lg">{selected.name || <span className="text-gray-500 italic">No name yet — abandoned at step 1</span>}</h2>
              <p className="text-gray-400 text-sm">{selected.email} {selected.phone && `· ${selected.phone}`}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-sm">Close</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
            <div><span className="text-gray-500">Trip Type</span><p className="text-white">{selected.tripType}</p></div>
            <div><span className="text-gray-500">Group Size</span><p className="text-white">{selected.groupSize}</p></div>
            {selected.dates && <div><span className="text-gray-500">Dates</span><p className="text-white">{selected.dates}</p></div>}
          </div>
          {selected.message && (
            <div className="mb-4">
              <span className="text-gray-500 text-sm">Message</span>
              <p className="text-white text-sm mt-1 whitespace-pre-wrap">{selected.message}</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="text-gray-500 text-sm">Status:</label>
            <select
              value={selected.status}
              onChange={e => updateStatus(selected.id, e.target.value)}
              className="bg-[#0a0e1a] border border-gray-700 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:border-[#f59e0b]"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <ReplyPanel
            enquiry={selected}
            onSent={() => {
              // A reply advances status to 'contacted' unless converted/closed
              setEnquiries(prev => prev.map(e => e.id === selected.id
                ? { ...e, status: ['converted', 'closed'].includes(e.status) ? e.status : 'contacted' }
                : e))
              setSelected((s: any) => s && !['converted', 'closed'].includes(s.status) ? { ...s, status: 'contacted' } : s)
            }}
          />
        </div>
      )}

      <div className="bg-[#111827] rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-3 font-medium">Name</th>
                <th className="text-left px-6 py-3 font-medium">Contact</th>
                <th className="text-left px-6 py-3 font-medium">Trip Type</th>
                <th className="text-left px-6 py-3 font-medium">Group Size</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
                <th className="text-left px-6 py-3 font-medium">Date</th>
                <th className="text-left px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500">No enquiries found.</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className={`hover:bg-white/[0.02] transition-colors ${e.status === 'partial' ? 'bg-orange-500/[0.03]' : ''}`}>
                  <td className="px-6 py-4 text-white font-medium whitespace-nowrap">
                    {e.name || <span className="text-gray-500 italic font-normal">— abandoned —</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    <div>{e.email}</div>
                    {e.phone && <div className="text-xs">{e.phone}</div>}
                  </td>
                  <td className="px-6 py-4 text-gray-400 whitespace-nowrap">{e.tripType}</td>
                  <td className="px-6 py-4 text-gray-400 whitespace-nowrap">{e.groupSize}</td>
                  <td className="px-6 py-4">
                    <select
                      value={e.status}
                      onChange={ev => updateStatus(e.id, ev.target.value)}
                      className={`text-xs font-medium border rounded px-2 py-1 focus:outline-none bg-transparent ${STATUS_COLORS[e.status] || ''}`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s} className="bg-[#111827] text-white">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                    {e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelected(e)} className="text-gray-400 hover:text-white transition-colors"><Eye size={16} /></button>
                      <button onClick={() => deleteEnquiry(e.id)} className="text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
