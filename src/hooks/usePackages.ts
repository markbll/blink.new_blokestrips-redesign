import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, mapPackage } from '@/lib/api'

export interface TripPackage {
  id: string
  title: string
  slug: string
  package_type: string
  location: string
  price: string
  group_size: string
  image_url: string
  features: string[]
  description: string
  is_hero: string | number
  display_order: string | number
  created_at: string
  updated_at: string
  duration?: string
  included?: string[]
  is_featured?: boolean
  price_on_application?: boolean
  /** Admin-only — never present on public API responses. */
  internal_notes_url?: string
  internal_notes?: string
}

export function useHeroPackages() {
  return useQuery({
    queryKey: ['packages', 'hero'],
    queryFn: async () => {
      const data = await api.packages.list({ homepage: true });
      return data.map(mapPackage) as TripPackage[];
    },
  })
}

export function usePackagesByType(packageType: string) {
  return useQuery({
    queryKey: ['packages', packageType],
    queryFn: async () => {
      const type = packageType.charAt(0).toUpperCase() + packageType.slice(1);
      const data = await api.packages.list({ packageType: type });
      return data.map(mapPackage) as TripPackage[];
    },
    enabled: !!packageType,
  })
}

export function usePackageBySlug(slug: string) {
  return useQuery({
    queryKey: ['package', slug],
    queryFn: async () => {
      const data = await api.packages.get(slug);
      return mapPackage(data) as TripPackage;
    },
    enabled: !!slug,
  })
}

export function useFeaturedPackage() {
  return useQuery({
    queryKey: ['packages', 'featured'],
    queryFn: async () => {
      const data = await api.packages.list({ featured: true });
      const mapped = data.map(mapPackage) as TripPackage[];
      return mapped[0] ?? null;
    },
  })
}

export function useAllPackages() {
  return useQuery({
    queryKey: ['packages', 'all'],
    queryFn: async () => {
      const data = await api.packages.list();
      return data.map(mapPackage) as TripPackage[];
    },
  })
}

// Admin-only hook — uses the authenticated admin endpoint which returns all fields
// including showOnHomepage (is_hero) and displayOrder. Use this in all admin pages.
export function useAdminPackages() {
  return useQuery({
    queryKey: ['admin', 'packages'],
    queryFn: async () => {
      const data = await api.admin.packages.list();
      return data.map(mapPackage) as TripPackage[];
    },
  })
}

export function useCreatePackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<TripPackage>) => {
      return api.admin.packages.create({
        title: data.title,
        packageType: data.package_type ? data.package_type.charAt(0).toUpperCase() + data.package_type.slice(1) : '',
        price: parseInt(String(data.price || '0').replace(/\D/g, '')) || 0,
        priceOnApplication: !!data.price_on_application,
        duration: data.duration || '2 Nights',
        image: data.image_url,
        description: data.description,
        features: Array.isArray(data.features) ? data.features : [],
        included: Array.isArray(data.included) ? data.included : [],
        location: data.location,
        groupSize: data.group_size,
        displayOrder: data.display_order || 999,
        showOnHomepage: data.is_hero === '1' || data.is_hero === 1,
        showOnSubpage: true,
        internalNotesUrl: data.internal_notes_url || '',
        internalNotes: data.internal_notes || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'packages'] })
    },
  })
}

export function useUpdatePackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<TripPackage> & { id: string }) => {
      return api.admin.packages.update(id, {
        title: data.title,
        packageType: data.package_type ? data.package_type.charAt(0).toUpperCase() + data.package_type.slice(1) : undefined,
        price: data.price ? parseInt(String(data.price).replace(/\D/g, '')) : undefined,
        priceOnApplication: data.price_on_application !== undefined ? !!data.price_on_application : undefined,
        image: data.image_url,
        description: data.description,
        features: Array.isArray(data.features) ? data.features : undefined,
        included: Array.isArray(data.included) ? data.included : undefined,
        location: data.location,
        groupSize: data.group_size,
        displayOrder: data.display_order,
        showOnHomepage: data.is_hero === '1' || data.is_hero === 1,
        internalNotesUrl: data.internal_notes_url !== undefined ? data.internal_notes_url : undefined,
        internalNotes: data.internal_notes !== undefined ? data.internal_notes : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'packages'] })
    },
  })
}

export function useDeletePackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.admin.packages.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'packages'] })
    },
  })
}
