import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface OptionalExtra {
  id: string
  name: string
  description?: string
  price: number
  active: boolean
  displayOrder: number
  packageId?: number | null
  priceOnApplication?: boolean
  /** Admin-only — never present on the public API response. */
  internalNotesUrl?: string
  internalNotes?: string
}

/**
 * Active Optional Extras, selectable on a package detail page.
 * Pass a packageId to also include that package's own unique add-ons
 * alongside the global list; omit it to get the global list only.
 */
export function useExtras(packageId?: string) {
  return useQuery({
    queryKey: ['extras', packageId ?? 'global'],
    queryFn: async () => (await api.extras.list(packageId)) as OptionalExtra[],
    staleTime: 60_000,
  })
}

/** Admin — add-on options unique to a single package (not shared with others). */
export function usePackageExtras(packageId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'package-extras', packageId],
    queryFn: async () => (await api.admin.packages.extras.list(packageId!)) as OptionalExtra[],
    enabled: !!packageId,
    staleTime: 0,
  })
}

export function useCreatePackageExtra(packageId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<OptionalExtra>) => api.admin.packages.extras.create(packageId!, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'package-extras', packageId] }),
  })
}

export function useUpdatePackageExtra(packageId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<OptionalExtra> & { id: string }) => api.admin.packages.extras.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'package-extras', packageId] }),
  })
}

export function useDeletePackageExtra(packageId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.admin.packages.extras.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'package-extras', packageId] }),
  })
}
