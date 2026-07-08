import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useUpdatePresets, PresetItem } from '../../hooks/usePresets'
import { ListChecks, Sparkles, Plus, Trash2, GripVertical, ArrowUp, ArrowDown, EyeOff, X, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

function NotesModal({ item, onSave, onClose }: {
  item: PresetItem
  onSave: (notesUrl: string, notes: string) => void
  onClose: () => void
}) {
  const [notesUrl, setNotesUrl] = useState(item.notesUrl)
  const [notes, setNotes] = useState(item.notes)

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-bold flex items-center gap-2">
            <EyeOff size={15} className="text-amber-500" /> Internal Notes
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-400 text-xs -mt-2">For "{item.text}" — hidden from the website, visible only here.</p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reference URL</label>
            <input
              type="url"
              value={notesUrl}
              onChange={e => setNotesUrl(e.target.value)}
              placeholder="https://supplier-site.com/..."
              className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f59e0b]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes for the team…"
              rows={4}
              className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f59e0b] resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { onSave(notesUrl.trim(), notes.trim()); onClose() }}
              className="flex-1 py-2.5 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm"
            >
              Save Notes
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-gray-700 text-gray-400 font-bold rounded-lg hover:text-white transition-colors text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PresetListEditor({
  title, icon: Icon, items, onChange, placeholder, hint,
}: {
  title: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  items: PresetItem[]
  onChange: (items: PresetItem[]) => void
  placeholder: string
  hint: string
}) {
  const [newItem, setNewItem] = useState('')
  const [editingNotes, setEditingNotes] = useState<number | null>(null)

  const add = () => {
    const trimmed = newItem.trim()
    if (!trimmed) return
    if (items.some(i => i.text.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('That item already exists')
      return
    }
    onChange([...items, { text: trimmed, notesUrl: '', notes: '' }])
    setNewItem('')
  }

  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx))

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...items]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  const saveNotes = (idx: number, notesUrl: string, notes: string) => {
    const next = [...items]
    next[idx] = { ...next[idx], notesUrl, notes }
    onChange(next)
  }

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className="text-[#f59e0b]" />
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">{title}</h2>
        <span className="ml-auto text-xs text-gray-600">{items.length} items</span>
      </div>
      <p className="text-gray-600 text-xs mb-5">{hint}</p>

      <div className="space-y-1.5 mb-4">
        {items.map((item, idx) => (
          <div key={`${item.text}-${idx}`}
            className="flex items-center gap-2 bg-[#0a0e1a] border border-gray-800 rounded-lg px-3 py-2 group">
            <GripVertical size={13} className="text-gray-700 flex-shrink-0" />
            <span className="text-gray-300 text-sm flex-1 min-w-0 truncate">{item.text}</span>
            {(item.notesUrl || item.notes) && (
              <EyeOff size={12} className="text-amber-500 flex-shrink-0" />
            )}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditingNotes(idx)}
                className="p-1 text-gray-500 hover:text-amber-400 transition-colors" title="Internal notes">
                <Pencil size={13} />
              </button>
              <button onClick={() => move(idx, -1)} disabled={idx === 0}
                className="p-1 text-gray-500 hover:text-white disabled:opacity-20 transition-colors">
                <ArrowUp size={13} />
              </button>
              <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1}
                className="p-1 text-gray-500 hover:text-white disabled:opacity-20 transition-colors">
                <ArrowDown size={13} />
              </button>
              <button onClick={() => remove(idx)}
                className="p-1 text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-gray-600 text-sm italic py-3 text-center">No items yet — add your first below.</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className="flex-1 bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f59e0b]"
        />
        <button onClick={add}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#f59e0b] text-black text-sm font-bold rounded-lg hover:bg-[#d97706] transition-colors">
          <Plus size={14} /> Add
        </button>
      </div>

      {editingNotes !== null && (
        <NotesModal
          item={items[editingNotes]}
          onSave={(notesUrl, notes) => saveNotes(editingNotes, notesUrl, notes)}
          onClose={() => setEditingNotes(null)}
        />
      )}
    </div>
  )
}

export function AdminTripOptions() {
  const [features, setFeatures] = useState<PresetItem[]>([])
  const [highlights, setHighlights] = useState<PresetItem[]>([])
  const [loading, setLoading] = useState(true)
  const updateMutation = useUpdatePresets()

  const load = () => {
    setLoading(true)
    api.admin.settings.getTripOptions()
      .then(data => {
        setFeatures(data.presetFeatures || [])
        setHighlights(data.presetHighlights || [])
      })
      .catch(() => toast.error('Could not load Trip Options'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const saveFeatures = (next: PresetItem[]) => {
    setFeatures(next)
    updateMutation.mutate({ presetFeatures: next }, {
      onSuccess: () => toast.success('Features updated'),
      onError:   () => toast.error('Could not save — try again'),
    })
  }

  const saveHighlights = (next: PresetItem[]) => {
    setHighlights(next)
    updateMutation.mutate({ presetHighlights: next }, {
      onSuccess: () => toast.success('Highlights updated'),
      onError:   () => toast.error('Could not save — try again'),
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Trip Options</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage the Features and Package Highlights available when building packages and on the Build Your Custom Trip form.
          Click the pencil on any item to add a hidden reference link or notes for your team.
        </p>
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-96 bg-[#111827] rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <PresetListEditor
            title="Features"
            icon={ListChecks}
            items={features}
            onChange={saveFeatures}
            placeholder="e.g. Sunday Recovery Brunch"
            hint="Detailed inclusions selectable when building a package — also shown on the custom trip form."
          />
          <PresetListEditor
            title="Package Highlights"
            icon={Sparkles}
            items={highlights}
            onChange={saveHighlights}
            placeholder="e.g. Beers on arrival"
            hint="Short punchy selling points shown on package cards — also selectable on the custom trip form."
          />
        </div>
      )}
    </div>
  )
}
