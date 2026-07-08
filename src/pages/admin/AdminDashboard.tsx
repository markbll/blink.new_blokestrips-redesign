import React, { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { api } from '../../lib/api'
import { Package, Mail, TrendingUp, Star, Clock } from 'lucide-react'

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.admin.stats().then(setStats).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Packages',      value: stats?.totalPackages    ?? 0, icon: Package, color: 'text-[#f59e0b]',   bg: 'bg-[#f59e0b]/10' },
    { label: 'Homepage Packages',   value: stats?.homepagePackages ?? 0, icon: Star,    color: 'text-yellow-400',  bg: 'bg-yellow-400/10' },
    { label: 'Total Enquiries',     value: stats?.totalEnquiries   ?? 0, icon: Mail,    color: 'text-blue-400',    bg: 'bg-blue-400/10' },
    { label: 'New Enquiries',       value: stats?.newEnquiries     ?? 0, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Abandoned Leads',     value: stats?.partialEnquiries ?? 0, icon: Clock,      color: 'text-orange-400', bg: 'bg-orange-400/10', link: '/admin/enquiries' },
  ]

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#111827] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-3xl font-bold text-white">{value}</span>
            </div>
            <p className="text-gray-400 text-sm">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {stats?.enquiriesByStatus && (
          <div className="bg-[#111827] rounded-lg p-6 border border-gray-800">
            <h2 className="text-white font-semibold mb-4">Enquiries by Status</h2>
            <div className="space-y-3">
              {Object.entries(stats.enquiriesByStatus).map(([status, count]: any) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status === 'new' ? 'bg-blue-400' : status === 'contacted' ? 'bg-yellow-400' : status === 'converted' ? 'bg-green-400' : 'bg-gray-400'}`} />
                    <span className="text-gray-300 capitalize text-sm">{status}</span>
                  </div>
                  <span className="text-white font-semibold">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {stats?.packagesByType && (
          <div className="bg-[#111827] rounded-lg p-6 border border-gray-800">
            <h2 className="text-white font-semibold mb-4">Packages by Type</h2>
            <div className="space-y-3">
              {Object.entries(stats.packagesByType).map(([type, count]: any) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                    <span className="text-gray-300 text-sm">{type}</span>
                  </div>
                  <span className="text-white font-semibold">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/packages" className="bg-[#111827] hover:bg-gray-800 rounded-lg p-6 border border-gray-800 transition-colors block">
          <Package className="w-8 h-8 text-[#f59e0b] mb-3" />
          <h3 className="text-white font-semibold mb-1">Manage Packages</h3>
          <p className="text-gray-400 text-sm">Add, edit or remove trip packages</p>
        </Link>
        <Link to="/admin/enquiries" className="bg-[#111827] hover:bg-gray-800 rounded-lg p-6 border border-gray-800 transition-colors block">
          <Mail className="w-8 h-8 text-blue-400 mb-3" />
          <h3 className="text-white font-semibold mb-1">View Enquiries</h3>
          <p className="text-gray-400 text-sm">Manage customer trip enquiries</p>
        </Link>
        <Link to="/" className="bg-[#111827] hover:bg-gray-800 rounded-lg p-6 border border-gray-800 transition-colors block">
          <TrendingUp className="w-8 h-8 text-green-400 mb-3" />
          <h3 className="text-white font-semibold mb-1">View Website</h3>
          <p className="text-gray-400 text-sm">See the public-facing site</p>
        </Link>
      </div>
    </div>
  )
}
