import React, { useState } from 'react'
import {
  OptionalExtra,
  usePackageExtras,
  useCreatePackageExtra,
  useUpdatePackageExtra,
  useDeletePackageExtra,
} from '../../hooks/useExtras'
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight, Sparkles, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface AddOnFormData {
  name: string
  description: string
  price: string
  active: boolean
  priceOnApplication: boolean
  internalNotesUrl: string
  internalNotes: string
}
const EMPTY_FORM: AddOnFormData = { name: '', description: '', price: '', active: true, priceOnApplication: false, internalNotesUrl: '', internalNotes: '' }

// No <form>/onSubmit here — this renders inside the package edit page's own
// <form>, and nested <form> elements aren't valid HTML.
function AddOnModal({ addOn, onSave, onClose }: {
  addOn: OptionalExtra | null
  onSave: (data: AddOnFormData) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<AddOnFormData>(
    addOn
      ? {
          name: addOn.name, description: addOn.description || '',
          price: addOn.priceOnApplication ? '' : String(addOn.price),
          active: addOn.active, priceOnApplication: !!addOn.priceOnApplication,
          internalNotesUrl: addOn.internalNotesUrl || '', internalNotes: addOn.internalNotes || '',
        }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
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
          <h2 className="text-white font-bold">{addOn ? 'Edit Add-On Option' : 'Add Add-On Option'}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Extra Round of Golf"
              className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f59e0b]"
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
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? 'Saving…' : addOn ? 'Save Changes' : 'Add Option'}
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

/**
 * Add-on options unique to a single package (not shared with other packages,
 * unlike the central Admin → Optional Extras list). Only usable once the
 * package has been saved at least once, since add-ons are attached by id.
 */
export function PackageAddOnsEditor({ packageId }: { packageId: string }) {
  const { data: addOns, isLoading } = usePackageExtras(packageId)
  const createMutation = useCreatePackageExtra(packageId)
  const updateMutation = useUpdatePackageExtra(packageId)
  const deleteMutation = useDeletePackageExtra(packageId)
  const [editing, setEditing] = useState<OptionalExtra | null | 'new'>(null)

  const handleSave = async (data: AddOnFormData) => {
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
        await updateMutation.mutateAsync({ id: editing.id, ...payload })
        toast.success('Add-on option updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Add-on option added')
      }
    } catch (err: any) {
      toast.error(err?.data?.error || 'Could not save add-on option')
      throw err
    }
  }

  const toggleActive = (addOn: OptionalExtra) => {
    updateMutation.mutate({ id: addOn.id, active: !addOn.active } as any, {
      onError: () => toast.error('Could not update'),
    })
  }

  const handleDelete = (addOn: OptionalExtra) => {
    if (!confirm(`Delete "${addOn.name}"? This cannot be undone.`)) return
    deleteMutation.mutate(addOn.id, {
      onSuccess: () => toast.success('Add-on option deleted'),
      onError: () => toast.error('Could not delete add-on option'),
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#f59e0b]" />
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Add-On Options</label>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f59e0b] text-black text-xs font-bold rounded-lg hover:bg-[#d97706] transition-colors"
        >
          <Plus size={13} /> Add Option
        </button>
      </div>
      <p className="text-xs text-gray-400 -mt-2">
        Unique to this package only — customers can tick these on this trip's page to build up the price. For add-ons shared across every package, use Admin → Optional Extras instead.
      </p>

      {isLoading ? (
        <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : !addOns || addOns.length === 0 ? (
        <p className="text-gray-400 text-sm italic py-2">No add-on options yet for this package.</p>
      ) : (
        <div className="space-y-2">
          {addOns.map(addOn => (
            <div key={addOn.id} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 text-sm font-semibold truncate">{addOn.name}</span>
                  <span className="text-[#f59e0b] text-sm font-bold flex-shrink-0">
                    {addOn.priceOnApplication ? 'POA' : `$${addOn.price.toFixed(2)}`}
                  </span>
                  {(addOn.internalNotesUrl || addOn.internalNotes) && (
                    <EyeOff size={11} className="text-amber-500 flex-shrink-0" />
                  )}
                </div>
                {addOn.description && <p className="text-gray-500 text-xs mt-0.5 truncate">{addOn.description}</p>}
              </div>
              <button type="button" onClick={() => toggleActive(addOn)}
                className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border transition-colors ${
                  addOn.active
                    ? 'bg-green-500/10 text-green-600 border-green-500/20'
                    : 'bg-gray-200 text-gray-500 border-gray-300'
                }`}>
                {addOn.active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                {addOn.active ? 'Active' : 'Hidden'}
              </button>
              <button type="button" onClick={() => setEditing(addOn)}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">
                <Pencil size={14} />
              </button>
              <button type="button" onClick={() => handleDelete(addOn)}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <AddOnModal
          addOn={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
