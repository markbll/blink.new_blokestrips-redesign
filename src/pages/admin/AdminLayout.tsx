import React from 'react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '@blinkdotnew/ui'
import { LayoutDashboard, Package, LogOut, ArrowLeft } from 'lucide-react'

export function AdminLayout() {
  const { user, isLoading, login, logout } = useAuth()
  const state = useRouterState()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <h1 className="text-4xl font-display font-black uppercase italic mb-4">Admin Access</h1>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          You need to sign in to manage packages.
        </p>
        <Button
          className="h-14 px-10 bg-accent text-primary hover:bg-primary hover:text-white border-none font-black uppercase italic tracking-tight text-lg shadow-xl shadow-accent/20"
          onClick={() => login(window.location.href)}
        >
          Sign In to Admin
        </Button>
        <Link to="/" className="mt-6 text-sm text-muted-foreground hover:text-foreground underline">
          Back to Site
        </Link>
      </div>
    )
  }

  const isActive = (path: string) => state.location.pathname === path

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-primary text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="text-accent font-display font-black uppercase italic text-lg tracking-tight hover:text-white transition-colors">
            BlokesTrips
          </Link>
          <p className="text-white/40 text-xs uppercase tracking-widest mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
              isActive('/admin') ? 'bg-accent text-primary' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package size={18} />
            Packages
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest"
          >
            <ArrowLeft size={16} />
            Back to Site
          </Link>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest w-full"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-secondary/10 overflow-y-auto">
        <div className="p-8 lg:p-12 max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
