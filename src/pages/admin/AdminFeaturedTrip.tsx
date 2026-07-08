import React, { useMemo } from 'react'
import { useAdminPackages, useUpdatePackage } from '../../hooks/usePackages'
import { api } from '../../lib/api'
import { Star, Sparkles, MapPin, Users, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

export function AdminFeaturedTrip() {
  const { data: packages, isLoading } = useAdminPackages()
  const updateMutation = useUpdatePackage()
  const queryClient = useQueryClient()

  // Current featured package
  const featured = useMemo(() =>
    (packages || []).find(p => p.is_featured), [packages]
  )

  const handleSelect = async (id: string) => {
    if (featured?.id === id) return
    try {
      await api.admin.packages.setFeatured(id)
      await queryClient.refetchQueries({ queryKey: ['admin', 'packages'] })
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      toast.success('Featured trip updated')
    } catch {
      toast.error('Could not update featured trip')
    }
  }

  const handleClear = async () => {
    if (!featured) return
    try {
      await api.admin.packages.clearFeatured(featured.id)
      await queryClient.refetchQueries({ queryKey: ['admin', 'packages'] })
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      toast.success('Featured trip cleared')
    } catch {
      toast.error('Could not clear featured trip')
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Featured Trip</h1>
        <p className="text-gray-500 text-sm mt-1">
          The featured trip appears as a large card on the homepage hero. Only one trip can be featured at a time.
        </p>
      </div>

      {/* Current featured */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-violet-400" />
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Currently Featured</h2>
        </div>
        {featured ? (
          <div className="flex items-center gap-4">
            <img src={featured.image_url} alt={featured.title} className="w-20 h-20 rounded-xl object-cover border border-gray-700 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg leading-tight">{featured.title}</p>
              <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
                <MapPin size={12} /> {featured.location}
              </p>
              <p className="text-[#f59e0b] font-bold text-sm mt-1">{featured.price} pp</p>
            </div>
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-bold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0"
            >
              Clear Featured
            </button>
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">No trip is currently featured. Select one below.</p>
        )}
      </div>

      {/* Package selector */}
      <div>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Select a Trip to Feature</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-[#111827] rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {(packages || []).map(pkg => {
              const isCurrent = pkg.is_featured
              return (
                <button
                  key={pkg.id}
                  onClick={() => handleSelect(pkg.id)}
                  disabled={isCurrent}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-violet-500/10 border-violet-500/40 cursor-default'
                      : 'bg-[#111827] border-gray-800 hover:border-[#f59e0b]/40 hover:bg-[#1a2236]'
                  }`}
                >
                  <img
                    src={pkg.image_url}
                    alt={pkg.title}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-700 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">{pkg.title}</span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/20 text-violet-300 text-xs font-bold rounded-full border border-violet-500/30">
                          <Sparkles size={10} /> Featured
                        </span>
                      )}
                      {Number(pkg.is_hero) > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-bold rounded-full border border-[#f59e0b]/20">
                          <Star size={9} /> Hero
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {pkg.location}
                      <span className="ml-2 flex items-center gap-1"><Users size={10} /> {pkg.group_size}</span>
                    </p>
                    <p className="text-[#f59e0b] text-xs font-bold mt-0.5">{pkg.price} pp</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isCurrent ? 'bg-violet-500 border-violet-500' : 'border-gray-600'
                  }`}>
                    {isCurrent && <Check size={13} className="text-white" strokeWidth={3} />}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-[#111827] border border-gray-800 rounded-xl text-xs text-gray-500 leading-relaxed">
        <p className="font-semibold text-gray-400 mb-1 flex items-center gap-1"><Sparkles size={12} /> How it works</p>
        <p>The featured trip card appears at the bottom-right of the homepage hero section on large screens.</p>
        <p className="mt-1">It is separate from "Hero" packages — you can feature any trip, whether or not it's marked as a Hero package.</p>
      </div>
    </div>
  )
}
