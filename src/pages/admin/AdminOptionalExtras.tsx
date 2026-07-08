import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { PlusCircle, Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface Extra {
  id: string
  name: string
  description?: string
  price: number
  active: boolean
  displayOrder: number
  priceOnApplication?: boolean
  internalNotesUrl?: string
  internalNotes?: string
}

interface FormData {
  name: string
  description: string
  price: string
  active: boolean
  priceOnApplication: boolean
  internalNotesUrl: string
  internalNotes: string
}

const EMPTY_FORM: FormData = { name: '', description: '', price: '', active: true, priceOnApplication: false, internalNotesUrl: '', internalNotes: '' }

function ExtraModal({ extra, onSave, onClose }: {
  extra: Extra | null
  onSave: (data: FormData) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<FormData>(
    extra
      ? {
          name: extra.name, description: extra.description || '',
          price: extra.priceOnApplication ? '' : String(extra.price),
          active: extra.active, priceOnApplication: !!extra.priceOnApplication,
          internalNotesUrl: extra.internalNotesUrl || '', internalNotes: extra.internalNotes || '',
        }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (!form.priceOnApplication) {
      const priceNum = parseFloat(form.price)
      if (Number.isNaN(priceNum) || priceNum < 0) { toast.error('Enter a valid price, or tick "Price on Application"'); return }
    }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-bold">{extra ? 'Edit Optional Extra' : 'Add Optional Extra'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Extra Night's Accommodation"
              className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f59e0b]"
              required
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Price Per Person (AUD) *</label>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.priceOnApplication}
                  onChange={e => setForm(f => ({ ...f, priceOnApplication: e.target.checked, price: e.target.checked ? '' : f.price }))}
                  className="rounded"
                />
                Price on Application
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number" min="0" step="0.01"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="49.00"
                disabled={form.priceOnApplication}
                className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg pl-7 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f59e0b] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional short description shown to customers"
              rows={3}
              className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f59e0b] resize-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, active: !f.active }))}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg"
          >
            <span className="text-sm font-semibold text-gray-300">Show to customers</span>
            {form.active
              ? <span className="flex items-center gap-1.5 text-green-400 text-sm font-bold"><ToggleRight size={18} /> Active</span>
              : <span className="flex items-center gap-1.5 text-gray-500 text-sm font-bold"><ToggleLeft size={18} /> Hidden</span>}
          </button>

          <div className="bg-amber-50/10 rounded-lg border border-amber-500/30 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <EyeOff size={12} className="text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Internal Notes (hidden from website)</span>
            </div>
            <input
              type="url"
              value={form.internalNotesUrl}
              onChange={e => setForm(f => ({ ...f, internalNotesUrl: e.target.value }))}
              placeholder="Reference URL"
              className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f59e0b]"
            />
            <textarea
              value={form.internalNotes}
              onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))}
              placeholder="Notes for the team…"
              rows={2}
              className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f59e0b] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? 'Saving…' : extra ? 'Save Changes' : 'Add Extra'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-gray-700 text-gray-400 font-bold rounded-lg hover:text-white transition-colors text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdminOptionalExtras() {
  const [extras, setExtras] = useState<Extra[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Extra | null | 'new'>(null)

  const load = () => {
    setLoading(true)
    api.admin.extras.list()
      .then(setExtras)
      .catch(() => toast.error('Could not load optional extras'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleSave = async (data: FormData) => {
    const payload = {
      name: data.name.trim(),
      description: data.description.trim(),
      price: data.priceOnApplication ? 0 : parseFloat(data.price),
      active: data.active,
      priceOnApplication: data.priceOnApplication,
      internalNotesUrl: data.internalNotesUrl.trim(),
      internalNotes: data.internalNotes.trim(),
    }
    try {
      if (editing && editing !== 'new') {
        const updated = await api.admin.extras.update(editing.id, payload)
        setExtras(es => es.map(e => e.id === updated.id ? updated : e))
        toast.success('Optional extra updated')
      } else {
        const created = await api.admin.extras.create(payload)
        setExtras(es => [...es, created])
        toast.success('Optional extra added')
      }
    } catch (err: any) {
      toast.error(err?.data?.error || 'Could not save optional extra')
      throw err
    }
  }

  const toggleActive = async (extra: Extra) => {
    try {
      const updated = await api.admin.extras.update(extra.id, { active: !extra.active })
      setExtras(es => es.map(e => e.id === updated.id ? updated : e))
    } catch {
      toast.error('Could not update')
    }
  }

  const handleDelete = async (extra: Extra) => {
    if (!confirm(`Delete "${extra.name}"? This cannot be undone.`)) return
    try {
      await api.admin.extras.delete(extra.id)
      setExtras(es => es.filter(e => e.id !== extra.id))
      toast.success('Optional extra deleted')
    } catch {
      toast.error('Could not delete optional extra')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Optional Extras</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Add-ons customers can tick on any package page to build up the price per person.
          </p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm"
        >
          <Plus size={16} /> Add Extra
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#111827] rounded-xl animate-pulse" />)}
        </div>
      ) : extras.length === 0 ? (
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-12 text-center">
          <PlusCircle size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No optional extras yet</p>
          <p className="text-gray-600 text-sm mt-1">Add your first one to let customers build up their price.</p>
        </div>
      ) : (
        <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-medium">Name</th>
                  <th className="text-left px-6 py-3 font-medium">Price / Person</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {extras.map(extra => (
                  <tr key={extra.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white font-medium">{extra.name}</p>
                        {(extra.internalNotesUrl || extra.internalNotes) && (
                          <EyeOff size={11} className="text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      {extra.description && <p className="text-gray-500 text-xs mt-0.5">{extra.description}</p>}
                    </td>
                    <td className="px-6 py-4 text-[#f59e0b] font-bold">{extra.priceOnApplication ? 'POA' : `$${extra.price.toFixed(2)}`}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleActive(extra)}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border transition-colors ${
                          extra.active
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20'
                        }`}>
                        {extra.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        {extra.active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditing(extra)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(extra)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing !== null && (
        <ExtraModal
          extra={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
