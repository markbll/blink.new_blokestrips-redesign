import React, { useState, useEffect } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { api } from '../lib/api'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'

function PasswordField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className="w-full bg-black border border-gray-700 rounded-md px-4 py-3 pr-10 text-white focus:outline-none focus:border-[#f59e0b]"
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

export function AdminResetPasswordPage() {
  const search = useSearch({ strict: false }) as { token?: string }
  const token  = search.token || ''

  const [newPass, setNewPass]   = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const mismatch  = newPass && confirm && newPass !== confirm
  const tooShort  = newPass && newPass.length < 8
  const canSubmit = token && newPass.length >= 8 && newPass === confirm && !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true); setError('')
    try {
      await api.admin.resetPassword(token, newPass)
      setSuccess(true)
    } catch (err: any) {
      setError(err?.data?.error || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-white">BLOKES</span><span className="text-[#f59e0b]">TRIPS</span>
          </h1>
          <p className="text-gray-400">Admin Portal</p>
        </div>

        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
          {success ? (
            <div className="text-center">
              <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4" />
              <h2 className="text-white font-bold text-xl mb-2">Password Reset</h2>
              <p className="text-gray-400 text-sm mb-6">Your password has been updated successfully.</p>
              <Link to="/admin"
                className="inline-block w-full bg-[#f59e0b] text-black px-6 py-3 rounded-md font-semibold hover:bg-[#d97706] transition-colors text-center">
                Sign In to Admin
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center">
              <p className="text-red-400 mb-4">No reset token found. Please use the link from your email.</p>
              <Link to="/admin" className="text-[#f59e0b] hover:text-[#d97706] text-sm">← Back to Admin</Link>
            </div>
          ) : (
            <>
              <h2 className="text-white font-bold text-lg mb-1">Set New Password</h2>
              <p className="text-gray-500 text-sm mb-6">Choose a strong password for your admin account.</p>

              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <PasswordField label="New Password" value={newPass} onChange={setNewPass} placeholder="At least 8 characters" />
                {tooShort && <p className="text-red-400 text-xs">Password must be at least 8 characters</p>}
                <PasswordField label="Confirm Password" value={confirm} onChange={setConfirm} placeholder="Repeat new password" />
                {mismatch && <p className="text-red-400 text-xs">Passwords do not match</p>}
                <button type="submit" disabled={!canSubmit}
                  className="w-full bg-[#f59e0b] text-black px-6 py-3 rounded-md font-semibold hover:bg-[#d97706] transition-colors disabled:opacity-50">
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/admin" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Back to Admin</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
