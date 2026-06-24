import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/blink/client'

export interface TripPackage {
  id: string
  title: string
  slug: string
  package_type: 'golf' | 'fishing' | 'bucks' | 'custom'
  location: string
  price: string
  group_size: string
  image_url: string
  features: string
  description: string
  is_hero: string | number
  display_order: string | number
  created_at: string
  updated_at: string
}

export function useHeroPackages() {
  return useQuery({
    queryKey: ['packages', 'hero'],
    queryFn: async () => {
      const data = await blink.db.tripPackages.list({
        where: { isHero: '1' },
        orderBy: { displayOrder: 'asc' },
      })
      return (data as TripPackage[]).map((pkg) => ({
        ...pkg,
        features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features,
      }))
    },
  })
}

export function usePackagesByType(packageType: string) {
  return useQuery({
    queryKey: ['packages', packageType],
    queryFn: async () => {
      const data = await blink.db.tripPackages.list({
        where: { packageType },
        orderBy: { displayOrder: 'asc' },
      })
      return (data as TripPackage[]).map((pkg) => ({
        ...pkg,
        features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features,
      }))
    },
    enabled: !!packageType,
  })
}

export function usePackageBySlug(slug: string) {
  return useQuery({
    queryKey: ['package', slug],
    queryFn: async () => {
      const data = await blink.db.tripPackages.list({
        where: { slug },
        limit: 1,
      })
      if (!data || data.length === 0) return null
      const pkg = data[0] as TripPackage
      return {
        ...pkg,
        features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features,
      }
    },
    enabled: !!slug,
  })
}

export function useAllPackages() {
  return useQuery({
    queryKey: ['packages', 'all'],
    queryFn: async () => {
      const data = await blink.db.tripPackages.list({
        orderBy: { displayOrder: 'asc' },
      })
      return (data as TripPackage[]).map((pkg) => ({
        ...pkg,
        features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features,
      }))
    },
  })
}

export function useCreatePackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<TripPackage, 'id' | 'createdAt' | 'updatedAt'>) => {
      return blink.db.tripPackages.create({
        ...data,
        features: typeof data.features === 'string' ? data.features : JSON.stringify(data.features),
        isHero: data.isHero,
        displayOrder: data.displayOrder,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
    },
  })
}

export function useUpdatePackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<TripPackage> & { id: string }) => {
      return blink.db.tripPackages.update(id, {
        ...data,
        features: typeof data.features === 'string' ? data.features : JSON.stringify(data.features),
        isHero: data.isHero,
        displayOrder: data.displayOrder,
        updatedAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
    },
  })
}

export function useDeletePackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return blink.db.tripPackages.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
    },
  })
}
