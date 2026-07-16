import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { Wallet, Mail, Lock, Key, Eye, EyeOff, Loader2, ArrowLeft, Info } from 'lucide-react'

export default function ForgotPassword() {
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1 = Request code, 2 = Reset password
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [simulatedCode, setSimulatedCode] = useState(null)
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRequestCode = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/user/forgot-password', { email: email.trim() })
      if (response.status === 200) {
        showToast('Reset code generated successfully!', 'success')
        setSimulatedCode(response.data.code)
        setStep(2)
      } else {
        setError(response.data || 'Failed to generate reset code.')
        showToast(response.data || 'Failed to generate reset code.', 'error')
      }
    } catch (err) {
      console.error('Request code error:', err)
      const errMsg = err.response?.data || 'User email not found or server issue occurred.'
      setError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (!code.trim()) {
      setError('Please enter the 6-digit reset code.')
      return
    }
    if (!newPassword) {
      setError('Please enter a new password.')
      return
    }
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/user/reset-password', {
        email: email.trim(),
        code: code.trim(),
        newPassword: newPassword
      })

      if (response.status === 200) {
        showToast('Password reset successfully! Please sign in.', 'success')
        navigate('/login')
      } else {
        setError(response.data || 'Failed to reset password.')
        showToast(response.data || 'Failed to reset password.', 'error')
      }
    } catch (err) {
      console.error('Reset password error:', err)
      const errMsg = err.response?.data || 'Invalid reset code or password update failed.'
      setError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="flex min-h-screen w-screen bg-slate-50 dark:bg-dark-950 transition-colors">
      {/* Left side: Form Panel */}
      <div class="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 xl:px-24 z-10">
        <div class="mx-auto w-full max-w-md">
          {/* Logo */}
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white shadow-lg shadow-primary-500/20">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 class="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Antigravity
              </h1>
              <p class="text-xxs text-slate-400 dark:text-slate-500 -mt-1 font-semibold">EXPENSE TRACKER</p>
            </div>
          </div>

          <h2 class="mt-8 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {step === 1 ? 'Forgot your password?' : 'Reset your password'}
          </h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {step === 1 
              ? 'Enter your email address and we will generate a password recovery code.' 
              : 'Enter the recovery code sent to you along with your new account password.'
            }
          </p>

          {/* Step 1: Request Recovery Code */}
          {step === 1 ? (
            <form onSubmit={handleRequestCode} class="mt-8 space-y-6">
              {error && (
                <div class="rounded-xl bg-rose-50 p-4 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 animate-slide-down">
                  <p class="text-sm font-semibold text-rose-800 dark:text-rose-400">{error}</p>
                </div>
              )}

              <div class="space-y-4">
                <div>
                  <label htmlFor="email" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <div class="relative mt-1.5 rounded-xl shadow-sm">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  class="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 hover:from-primary-700 hover:to-indigo-700 focus:outline-none disabled:opacity-50 transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating code...
                    </>
                  ) : (
                    'Generate Recovery Code'
                  )}
                </button>

                <Link
                  to="/login"
                  class="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors mt-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </form>
          ) : (
            // Step 2: Reset password using code
            <form onSubmit={handleResetPassword} class="mt-8 space-y-6">
              {error && (
                <div class="rounded-xl bg-rose-50 p-4 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 animate-slide-down">
                  <p class="text-sm font-semibold text-rose-800 dark:text-rose-400">{error}</p>
                </div>
              )}

              {/* Simulation Helper Banner */}
              {simulatedCode && (
                <div class="rounded-xl bg-primary-50 p-4 border border-primary-100 dark:bg-primary-950/20 dark:border-primary-900/40 animate-slide-down flex items-start gap-2.5">
                  <Info className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5" />
                  <div>
                    <h4 class="text-sm font-bold text-primary-800 dark:text-primary-300">[Reset Simulation Notice]</h4>
                    <p class="text-xs text-primary-700 dark:text-primary-400 mt-1">
                      Your mock password recovery code is: <code class="font-bold text-sm bg-primary-100 dark:bg-primary-900 px-1.5 py-0.5 rounded text-primary-900 dark:text-primary-200">{simulatedCode}</code>
                    </p>
                  </div>
                </div>
              )}

              <div class="space-y-4">
                {/* 6-Digit Recovery Code */}
                <div>
                  <label htmlFor="code" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    6-Digit Recovery Code
                  </label>
                  <div class="relative mt-1.5 rounded-xl shadow-sm">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Key className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      id="code"
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. 123456"
                      class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    New Password
                  </label>
                  <div class="relative mt-1.5 rounded-xl shadow-sm">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </label>
                  <div class="relative mt-1.5 rounded-xl shadow-sm">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  class="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 hover:from-primary-700 hover:to-indigo-700 focus:outline-none disabled:opacity-50 transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  class="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors mt-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change email address
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right side: Modern visual abstract art */}
      <div class="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900 dark:bg-dark-900">
        <div class="absolute -left-1/4 -top-1/4 h-[80%] w-[80%] rounded-full bg-primary-500/20 blur-3xl" />
        <div class="absolute -right-1/4 -bottom-1/4 h-[80%] w-[80%] rounded-full bg-indigo-500/20 blur-3xl" />
        
        <div class="flex flex-col justify-center items-center h-full w-full p-12 text-white relative z-10">
          <div class="max-w-md text-center space-y-6">
            <div class="inline-flex rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur-md">
              ✨ Adaptive Engineering Solution
            </div>
            <h2 class="text-4xl font-extrabold tracking-tight md:text-5xl leading-tight">
              Regain access in seconds.
            </h2>
            <p class="text-base text-slate-350 leading-relaxed">
              Don't worry! Recovering your password is easy. Follow the steps to secure your credentials and retrieve your financial history.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
