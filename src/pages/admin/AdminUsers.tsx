import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Users, Plus, Pencil, Trash2, X, Shield, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
  hasPassword?: boolean
}

const AREAS: { key: string; label: string }[] = [
  { key: 'dashboard',    label: 'Dashboard' },
  { key: 'packages',     label: 'Packages' },
  { key: 'featured',     label: 'Featured Trip' },
  { key: 'trip-options', label: 'Trip Options' },
  { key: 'optional-extras', label: 'Optional Extras' },
  { key: 'reviews',      label: 'Reviews' },
  { key: 'enquiries',    label: 'Enquiries' },
  { key: 'discovery',    label: 'Discovery' },
  { key: 'settings',     label: 'Settings' },
  { key: 'users',        label: 'Users' },
  { key: 'notes',        label: 'Notes' },
]

const ROLE_PRESETS: Record<string, string[]> = {
  super_admin: AREAS.map(a => a.key),
  manager:     ['dashboard', 'packages', 'featured', 'trip-options', 'optional-extras', 'reviews', 'enquiries', 'discovery', 'notes'],
  clerk:       ['dashboard', 'enquiries'],
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  manager:     'Manager',
  clerk:       'Clerk',
}

interface FormState {
  email: string
  name: string
  role: string
  permissions: string[]
  password: string
}

function UserModal({ user, onSave, onClose }: {
  user: AdminUser | null
  onSave: (data: FormState) => Promise<void>
  onClose: () => void
}) {
  const isEdit = !!user
  const [form, setForm] = useState<FormState>(
    user
      ? { email: user.email, name: user.name, role: user.role, permissions: user.permissions, password: '' }
      : { email: '', name: '', role: 'clerk', permissions: ROLE_PRESETS.clerk, password: '' }
  )
  const [saving, setSaving] = useState(false)

  const setRole = (role: string) =>
    setForm(f => ({ ...f, role, permissions: role === 'super_admin' ? ROLE_PRESETS.super_admin : ROLE_PRESETS[role] ?? f.permissions }))

  const togglePerm = (key: string) =>
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key) ? f.permissions.filter(p => p !== key) : [...f.permissions, key],
    }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email.trim()) { toast.error('Email is required'); return }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch {
      // error toast handled by caller
    } finally {
      setSaving(false)
    }
  }

  const superAdmin = form.role === 'super_admin'

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-[#111827]">
          <h2 className="text-white font-bold">{isEdit ? 'Edit User' : 'Add User'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email *</label>
            <input
              type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              disabled={isEdit}
              placeholder="person@blokestrips.com.au"
              className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f59e0b] disabled:opacity-50"
            />
            {isEdit && <p className="text-gray-600 text-[11px]">Email can't be changed after creation.</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Full name"
              className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f59e0b]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Role</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.keys(ROLE_PRESETS).map(role => (
                <button
                  key={role} type="button" onClick={() => setRole(role)}
                  className={`px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${
                    form.role === role
                      ? 'bg-[#f59e0b] text-black border-[#f59e0b]'
                      : 'bg-[#0a0e1a] text-gray-400 border-gray-700 hover:text-white'
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Access Areas</label>
            {superAdmin && (
              <p className="text-[11px] text-violet-400 flex items-center gap-1"><Shield size={12} /> Super admins have access to everything.</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {AREAS.map(area => {
                const checked = superAdmin || form.permissions.includes(area.key)
                return (
                  <button
                    key={area.key} type="button"
                    onClick={() => !superAdmin && togglePerm(area.key)}
                    disabled={superAdmin}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      checked
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-[#0a0e1a] border-gray-700 text-gray-400 hover:text-white'
                    } ${superAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-amber-500 border-amber-500' : 'border-gray-600'}`}>
                      {checked && <Check size={11} className="text-black" strokeWidth={3} />}
                    </span>
                    {area.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {isEdit ? 'Reset Password' : 'Password'} <span className="text-gray-600 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder={isEdit ? 'Leave blank to keep current' : 'Leave blank — they can use Email Code'}
              className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f59e0b]"
            />
            <p className="text-gray-600 text-[11px]">Min 8 characters. If blank, the user logs in with an emailed one-time code.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors disabled:opacity-50 text-sm">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
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

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AdminUser | null | 'new'>(null)

  const load = () => {
    setLoading(true)
    api.admin.users.list().then(setUsers).catch(() => toast.error('Could not load users')).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleSave = async (data: FormState) => {
    try {
      if (editing && editing !== 'new') {
        const updated = await api.admin.users.update(editing.id, {
          name: data.name, role: data.role, permissions: data.permissions,
          ...(data.password ? { password: data.password } : {}),
        })
        setUsers(us => us.map(u => u.id === updated.id ? updated : u))
        toast.success('User updated')
      } else {
        const created = await api.admin.users.create(data)
        setUsers(us => [...us, created])
        toast.success('User created — a welcome email has been sent')
      }
    } catch (err: any) {
      toast.error(err?.data?.error || 'Could not save user')
      throw err
    }
  }

  const handleDelete = async (u: AdminUser) => {
    if (!confirm(`Remove ${u.email}? They'll lose admin access immediately.`)) return
    try {
      await api.admin.users.delete(u.id)
      setUsers(us => us.filter(x => x.id !== u.id))
      toast.success('User removed')
    } catch (err: any) {
      toast.error(err?.data?.error || 'Could not remove user')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage who can access the admin area and what they can see.</p>
        </div>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm">
          <Plus size={16} /> Add User
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#111827] rounded-xl animate-pulse" />)}</div>
      ) : users.length === 0 ? (
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-12 text-center">
          <Users size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No users yet</p>
        </div>
      ) : (
        <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">User</th>
                  <th className="text-left px-5 py-3 font-medium">Role</th>
                  <th className="text-left px-5 py-3 font-medium">Access</th>
                  <th className="text-left px-5 py-3 font-medium">Login</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{u.name || <span className="text-gray-500 italic">No name</span>}</p>
                      <p className="text-gray-500 text-xs">{u.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${
                        u.role === 'super_admin' ? 'bg-violet-500/10 text-violet-300 border-violet-500/30'
                        : u.role === 'manager' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        : 'bg-gray-500/10 text-gray-300 border-gray-500/30'
                      }`}>
                        {u.role === 'super_admin' && <Shield size={10} />}
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.role === 'super_admin'
                        ? <span className="text-gray-400 text-xs">All areas</span>
                        : <span className="text-gray-400 text-xs">{u.permissions.length} area{u.permissions.length !== 1 ? 's' : ''}</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {u.hasPassword ? 'Password + Email Code' : 'Email Code'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setEditing(u)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(u)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={15} /></button>
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
        <UserModal
          user={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
