import React, { useState, useMemo, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { useAllPackages, useDeletePackage, useCreatePackage, TripPackage } from '../../hooks/usePackages'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Download, Upload, FileDown, Search, Star, Package, Sparkles } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  golf: 'Golf', fishing: 'Fishing', bucks: 'Bucks', custom: 'Custom', sports: 'Sports',
}

const TYPE_COLORS: Record<string, string> = {
  golf:    'bg-green-500/10 text-green-400 border-green-500/20',
  fishing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  bucks:   'bg-purple-500/10 text-purple-400 border-purple-500/20',
  sports:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  custom:  'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const CSV_SCHEMA = [
  'title', 'packageType', 'price', 'duration', 'location', 'groupSize',
  'description', 'features', 'included', 'displayOrder', 'showOnHomepage', 'showOnSubpage', 'image'
]

type SortKey = 'title' | 'package_type' | 'is_hero' | 'price' | 'display_order'
type SortDir = 'asc' | 'desc'

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown size={12} className="text-gray-600" />
  return sortDir === 'asc' ? <ArrowUp size={12} className="text-[#f59e0b]" /> : <ArrowDown size={12} className="text-[#f59e0b]" />
}

export function AdminPackages() {
  const { data: packages, isLoading, refetch } = useAllPackages()
  const deleteMutation = useDeletePackage()
  const createMutation = useCreatePackage()
  const importRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [heroFilter, setHeroFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('display_order')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [importing, setImporting] = useState(false)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  // Featured trip = first hero package by displayOrder
  const featuredId = useMemo(() => {
    const heroes = (Array.isArray(packages) ? packages : []).filter(p => Number(p.is_hero) > 0)
    if (heroes.length === 0) return null
    return [...heroes].sort((a, b) => Number(a.display_order) - Number(b.display_order))[0]?.id
  }, [packages])

  const filtered = useMemo(() => {
    let rows = Array.isArray(packages) ? [...packages] : []
    if (search) rows = rows.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.location?.toLowerCase().includes(search.toLowerCase()))
    if (typeFilter !== 'all') rows = rows.filter(p => p.package_type === typeFilter)
    if (heroFilter === 'hero') rows = rows.filter(p => Number(p.is_hero) > 0)
    if (heroFilter === 'regular') rows = rows.filter(p => Number(p.is_hero) === 0)
    rows.sort((a, b) => {
      let va: any, vb: any
      if (sortKey === 'title') { va = a.title; vb = b.title }
      else if (sortKey === 'package_type') { va = a.package_type; vb = b.package_type }
      else if (sortKey === 'is_hero') { va = Number(a.is_hero); vb = Number(b.is_hero) }
      else if (sortKey === 'price') { va = parseFloat(String(a.price).replace(/[^0-9.]/g, '')); vb = parseFloat(String(b.price).replace(/[^0-9.]/g, '')) }
      else if (sortKey === 'display_order') { va = Number(a.display_order); vb = Number(b.display_order) }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [packages, search, typeFilter, heroFilter, sortKey, sortDir])

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success(`${title} removed.`),
      onError: () => toast.error('Could not delete package.'),
    })
  }

  // Export current packages to CSV
  const exportCSV = () => {
    const rows = Array.isArray(packages) ? packages : []
    const header = CSV_SCHEMA.join(',')
    const lines = rows.map(p => CSV_SCHEMA.map(col => {
      let val: any = ''
      if (col === 'title') val = p.title
      else if (col === 'packageType') val = p.package_type
      else if (col === 'price') val = p.price.replace(/[^0-9.]/g, '')
      else if (col === 'duration') val = (p as any).duration || ''
      else if (col === 'location') val = p.location
      else if (col === 'groupSize') val = p.group_size
      else if (col === 'description') val = p.description
      else if (col === 'features') val = Array.isArray(p.features) ? p.features.join('|') : ''
      else if (col === 'included') val = Array.isArray((p as any).included) ? (p as any).included.join('|') : ''
      else if (col === 'displayOrder') val = p.display_order
      else if (col === 'showOnHomepage') val = Number(p.is_hero) > 0 ? 'true' : 'false'
      else if (col === 'showOnSubpage') val = 'true'
      else if (col === 'image') val = p.image_url
      return `"${String(val).replace(/"/g, '""')}"`
    }).join(','))
    const csv = [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'blokestrips-packages.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported ' + rows.length + ' packages')
  }

  // Download blank schema template
  const downloadSchema = () => {
    const header = CSV_SCHEMA.join(',')
    const example = '"Murray River Ultimate","Golf","799","2 Nights","Murray River","8-16 blokes","Championship golf weekend","Tee times|Accommodation|Bar tab","Accommodation|Meals","1","true","true","https://images.unsplash.com/..."'
    const notes = '"# Features and included: separate multiple items with | (pipe)","","","","","","","","","","# showOnHomepage: true/false","# showOnSubpage: true/false",""'
    const csv = [header, example, notes].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'blokestrips-import-template.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Template downloaded')
  }

  // Import CSV
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const text = await file.text()
    const lines = text.trim().split('\n').filter(l => !l.startsWith('#'))
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const dataRows = lines.slice(1)
    let imported = 0, errors = 0

    for (const line of dataRows) {
      if (!line.trim() || line.startsWith('#')) continue
      try {
        const vals = line.match(/("([^"]*(?:""[^"]*)*)"|[^,]*)/g) || []
        const clean = vals.filter((_: any, i: number) => i % 2 === 0).map((v: string) => v.replace(/^"|"$/g, '').replace(/""/g, '"'))
        const row: any = {}
        headers.forEach((h: string, i: number) => { row[h] = clean[i] || '' })

        await new Promise<void>((resolve, reject) => {
          createMutation.mutate({
            title: row.title,
            package_type: row.packageType?.toLowerCase() || 'custom',
            price: `$${row.price}`,
            duration: row.duration,
            location: row.location,
            group_size: row.groupSize,
            description: row.description,
            features: row.features ? row.features.split('|').map((f: string) => f.trim()) : [],
            included: row.included ? row.included.split('|').map((f: string) => f.trim()) : [],
            display_order: Number(row.displayOrder) || 999,
            is_hero: row.showOnHomepage === 'true' ? '1' : '0',
            image_url: row.image,
          } as any, { onSuccess: () => { imported++; resolve() }, onError: reject })
        })
      } catch { errors++ }
    }

    setImporting(false)
    refetch()
    if (errors > 0) toast.error(`${imported} imported, ${errors} failed`)
    else toast.success(`${imported} packages imported`)
    if (importRef.current) importRef.current.value = ''
  }

  const thBtn = (key: SortKey, label: string) => (
    <button onClick={() => handleSort(key)} className="flex items-center gap-1 text-xs uppercase tracking-wider font-medium text-gray-500 hover:text-gray-300 transition-colors">
      {label} <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
    </button>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Packages</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} of {packages?.length ?? 0} packages</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadSchema} title="Download import template"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-400 bg-[#1e2a3a] hover:bg-[#263348] border border-gray-700 rounded-lg transition-colors">
            <FileDown size={14} /> Schema
          </button>
          <button onClick={exportCSV} title="Export to CSV"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-400 bg-[#1e2a3a] hover:bg-[#263348] border border-gray-700 rounded-lg transition-colors">
            <Download size={14} /> Export CSV
          </button>
          <label title="Import from CSV" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-400 bg-[#1e2a3a] hover:bg-[#263348] border border-gray-700 rounded-lg transition-colors cursor-pointer">
            <Upload size={14} /> {importing ? 'Importing…' : 'Import CSV'}
            <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <Link to="/admin/packages/new"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-black bg-[#f59e0b] hover:bg-[#d97706] rounded-lg transition-colors">
            <Plus size={16} /> Add Package
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search packages…"
            className="pl-8 pr-3 py-2 text-sm bg-[#111827] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#f59e0b] w-48" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-[#111827] border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-[#f59e0b]">
          <option value="all">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={heroFilter} onChange={e => setHeroFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-[#111827] border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-[#f59e0b]">
          <option value="all">All Visibility</option>
          <option value="hero">Hero only</option>
          <option value="regular">Regular only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3">{thBtn('title', 'Package')}</th>
                <th className="text-left px-4 py-3">{thBtn('package_type', 'Type')}</th>
                <th className="text-left px-4 py-3">{thBtn('price', 'Price')}</th>
                <th className="text-left px-4 py-3">{thBtn('display_order', 'Order')}</th>
                <th className="text-left px-4 py-3">{thBtn('is_hero', 'Hero')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td colSpan={6} className="px-4 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse w-48" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-500">No packages found.</td></tr>
              ) : filtered.map((pkg, i) => (
                <tr key={pkg.id} className={`border-b border-gray-800/40 hover:bg-white/[0.03] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={pkg.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-700" loading="lazy" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-white text-sm font-semibold leading-tight">{pkg.title}</p>
                          {pkg.id === featuredId && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded text-[10px] font-bold">
                              <Sparkles size={9} /> Featured
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5">{pkg.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold border ${TYPE_COLORS[pkg.package_type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                      {TYPE_LABELS[pkg.package_type] || pkg.package_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#f59e0b] font-bold text-sm">{pkg.price}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{pkg.display_order}</td>
                  <td className="px-4 py-3">
                    {Number(pkg.is_hero) > 0
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 rounded-md text-xs font-bold"><Star size={10} /> Hero</span>
                      : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link to="/admin/packages/$id/edit" params={{ id: pkg.id }}
                        aria-label={`Edit ${pkg.title}`}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <Pencil size={15} />
                      </Link>
                      <button onClick={() => handleDelete(pkg.id, pkg.title)}
                        aria-label={`Delete ${pkg.title}`}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-40">
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

      {/* Import hint */}
      <div className="mt-4 p-4 bg-[#111827] border border-gray-800 rounded-xl text-xs text-gray-500 leading-relaxed">
        <p className="font-semibold text-gray-400 mb-1 flex items-center gap-1"><Package size={12} /> Bulk Import Guide</p>
        <p>1. Click <strong className="text-gray-300">Schema</strong> to download the CSV template with column headers and an example row.</p>
        <p>2. Fill it in Excel, Google Sheets, or any spreadsheet app. Separate features/included with <code className="bg-gray-800 px-1 rounded">|</code> pipes.</p>
        <p>3. Save as CSV and click <strong className="text-gray-300">Import CSV</strong> to upload. Existing packages are not affected.</p>
      </div>
    </div>
  )
}
