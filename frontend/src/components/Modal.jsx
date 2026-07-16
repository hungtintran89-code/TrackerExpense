import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children }) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      />
      
      {/* Modal Card */}
      <div 
        class="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 animate-scale-in dark:bg-dark-800 border border-slate-100 dark:border-dark-700"
      >
        {/* Header */}
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-dark-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div class="mt-4 max-h-[70vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  )
}
