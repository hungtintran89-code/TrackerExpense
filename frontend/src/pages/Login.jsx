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

  // Google Sign-In & Onboarding States
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [googleStep, setGoogleStep] = useState(1) // 1: Choose Account, 2: Onboarding Setup
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleName, setGoogleName] = useState('')
  const [googlePassword, setGooglePassword] = useState('')
  const [onboardingTicket, setOnboardingTicket] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [savedAccounts, setSavedAccounts] = useState(() => {
    const accounts = localStorage.getItem('google_saved_accounts')
    return accounts ? JSON.parse(accounts) : []
  })

  // Forgot Password States
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetStep, setResetStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [resetEmail, setResetEmail] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetPasswordVal, setResetPasswordVal] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  // Handle Google Login request (Simulated Account Chooser step)
  const handleGoogleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!googleEmail.trim()) {
      showToast('Please enter your Google email.', 'warning')
      return
    }
    if (!googleEmail.trim().endsWith('@gmail.com')) {
      showToast('Please enter a valid Gmail address (@gmail.com).', 'warning')
      return
    }

    setGoogleLoading(true)
    const result = await googleLogin(googleEmail.trim())
    setGoogleLoading(false)

    if (result.success) {
      if (result.status === 'SUCCESS') {
        showToast('Successfully logged in with Google!', 'success')
        setShowGoogleModal(false)

        // Save account to local history
        const updatedAccounts = [...savedAccounts.filter(a => a.email !== googleEmail.trim()), { email: googleEmail.trim(), name: result.name }]
        localStorage.setItem('google_saved_accounts', JSON.stringify(updatedAccounts))
        setSavedAccounts(updatedAccounts)

        navigate('/dashboard')
      } else if (result.status === 'ONBOARDING_REQUIRED') {
        showToast('Google account verified. Please complete your profile setup.', 'info')
        setOnboardingTicket(result.onboarding_ticket)
        setGoogleName(googleEmail.split('@')[0])
        setGooglePassword('')
        setGoogleStep(2) // Move to onboarding screen
      }
    } else {
      showToast(result.message, 'error')
    }
  }

  // Handle Google Onboarding finalize registration
  const handleGoogleFinalizeSubmit = async (e) => {
    e.preventDefault()
    if (!googleName.trim() || googlePassword.length < 6) {
      showToast('Name is required, and password must be at least 6 characters.', 'warning')
      return
    }

    setGoogleLoading(true)
    const result = await googleFinalize(onboardingTicket, googleName.trim(), googlePassword)
    setGoogleLoading(true) // Keeps spinner showing while navigating

    if (result.success) {
      showToast('Account created successfully! Welcome to Expense Tracker.', 'success')
      setShowGoogleModal(false)

      // Save account to local history
      const updatedAccounts = [...savedAccounts.filter(a => a.email !== googleEmail.trim()), { email: googleEmail.trim(), name: googleName.trim() }]
      localStorage.setItem('google_saved_accounts', JSON.stringify(updatedAccounts))
      setSavedAccounts(updatedAccounts)

      navigate('/dashboard')
    } else {
      setGoogleLoading(false)
      showToast(result.message, 'error')
    }
  }

  // Handle Forgot Password OTP request
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault()
    if (!resetEmail.trim()) {
      showToast('Please enter your email address.', 'warning')
      return
    }

    setResetLoading(true)
    const result = await forgotPassword(resetEmail.trim())
    setResetLoading(false)

    if (result.success) {
      showToast(result.message, 'success')
      if (result.otp) {
        console.log("Simulated Reset Password OTP:", result.otp)
        showToast(`[Simulation] OTP for ${resetEmail} is: ${result.otp}`, 'info')
      }
      setResetStep(2)
    } else {
      showToast(result.message, 'error')
    }
  }

  // Handle OTP code verification
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault()
    if (!resetOtp.trim()) {
      showToast('Please enter the 6-digit OTP code.', 'warning')
      return
    }

    setResetLoading(true)
    const result = await verifyOtp(resetEmail.trim(), resetOtp.trim())
    setResetLoading(false)

    if (result.success) {
      showToast('OTP verified. Please set your new password.', 'success')
      setResetToken(result.reset_token)
      setResetStep(3)
    } else {
      showToast(result.message, 'error')
    }
  }

  // Handle New Password submit
  const handleResetPasswordFinalizeSubmit = async (e) => {
    e.preventDefault()
    if (resetPasswordVal.length < 6) {
      showToast('Password must be at least 6 characters long.', 'warning')
      return
    }

    setResetLoading(true)
    const result = await resetPassword(resetEmail.trim(), resetToken, resetPasswordVal)
    setResetLoading(false)

    if (result.success) {
      showToast(result.message, 'success')
      setShowResetModal(false)
      // Clear states
      setResetEmail('')
      setResetOtp('')
      setResetToken('')
      setResetPasswordVal('')
    } else {
      showToast(result.message, 'error')
    }
  }




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
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(1)
                      setResetEmail('')
                      setResetOtp('')
                      setResetToken('')
                      setResetPasswordVal('')
                      setShowResetModal(true)
                    }}
                    class="text-xs font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 focus:outline-none"
                  >
                    Forgot password?
                  </button>

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

          {/* Custom Google Sign-In Button */}
          <button
            type="button"
            onClick={() => {
              setGoogleStep(1)
              setGoogleEmail('')
              setGoogleName('')
              setGooglePassword('')
              setShowGoogleModal(true)
            }}
            class="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:hover:bg-dark-850 transition-all duration-200"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.354 0 3.373 2.736 1.49 6.727l3.776 3.038z"
              />
              <path
                fill="#34A853"
                d="M16.04 15.345c-1.073.727-2.427 1.164-4.04 1.164-2.927 0-5.418-1.982-6.3-4.654L1.873 14.9C3.782 18.9 7.8 21.6 12 21.6c3.136 0 6.01-1.09 8.164-3l-4.124-3.255z"
              />
              <path
                fill="#4285F4"
                d="M22.527 12.3c0-.627-.054-1.282-.163-1.882H12v3.709h5.918c-.245 1.282-.982 2.373-2.073 3.09l4.124 3.255C22.382 18.255 24 14.818 24 12c0-.3 0-.6-.055-.9H22.527z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 11.836c-.245-.727-.382-1.509-.382-2.327 0-.818.137-1.6.382-2.327L1.49 4.145C.536 6.073 0 8.218 0 10.473c0 2.255.536 4.4 1.49 6.327l3.776-2.964z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>

      {/* Google Login Account Chooser & Onboarding Modal */}
      <Modal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        title={googleStep === 1 ? "Sign in - Google Accounts" : "Complete Google Profile"}
      >
        <div class="flex flex-col items-center mb-6">
          <svg className="h-10 w-10 mb-2" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.354 0 3.373 2.736 1.49 6.727l3.776 3.038z" />
            <path fill="#34A853" d="M16.04 15.345c-1.073.727-2.427 1.164-4.04 1.164-2.927 0-5.418-1.982-6.3-4.654L1.873 14.9C3.782 18.9 7.8 21.6 12 21.6c3.136 0 6.01-1.09 8.164-3l-4.124-3.255z" />
            <path fill="#4285F4" d="M22.527 12.3c0-.627-.054-1.282-.163-1.882H12v3.709h5.918c-.245 1.282-.982 2.373-2.073 3.09l4.124 3.255C22.382 18.255 24 14.818 24 12c0-.3 0-.6-.055-.9H22.527z" />
            <path fill="#FBBC05" d="M5.266 11.836c-.245-.727-.382-1.509-.382-2.327 0-.818.137-1.6.382-2.327L1.49 4.145C.536 6.073 0 8.218 0 10.473c0 2.255.536 4.4 1.49 6.327l3.776-2.964z" />
          </svg>
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Google Authentication</span>
        </div>

        {googleStep === 1 ? (
          <form onSubmit={handleGoogleLoginSubmit} class="space-y-4">
            <p class="text-sm text-slate-600 dark:text-slate-400 text-center">
              Choose your Google account to log in directly to Expense Tracker.
            </p>
            
            {/* Quick account presets to simulate Google account chooser */}
            {savedAccounts.length > 0 && (
              <>
                <div class="space-y-2">
                  {savedAccounts.map((acc, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setGoogleEmail(acc.email)
                        // Trigger login submit automatically for this clicked account
                        setGoogleLoading(true)
                        googleLogin(acc.email).then(result => {
                          setGoogleLoading(false)
                          if (result.success) {
                            if (result.status === 'SUCCESS') {
                              showToast('Successfully logged in with Google!', 'success')
                              setShowGoogleModal(false)
                              navigate('/dashboard')
                            } else {
                              setOnboardingTicket(result.onboarding_ticket)
                              setGoogleName(acc.email.split('@')[0])
                              setGoogleStep(2)
                            }
                          } else {
                            showToast(result.message, 'error')
                          }
                        })
                      }}
                      class="flex w-full items-center gap-3 rounded-xl border border-slate-200 dark:border-dark-800 bg-slate-50 dark:bg-dark-900 p-3 hover:bg-slate-100 dark:hover:bg-dark-800 transition text-left"
                    >
                      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                        {acc.name ? acc.name.charAt(0).toUpperCase() : acc.email.charAt(0).toUpperCase()}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{acc.name || 'Google Account'}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{acc.email}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div class="relative flex py-2 items-center">
                  <div class="flex-grow border-t border-slate-200 dark:border-dark-800"></div>
                  <span class="flex-shrink mx-4 text-slate-400 text-xs">Or use another account</span>
                  <div class="flex-grow border-t border-slate-200 dark:border-dark-800"></div>
                </div>
              </>
            )}


            <div>
              <label htmlFor="googleEmail" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <div class="relative mt-1.5 rounded-xl shadow-sm">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="googleEmail"
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={googleLoading}
              class="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg hover:from-primary-700 hover:to-indigo-700 focus:outline-none disabled:opacity-50 transition-all duration-200"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Next'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleGoogleFinalizeSubmit} class="space-y-4">
            <div class="rounded-xl bg-slate-50 dark:bg-dark-900 p-3 text-center border border-slate-100 dark:border-dark-800">
              <span class="text-xs text-slate-500 dark:text-slate-400 block">Google account verified</span>
              <strong class="text-sm text-slate-700 dark:text-slate-200">{googleEmail}</strong>
            </div>
            <p class="text-sm text-slate-600 dark:text-slate-400 text-center">
              Welcome! Please set a display name and password to complete your account setup. You can use these credentials to log in later.
            </p>
            
            <div>
              <label htmlFor="googleName" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Display Name
              </label>
              <div class="relative mt-1.5 rounded-xl shadow-sm">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="googleName"
                  type="text"
                  required
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Your display name"
                  class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="googlePassword" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Create Password
              </label>
              <div class="relative mt-1.5 rounded-xl shadow-sm">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="googlePassword"
                  type="password"
                  required
                  minLength={6}
                  value={googlePassword}
                  onChange={(e) => setGooglePassword(e.target.value)}
                  placeholder="•••••••• (min 6 characters)"
                  class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={googleLoading}
              class="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg hover:from-primary-700 hover:to-indigo-700 focus:outline-none disabled:opacity-50 transition-all duration-200"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Finalize & Sign In'
              )}
            </button>
          </form>
        )}
      </Modal>

      {/* Forgot Password Reset Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Forgot Password Request"
      >
        {resetStep === 1 && (
          <form onSubmit={handleForgotPasswordSubmit} class="space-y-4">
            <p class="text-sm text-slate-600 dark:text-slate-400">
              Enter your registered email address. We will verify your account and send a 6-digit OTP code to reset your password.
            </p>
            <div>
              <label htmlFor="resetEmail" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div class="relative mt-1.5 rounded-xl shadow-sm">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="resetEmail"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={resetLoading}
              class="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg hover:from-primary-700 hover:to-indigo-700 focus:outline-none disabled:opacity-50 transition-all duration-200"
            >
              {resetLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying Email...
                </>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </form>
        )}

        {resetStep === 2 && (
          <form onSubmit={handleVerifyOtpSubmit} class="space-y-4">
            <div class="rounded-xl bg-slate-50 dark:bg-dark-900 p-3 text-center border border-slate-100 dark:border-dark-800">
              <span class="text-xs text-slate-500 dark:text-slate-400 block">Verification code sent to</span>
              <strong class="text-sm text-slate-700 dark:text-slate-200">{resetEmail}</strong>
            </div>
            <p class="text-sm text-slate-600 dark:text-slate-400 text-center">
              Please enter the 6-digit OTP code sent to your email to verify your identity.
            </p>
            <div>
              <label htmlFor="resetOtp" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Enter 6-digit OTP
              </label>
              <div class="relative mt-1.5 rounded-xl shadow-sm">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Key className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="resetOtp"
                  type="text"
                  required
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  placeholder="123456"
                  class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
                />
              </div>
            </div>
            <div class="flex gap-3">
              <button
                type="button"
                onClick={() => setResetStep(1)}
                class="flex w-1/3 items-center justify-center rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:hover:bg-dark-850 transition-all duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                class="flex w-2/3 items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg hover:from-primary-700 hover:to-indigo-700 focus:outline-none disabled:opacity-50 transition-all duration-200"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
            </div>
          </form>
        )}

        {resetStep === 3 && (
          <form onSubmit={handleResetPasswordFinalizeSubmit} class="space-y-4">
            <div class="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-3 text-center border border-emerald-100 dark:border-emerald-900/40">
              <span class="text-xs text-emerald-600 dark:text-emerald-400 block font-semibold">Identity Verified</span>
              <strong class="text-sm text-slate-700 dark:text-slate-200">{resetEmail}</strong>
            </div>
            <p class="text-sm text-slate-600 dark:text-slate-400 text-center">
              Please choose a new secure password for your account.
            </p>
            <div>
              <label htmlFor="resetPasswordVal" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <div class="relative mt-1.5 rounded-xl shadow-sm">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="resetPasswordVal"
                  type="password"
                  required
                  minLength={6}
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="•••••••• (min 6 characters)"
                  class="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-50 dark:placeholder-slate-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={resetLoading}
              class="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg hover:from-primary-700 hover:to-indigo-700 focus:outline-none disabled:opacity-50 transition-all duration-200"
            >
              {resetLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}
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
