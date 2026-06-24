import { useState, useEffect } from 'react'
import { blink } from '@/blink/client'

export function useAuth() {
  const [user, setUser] = useState<ReturnType<typeof blink.auth.onAuthStateChanged> extends (cb: infer C) => void ? Parameters<C>[0]['user'] : unknown>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (!state.isLoading) setIsLoading(false)
    })
    return unsubscribe
  }, [])

  return { user, isLoading, login: blink.auth.login, logout: blink.auth.logout }
}
