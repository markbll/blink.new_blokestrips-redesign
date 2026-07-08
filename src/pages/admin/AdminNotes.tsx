import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { NotebookPen, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export function AdminNotes() {
  const [notes, setNotes] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    api.admin.notes.get()
      .then(data => { setNotes(data.notes || ''); setUpdatedAt(data.updatedAt) })
      .catch(() => toast.error('Could not load notes'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.admin.notes.update(notes)
      setUpdatedAt(res.updatedAt)
      setDirty(false)
      toast.success('Notes saved')
    } catch {
      toast.error('Could not save notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <NotebookPen size={22} className="text-[#f59e0b]" /> Notes
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            A general scratchpad for the team — reminders, passwords to rotate, supplier contacts, anything worth keeping handy. Hidden from the website; visible only here in the admin.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Save size={15} /> {saving ? 'Saving…' : 'Save Notes'}
        </button>
      </div>

      {loading ? (
        <div className="h-96 bg-[#111827] rounded-xl animate-pulse" />
      ) : (
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-1">
          <textarea
            value={notes}
            onChange={e => { setNotes(e.target.value); setDirty(true) }}
            placeholder="Write anything here — this is just for the team…"
            rows={22}
            className="w-full bg-transparent text-white text-sm p-5 focus:outline-none resize-y leading-relaxed"
          />
        </div>
      )}

      {updatedAt && (
        <p className="text-xs text-gray-600 mt-3 text-right">
          Last saved: {new Date(updatedAt.replace(' ', 'T')).toLocaleString('en-AU', {
            day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
          })}
        </p>
      )}
    </div>
  )
}
