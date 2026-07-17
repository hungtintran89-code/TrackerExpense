import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

// Utility to decode JWT token client-side to extract user information
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const decoded = JSON.parse(jsonPayload)
    return {
      id: decoded.id,
      name: decoded.sub, // Subject contains user.getName()
      email: decoded.iss, // Issuer contains user.getEmail()
      exp: decoded.exp,
    }
  } catch (e) {
    console.error('Error decoding token:', e)
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  // Cache Shared Wallets & Invitations globally
  const [wallets, setWallets] = useState([])
  const [pendingInvitations, setPendingInvitations] = useState([])
  const [selectedWalletId, setSelectedWalletId] = useState(null)

  const fetchWallets = async () => {
    if (!localStorage.getItem('token')) return
    try {
      const response = await api.get('/wallet')
      setWallets(response.data || [])
    } catch (error) {
      console.error('Failed to fetch wallets:', error)
    }
  }

  const fetchInvitations = async () => {
    if (!localStorage.getItem('token')) return
    try {
      const response = await api.get('/wallet/invitations')
      setPendingInvitations(response.data || [])
    } catch (error) {
      console.error('Failed to fetch invitations:', error)
    }
  }

  // Load cache automatically when token is present
  useEffect(() => {
    if (token) {
      fetchWallets()
      fetchInvitations()
    } else {
      setWallets([])
      setPendingInvitations([])
      setSelectedWalletId(null)
    }
  }, [token])

  // Initialize Auth state & Dark Mode
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      const decoded = decodeToken(savedToken)
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setToken(savedToken)
        setUser({ id: decoded.id, name: decoded.name, email: decoded.email })
      } else {
        // Token expired
        localStorage.removeItem('token')
      }
    }
    setLoading(false)

    // Dark Mode Theme Init
    const isDark = 
      localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    const nextMode = !darkMode
    setDarkMode(nextMode)
    if (nextMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Login handler
  const login = async (email, password) => {
    try {
      // Backend expects a User object with email and password
      // UserRepository looks up using the email, so name parameter should be the email.
      const payload = {
        name: email, 
        email: email,
        password: password
      }
      
      const response = await api.post('/user/login', payload)
      
      // Backend returns HTTP 200 with raw response in body
      // On success, this response is the token (starts with eyJ).
      // On failure, it is an error string.
      const data = response.data
      
      if (typeof data === 'string' && data.startsWith('eyJ')) {
        const decoded = decodeToken(data)
        if (decoded) {
          localStorage.setItem('token', data)
          setToken(data)
          setUser({ id: decoded.id, name: decoded.name, email: decoded.email })
          return { success: true }
        }
      }
      
      // If it is not a valid token, it is an error message
      return { 
        success: false, 
        message: typeof data === 'string' ? data : 'Authentication failed. Please check credentials.' 
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: error.response?.data || 'Server is not responding. Please try again later.'
      }
    }
  }




  // Register Request handler (Step 1)
  const registerRequest = async (name, email, password) => {
    try {
      const payload = { name, email, password }
      const response = await api.post('/user/register-request', payload)
      return { success: true, message: response.data?.message || 'Verification code sent.', otp: response.data?.otp }
    } catch (error) {
      console.error('Register request error:', error)
      return {
        success: false,
        message: error.response?.data || 'Failed to request email verification.'
      }
    }
  }

  // Register Confirm handler (Step 2)
  const registerConfirm = async (email, otp) => {
    try {
      const payload = { email, otp }
      const response = await api.post('/user/register-confirm', payload)
      return { success: true, message: response.data }
    } catch (error) {
      console.error('Register confirm error:', error)
      return {
        success: false,
        message: error.response?.data || 'Email verification failed.'
      }
    }
  }

  // Google Direct Login handler (Simulated)
  const googleLogin = async (email) => {
    try {
      const response = await api.post('/user/google-login', { email })
      const data = response.data
      if (data.status === 'SUCCESS' && data.token) {
        const decoded = decodeToken(data.token)
        if (decoded) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
          setUser({ id: decoded.id, name: decoded.name, email: decoded.email, auth_provider: decoded.auth_provider })
          return { success: true, status: 'SUCCESS', name: decoded.name }

        }
      }
      return {
        success: true,
        status: data.status,
        onboarding_ticket: data.onboarding_ticket,
        email: data.email
      }
    } catch (error) {
      console.error('Google login error:', error)
      return {
        success: false,
        message: error.response?.data || 'Failed to authenticate with Google.'
      }
    }
  }

  // Google Onboarding Finalize handler
  const googleFinalize = async (ticket, fullName, password) => {
    try {
      const response = await api.post('/user/google-finalize', {
        onboarding_ticket: ticket,
        full_name: fullName,
        password
      })
      const data = response.data
      if (data.token) {
        const decoded = decodeToken(data.token)
        if (decoded) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
          setUser({ id: decoded.id, name: decoded.name, email: decoded.email, auth_provider: decoded.auth_provider })
          return { success: true }
        }
      }
      return { success: false, message: 'Finalize onboarding failed.' }
    } catch (error) {
      console.error('Google finalize error:', error)
      return {
        success: false,
        message: error.response?.data || 'Failed to complete Google onboarding.'
      }
    }
  }

  // Forgot Password request
  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/user/forgot-password', { email })
      return {
        success: true,
        message: response.data?.message || 'Verification code sent.',
        otp: response.data?.otp // simulation backup
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      return {
        success: false,
        message: error.response?.data || 'Email chưa được đăng ký.'
      }
    }
  }

  // Verify Reset OTP
  const verifyOtp = async (email, otp) => {
    try {
      const response = await api.post('/user/verify-otp', { email, otp })
      return {
        success: true,
        reset_token: response.data?.reset_token
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      return {
        success: false,
        message: error.response?.data || 'OTP sai hoặc hết hạn.'
      }
    }
  }

  // Reset Password Finalize
  const resetPassword = async (email, resetToken, newPassword) => {
    try {
      const response = await api.post('/user/reset-password', {
        email,
        reset_token: resetToken,
        new_password: newPassword
      })
      return {
        success: true,
        message: response.data?.message || 'Password reset successfully.'
      }
    } catch (error) {
      console.error('Reset password error:', error)
      return {
        success: false,
        message: error.response?.data || 'Failed to reset password.'
      }
    }
  }



  // Register handler
  const register = async (name, email, password) => {
    try {
      const payload = { name, email, password }
      const response = await api.post('/user/register', payload)
      
      // Backend returns HTTP 200 and raw string "Register successfull!" on success
      // If failure, it returns HTTP 400 and "Register fail!"
      const data = response.data
      
      if (response.status === 200 && data.includes('success')) {
        return { success: true, message: data }
      } else {
        return { success: false, message: data || 'Registration failed.' }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        message: error.response?.data || 'Registration failed. Email or Name might already be taken.'
      }
    }
  }

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  // Update token handler (for profile updates)
  const updateToken = (newToken) => {
    if (newToken) {
      const decoded = decodeToken(newToken)
      if (decoded) {
        localStorage.setItem('token', newToken)
        setToken(newToken)
        setUser({ name: decoded.name, email: decoded.email })
      }
    }
  }

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, googleLogin, googleFinalize, register, registerRequest, registerConfirm,
      forgotPassword, verifyOtp, resetPassword, logout, darkMode, toggleDarkMode, updateToken,
      wallets, setWallets, pendingInvitations, setPendingInvitations,
      selectedWalletId, setSelectedWalletId, fetchWallets, fetchInvitations
    }}>

      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
