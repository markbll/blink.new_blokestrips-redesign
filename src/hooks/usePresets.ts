import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Fallbacks shown until settings load (mirror the server defaults)
export const DEFAULT_FEATURES: string[] = []
export const DEFAULT_HIGHLIGHTS: string[] = []

/** A Trip Option (Feature or Package Highlight) with hidden admin-only notes. */
export interface PresetItem {
  text: string
  notesUrl: string
  notes: string
}

/**
 * Central Features & Package Highlights lists, managed in the admin area
 * (Trip Options) and stored in backend settings. Used by the package form
 * and the public Build Your Custom Trip form.
 *
 * The public API only ever returns plain label strings (admin notes are
 * stripped server-side), so this hook always deals in string[].
 */
export function usePresets() {
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
    staleTime: 60_000,
  })

  return {
    features:   (query.data?.presetFeatures   as string[] | undefined) ?? DEFAULT_FEATURES,
    highlights: (query.data?.presetHighlights as string[] | undefined) ?? DEFAULT_HIGHLIGHTS,
    isLoading: query.isLoading,
  }
}

/**
 * Admin-side mutation to persist updated preset lists. Accepts either plain
 * strings (ad-hoc additions from the package form, no notes) or full
 * PresetItem objects (from the Trip Options admin page, with notes).
 */
export function useUpdatePresets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { presetFeatures?: (string | PresetItem)[]; presetHighlights?: (string | PresetItem)[] }) =>
      api.admin.settings.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}
