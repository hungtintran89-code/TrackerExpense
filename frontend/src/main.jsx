import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import './index.css'

// Private route wrapper to redirect unauthorized users to login
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div class="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-dark-950">
        <div class="flex flex-col items-center space-y-4">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Loading Expense Tracker...</p>
        </div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

// Layout wrapper for authenticated pages (contains Sidebar + Header)
const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div class="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-dark-950">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div class="flex flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main class="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div class="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/expenses" 
            element={
              <PrivateRoute>
                <MainLayout>
                  <Expenses />
                </MainLayout>
              </PrivateRoute>
            } 
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
