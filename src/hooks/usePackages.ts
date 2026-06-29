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

export function useAllPackages() {
  return useQuery({
    queryKey: ['packages', 'all'],
    queryFn: async () => {
      const data = await api.packages.list();
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
        duration: data.duration || '2 Nights',
        image: data.image_url,
        description: data.description,
        features: JSON.stringify(data.features || []),
        included: JSON.stringify(data.included || []),
        location: data.location,
        groupSize: data.group_size,
        displayOrder: data.display_order || 999,
        showOnHomepage: data.is_hero === '1' || data.is_hero === 1,
        showOnSubpage: true,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packages'] }),
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
        image: data.image_url,
        description: data.description,
        features: data.features ? JSON.stringify(data.features) : undefined,
        included: data.included ? JSON.stringify(data.included) : undefined,
        location: data.location,
        groupSize: data.group_size,
        displayOrder: data.display_order,
        showOnHomepage: data.is_hero === '1' || data.is_hero === 1,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packages'] }),
  })
}

export function useDeletePackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.admin.packages.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packages'] }),
  })
}
