import React, { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Star, Plus, Pencil, Trash2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface Review {
  id: number
  name: string
  trip: string
  rating: number
  text: string
  avatar?: string
  createdAt?: string
}

interface ReviewFormData {
  name: string
  trip: string
  rating: number
  text: string
}

const EMPTY_FORM: ReviewFormData = { name: '', trip: '', rating: 5, text: '' }

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHovered(i)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`text-xl transition-colors ${onChange ? 'cursor-pointer' : 'cursor-default'} ${
            i <= (hovered || value) ? 'text-[#f59e0b]' : 'text-gray-600'
          }`}
        >★</button>
      ))}
    </div>
  )
}

function ReviewModal({ review, onSave, onClose }: {
  review: Review | null
  onSave: (data: ReviewFormData) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<ReviewFormData>(
    review ? { name: review.name, trip: review.trip, rating: review.rating, text: review.text } : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.trip || !form.text) {
      toast.error('Please fill in all fields')
      return
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
      <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-bold">{review ? 'Edit Review' : 'Add Review'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jake Thompson"
                className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f59e0b]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trip *</label>
              <input
                value={form.trip}
                onChange={e => setForm(f => ({ ...f, trip: e.target.value }))}
                placeholder="Murray River Weekend"
                className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f59e0b]"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rating</label>
            <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Review *</label>
            <textarea
              value={form.text}
              onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
              placeholder="Write the review here..."
              rows={4}
              className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f59e0b] resize-none"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? 'Saving…' : review ? 'Update Review' : 'Add Review'}
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

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewsEnabled, setReviewsEnabled] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [editing, setEditing] = useState<Review | null | 'new'>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [revData, settings] = await Promise.all([
        api.admin.testimonials.list(),
        api.admin.settings.get(),
      ])
      setReviews(revData)
      setReviewsEnabled(settings.reviewsEnabled !== false)
    } catch {
      toast.error('Could not load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async () => {
    setToggling(true)
    try {
      const updated = await api.admin.settings.update({ reviewsEnabled: !reviewsEnabled })
      setReviewsEnabled(updated.reviewsEnabled)
      toast.success(updated.reviewsEnabled ? 'Reviews enabled on site' : 'Reviews hidden from site')
    } catch {
      toast.error('Could not update setting')
    } finally {
      setToggling(false)
    }
  }

  const handleSave = async (data: ReviewFormData) => {
    if (editing && editing !== 'new') {
      try {
        const updated = await api.admin.testimonials.update(String(editing.id), data)
        // Use loose == to handle PHP returning id as string vs JS number
        setReviews(rs => rs.map(r => String(r.id) === String(updated.id) ? updated : r))
        toast.success('Review updated')
      } catch (err: any) {
        toast.error(err?.data?.error || 'Could not update review')
        throw err // re-throw so modal stays open
      }
    } else {
      try {
        const created = await api.admin.testimonials.create(data)
        setReviews(rs => [created, ...rs])
        toast.success('Review added')
      } catch (err: any) {
        toast.error(err?.data?.error || 'Could not add review')
        throw err
      }
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete review from "${name}"? This cannot be undone.`)) return
    try {
      await api.admin.testimonials.delete(String(id))
      setReviews(rs => rs.filter(r => r.id !== id))
      toast.success('Review deleted')
    } catch {
      toast.error('Could not delete review')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Reviews</h1>
          <p className="text-gray-500 text-sm mt-0.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm"
        >
          <Plus size={16} /> Add Review
        </button>
      </div>

      {/* Global toggle */}
      <div className="flex items-center justify-between bg-[#111827] border border-gray-800 rounded-xl p-5 mb-8">
        <div>
          <p className="text-white font-semibold text-sm">Show Reviews on Site</p>
          <p className="text-gray-500 text-xs mt-0.5">Turn off to hide all reviews from the public website</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
            reviewsEnabled
              ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
              : 'bg-gray-700/50 text-gray-400 border border-gray-700 hover:bg-gray-700'
          } disabled:opacity-50`}
        >
          {reviewsEnabled
            ? <><ToggleRight size={18} /> Reviews ON</>
            : <><ToggleLeft size={18} /> Reviews OFF</>
          }
        </button>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-[#111827] rounded-xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-12 text-center">
          <Star size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No reviews yet</p>
          <p className="text-gray-600 text-sm mt-1">Add your first review to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-[#111827] border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <img
                    src={review.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=f59e0b&color=000`}
                    alt={review.name}
                    className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className="text-white font-semibold text-sm">{review.name}</span>
                      <span className="text-gray-500 text-xs">{review.trip}</span>
                      <StarRating value={review.rating} />
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{review.text}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditing(review)}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(review.id, review.name)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing !== null && (
        <ReviewModal
          review={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
