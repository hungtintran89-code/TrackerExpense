import React, { createContext, useContext, useState, useCallback } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      
      {/* Toast container */}
      <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full px-4 md:px-0 md:w-96">
        {toasts.map((toast) => {
          let bgClass = 'bg-white text-slate-800 border-slate-100 dark:bg-dark-800 dark:text-slate-100 dark:border-dark-700'
          let icon = <Info className="h-5 w-5 text-blue-500" />
          
          if (toast.type === 'success') {
            bgClass = 'bg-emerald-50 text-emerald-900 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50'
            icon = <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          } else if (toast.type === 'error') {
            bgClass = 'bg-rose-50 text-rose-900 border-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50'
            icon = <AlertCircle className="h-5 w-5 text-rose-500" />
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-50 text-amber-900 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50'
            icon = <AlertCircle className="h-5 w-5 text-amber-500" />
          }

          return (
            <div
              key={toast.id}
              class={`flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 animate-slide-up ${bgClass}`}
            >
              <div class="flex-shrink-0 mt-0.5">{icon}</div>
              <div class="flex-1 text-sm font-medium leading-5">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                class="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
