import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useAdminPackages, useCreatePackage, useUpdatePackage } from '../../hooks/usePackages'
import { usePresets, useUpdatePresets } from '../../hooks/usePresets'
import { PackageAddOnsEditor } from '../../components/admin/PackageAddOnsEditor'
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Textarea, Switch, toast } from '@blinkdotnew/ui'
import { ArrowLeft, Plus, X, Clock, Upload, ImageIcon, Check, EyeOff } from 'lucide-react'

// ─── Preset lists ────────────────────────────────────────────────────────────

const PRESET_PACKAGE_TYPES = [
  { value: 'golf',    label: 'Golf Weekend' },
  { value: 'fishing', label: 'Fishing Trip' },
  { value: 'sports',  label: 'Sports Weekend' },
  { value: 'custom',  label: 'Custom Trip' },
]

const PRESET_GROUP_SIZES = [
  '4–8 Blokes',
  '6–12 Blokes',
  '8–12 Blokes',
  '12–20 Blokes',
  '20+ Blokes',
]

const PRESET_FEATURES = [
  '2 Nights Luxury Accommodation',
  '3 Nights Luxury Accommodation',
  '36 Holes of Championship Golf',
  '54 Holes of Championship Golf',
  'Full Day Fishing Charter',
  'All Fishing Gear & Bait',
  'Shared Transport Included',
  'Airport Transfers',
  'Friday Night Welcome Dinner',
  'Saturday Night Group Dinner',
  'Open Bar Tab',
  'Custom Polo Shirts',
  'Custom Caps',
  'Personalised Trip Itinerary',
  'Individual Payment Links',
  'RSVP Management',
  'Competition Scoring & Prizes',
  'Trophy & Prize Pack',
  'Welcome Pack on Arrival',
  'Dedicated Trip Coordinator',
]

const PRESET_HIGHLIGHTS = [
  'Accommodation sorted',
  'Tee times locked in',
  'Bar tab included',
  'Custom gear provided',
  'Trophy & Prize pack',
  'Transport arranged',
  'All meals included',
  'Individual payments',
  'Full itinerary provided',
  'Fishing gear & bait',
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  title: string
  slug: string
  package_type: string
  customType: string
  location: string
  price: string
  price_on_application: boolean
  group_size: string
  customGroupSize: string
  image_url: string
  description: string
  is_hero: boolean
  display_order: number
  features: string[]
  highlights: string[]
  start_date: string
  end_date: string
  internal_notes_url: string
  internal_notes: string
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function PresetCheckList({
  label,
  presets,
  selected,
  onToggle,
  customItems,
  onAddCustom,
  onRemoveCustom,
  placeholder,
}: {
  label: string
  presets: string[]
  selected: string[]
  onToggle: (item: string) => void
  customItems: string[]
  onAddCustom: (item: string) => void
  onRemoveCustom: (item: string) => void
  placeholder: string
}) {
  const [newItem, setNewItem] = useState('')

  const handleAdd = () => {
    const trimmed = newItem.trim()
    if (!trimmed) return
    onAddCustom(trimmed)
    setNewItem('')
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">{label}</label>

      {/* Preset grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {presets.map(item => {
          const checked = selected.includes(item)
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all ${
                checked
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-400'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                checked ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
              }`}>
                {checked && <Check size={11} className="text-white" strokeWidth={3} />}
              </span>
              {item}
            </button>
          )
        })}
      </div>

      {/* Custom items added */}
      {customItems.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {customItems.map(item => (
            <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-500/5">
              <Check size={13} className="text-amber-500 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium">{item}</span>
              <button type="button" onClick={() => onRemoveCustom(item)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add custom */}
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          placeholder={placeholder}
          className="bg-white h-10 rounded-xl flex-1 text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="h-10 px-3 rounded-xl shrink-0">
          <Plus size={14} className="mr-1" /> Add
        </Button>
      </div>
    </div>
  )
}

// ─── Image upload helper ─────────────────────────────────────────────────────

async function uploadImage(file: File): Promise<string> {
  const token = localStorage.getItem('adminToken')
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: token ? { 'X-Auth-Token': token } : {},
    body: fd,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Upload failed')
  }
  const data = await res.json()
  return data.url as string
}

// ─── Helpers for preset+custom list management ───────────────────────────────

function usePresetList(initial: string[], presets: string[]) {
  const [selected, setSelected] = useState<string[]>(initial)

  // items not in presets are "custom"
  const customItems = selected.filter(s => !presets.includes(s))

  const toggle = (item: string) =>
    setSelected(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item])

  const addCustom = (item: string) => {
    if (!selected.includes(item)) setSelected(prev => [...prev, item])
  }

  const removeCustom = (item: string) => setSelected(prev => prev.filter(x => x !== item))

  const set = (items: string[]) => setSelected(items)

  return { selected, customItems, toggle, addCustom, removeCustom, set }
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AdminPackageForm() {
  const params = useParams({ from: '/admin/packages/$id/edit', shouldThrow: false }) as { id?: string } | undefined
  const isEdit = !!params?.id
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const { data: packages } = useAdminPackages()
  const existing = isEdit && packages ? (packages as any[]).find((p: any) => p.id === params!.id) : null

  const createMutation = useCreatePackage()
  const updateMutation = useUpdatePackage()

  const [form, setForm] = useState<FormState>({
    title: '',
    slug: '',
    package_type: 'golf',
    customType: '',
    location: '',
    price: '',
    price_on_application: false,
    group_size: '',
    customGroupSize: '',
    image_url: '',
    description: '',
    is_hero: false,
    display_order: 0,
    features: [],
    highlights: [],
    start_date: '',
    end_date: '',
    internal_notes_url: '',
    internal_notes: '',
  })

  // Central preset lists (managed in Admin → Trip Options); hardcoded lists as fallback while loading
  const { features: centralFeatures, highlights: centralHighlights } = usePresets()
  const updatePresets = useUpdatePresets()
  const presetFeatures   = centralFeatures.length   > 0 ? centralFeatures   : PRESET_FEATURES
  const presetHighlights = centralHighlights.length > 0 ? centralHighlights : PRESET_HIGHLIGHTS

  const featuresCtrl = usePresetList([], presetFeatures)
  const highlightsCtrl = usePresetList([], presetHighlights)

  // Ad-hoc additions also persist to the central list so they're reusable
  const addCustomFeature = (item: string) => {
    featuresCtrl.addCustom(item)
    if (!presetFeatures.some(f => f.toLowerCase() === item.toLowerCase())) {
      updatePresets.mutate({ presetFeatures: [...presetFeatures, item] })
    }
  }
  const addCustomHighlight = (item: string) => {
    highlightsCtrl.addCustom(item)
    if (!presetHighlights.some(h => h.toLowerCase() === item.toLowerCase())) {
      updatePresets.mutate({ presetHighlights: [...presetHighlights, item] })
    }
  }

  useEffect(() => {
    if (existing) {
      const existingFeatures = Array.isArray(existing.features) ? existing.features : []
      const existingHighlights = Array.isArray(existing.included) ? existing.included : []
      const existingType = (existing.package_type || 'golf').toLowerCase()
      const knownType = PRESET_PACKAGE_TYPES.find(t => t.value === existingType)
      const existingSize = existing.group_size || ''
      const knownSize = PRESET_GROUP_SIZES.includes(existingSize)

      setForm({
        title: existing.title || '',
        slug: existing.slug || '',
        package_type: knownType ? existingType : 'custom',
        customType: knownType ? '' : existingType,
        location: existing.location || '',
        price: existing.price_on_application ? '' : (existing.price || ''),
        price_on_application: !!existing.price_on_application,
        group_size: knownSize ? existingSize : (existingSize ? 'other' : ''),
        customGroupSize: knownSize ? '' : existingSize,
        image_url: existing.image_url || '',
        description: existing.description || '',
        is_hero: Number(existing.is_hero) > 0,
        display_order: Number(existing.display_order) || 0,
        features: existingFeatures,
        highlights: existingHighlights,
        start_date: existing.start_date || '',
        end_date: existing.end_date || '',
        internal_notes_url: existing.internal_notes_url || '',
        internal_notes: existing.internal_notes || '',
      })
      featuresCtrl.set(existingFeatures)
      highlightsCtrl.set(existingHighlights)
    }
  }, [existing])

  // Prefill from a discovered (scraped) pending package — set once on mount when creating
  useEffect(() => {
    if (isEdit) return
    const raw = sessionStorage.getItem('prefillPackage')
    if (!raw) return
    sessionStorage.removeItem('prefillPackage')
    try {
      const p = JSON.parse(raw)
      const type = (p.package_type || 'custom').toLowerCase()
      const knownType = PRESET_PACKAGE_TYPES.find(t => t.value === type)
      const feats = Array.isArray(p.features) ? p.features : []
      setForm(prev => ({
        ...prev,
        title: p.title || '',
        slug: (p.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        package_type: knownType ? type : 'custom',
        customType: knownType ? '' : type,
        location: p.location || '',
        price: p.price || '',
        image_url: p.image_url || '',
        description: p.source
          ? `${p.description || ''}\n\nSource: ${p.source}`.trim()
          : (p.description || ''),
        features: feats,
      }))
      featuresCtrl.set(feats)
      toast.success('Pre-filled from discovery — review and save to publish')
    } catch { /* ignore malformed prefill */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSlug = (title: string) => {
    if (!isEdit) {
      setForm(prev => ({
        ...prev, title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }))
    } else {
      setForm(prev => ({ ...prev, title }))
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setForm(prev => ({ ...prev, image_url: url }))
      toast.success('Image uploaded', { description: 'Image saved and ready.' })
    } catch (err: any) {
      toast.error('Upload failed', { description: err.message })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const resolvedType = form.package_type === 'other' ? form.customType.trim() : form.package_type
  const resolvedSize = form.group_size === 'other' ? form.customGroupSize.trim() : form.group_size

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.slug || !form.location) {
      toast.error('Missing fields', { description: 'Title, slug, and location are required.' })
      return
    }
    if (!form.price_on_application && !form.price) {
      toast.error('Missing price', { description: 'Enter a price, or tick "Price on Application".' })
      return
    }

    const payload = {
      title: form.title,
      slug: form.slug,
      package_type: resolvedType || 'custom',
      location: form.location,
      price: form.price,
      price_on_application: form.price_on_application,
      group_size: resolvedSize,
      image_url: form.image_url,
      description: form.description,
      features: featuresCtrl.selected.filter(f => f.trim()),
      included: highlightsCtrl.selected.filter(h => h.trim()),
      is_hero: form.is_hero ? 1 : 0,
      display_order: form.display_order,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      internal_notes_url: form.internal_notes_url.trim(),
      internal_notes: form.internal_notes.trim(),
    }

    if (isEdit && params?.id) {
      updateMutation.mutate(
        { id: params.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Updated', { description: 'Package updated successfully.' })
            navigate({ to: '/admin' })
          },
          onError: () => toast.error('Error', { description: 'Could not update package.' }),
        }
      )
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: () => {
          toast.success('Created', { description: 'Package created successfully.' })
          navigate({ to: '/admin' })
        },
        onError: () => toast.error('Error', { description: 'Could not create package.' }),
      })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin' })}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-black uppercase italic tracking-tight">
            {isEdit ? 'Edit Package' : 'New Package'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isEdit ? 'Update package details.' : 'Add a new trip package to your catalog.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-8 max-w-2xl">

        {/* ── Title + Slug ── */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Title *</label>
            <Input
              value={form.title}
              onChange={e => handleSlug(e.target.value)}
              placeholder="The Ultimate Golf Weekend"
              className="bg-white h-12 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Slug *</label>
            <Input
              value={form.slug}
              onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="ultimate-golf-weekend"
              className="bg-white h-12 rounded-xl"
              required
              disabled={isEdit}
            />
          </div>
        </div>

        {/* ── Package Type ── */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Package Type</label>
          <div className="grid sm:grid-cols-2 gap-3">
            {[...PRESET_PACKAGE_TYPES, { value: 'other', label: '+ Create New Type…' }].map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, package_type: t.value }))}
                className={`px-4 py-3 rounded-xl border text-sm font-bold text-left transition-all ${
                  form.package_type === t.value
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-400'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                } ${t.value === 'other' ? 'col-span-full sm:col-span-1' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {form.package_type === 'other' && (
            <Input
              value={form.customType}
              onChange={e => setForm(prev => ({ ...prev, customType: e.target.value }))}
              placeholder="e.g. Hunting Trip, Camping Weekend…"
              className="bg-white h-11 rounded-xl mt-2"
            />
          )}
        </div>

        {/* ── Price + Group Size ── */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Price per Person</label>
              <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.price_on_application}
                  onChange={e => setForm(prev => ({ ...prev, price_on_application: e.target.checked, price: e.target.checked ? '' : prev.price }))}
                  className="rounded"
                />
                Price on Application
              </label>
            </div>
            <Input
              value={form.price}
              onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
              placeholder="$499"
              disabled={form.price_on_application}
              className="bg-white h-12 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Group Size</label>
            <Select value={form.group_size} onValueChange={v => setForm(prev => ({ ...prev, group_size: v }))}>
              <SelectTrigger className="bg-white h-12 rounded-xl">
                <SelectValue placeholder="Select group size…" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_GROUP_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                <SelectItem value="other">+ Enter custom size…</SelectItem>
              </SelectContent>
            </Select>
            {form.group_size === 'other' && (
              <Input
                value={form.customGroupSize}
                onChange={e => setForm(prev => ({ ...prev, customGroupSize: e.target.value }))}
                placeholder="e.g. 5–30 Blokes"
                className="bg-white h-11 rounded-xl"
              />
            )}
          </div>
        </div>

        {/* ── Location ── */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Location *</label>
          <Input
            value={form.location}
            onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Murray River"
            className="bg-white h-12 rounded-xl"
            required
          />
        </div>

        {/* ── Image Upload ── */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Package Image</label>

          {/* Upload button */}
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <label
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  uploading ? 'border-amber-400 bg-amber-50' : 'border-gray-300 bg-white hover:border-amber-400 hover:bg-amber-50/30'
                }`}
              >
                <Upload size={18} className={uploading ? 'text-amber-500 animate-bounce' : 'text-gray-400'} />
                <span className="text-sm font-medium text-gray-600">
                  {uploading ? 'Uploading…' : 'Click to upload image (JPG, PNG, WebP)'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* OR use URL */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">or paste URL</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <Input
            value={form.image_url}
            onChange={e => setForm(prev => ({ ...prev, image_url: e.target.value }))}
            placeholder="https://images.unsplash.com/..."
            className="bg-white h-11 rounded-xl"
          />

          {/* Preview */}
          {form.image_url && (
            <div className="relative rounded-xl overflow-hidden h-40 border border-gray-200">
              <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-3">
                <span className="text-white text-xs font-bold flex items-center gap-1">
                  <ImageIcon size={12} /> Image preview
                </span>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* ── Description ── */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
          <Textarea
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the package..."
            className="bg-white rounded-xl min-h-[100px]"
          />
        </div>

        {/* ── Features ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <PresetCheckList
            label="What's Included — Features"
            presets={presetFeatures}
            selected={featuresCtrl.selected}
            onToggle={featuresCtrl.toggle}
            customItems={featuresCtrl.customItems}
            onAddCustom={addCustomFeature}
            onRemoveCustom={featuresCtrl.removeCustom}
            placeholder="e.g. Helicopter transfer…"
          />
        </div>

        {/* ── Highlights ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <PresetCheckList
            label="Package Highlights (shown as badges on cards)"
            presets={presetHighlights}
            selected={highlightsCtrl.selected}
            onToggle={highlightsCtrl.toggle}
            customItems={highlightsCtrl.customItems}
            onAddCustom={addCustomHighlight}
            onRemoveCustom={highlightsCtrl.removeCustom}
            placeholder="e.g. VIP suite upgrade…"
          />
        </div>

        {/* ── Schedule ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Schedule (optional)</label>
            <p className="text-xs text-gray-400 mt-0.5">Set dates to show/hide this package automatically. Leave blank to always show.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Show From</label>
              <Input
                type="date"
                value={form.start_date}
                onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                className="bg-gray-50 h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Hide After</label>
              <Input
                type="date"
                value={form.end_date}
                onChange={e => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                className="bg-gray-50 h-11 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* ── Hero + Order ── */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between gap-6 bg-white p-4 rounded-xl border border-gray-200">
            <div className="space-y-0.5">
              <label className="text-xs font-black uppercase tracking-widest">Hero Package</label>
              <p className="text-xs text-muted-foreground">Featured on homepage (max 3)</p>
            </div>
            <Switch
              checked={form.is_hero}
              onCheckedChange={checked => setForm(prev => ({ ...prev, is_hero: checked }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Display Order</label>
            <Input
              type="number"
              value={form.display_order}
              onChange={e => setForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
              className="bg-white h-12 rounded-xl"
              min={0}
            />
          </div>
        </div>

        {/* ── Add-On Options (unique to this package) ── */}
        {isEdit && params?.id ? (
          <PackageAddOnsEditor packageId={params.id} />
        ) : (
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-5 text-center">
            <p className="text-sm text-gray-500">Save this package first to add package-specific Add-On Options.</p>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            className="h-14 px-10 bg-accent text-primary hover:bg-primary hover:text-white border-none font-black uppercase italic tracking-tight text-lg shadow-xl shadow-accent/20"
            disabled={isSaving || uploading}
          >
            {isSaving ? 'Saving…' : isEdit ? 'Update Package' : 'Create Package'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate({ to: '/admin' })}
            className="h-14 px-8 font-bold uppercase tracking-widest text-sm"
          >
            Cancel
          </Button>
        </div>

        {isEdit && existing && (
          <p className="text-xs text-muted-foreground text-right flex items-center justify-end gap-1.5">
            <Clock size={12} />
            Last modified:{' '}
            {new Date(existing.updated_at).toLocaleString('en-AU', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: 'numeric', minute: '2-digit',
            })}
          </p>
        )}
      </div>

        {/* ── Internal Notes (admin-only, never shown on the website) — fixed alongside the form on scroll ── */}
        <div className="lg:sticky lg:top-6 self-start w-full bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <EyeOff size={14} className="text-amber-700" />
            <label className="text-xs font-black uppercase tracking-widest text-amber-800">Internal Notes</label>
          </div>
          <p className="text-xs text-amber-700/80 -mt-2">
            Hidden from the website — visible only here in the admin. Use it to keep a source link and any notes for your team.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">Reference URL</label>
            <Input
              type="url"
              value={form.internal_notes_url}
              onChange={e => setForm(prev => ({ ...prev, internal_notes_url: e.target.value }))}
              placeholder="https://supplier-site.com/package-page"
              className="bg-white h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">Notes</label>
            <Textarea
              value={form.internal_notes}
              onChange={e => setForm(prev => ({ ...prev, internal_notes: e.target.value }))}
              placeholder="Supplier contact, negotiated rate, booking terms, anything the team needs to know…"
              rows={8}
              className="bg-white rounded-xl"
            />
          </div>
        </div>
      </form>
    </div>
  )
}
