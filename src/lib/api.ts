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
    list: (params?: { packageType?: string; homepage?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.packageType) q.set('packageType', params.packageType);
      if (params?.homepage) q.set('homepage', 'true');
      return request<any[]>(`/packages${q.toString() ? '?' + q : ''}`);
    },
    get: (id: string) => request<any>(`/packages/${id}`),
  },
  enquiries: {
    create: (data: Record<string, any>) =>
      request<any>('/enquiries', { method: 'POST', body: JSON.stringify(data) }),
  },
  admin: {
    login: (email: string, password: string) =>
      request<{ access_token: string }>('/admin/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      }),
    me: () => request<any>('/admin/me'),
    stats: () => request<any>('/admin/stats'),
    enquiries: () => request<any[]>('/admin/enquiries'),
    updateEnquiry: (id: string, data: any) =>
      request<any>(`/admin/enquiries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEnquiry: (id: string) =>
      request<any>(`/admin/enquiries/${id}`, { method: 'DELETE' }),
    packages: {
      list: () => request<any[]>('/admin/packages'),
      create: (data: any) => request<any>('/admin/packages', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => request<any>(`/admin/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string) => request<any>(`/admin/packages/${id}`, { method: 'DELETE' }),
    },
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
    price: `$${pkg.price}`,
    group_size: pkg.groupSize,
    image_url: pkg.image,
    features,
    description: pkg.description,
    is_hero: pkg.showOnHomepage ? '1' : '0',
    display_order: pkg.displayOrder,
    created_at: pkg.createdAt || '',
    updated_at: pkg.updatedAt || '',
    duration: pkg.duration,
    included: typeof pkg.included === 'string' ? JSON.parse(pkg.included) : (pkg.included || []),
  };
}
