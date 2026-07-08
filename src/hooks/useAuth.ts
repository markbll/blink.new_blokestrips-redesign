import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export interface Admin {
  id: string
  email: string
  name: string
  role?: string
  permissions?: string[]
}

export function useAuth() {
  const [user, setUser] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) { setIsLoading(false); return }
    api.admin.me()
      .then(data => setUser(data))
      .catch(() => localStorage.removeItem('adminToken'))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const { access_token } = await api.admin.login(email, password)
    localStorage.setItem('adminToken', access_token)
    const me = await api.admin.me()
    setUser(me)
  }

  const loginWithToken = async (token: string) => {
    localStorage.setItem('adminToken', token)
    const me = await api.admin.me()
    setUser(me)
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setUser(null)
  }

  // Super admins can access everything; otherwise check the permissions list.
  const hasAccess = (area: string) => {
    if (!user) return false
    if (user.role === 'super_admin') return true
    return (user.permissions ?? []).includes(area)
  }

  return { user, isLoading, login, loginWithToken, logout, hasAccess }
}
