import React from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', isDangerous = true }) {
  if (!isOpen) return null

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      />
      
      {/* Dialog container */}
      <div 
        class="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 animate-scale-in dark:bg-dark-800 border border-slate-100 dark:border-dark-700"
      >
        <div class="flex items-start gap-4">
          <div class={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
            isDangerous 
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' 
              : 'bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400'
          }`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          
          <div class="flex-1">
            <h3 class="text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <div class="mt-2">
              <p class="text-sm text-slate-500 dark:text-slate-400">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            class="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none dark:border-dark-700 dark:bg-dark-800 dark:text-slate-300 dark:hover:bg-dark-700"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            class={`inline-flex justify-center rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:outline-none ${
              isDangerous 
                ? 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700' 
                : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
