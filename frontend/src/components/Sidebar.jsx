import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Receipt, LogOut, Wallet, X } from 'lucide-react'

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      title: 'Expenses',
      path: '/expenses',
      icon: <Receipt className="h-5 w-5" />
    }
  ]

  const sidebarContent = (
    <div class="flex h-full flex-col justify-between border-r border-slate-200 bg-white p-4 dark:border-dark-800 dark:bg-dark-900 transition-all-custom">
      <div>
        {/* Logo Section */}
        <div class="flex items-center gap-3 px-2 py-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white shadow-md shadow-primary-500/20">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 class="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
            </h1>
            <p class="text-xxs text-slate-400 dark:text-slate-500 -mt-1 font-semibold">EXPENSE TRACKER</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav class="mt-8 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen && setIsOpen(false)} // Close drawer on mobile click
                class={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-dark-800/50 dark:hover:text-slate-100'
                }`}
              >
                {item.icon}
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User profile / Logout bottom panel */}
      {user && (
        <div class="border-t border-slate-100 pt-4 dark:border-dark-800/80">
          <div class="flex items-center gap-3 px-2 py-2">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 font-bold text-sm uppercase">
              {user.name ? user.name.substring(0, 2) : 'US'}
            </div>
            <div class="flex-1 min-w-0">
              <p class="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {user.name}
              </p>
              <p class="truncate text-xs text-slate-400 dark:text-slate-500">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            class="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar (always visible on MD screens) */}
      <aside class="hidden md:block w-64 h-full shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (controlled by Header toggle state via global event or context, wait, we'll configure a state in Layout) */}
      {isOpen && (
        <div class="fixed inset-0 z-40 md:hidden flex">
          {/* Mobile backdrop */}
          <div 
            onClick={() => setIsOpen(false)}
            class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          />
          
          {/* Drawer card */}
          <div class="relative z-50 w-72 h-full flex flex-col animate-slide-up bg-white dark:bg-dark-900">
            {/* Close button inside drawer */}
            <button 
              onClick={() => setIsOpen(false)}
              class="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-800"
            >
              <X className="h-5 w-5" />
            </button>
            <div class="h-full pt-4">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
