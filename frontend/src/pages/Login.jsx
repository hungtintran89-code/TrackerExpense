import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import { Wallet, Mail, Lock, Eye, EyeOff, Loader2, Key, Sparkles } from 'lucide-react'

export default function Login() {
  const { login, googleLogin, googleOtpRequest, googleOtpConfirm, user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Google Login OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  const handleGoogleLogin = async (response) => {
    setLoading(true)
    setError('')
    const result = await googleOtpRequest(response.credential)
    setLoading(false)

    if (result.success) {
      setOtpEmail(result.email)
      setOtpCode('')
      showToast(result.message, 'success')
      if (result.otp) {
        console.log("Simulated Google Login OTP:", result.otp)
        showToast(`[Simulation] OTP for ${result.email} is: ${result.otp}`, 'info')
      }
      setShowOtpModal(true)
    } else {
      setError(result.message)
      showToast(result.message, 'error')
    }
  }

  const handleVerifyGoogleOtp = async (e) => {
    e.preventDefault()
    if (!otpCode.trim()) {
      showToast('Please enter the verification code.', 'warning')
      return
    }

    setOtpLoading(true)
    const result = await googleOtpConfirm(otpEmail, otpCode.trim())
    setOtpLoading(false)

    if (result.success) {
      showToast('Welcome back! You have successfully signed in.', 'success')
      setShowOtpModal(false)
      navigate('/dashboard')
    } else {
      showToast(result.message, 'error')
    }
  }

  useEffect(() => {
    const initGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          // This client_id can be overridden via environment variables
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '725350393091-m0tflfpt117r3qnt2t6p0h4gqpgj0p1a.apps.googleusercontent.com',
          callback: handleGoogleLogin,
        })
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInDiv'),
          { theme: 'outline', size: 'large', width: '380px' }
        )
      }
    }

    const timer = setInterval(() => {
      if (window.google) {
        initGoogleSignIn()
        clearInterval(timer)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  // Show session expired notification if redirected
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      showToast('Your session has expired. Please login again.', 'warning')
    }
  }, [searchParams, showToast])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validations
    if (!email) {
      setError('Please enter your email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    if (result.success) {
      showToast('Welcome back! You have successfully signed in.', 'success')
      navigate('/dashboard')
    } else {
      setError(result.message)
      showToast(result.message, 'error')
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
            Sign in to your account
          </h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Or{' '}
            <Link to="/register" class="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400">
              create a new account for free
            </Link>
          </p>

          <form onSubmit={handleSubmit} class="mt-8 space-y-6">
            {error && (
              <div class="rounded-xl bg-rose-50 p-4 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 animate-slide-down">
                <p class="text-sm font-semibold text-rose-800 dark:text-rose-400">{error}</p>
              </div>
            )}

            <div class="space-y-4">
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
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div class="flex items-center justify-between">
                  <label htmlFor="password" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <Link to="/forgot-password" class="text-xs font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400">
                    Forgot password?
                  </Link>
                </div>
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
            </div>

            <button
              type="submit"
              disabled={loading}
              class="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 hover:from-primary-700 hover:to-indigo-700 focus:outline-none disabled:opacity-50 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying account...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Google Divider */}
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center" aria-hidden="true">
              <div class="w-full border-t border-slate-200 dark:border-dark-800"></div>
            </div>
            <div class="relative flex justify-center text-sm font-medium">
              <span class="bg-slate-50 dark:bg-dark-950 px-3 text-slate-500 dark:text-slate-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div class="flex justify-center w-full">
            <div id="googleSignInDiv" class="w-full flex justify-center"></div>
          </div>
        </div>

      </div>

      {/* Google Login OTP Verification Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Google Login Verification"
      >
        <form onSubmit={handleVerifyGoogleOtp} class="space-y-4">
          <p class="text-sm text-slate-600 dark:text-slate-400">
            A 6-digit login OTP code was generated for your Google account <strong>{otpEmail}</strong>. Please enter the code below to complete sign-in.
          </p>
          <div>
            <label htmlFor="otpCode" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Verification Code (OTP)
            </label>
            <div class="relative mt-1.5 rounded-xl shadow-sm">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Key className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                id="otpCode"
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
            disabled={otpLoading}
            class="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 hover:from-primary-700 hover:to-indigo-700 focus:outline-none disabled:opacity-50 transition-all duration-200"
          >
            {otpLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Sign In'
            )}
          </button>
        </form>
      </Modal>

      {/* Right side: Modern visual abstract art */}
      <div class="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900 dark:bg-dark-900">
        {/* Glow Effects */}
        <div class="absolute -left-1/4 -top-1/4 h-[80%] w-[80%] rounded-full bg-primary-500/20 blur-3xl" />
        <div class="absolute -right-1/4 -bottom-1/4 h-[80%] w-[80%] rounded-full bg-indigo-500/20 blur-3xl" />
        
        {/* Interactive illustration grid */}
        <div class="flex flex-col justify-center items-center h-full w-full p-12 text-white relative z-10">
          <div class="max-w-md text-center space-y-6">
            <div class="inline-flex rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur-md">
              ✨ Adaptive Engineering Solution
            </div>
            <h2 class="text-4xl font-extrabold tracking-tight md:text-5xl leading-tight">
              Control your expenses instantly.
            </h2>
            <p class="text-slate-300">
              A premium, lightning-fast dashboard that parses custom servers to visualize your financial activities in real time.
            </p>
            
            {/* Visual stats widget mockup */}
            <div class="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md text-left shadow-2xl">
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-semibold text-slate-400">MONTHLY BUDGET</span>
                <span class="text-xs font-bold text-emerald-400">+14.2%</span>
              </div>
              <div class="text-2xl font-bold">$4,850.00</div>
              <div class="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                <div class="bg-primary-500 h-full rounded-full w-3/4 animate-pulse-subtle" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
