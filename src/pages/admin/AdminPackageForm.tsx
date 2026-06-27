import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useAllPackages, useCreatePackage, useUpdatePackage } from '../../hooks/usePackages'
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Textarea, Switch, toast } from '@blinkdotnew/ui'
import { ArrowLeft, Plus, X, Clock } from 'lucide-react'

export function AdminPackageForm() {
  const params = useParams({ from: '/admin/$id/edit', shouldThrow: false }) as { id?: string } | undefined
  const isEdit = !!params?.id
  const navigate = useNavigate()

  const { data: packages } = useAllPackages()
  const existing = isEdit && packages ? (packages as any[]).find((p: any) => p.id === params!.id) : null

  const createMutation = useCreatePackage()
  const updateMutation = useUpdatePackage()

  const [form, setForm] = useState({
    title: '',
    slug: '',
    package_type: 'golf' as string,
    location: '',
    price: '',
    group_size: '',
    image_url: '',
    description: '',
    is_hero: false,
    display_order: 0,
    features: [] as string[],
  })

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || '',
        slug: existing.slug || '',
        package_type: existing.package_type || 'golf',
        location: existing.location || '',
        price: existing.price || '',
        group_size: existing.group_size || '',
        image_url: existing.image_url || '',
        description: existing.description || '',
        is_hero: Number(existing.is_hero) > 0,
        display_order: Number(existing.display_order) || 0,
        features: Array.isArray(existing.features) ? existing.features : [],
      })
    }
  }, [existing])

  const handleSlug = (title: string) => {
    if (!isEdit) {
      setForm((prev) => ({
        ...prev,
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }))
    } else {
      setForm((prev) => ({ ...prev, title }))
    }
  }

  const addFeature = () => setForm((prev) => ({ ...prev, features: [...prev.features, ''] }))
  const removeFeature = (i: number) => setForm((prev) => ({
    ...prev,
    features: prev.features.filter((_, idx) => idx !== i),
  }))
  const updateFeature = (i: number, val: string) => setForm((prev) => {
    const updated = [...prev.features]
    updated[i] = val
    return { ...prev, features: updated }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.slug || !form.location) {
      toast.error('Missing fields', { description: 'Title, slug, and location are required.' })
      return
    }

    const payload = {
      title: form.title,
      slug: form.slug,
      package_type: form.package_type,
      location: form.location,
      price: form.price,
      group_size: form.group_size,
      image_url: form.image_url,
      description: form.description,
      features: JSON.stringify(form.features.filter((f) => f.trim())),
      is_hero: form.is_hero ? 1 : 0,
      display_order: form.display_order,
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

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Title *</label>
            <Input
              value={form.title}
              onChange={(e) => handleSlug(e.target.value)}
              placeholder="The Ultimate Golf Weekend"
              className="bg-white h-12 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Slug *</label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="ultimate-golf-weekend"
              className="bg-white h-12 rounded-xl"
              required
              disabled={isEdit}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Package Type</label>
            <Select value={form.package_type} onValueChange={(v) => setForm((prev) => ({ ...prev, package_type: v }))}>
              <SelectTrigger className="bg-white h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="golf">Golf Weekend</SelectItem>
                <SelectItem value="fishing">Fishing Trip</SelectItem>
                <SelectItem value="bucks">Bucks Party</SelectItem>
                <SelectItem value="custom">Custom Trip</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Price</label>
            <Input
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="$499"
              className="bg-white h-12 rounded-xl"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Location *</label>
            <Input
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Murray River"
              className="bg-white h-12 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Group Size</label>
            <Input
              value={form.group_size}
              onChange={(e) => setForm((prev) => ({ ...prev, group_size: e.target.value }))}
              placeholder="8+ Blokes"
              className="bg-white h-12 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Image URL</label>
          <Input
            value={form.image_url}
            onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
            placeholder="https://images.unsplash.com/..."
            className="bg-white h-12 rounded-xl"
          />
          {form.image_url && (
            <img src={form.image_url} alt="Preview" className="mt-2 rounded-xl h-32 object-cover w-full" />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the package..."
            className="bg-white rounded-xl min-h-[100px]"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Features</label>
            <Button type="button" variant="ghost" size="sm" onClick={addFeature} className="text-xs font-bold uppercase">
              <Plus size={14} className="mr-1" /> Add Feature
            </Button>
          </div>
          <div className="space-y-2">
            {form.features.map((f, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={f}
                  onChange={(e) => updateFeature(i, e.target.value)}
                  placeholder={`Feature ${i + 1}`}
                  className="bg-white h-10 rounded-xl flex-1"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(i)} className="text-destructive shrink-0">
                  <X size={16} />
                </Button>
              </div>
            ))}
            {form.features.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No features added yet.</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 bg-white p-4 rounded-xl">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest">Hero Package</label>
            <p className="text-xs text-muted-foreground">Featured on homepage (max 3)</p>
          </div>
          <Switch
            checked={form.is_hero}
            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_hero: checked }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Display Order</label>
          <Input
            type="number"
            value={form.display_order}
            onChange={(e) => setForm((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
            className="bg-white h-12 rounded-xl w-32"
            min={0}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            className="h-14 px-10 bg-accent text-primary hover:bg-primary hover:text-white border-none font-black uppercase italic tracking-tight text-lg shadow-xl shadow-accent/20"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {isEdit ? 'Update Package' : 'Create Package'}
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
      </form>

      {isEdit && existing && (
        <p className="text-xs text-muted-foreground text-right mt-8 flex items-center justify-end gap-1.5">
          <Clock size={12} />
          Last modified:{' '}
          {new Date(existing.updated_at).toLocaleString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  )
}
