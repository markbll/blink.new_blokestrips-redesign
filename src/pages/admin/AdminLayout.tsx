import React, { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useRouterState, useRouter } from '@tanstack/react-router'
import { useAuth } from '../../hooks/useAuth'
import { LayoutDashboard, Package, Mail, LogOut, Menu, X, ArrowLeft, RefreshCw, Sparkles, Star, Settings, ListChecks, Users, Radar, PlusCircle, NotebookPen } from 'lucide-react'
import { api } from '../../lib/api'

const OTP_SECONDS = 600

function LoginForm({ onLogin }: { onLogin: (token: string) => Promise<void> }) {
  const [mode, setMode]                 = useState<'otp' | 'password' | 'forgot'>('password')
  const [step, setStep]                 = useState<1 | 2>(1)
  const [email, setEmail]               = useState('')
  const [code, setCode]                 = useState('')
  const [password, setPassword]         = useState('')
  const [forgotEmail, setForgotEmail]   = useState('')
  const [forgotSent, setForgotSent]     = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [secondsLeft, setSeconds]       = useState(OTP_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setSeconds(OTP_SECONDS)
    timerRef.current = setInterval(() => {
      setSeconds(s => { if (s <= 1) { clearInterval(timerRef.current!); return 0 } return s - 1 })
    }, 1000)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])
  useEffect(() => { if (step === 2) codeInputRef.current?.focus() }, [step])

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const timerColor = secondsLeft > 120 ? '#22c55e' : secondsLeft > 30 ? '#f59e0b' : '#ef4444'

  const sendCode = async () => {
    if (!email.trim()) { setError('Please enter your email.'); return }
    setError(''); setLoading(true)
    try {
      await api.admin.requestOtp(email.trim())
      startTimer(); setStep(2)
    } catch (err: any) {
      setError(err?.data?.error || 'Failed to send code. Please try again.')
    } finally { setLoading(false) }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.admin.login(email.trim(), password)
      await onLogin(res.access_token)
    } catch (err: any) {
      setError(err?.data?.error || 'Incorrect email or password')
      setLoading(false)
    }
  }

  const handleResend = () => { setCode(''); setError(''); sendCode() }

  const switchMode = (m: 'otp' | 'password' | 'forgot') => {
    setMode(m); setError(''); setCode(''); setPassword(''); setStep(1)
    setForgotSent(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.admin.forgotPassword(forgotEmail)
      setForgotSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally { setLoading(false) }
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

          {/* ── Mode toggle (hidden when forgot password is shown) ── */}
          {mode !== 'forgot' && (
            <div className="flex rounded-md overflow-hidden border border-gray-700 mb-6">
              <button onClick={() => switchMode('password')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'password' ? 'bg-[#f59e0b] text-black' : 'text-gray-400 hover:text-white'}`}>
                Password
              </button>
              <button onClick={() => switchMode('otp')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'otp' ? 'bg-[#f59e0b] text-black' : 'text-gray-400 hover:text-white'}`}>
                Email Code
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">{error}</div>
          )}

          {/* ── Forgot password mode ── */}
          {mode === 'forgot' && (
            <div>
              <h2 className="text-white font-bold text-lg mb-1">Reset Password</h2>
              <p className="text-gray-500 text-sm mb-5">We'll email you a link to reset your password.</p>
              {forgotSent ? (
                <div className="text-center">
                  <div className="text-3xl mb-3">📧</div>
                  <p className="text-green-400 font-semibold text-sm mb-1">Check your inbox</p>
                  <p className="text-gray-500 text-xs mb-5">A reset link has been sent to <span className="text-gray-300">{forgotEmail}</span>. It expires in 1 hour.</p>
                  <button onClick={() => switchMode('password')}
                    className="text-[#f59e0b] hover:text-[#d97706] text-sm font-medium transition-colors">
                    ← Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <input
                    type="email" required value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="admin@blokestrips.com.au"
                    className="w-full bg-black border border-gray-700 rounded-md px-4 py-3 text-white focus:outline-none focus:border-[#f59e0b]"
                  />
                  <button type="submit" disabled={loading}
                    className="w-full bg-[#f59e0b] text-black px-6 py-3 rounded-md font-semibold hover:bg-[#d97706] transition-colors disabled:opacity-50">
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                  <button type="button" onClick={() => switchMode('password')}
                    className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors">
                    ← Back to Sign In
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── Password mode ── */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <input
                type="email" required autoComplete="username"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@blokestrips.com.au"
                className="w-full bg-black border border-gray-700 rounded-md px-4 py-3 text-white focus:outline-none focus:border-[#f59e0b]"
              />
              <input
                type="password" required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-black border border-gray-700 rounded-md px-4 py-3 text-white focus:outline-none focus:border-[#f59e0b]"
              />
              <button type="submit" disabled={loading || !password || !email}
                className="w-full bg-[#f59e0b] text-black px-6 py-3 rounded-md font-semibold hover:bg-[#d97706] transition-colors disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <div className="text-center">
                <button type="button" onClick={() => switchMode('forgot')}
                  className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                  Forgot password?
                </button>
              </div>
            </form>
          )}

          {/* ── OTP mode: Step 1 ── */}
          {mode === 'otp' && step === 1 && (
            <>
              <p className="text-gray-400 text-sm text-center mb-6">
                Enter your email and we'll send you a one-time login code.
              </p>
              <form onSubmit={e => { e.preventDefault(); sendCode() }} className="space-y-4">
                <input
                  type="email" required autoComplete="username"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@blokestrips.com.au"
                  className="w-full bg-black border border-gray-700 rounded-md px-4 py-3 text-white focus:outline-none focus:border-[#f59e0b]"
                />
                <button type="submit" disabled={loading || !email}
                  className="w-full bg-[#f59e0b] text-black px-6 py-3 rounded-md font-semibold hover:bg-[#d97706] transition-colors disabled:opacity-50">
                  {loading ? 'Sending code...' : 'Send Login Code'}
                </button>
              </form>
            </>
          )}

          {/* ── OTP mode: Step 2 ── */}
          {mode === 'otp' && step === 2 && (
            <>
              <p className="text-gray-400 text-sm text-center mb-4">
                Code sent to <span className="text-[#f59e0b] font-semibold">{email}</span>
              </p>
              <div className="flex flex-col items-center mb-5">
                <div className="text-5xl font-mono font-bold tabular-nums" style={{ color: timerColor }}>{fmt(secondsLeft)}</div>
                <p className="text-gray-600 text-xs mt-1 uppercase tracking-widest">{secondsLeft > 0 ? 'Code expires in' : 'Code expired'}</p>
                <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3">
                  <div className="h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(secondsLeft / OTP_SECONDS) * 100}%`, backgroundColor: timerColor }} />
                </div>
              </div>
              <form onSubmit={e => {
                e.preventDefault()
                if (secondsLeft === 0) { setError('Code expired — click Resend.'); return }
                setError(''); setLoading(true)
                api.admin.verifyOtp(email.trim(), code.trim())
                  .then(res => onLogin(res.access_token))
                  .catch((err: any) => { setError(err?.data?.error || 'Invalid or expired code'); setLoading(false) })
              }} className="space-y-4">
                <input ref={codeInputRef}
                  type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                  required autoComplete="one-time-code"
                  value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={secondsLeft === 0} placeholder="000000"
                  className="w-full bg-black border border-gray-700 rounded-md px-4 py-4 text-white text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:border-[#f59e0b] disabled:opacity-40"
                />
                <button type="submit" disabled={loading || code.length < 6 || secondsLeft === 0}
                  className="w-full bg-[#f59e0b] text-black px-6 py-3 rounded-md font-semibold hover:bg-[#d97706] transition-colors disabled:opacity-50">
                  {loading ? 'Verifying...' : 'Sign In'}
                </button>
              </form>
              <div className="mt-4 flex items-center justify-between">
                <button onClick={() => { setStep(1); setCode(''); setError(''); if (timerRef.current) clearInterval(timerRef.current) }}
                  className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Back</button>
                <button onClick={handleResend} disabled={loading}
                  className="flex items-center gap-1.5 text-[#f59e0b] hover:text-[#d97706] text-sm font-medium transition-colors disabled:opacity-50">
                  <RefreshCw size={13} /> Resend code
                </button>
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Back to site</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const { user, isLoading, logout, loginWithToken, hasAccess } = useAuth()
  const router = useRouter()
  const state = useRouterState()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f59e0b]" />
    </div>
  )

  if (!user) return <LoginForm onLogin={loginWithToken} />

  const path = state.location.pathname
  const allNavItems = [
    { to: '/admin',                label: 'Dashboard',     icon: LayoutDashboard, area: 'dashboard' },
    { to: '/admin/packages',       label: 'Packages',      icon: Package,         area: 'packages' },
    { to: '/admin/featured-trip',  label: 'Featured Trip', icon: Sparkles,        area: 'featured' },
    { to: '/admin/trip-options',   label: 'Trip Options',  icon: ListChecks,      area: 'trip-options' },
    { to: '/admin/optional-extras', label: 'Optional Extras', icon: PlusCircle,   area: 'optional-extras' },
    { to: '/admin/reviews',        label: 'Reviews',       icon: Star,            area: 'reviews' },
    { to: '/admin/enquiries',      label: 'Enquiries',     icon: Mail,            area: 'enquiries' },
    { to: '/admin/discovery',      label: 'Discovery',     icon: Radar,           area: 'discovery' },
    { to: '/admin/settings',       label: 'Settings',      icon: Settings,        area: 'settings' },
    { to: '/admin/users',          label: 'Users',         icon: Users,           area: 'users' },
    { to: '/admin/notes',          label: 'Notes',         icon: NotebookPen,     area: 'notes' },
  ]
  const navItems = allNavItems.filter(item => hasAccess(item.area))
  const isActive = (to: string) => to === '/admin' ? path === '/admin' : path.startsWith(to)
  const handleLogout = () => { logout(); router.navigate({ to: '/admin' }) }

  // Which area does the current path belong to? (login has no area)
  const currentArea = path === '/admin/login'
    ? null
    : [...allNavItems].sort((a, b) => b.to.length - a.to.length).find(i =>
        i.to === '/admin' ? path === '/admin' : path.startsWith(i.to)
      )?.area
  const accessDenied = currentArea != null && !hasAccess(currentArea)

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
        <main className="flex-1 p-5 sm:p-8 overflow-y-auto">
          {accessDenied ? (
            <div className="max-w-md mx-auto mt-20 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
                <X size={26} className="text-red-400" />
              </div>
              <h2 className="text-white font-bold text-xl mb-2">No access to this area</h2>
              <p className="text-gray-500 text-sm mb-6">Your account doesn't have permission to view this section. Contact a super admin if you need access.</p>
              <button onClick={() => router.navigate({ to: '/admin' })}
                className="px-5 py-2.5 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm">
                Back to Dashboard
              </button>
            </div>
          ) : <Outlet />}
        </main>
      </div>
    </div>
  )
}
