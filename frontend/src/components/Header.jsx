import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, Sun, Moon, LogOut, User, Lock, Mail, ShieldAlert, Loader2 } from 'lucide-react'
import { useToast } from './Toast'
import Modal from './Modal'
import api from '../services/api'

export default function Header({ onMenuToggle }) {
  const location = useLocation()
  const { user, logout, darkMode, toggleDarkMode, updateToken } = useAuth()
  const { showToast } = useToast()
  
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('info') // 'info' | 'password' | 'email'
  
  // Form states
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [verifyPassword, setVerifyPassword] = useState('')
  const [mutating, setMutating] = useState(false)

  // Get current page title dynamically
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Overview'
      case '/expenses':
        return 'Expenses Manager'
      default:
        return 'Dashboard'
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match!', 'warning')
      return
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long!', 'warning')
      return
    }
    try {
      setMutating(true)
      const res = await api.post('/user/change-password', {
        oldPassword,
        newPassword
      })
      
      // Backend returns HTTP 200 on success, status 400/500 for error
      if (res.status === 200) {
        showToast('Password changed successfully!', 'success')
        setProfileOpen(false)
        setOldPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
      } else {
        showToast(res.data?.message || res.data || 'Failed to update password.', 'error')
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.response?.data || 'Failed to update password.', 'error')
    } finally {
      setMutating(false)
    }
  }

  const handleChangeEmail = async (e) => {
    e.preventDefault()
    if (!newEmail.trim()) {
      showToast('Please enter a valid email address.', 'warning')
      return
    }
    try {
      setMutating(true)
      const res = await api.post('/user/change-email', {
        newEmail: newEmail.trim(),
        password: verifyPassword
      })
      const data = res.data
      
      // On success, backend returns the new token (starts with eyJ)
      if (typeof data === 'string' && data.startsWith('eyJ')) {
        updateToken(data)
        showToast('Email updated successfully! Session updated.', 'success')
        setProfileOpen(false)
        setNewEmail('')
        setVerifyPassword('')
      } else {
        showToast(data || 'Failed to update email.', 'error')
      }
    } catch (err) {
      showToast(err.response?.data || 'Failed to update email.', 'error')
    } finally {
      setMutating(false)
    }
  }

  return (
    <header class="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 dark:border-dark-800 dark:bg-dark-900 transition-colors">
      <div class="flex items-center gap-3">
        {/* Menu button for mobile */}
        <button
          onClick={onMenuToggle}
          class="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 md:hidden dark:text-slate-400 dark:hover:bg-dark-800 dark:hover:text-slate-200 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100 md:text-xl">
          {getPageTitle()}
        </h2>
      </div>

      <div class="flex items-center gap-4">
        {/* Dark/Light mode theme toggle */}
        <button
          onClick={toggleDarkMode}
          class="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-dark-800 text-slate-405 dark:text-slate-400 dark:hover:bg-dark-800 dark:hover:text-slate-200 transition-all duration-200"
          title="Toggle Theme"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* User profile dropdown menu */}
        {user && (
          <div class="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              class="flex items-center gap-2 rounded-xl border border-slate-200 p-1.5 pr-3 hover:bg-slate-50 dark:border-dark-800 dark:hover:bg-dark-800 transition-all duration-200"
            >
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 font-bold text-sm uppercase">
                {user.name ? user.name.substring(0, 2) : 'US'}
              </div>
              <span class="hidden text-sm font-semibold text-slate-700 dark:text-slate-300 md:inline">
                {user.name}
              </span>
            </button>

            {dropdownOpen && (
              <>
                {/* Backdrop to close dropdown */}
                <div 
                  onClick={() => setDropdownOpen(false)}
                  class="fixed inset-0 z-10"
                />
                
                {/* Dropdown panel */}
                <div class="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-slate-100 bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 dark:border-dark-750 dark:bg-dark-800">
                  <div class="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 border-b border-slate-50 dark:border-dark-700">
                    Logged in as <span class="font-bold truncate block">{user.email}</span>
                  </div>
                  
                  {/* My Profile Action */}
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      setActiveTab('info')
                      setProfileOpen(true)
                    }}
                    class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-dark-700/50 transition-all"
                  >
                    <User className="h-4 w-4" />
                    My Account
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      logout()
                    }}
                    class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-all border-t border-slate-50 dark:border-dark-700/50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Account Settings / Profile Modal */}
      <Modal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Account Settings"
      >
        <div class="flex flex-col gap-6">
          {/* Navigation Tabs */}
          <div class="flex border-b border-slate-100 dark:border-dark-700">
            <button
              onClick={() => setActiveTab('info')}
              class={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'info'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
              }`}
            >
              <User className="h-4 w-4" />
              General
            </button>
            <button
              onClick={() => setActiveTab('password')}
              class={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'password'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
              }`}
            >
              <Lock className="h-4 w-4" />
              Password
            </button>
            <button
              onClick={() => setActiveTab('email')}
              class={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'email'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
              }`}
            >
              <Mail className="h-4 w-4" />
              Email Address
            </button>
          </div>

          {/* Tab Contents */}
          <div class="min-h-[220px]">
            {activeTab === 'info' && user && (
              <div class="space-y-4 animate-fade-in">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    User Nickname
                  </label>
                  <p class="mt-1 text-sm font-semibold text-slate-900 bg-slate-50 dark:bg-dark-850 px-4 py-2.5 rounded-xl">
                    {user.name}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                    Email Address
                  </label>
                  <p class="mt-1 text-sm font-semibold text-slate-900 bg-slate-50 dark:bg-dark-850 px-4 py-2.5 rounded-xl">
                    {user.email}
                  </p>
                </div>
                <div class="flex items-start gap-2 rounded-xl bg-indigo-50/50 p-3.5 dark:bg-indigo-950/10">
                  <ShieldAlert className="h-4 w-4 text-indigo-500 mt-0.5" />
                  <p class="text-xs text-indigo-700 dark:text-indigo-400">
                    Your account is validated securely using BCrypt password hashing and HMAC-256 JWT tokens.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} class="space-y-4 animate-fade-in">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    class="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-950 dark:text-slate-50"
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    class="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-950 dark:text-slate-50"
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    class="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-950 dark:text-slate-50"
                  />
                </div>
                <div class="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={mutating}
                    class="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary-700 disabled:opacity-50"
                  >
                    {mutating && <Loader2 className="h-4 w-4 animate-spin" />}
                    Update Password
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'email' && (
              <form onSubmit={handleChangeEmail} class="space-y-4 animate-fade-in">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    New Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="new-email@domain.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    class="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-950 dark:text-slate-50"
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Verification Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm password to apply change"
                    value={verifyPassword}
                    onChange={(e) => setVerifyPassword(e.target.value)}
                    class="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-950 dark:text-slate-50"
                  />
                </div>
                <div class="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={mutating}
                    class="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary-700 disabled:opacity-50"
                  >
                    {mutating && <Loader2 className="h-4 w-4 animate-spin" />}
                    Change Email
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Modal>
    </header>
  )
}
