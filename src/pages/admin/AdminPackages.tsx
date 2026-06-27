import React from 'react'
import { Link } from '@tanstack/react-router'
import { useAllPackages, useDeletePackage, TripPackage } from '../../hooks/usePackages'
import { Button, DataTable, toast } from '@blinkdotnew/ui'
import { Plus, Pencil, Trash2, Clock } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

const TYPE_LABELS: Record<string, string> = {
  golf: 'Golf',
  fishing: 'Fishing',
  bucks: 'Bucks',
  custom: 'Custom',
}

export function AdminPackages() {
  const { data: packages, isLoading } = useAllPackages()
  const deleteMutation = useDeletePackage()

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Deleted', { description: `${title} removed.` }),
      onError: () => toast.error('Error', { description: 'Could not delete package.' }),
    })
  }

  const columns: ColumnDef<TripPackage>[] = [
    {
      accessorKey: 'title',
      header: 'Package',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
          <div>
            <p className="font-bold text-sm">{row.original.title}</p>
            <p className="text-xs text-muted-foreground">{row.original.location}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'package_type',
      header: 'Type',
      cell: ({ getValue }) => (
        <span className="px-2 py-0.5 bg-secondary rounded-md text-xs font-bold uppercase tracking-wider">
          {TYPE_LABELS[getValue<string>()] || getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ getValue }) => <span className="font-black text-accent">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'is_hero',
      header: 'Hero',
      cell: ({ getValue }) => (
        Number(getValue()) > 0 ? (
          <span className="px-2 py-0.5 bg-accent/10 text-accent rounded-md text-xs font-bold">Hero</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/$id/edit" params={{ id: row.original.id }}>
              <Pencil size={16} />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => handleDelete(row.original.id, row.original.title)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-black uppercase italic tracking-tight">Packages</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your trip packages and hero features.</p>
        </div>
        <Button asChild className="bg-accent text-primary hover:bg-primary hover:text-white border-none font-black uppercase italic tracking-tight">
          <Link to="/admin/new">
            <Plus className="mr-2" size={18} /> Add Package
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-secondary/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={Array.isArray(packages) ? packages : []}
          searchable
          searchColumn="title"
        />
      )}

      <p className="text-xs text-muted-foreground text-right mt-6 flex items-center justify-end gap-1.5">
        <Clock size={12} />
        Last modified:{' '}
        {packages && packages.length > 0
          ? new Date(
              Math.max(...packages.map((p: any) => new Date(p.updated_at).getTime()))
            ).toLocaleString('en-AU', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
          : '—'}
      </p>
    </div>
  )
}
