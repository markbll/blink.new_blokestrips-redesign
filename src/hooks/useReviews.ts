import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Review {
  id: number | string
  name: string
  trip: string
  rating: number
  text: string
  avatar?: string
}

/**
 * Site-wide reviews: admin-managed testimonials + the global reviewsEnabled toggle.
 * When `enabled` is false, every review display on the site must hide.
 */
export function useReviews() {
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
    staleTime: 60_000,
  })

  const reviewsQuery = useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => (await api.testimonials.list()) as Review[],
    staleTime: 60_000,
  })

  const enabled = settingsQuery.data ? settingsQuery.data.reviewsEnabled !== false : true

  return {
    reviews: reviewsQuery.data ?? [],
    enabled,
    isLoading: settingsQuery.isLoading || reviewsQuery.isLoading,
  }
}
