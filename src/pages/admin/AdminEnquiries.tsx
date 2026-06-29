import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Eye, Trash2 } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  contacted: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  converted: 'bg-green-500/10 text-green-400 border-green-500/20',
  closed:    'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

export function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  const load = () => {
    api.admin.enquiries().then(setEnquiries).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    await api.admin.updateEnquiry(id, { status })
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    if (selected?.id === id) setSelected((s: any) => ({ ...s, status }))
  }

  const deleteEnquiry = async (id: string) => {
    if (!confirm('Delete this enquiry?')) return
    await api.admin.deleteEnquiry(id)
    setEnquiries(prev => prev.filter(e => e.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Enquiries</h1>
        <span className="text-gray-400 text-sm">Total: {enquiries.length}</span>
      </div>

      {selected && (
        <div className="bg-[#111827] border border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-white font-bold text-lg">{selected.name}</h2>
              <p className="text-gray-400 text-sm">{selected.email} {selected.phone && `· ${selected.phone}`}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-sm">Close</button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><span className="text-gray-500">Trip Type</span><p className="text-white">{selected.tripType}</p></div>
            <div><span className="text-gray-500">Group Size</span><p className="text-white">{selected.groupSize}</p></div>
            {selected.dates && <div><span className="text-gray-500">Dates</span><p className="text-white">{selected.dates}</p></div>}
          </div>
          <div className="mb-4">
            <span className="text-gray-500 text-sm">Message</span>
            <p className="text-white text-sm mt-1 whitespace-pre-wrap">{selected.message}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-gray-500 text-sm">Status:</label>
            <select
              value={selected.status}
              onChange={e => updateStatus(selected.id, e.target.value)}
              className="bg-[#0a0e1a] border border-gray-700 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:border-[#f59e0b]"
            >
              {['new', 'contacted', 'converted', 'closed'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="bg-[#111827] rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-3 font-medium">Name</th>
                <th className="text-left px-6 py-3 font-medium">Contact</th>
                <th className="text-left px-6 py-3 font-medium">Trip Type</th>
                <th className="text-left px-6 py-3 font-medium">Group Size</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
                <th className="text-left px-6 py-3 font-medium">Date</th>
                <th className="text-left px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {enquiries.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500">No enquiries yet.</td></tr>
              ) : enquiries.map(e => (
                <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-white font-medium whitespace-nowrap">{e.name}</td>
                  <td className="px-6 py-4 text-gray-400">
                    <div>{e.email}</div>
                    {e.phone && <div className="text-xs">{e.phone}</div>}
                  </td>
                  <td className="px-6 py-4 text-gray-400 whitespace-nowrap">{e.tripType}</td>
                  <td className="px-6 py-4 text-gray-400 whitespace-nowrap">{e.groupSize}</td>
                  <td className="px-6 py-4">
                    <select
                      value={e.status}
                      onChange={ev => updateStatus(e.id, ev.target.value)}
                      className={`text-xs font-medium border rounded px-2 py-1 focus:outline-none bg-transparent ${STATUS_COLORS[e.status] || ''}`}
                    >
                      {['new', 'contacted', 'converted', 'closed'].map(s => (
                        <option key={s} value={s} className="bg-[#111827] text-white">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                    {e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelected(e)} className="text-gray-400 hover:text-white transition-colors"><Eye size={16} /></button>
                      <button onClick={() => deleteEnquiry(e.id)} className="text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
