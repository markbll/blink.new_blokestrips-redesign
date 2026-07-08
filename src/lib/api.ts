// Use relative /api path so the same build works on any domain (staging or production)
const API = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Auth-Token': token } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error || 'Request failed'), { status: res.status, data: err });
  }
  return res.json();
}

export const api = {
  packages: {
    list: (params?: { packageType?: string; homepage?: boolean; featured?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.packageType) q.set('packageType', params.packageType);
      if (params?.homepage) q.set('homepage', 'true');
      if (params?.featured) q.set('featured', 'true');
      return request<any[]>(`/packages${q.toString() ? '?' + q : ''}`);
    },
    get: (id: string) => request<any>(`/packages/${id}`),
  },
  testimonials: {
    list: () => request<any[]>('/testimonials'),
  },
  settings: {
    get: () => request<any>('/settings'),
  },
  extras: {
    list: (packageId?: string) => request<any[]>(`/extras${packageId ? `?packageId=${packageId}` : ''}`),
  },
  enquiries: {
    create: (data: Record<string, any>) =>
      request<any>('/enquiries', { method: 'POST', body: JSON.stringify(data) }),
    createPartial: (data: Record<string, any>) =>
      request<{ id: number }>('/enquiries/partial', { method: 'POST', body: JSON.stringify(data) }),
  },
  admin: {
    login: (email: string, password: string) =>
      request<{ access_token: string }>('/admin/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      }),
    requestOtp: (email: string) =>
      request<{ message: string }>('/admin/request-otp', {
        method: 'POST', body: JSON.stringify({ email }),
      }),
    verifyOtp: (email: string, code: string) =>
      request<{ access_token: string }>('/admin/verify-otp', {
        method: 'POST', body: JSON.stringify({ email, code }),
      }),
    me: () => request<any>('/admin/me'),
    stats: () => request<any>('/admin/stats'),
    enquiries: () => request<any[]>('/admin/enquiries'),
    updateEnquiry: (id: string, data: any) =>
      request<any>(`/admin/enquiries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEnquiry: (id: string) =>
      request<any>(`/admin/enquiries/${id}`, { method: 'DELETE' }),
    enquiryReplies: (id: string) => request<any[]>(`/admin/enquiries/${id}/replies`),
    replyToEnquiry: (id: string, data: { subject: string; body: string }) =>
      request<any>(`/admin/enquiries/${id}/reply`, { method: 'POST', body: JSON.stringify(data) }),
    users: {
      list: () => request<any[]>('/admin/users'),
      create: (data: any) => request<any>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => request<any>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string) => request<any>(`/admin/users/${id}`, { method: 'DELETE' }),
    },
    extras: {
      list: () => request<any[]>('/admin/extras'),
      create: (data: any) => request<any>('/admin/extras', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => request<any>(`/admin/extras/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string) => request<any>(`/admin/extras/${id}`, { method: 'DELETE' }),
    },
    scraper: {
      sources: () => request<any[]>('/admin/scraper/sources'),
      addSource: (url: string, label?: string) =>
        request<any>('/admin/scraper/sources', { method: 'POST', body: JSON.stringify({ url, label }) }),
      deleteSource: (id: string) => request<any>(`/admin/scraper/sources/${id}`, { method: 'DELETE' }),
      pending: () => request<any[]>('/admin/scraper/pending'),
      scan: (payload: { id?: string; url?: string }) =>
        request<any>('/admin/scraper/scan', { method: 'POST', body: JSON.stringify(payload) }),
      discover: () => request<any>('/admin/scraper/discover', { method: 'POST', body: '{}' }),
      setPendingStatus: (id: string, status: 'imported' | 'dismissed') =>
        request<any>(`/admin/scraper/pending/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    },
    packages: {
      list: () => request<any[]>('/admin/packages'),
      create: (data: any) => request<any>('/admin/packages', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => request<any>(`/admin/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string) => request<any>(`/admin/packages/${id}`, { method: 'DELETE' }),
      setFeatured: (id: string) => request<any>(`/admin/packages/${id}`, { method: 'PUT', body: JSON.stringify({ isFeaturedExperience: true }) }),
      clearFeatured: (id: string) => request<any>(`/admin/packages/${id}`, { method: 'PUT', body: JSON.stringify({ isFeaturedExperience: false }) }),
      // Add-on options unique to one package (not shared with others)
      extras: {
        list: (packageId: string) => request<any[]>(`/admin/packages/${packageId}/extras`),
        create: (packageId: string, data: any) =>
          request<any>(`/admin/packages/${packageId}/extras`, { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) => request<any>(`/admin/extras/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request<any>(`/admin/extras/${id}`, { method: 'DELETE' }),
      },
    },
    testimonials: {
      list: () => request<any[]>('/admin/testimonials'),
      create: (data: any) => request<any>('/admin/testimonials', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => request<any>(`/admin/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string) => request<any>(`/admin/testimonials/${id}`, { method: 'DELETE' }),
    },
    settings: {
      get: () => request<any>('/settings'),
      update: (data: any) => request<any>('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
      // Full-detail Trip Options (Features/Highlights) including hidden admin notes
      getTripOptions: () => request<any>('/admin/trip-options'),
    },
    notes: {
      get: () => request<{ notes: string; updatedAt: string | null }>('/admin/notes'),
      update: (notes: string) => request<{ notes: string; updatedAt: string }>('/admin/notes', { method: 'PUT', body: JSON.stringify({ notes }) }),
    },
    changePassword: (currentPassword: string, newPassword: string) =>
      request<any>('/admin/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
    forgotPassword: (email: string) =>
      request<any>('/admin/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token: string, password: string) =>
      request<any>('/admin/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  },
};

// Map PHP API package format to the shape the UI components expect
export function mapPackage(pkg: any) {
  const features = typeof pkg.features === 'string' ? JSON.parse(pkg.features) : (pkg.features || []);
  return {
    id: String(pkg.id),
    title: pkg.title,
    slug: String(pkg.id),                       // use id as slug
    package_type: (pkg.packageType || '').toLowerCase(),
    location: pkg.location,
    price: pkg.priceOnApplication ? 'POA' : `$${pkg.price}`,
    price_on_application: !!pkg.priceOnApplication,
    group_size: pkg.groupSize,
    image_url: pkg.image,
    features,
    description: pkg.description,
    is_hero: pkg.showOnHomepage ? '1' : '0',
    is_featured: !!pkg.isFeaturedExperience,
    display_order: pkg.displayOrder,
    created_at: pkg.createdAt || '',
    updated_at: pkg.updatedAt || '',
    duration: pkg.duration,
    included: typeof pkg.included === 'string' ? JSON.parse(pkg.included) : (pkg.included || []),
    // Admin-only fields — absent on public API responses, so these are undefined there
    internal_notes_url: pkg.internalNotesUrl || '',
    internal_notes: pkg.internalNotes || '',
  };
}
