import React, { useState } from 'react'
import { api } from '../../lib/api'
import { KeyRound, Eye, EyeOff, Check } from 'lucide-react'
import toast from 'react-hot-toast'

function PasswordField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-[#f59e0b]"
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

export function AdminSettings() {
  const [current, setCurrent]   = useState('')
  const [newPass, setNewPass]   = useState('')
  const [confirm, setConfirm]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [done, setDone]         = useState(false)

  const mismatch    = newPass && confirm && newPass !== confirm
  const tooShort    = newPass && newPass.length < 8
  const canSubmit   = current && newPass.length >= 8 && newPass === confirm && !saving

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setDone(false)
    try {
      await api.admin.changePassword(current, newPass)
      toast.success('Password updated')
      setCurrent(''); setNewPass(''); setConfirm('')
      setDone(true)
    } catch (err: any) {
      toast.error(err?.data?.error || 'Could not update password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your admin account</p>
      </div>

      <div className="max-w-md">
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <KeyRound size={16} className="text-[#f59e0b]" />
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Change Password</h2>
          </div>

          {done && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg mb-5">
              <Check size={15} /> Password updated successfully
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField
              label="Current Password"
              value={current}
              onChange={setCurrent}
              placeholder="Enter your current password"
            />
            <PasswordField
              label="New Password"
              value={newPass}
              onChange={v => { setNewPass(v); setDone(false) }}
              placeholder="At least 8 characters"
            />
            {tooShort && (
              <p className="text-red-400 text-xs -mt-2">Password must be at least 8 characters</p>
            )}
            <PasswordField
              label="Confirm New Password"
              value={confirm}
              onChange={v => { setConfirm(v); setDone(false) }}
              placeholder="Repeat new password"
            />
            {mismatch && (
              <p className="text-red-400 text-xs -mt-2">Passwords do not match</p>
            )}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-2.5 bg-[#f59e0b] text-black font-bold rounded-lg hover:bg-[#d97706] transition-colors disabled:opacity-40 text-sm mt-2"
            >
              {saving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
