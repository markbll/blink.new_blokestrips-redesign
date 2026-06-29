import React, { useState } from 'react'
import { Link, Outlet, useRouterState, useRouter } from '@tanstack/react-router'
import { useAuth } from '../../hooks/useAuth'
import { LayoutDashboard, Package, Mail, LogOut, Menu, X, ArrowLeft, Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err?.data?.error || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-white">BLOKES</span>
            <span className="text-[#f59e0b]">TRIPS</span>
          </h1>
          <p className="text-gray-400">Admin Portal</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Sign In</h2>
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">Email</label>
              <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@blokestrips.com"
                className="w-full bg-black border border-gray-700 rounded-md px-4 py-3 text-white focus:outline-none focus:border-[#f59e0b] text-sm" />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black border border-gray-700 rounded-md px-4 py-3 pr-11 text-white focus:outline-none focus:border-[#f59e0b] text-sm" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#f59e0b] text-black px-6 py-3 rounded-md font-semibold hover:bg-[#d97706] transition-colors disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Back to site</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const state = useRouterState()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f59e0b]" />
    </div>
  )

  if (!user) return <LoginForm />

  const path = state.location.pathname
  const navItems = [
    { to: '/admin',           label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/packages',  label: 'Packages',  icon: Package },
    { to: '/admin/enquiries', label: 'Enquiries', icon: Mail },
  ]
  const isActive = (to: string) => to === '/admin' ? path === '/admin' : path.startsWith(to)
  const handleLogout = () => { logout(); router.navigate({ to: '/admin' }) }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#111827] border-r border-gray-800 z-40 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        <div className="flex items-center justify-between px-6 h-16 border-b border-gray-800 flex-shrink-0">
          <span className="text-xl font-bold"><span className="text-white">BLOKES</span><span className="text-[#f59e0b]">TRIPS</span></span>
          <button className="lg:hidden text-gray-500 hover:text-white" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-gray-600 text-xs uppercase tracking-widest px-3 mb-2">Navigation</p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(to) ? 'bg-[#f59e0b] text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <Icon size={16} className="flex-shrink-0" />{label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800 space-y-1 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <ArrowLeft size={16} /> Back to Site
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#111827] border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="w-7 h-7 rounded-full bg-[#f59e0b]/20 flex items-center justify-center">
              <span className="text-[#f59e0b] text-xs font-bold uppercase">{user.email?.charAt(0)}</span>
            </div>
            <span className="text-gray-400 text-sm hidden sm:block">{user.email}</span>
          </div>
        </header>
        <main className="flex-1 p-5 sm:p-8 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  )
}
