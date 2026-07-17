import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import { Wallet, Mail, Lock, User, Eye, EyeOff, Loader2, Key } from 'lucide-react'

export default function Register() {
  const { registerRequest, registerConfirm, user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validation checks
    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const result = await registerRequest(name, email, password)
    setLoading(false)

    if (result.success) {
      showToast('Verification code generated. Please check your email.', 'success')
      if (result.otp) {
        console.log("Simulated Signup OTP:", result.otp)
        showToast(`[Simulation] Signup OTP is: ${result.otp}`, 'info')
      }
      setShowOtpModal(true)
    } else {
      setError(result.message)
      showToast(result.message, 'error')
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otpCode.trim()) {
      showToast('Please enter the verification code.', 'warning')
      return
    }

    setVerifyingOtp(true)
    const result = await registerConfirm(email, otpCode.trim())
    setVerifyingOtp(false)

    if (result.success) {
      showToast('Verification successful! Account created.', 'success')
      setShowOtpModal(false)
      navigate('/login')
    } else {
      showToast(result.message, 'error')
    }
  }

  return (
    <div class="flex min-h-screen w-screen bg-slate-50 dark:bg-dark-950 transition-colors">
      {/* Left side: Modern visual abstract art */}
      <div class="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900 dark:bg-dark-900">
        {/* Glow Effects */}
        <div class="absolute -left-1/4 -top-1/4 h-[80%] w-[80%] rounded-full bg-primary-500/20 blur-3xl" />
        <div class="absolute -right-1/4 -bottom-1/4 h-[80%] w-[80%] rounded-full bg-indigo-500/20 blur-3xl" />
        
        {/* Interactive illustration grid */}
        <div class="flex flex-col justify-center items-center h-full w-full p-12 text-white relative z-10">
          <div class="max-w-md text-center space-y-6">
            <div class="inline-flex rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur-md">
              🎯 Start Tracking Today
            </div>
            <h2 class="text-4xl font-extrabold tracking-tight md:text-5xl leading-tight">
              Manage wealth intelligently.
            </h2>
            <p class="text-slate-300">
              Create an account to track expenses, filter categories, visualize budgets, and extract custom details in a couple of clicks.
            </p>
            
            {/* Visual stats widget mockup */}
            <div class="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md text-left shadow-2xl">
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-semibold text-slate-400">TRACKING STATUS</span>
                <span class="text-xs font-bold text-indigo-400">ACTIVE</span>
              </div>
              <div class="flex gap-2">
                <div class="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">F</div>
                <div class="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">S</div>
                <div class="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">O</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Form Panel */}
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
            Create your free account
          </h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" class="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400">
              Sign in here
            </Link>
          </p>

          <form onSubmit={handleSubmit} class="mt-8 space-y-5">
            {error && (
              <div class="rounded-xl bg-rose-50 p-4 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 animate-slide-down">
                <p class="text-sm font-semibold text-rose-800 dark:text-rose-400">{error}</p>
              </div>
            )}

            <div class="space-y-3.5">
              {/* Full Name */}
              <div>
                <label htmlFor="name" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div class="relative mt-1.5 rounded-xl shadow-sm">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Email Address */}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Password (min 6 chars)
                </label>
                <div class="relative mt-1.5 rounded-xl shadow-sm">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              class="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 hover:from-primary-700 hover:to-indigo-700 focus:outline-none disabled:opacity-50 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registering account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
      {/* OTP Verification Modal */}
      <Modal 
        isOpen={showOtpModal} 
        onClose={() => setShowOtpModal(false)} 
        title="Email Verification Required"
      >
        <form onSubmit={handleVerifyOtp} class="space-y-4">
          <p class="text-sm text-slate-600 dark:text-slate-400">
            We have generated a 6-digit verification code to confirm ownership of <strong>{email}</strong>. Please enter the code below to complete registration.
          </p>
          <div>
            <label htmlFor="otp" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Verification Code (OTP)
            </label>
            <div class="relative mt-1.5 rounded-xl shadow-sm">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Key className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                id="otp"
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={verifyingOtp}
            class="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 hover:from-primary-700 hover:to-indigo-700 focus:outline-none disabled:opacity-50 transition-all duration-200"
          >
            {verifyingOtp ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying OTP...
              </>
            ) : (
              'Confirm & Register'
            )}
          </button>
        </form>
      </Modal>
        </div>
      </div>
    </div>
  )
}
