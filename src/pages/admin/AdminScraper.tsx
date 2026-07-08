import React, { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { api } from '../../lib/api'
import {
  Radar, Plus, Trash2, RefreshCw, Loader2, ExternalLink, Check, X,
  Globe, PackagePlus, MapPin, Tag, Search,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Source {
  id: string
  url: string
  domain: string
  label?: string
  last_scanned_at?: string | null
  last_status?: string | null
  found_count: number
}

interface Pending {
  id: string
  source_url: string
  source_domain: string
  title: string
  price?: string
  description?: string
  image?: string
  features: string[]
  location?: string
  created_at?: string
}

export function AdminScraper() {
  const navigate = useNavigate()
  const [sources, setSources] = useState<Source[]>([])
  const [pending, setPending] = useState<Pending[]>([])
  const [loading, setLoading] = useState(true)
  const [newUrl, setNewUrl] = useState('')
  const [addingSource, setAddingSource] = useState(false)
  const [scanningId, setScanningId] = useState<string | null>(null)
  const [scanningAll, setScanningAll] = useState(false)
  const [discovering, setDiscovering] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [s, p] = await Promise.all([api.admin.scraper.sources(), api.admin.scraper.pending()])
      setSources(s); setPending(p)
    } catch {
      toast.error('Could not load discovery data')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const addSource = async () => {
    if (!newUrl.trim()) return
    setAddingSource(true)
    try {
      const res = await api.admin.scraper.addSource(newUrl.trim())
      setSources(res.sources)
      setNewUrl('')
      toast.success('Source added')
    } catch (err: any) {
      toast.error(err?.data?.error || 'Could not add source')
    } finally {
      setAddingSource(false)
    }
  }

  const deleteSource = async (s: Source) => {
    if (!confirm(`Remove ${s.domain} from discovery sources?`)) return
    try {
      await api.admin.scraper.deleteSource(s.id)
      setSources(prev => prev.filter(x => x.id !== s.id))
      toast.success('Source removed')
    } catch { toast.error('Could not remove source') }
  }

  const scanOne = async (s: Source) => {
    setScanningId(s.id)
    try {
      const res = await api.admin.scraper.scan({ id: s.id })
      toast.success(res.message || 'Scan complete')
      await load()
    } catch (err: any) {
      toast.error(err?.data?.error || 'Scan failed')
    } finally {
      setScanningId(null)
    }
  }

  const scanAll = async () => {
    setScanningAll(true)
    let created = 0
    try {
      // Scan each source sequentially to stay within request limits
      for (const s of sources) {
        try {
          const res = await api.admin.scraper.scan({ id: s.id })
          created += res.created || 0
        } catch { /* keep going */ }
      }
      toast.success(created > 0 ? `Found ${created} new package(s)` : 'Scan complete — no new packages')
      await load()
    } finally {
      setScanningAll(false)
    }
  }

  const autoDiscover = async () => {
    setDiscovering(true)
    try {
      const res = await api.admin.scraper.discover()
      toast.success(res.message || 'Discovery complete')
      await load()
    } catch (err: any) {
      toast.error(err?.data?.error || 'Discovery failed')
    } finally {
      setDiscovering(false)
    }
  }

  const dismiss = async (p: Pending) => {
    try {
      await api.admin.scraper.setPendingStatus(p.id, 'dismissed')
      setPending(prev => prev.filter(x => x.id !== p.id))
    } catch { toast.error('Could not dismiss') }
  }

  // Hand the scraped data to the package form, then mark it imported.
  const createPackage = async (p: Pending) => {
    const guessType = () => {
      const hay = `${p.title} ${p.source_domain}`.toLowerCase()
      if (hay.includes('golf')) return 'golf'
      if (hay.includes('fish')) return 'fishing'
      return 'custom'
    }
    const prefill = {
      title: p.title,
      package_type: guessType(),
      price: p.price ? p.price.replace(/[^0-9.]/g, '') : '',
      location: p.location || '',
      image_url: p.image || '',
      description: p.description || '',
      features: p.features || [],
      source: p.source_url,
    }
    sessionStorage.setItem('prefillPackage', JSON.stringify(prefill))
    try { await api.admin.scraper.setPendingStatus(p.id, 'imported') } catch { /* non-blocking */ }
    navigate({ to: '/admin/packages/new' })
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Radar size={22} className="text-[#f59e0b]" /> Supplier Discovery</h1>
          <p className="text-gray-500 text-sm mt-0.5">Scan supplier sites for packages. Findings are staged here for review — nothing goes live until you create it.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={autoDiscover} disabled={discovering}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e2a3a] text-white font-bold rounded-lg hover:bg-[#263348] border border-gray-700 transition-colors text-sm disabled:opacity-50">
            {discovering ? <><Loader2 size={16} className="animate-spin" /> Searching AU…</> : <><Search size={16} /> Auto-Discover</>}
          </button>
          <button onClick={scanAll} disabled={scanningAll || sources.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm disabled:opacity-50">
            {scanningAll ? <><Loader2 size={16} className="animate-spin" /> Scanning…</> : <><RefreshCw size={16} /> Scan All</>}
          </button>
        </div>
      </div>

      {/* Sources */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 mt-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={15} className="text-[#f59e0b]" />
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Discovery Sources</h2>
        </div>

        <div className="flex gap-2 mb-5">
          <input
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSource() } }}
            placeholder="https://supplier.com.au/packages/"
            className="flex-1 bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f59e0b]"
          />
          <button onClick={addSource} disabled={addingSource || !newUrl.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#f59e0b] text-black text-sm font-bold rounded-lg hover:bg-[#d97706] transition-colors disabled:opacity-50">
            <Plus size={14} /> Add
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-[#0a0e1a] rounded-lg animate-pulse" />)}</div>
        ) : sources.length === 0 ? (
          <p className="text-gray-600 text-sm italic">No sources yet — add a supplier URL above.</p>
        ) : (
          <div className="space-y-2">
            {sources.map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-[#0a0e1a] border border-gray-800 rounded-lg px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium truncate">{s.label || s.domain}</span>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#f59e0b]"><ExternalLink size={12} /></a>
                  </div>
                  <p className="text-gray-600 text-xs truncate">
                    {s.last_scanned_at
                      ? `${s.last_status || 'Scanned'} · last scan ${new Date(s.last_scanned_at.replace(' ', 'T')).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                      : 'Not scanned yet'}
                  </p>
                </div>
                <button onClick={() => scanOne(s)} disabled={scanningId === s.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-300 bg-[#1e2a3a] hover:bg-[#263348] border border-gray-700 rounded-lg transition-colors disabled:opacity-50">
                  {scanningId === s.id ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Scan
                </button>
                <button onClick={() => deleteSource(s)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending packages */}
      <div className="flex items-center gap-2 mb-4">
        <PackagePlus size={16} className="text-[#f59e0b]" />
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Pending Packages</h2>
        <span className="text-gray-600 text-xs">{pending.length} awaiting review</span>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1, 2].map(i => <div key={i} className="h-40 bg-[#111827] rounded-xl animate-pulse" />)}</div>
      ) : pending.length === 0 ? (
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-12 text-center">
          <Radar size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No pending packages</p>
          <p className="text-gray-600 text-sm mt-1">Run a scan above to discover supplier packages.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {pending.map(p => (
            <div key={p.id} className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden flex flex-col">
              {p.image && (
                <div className="h-36 bg-[#0a0e1a] overflow-hidden">
                  <img src={p.image} alt="" className="w-full h-full object-cover" loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-white font-semibold text-sm leading-snug">{p.title}</h3>
                  {p.price && <span className="flex-shrink-0 inline-flex items-center gap-1 text-[#f59e0b] font-bold text-sm"><Tag size={12} />{p.price}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  {p.location && <span className="inline-flex items-center gap-1"><MapPin size={11} />{p.location}</span>}
                  <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[#f59e0b]">
                    <Globe size={11} />{p.source_domain}
                  </a>
                </div>
                {p.description && <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-3">{p.description}</p>}
                {p.features?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.features.slice(0, 4).map((f, i) => (
                      <span key={i} className="text-[10px] bg-[#0a0e1a] border border-gray-800 text-gray-400 rounded px-1.5 py-0.5">{f}</span>
                    ))}
                    {p.features.length > 4 && <span className="text-[10px] text-gray-600">+{p.features.length - 4} more</span>}
                  </div>
                )}
                <div className="flex gap-2 mt-auto pt-2">
                  <button onClick={() => createPackage(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#f59e0b] text-black text-xs font-bold rounded-lg hover:bg-[#d97706] transition-colors">
                    <Check size={13} /> Create Package
                  </button>
                  <button onClick={() => dismiss(p)}
                    className="px-3 py-2 text-xs font-bold text-gray-400 border border-gray-700 rounded-lg hover:text-white hover:border-gray-600 transition-colors">
                    <X size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-[#111827] border border-gray-800 rounded-xl text-xs text-gray-500 leading-relaxed">
        <p className="font-semibold text-gray-400 mb-1 flex items-center gap-1"><Radar size={12} /> How discovery works</p>
        <p><strong className="text-gray-300">Auto-Discover</strong> searches the web for new Australian supplier sites, adds relevant ones as sources and scans them. Every site it has ever seen is remembered, so nothing is shown twice.</p>
        <p className="mt-1"><strong className="text-gray-300">Scan</strong> pulls package details from a source and follows package links within its own site. New findings are emailed to admin@blokestrips.com.au and staged here.</p>
        <p className="mt-1"><strong className="text-gray-300">Create Package</strong> opens the package form pre-filled — review, tweak and save to make it live. Nothing is published automatically.</p>
      </div>
    </div>
  )
}
