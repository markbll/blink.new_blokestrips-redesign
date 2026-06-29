import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface Admin { id: string; email: string; name: string }

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

  const logout = () => {
    localStorage.removeItem('adminToken')
    setUser(null)
  }

  return { user, isLoading, login, logout }
}
