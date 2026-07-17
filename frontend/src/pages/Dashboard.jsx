import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { parseAsciiExpenses } from '../utils/asciiParser'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { Wallet, DollarSign, ListCollapse, TrendingUp, Plus, ArrowRight, PieChart, Info, HelpCircle, Users, Mail, UserPlus, Check, X, Bell } from 'lucide-react'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

const COLORS = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Shopping: '#f43f5e',
  Bills: '#a855f7',
  Entertainment: '#10b981',
  Other: '#64748b'
}

// Premium color coding for standard category tags
const TAG_COLORS = {
  Food: { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-400', bar: 'bg-amber-500' },
  Transport: { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-400', bar: 'bg-blue-500' },
  Shopping: { bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-700 dark:text-rose-400', bar: 'bg-rose-500' },
  Bills: { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-400', bar: 'bg-purple-500' },
  Entertainment: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500' },
  Other: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400', bar: 'bg-slate-500' },
}

const getTagStyle = (tag) => {
  const normTag = tag ? tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase() : 'Other'
  return TAG_COLORS[normTag] || TAG_COLORS.Other
}

export default function Dashboard() {
  const {
    user,
    wallets,
    selectedWalletId,
    setSelectedWalletId,
    pendingInvitations,
    fetchWallets,
    fetchInvitations
  } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [budgets, setBudgets] = useState([])
  const [budgetLimit, setBudgetLimit] = useState('')
  const [budgetTag, setBudgetTag] = useState('Food')
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [savingBudget, setSavingBudget] = useState(false)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  // Shared Wallet form states
  const [showWalletForm, setShowWalletForm] = useState(false)
  const [newWalletName, setNewWalletName] = useState('')
  const [creatingWallet, setCreatingWallet] = useState(false)
  const [inviteEmail, setInviteEmail] = useState({})
  const [invitingMember, setInvitingMember] = useState({})

  const fetchBudgets = async () => {
    try {
      const response = await api.get('/budget')
      setBudgets(response.data)
    } catch (error) {
      console.error('Error fetching budgets:', error)
    }
  }

  const fetchAndParseExpenses = async () => {
    try {
      setLoading(true)
      const url = selectedWalletId ? `/post?walletId=${selectedWalletId}` : '/post'
      const response = await api.get(url)
      const parsed = parseAsciiExpenses(response.data)
      setExpenses(parsed)
      
      const budgetRes = await api.get('/budget')
      setBudgets(budgetRes.data)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      showToast('Could not sync expense records with backend.', 'error')
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAndParseExpenses()
  }, [selectedWalletId])

  const handleCreateWallet = async (e) => {
    e.preventDefault()
    if (!newWalletName.trim()) {
      showToast('Please enter a wallet name.', 'warning')
      return
    }

    try {
      setCreatingWallet(true)
      const response = await api.post('/wallet', { name: newWalletName.trim() })
      if (response.status === 200) {
        showToast('Shared wallet created successfully!', 'success')
        setNewWalletName('')
        setShowWalletForm(false)
        fetchWallets()
      } else {
        showToast(response.data || 'Failed to create wallet.', 'error')
      }
    } catch (error) {
      console.error('Create wallet error:', error)
      showToast('Could not create shared wallet.', 'error')
    } finally {
      setCreatingWallet(false)
    }
  }

  const handleInviteMember = async (walletId) => {
    const email = inviteEmail[walletId]
    if (!email || !email.trim()) {
      showToast('Please enter an email address to invite.', 'warning')
      return
    }

    try {
      setInvitingMember(prev => ({ ...prev, [walletId]: true }))
      const response = await api.post(`/wallet/${walletId}/invite`, { email: email.trim() })
      if (response.status === 200) {
        showToast('Invitation sent successfully!', 'success')
        setInviteEmail(prev => ({ ...prev, [walletId]: '' }))
      } else {
        showToast(response.data || 'Failed to send invitation.', 'error')
      }
    } catch (error) {
      console.error('Invite member error:', error)
      showToast(error.response?.data || 'Could not send invitation.', 'error')
    } finally {
      setInvitingMember(prev => ({ ...prev, [walletId]: false }))
    }
  }

  const handleRespondInvitation = async (walletId, accept) => {
    try {
      const response = await api.post(`/wallet/${walletId}/respond`, { accept })
      if (response.status === 200) {
        showToast(accept ? 'Invitation accepted!' : 'Invitation declined.', 'success')
        fetchInvitations()
        fetchWallets()
      } else {
        showToast('Failed to respond to invitation.', 'error')
      }
    } catch (error) {
      console.error('Respond invitation error:', error)
      showToast('Error responding to invitation.', 'error')
    }
  }

  const handleDisbandWallet = async (walletId) => {
    if (!window.confirm("Are you sure you want to disband this wallet? All transactions will be kept but unlinked from this wallet.")) {
      return
    }

    try {
      const response = await api.delete(`/wallet/${walletId}`)
      if (response.status === 200) {
        showToast('Wallet disbanded successfully!', 'success')
        if (selectedWalletId === walletId) {
          setSelectedWalletId(null)
        }
        fetchWallets()
      } else {
        showToast('Failed to disband wallet.', 'error')
      }
    } catch (error) {
      console.error('Disband wallet error:', error)
      showToast('Error disbanding wallet.', 'error')
    }
  }

  const handleLeaveWallet = async (walletId) => {
    if (!window.confirm("Are you sure you want to leave this shared wallet?")) {
      return
    }

    try {
      const response = await api.post(`/wallet/${walletId}/leave`)
      if (response.status === 200) {
        showToast('You left the shared wallet successfully.', 'success')
        if (selectedWalletId === walletId) {
          setSelectedWalletId(null)
        }
        fetchWallets()
      } else {
        showToast('Failed to leave wallet.', 'error')
      }
    } catch (error) {
      console.error('Leave wallet error:', error)
      showToast('Error leaving wallet.', 'error')
    }
  }

  const handleSaveBudget = async (e) => {
    e.preventDefault()
    if (!budgetLimit || isNaN(budgetLimit) || parseInt(budgetLimit, 10) <= 0) {
      showToast('Please enter a valid positive budget limit.', 'error')
      return
    }

    try {
      setSavingBudget(true)
      await api.post('/budget', {
        tag: budgetTag,
        limitAmount: parseInt(budgetLimit, 10)
      })
      showToast(`Monthly budget for ${budgetTag} updated!`, 'success')
      setBudgetLimit('')
      setShowBudgetForm(false)
      await fetchBudgets()
    } catch (error) {
      console.error('Failed to save budget:', error)
      showToast('Could not set budget limit.', 'error')
    } finally {
      setSavingBudget(false)
    }
  }

  // Client-side computations
  const totalIncome = expenses.filter(e => e.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0)
  const totalExpense = expenses.filter(e => e.type !== 'INCOME').reduce((acc, curr) => acc + curr.amount, 0)
  const netBalance = totalIncome - totalExpense

  const expenseRecords = expenses.filter(e => e.type !== 'INCOME')
  const averageExpense = expenseRecords.length > 0 ? Math.round(totalExpense / expenseRecords.length) : 0
  const maxExpense = expenseRecords.length > 0 ? Math.max(...expenseRecords.map(e => e.amount)) : 0

  // Grouping by Tag (Only for Expense records)
  const categoryGroups = expenseRecords.reduce((acc, curr) => {
    const tag = curr.tag || 'Other'
    const normTag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()
    acc[normTag] = (acc[normTag] || 0) + curr.amount
    return acc
  }, {})

  const categoryBreakdown = Object.entries(categoryGroups)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount)

  // Last 5 transactions
  const recentTransactions = [...expenses].reverse().slice(0, 5)

  if (loading) {
    return (
      <div class="space-y-6 animate-fade-in">
        {/* Header Skeleton */}
        <div class="h-10 w-48 rounded-lg shimmer"></div>
        
        {/* Cards Skeleton */}
        <div class="grid gap-6 md:grid-cols-3">
          <div class="h-32 rounded-2xl shimmer"></div>
          <div class="h-32 rounded-2xl shimmer"></div>
          <div class="h-32 rounded-2xl shimmer"></div>
        </div>

        {/* Content Skeleton */}
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="h-96 rounded-2xl shimmer lg:col-span-2"></div>
          <div class="h-96 rounded-2xl shimmer"></div>
        </div>
      </div>
    )
  }

  return (
    <div class="space-y-8 animate-slide-up">
      {/* Overview Top header cards */}
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Welcome Back!
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Here's a real-time summary of your current spending activity.
          </p>
        </div>
        <div class="flex items-center gap-3">
          {/* Wallet Selector Dropdown */}
          <select
            value={selectedWalletId || ''}
            onChange={(e) => {
              const val = e.target.value
              setSelectedWalletId(val ? parseInt(val, 10) : null)
            }}
            class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none dark:border-dark-750 dark:bg-dark-900 dark:text-slate-150 shadow-sm transition-all"
          >
            <option value="">Personal Wallet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} (Shared)
              </option>
            ))}
          </select>

          <Link
            to={selectedWalletId ? `/expenses?walletId=${selectedWalletId}` : '/expenses'}
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Link>
        </div>
      </div>

      {/* KPI Statistic cards */}
      <div class="grid gap-6 md:grid-cols-3">
        {/* Net Balance */}
        <div class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-dark-800 dark:bg-dark-900">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">Net Balance</span>
            <div class={`rounded-lg p-2 ${netBalance >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/25 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/25 dark:text-rose-400'}`}>
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div class="mt-4">
            <h3 class={`text-3xl font-extrabold ${netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {netBalance >= 0 ? '' : '-'}${Math.abs(netBalance).toLocaleString()}
            </h3>
            <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Total remaining balance
            </p>
          </div>
        </div>

        {/* Total Income */}
        <div class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-dark-800 dark:bg-dark-900">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Income</span>
            <div class="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/25 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div class="mt-4">
            <h3 class="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
              ${totalIncome.toLocaleString()}
            </h3>
            <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Inflow transactions
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-dark-800 dark:bg-dark-900">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Expenses</span>
            <div class="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/25 dark:text-rose-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div class="mt-4">
            <h3 class="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
              ${totalExpense.toLocaleString()}
            </h3>
            <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Outflow transactions
            </p>
          </div>
        </div>
      </div>

      {expenses.length === 0 ? (
        /* Empty State */
        <div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-dark-800 dark:bg-dark-900">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-dark-800 text-slate-400">
            <Wallet className="h-8 w-8" />
          </div>
          <h3 class="mt-4 text-lg font-bold text-slate-900 dark:text-slate-50">No expenses recorded</h3>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            You don't have any financial transactions in this database. Click the button below to add your first expense record.
          </p>
          <Link
            to="/expenses"
            class="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create First Record
          </Link>
        </div>
      ) : (
        /* Charts & Dashboard breakdown details */
        <div class="grid gap-6 lg:grid-cols-3">
          {/* Recent transactions table */}
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-dark-800 dark:bg-dark-900 lg:col-span-2">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-800">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Transactions
              </h3>
              <Link
                to="/expenses"
                class="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                View All
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div class="mt-4 overflow-hidden">
              <div class="divide-y divide-slate-100 dark:divide-dark-800/80">
                {recentTransactions.map((expense) => {
                  const style = getTagStyle(expense.tag)
                  return (
                    <div key={expense.stt} class="flex items-center justify-between py-3.5 hover:bg-slate-50/50 dark:hover:bg-dark-800/25 px-2 rounded-xl transition-colors">
                      <div class="flex items-center gap-3">
                        <span class={`rounded-xl px-2.5 py-1 text-xs font-bold ${style.bg} ${style.text}`}>
                          {expense.tag}
                        </span>
                        <div>
                          <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {expense.title}
                          </p>
                          <p class="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 max-w-xs md:max-w-md">
                            {expense.description}
                          </p>
                        </div>
                      </div>
                      <div class="text-right">
                        <span class={`text-sm font-bold ${expense.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-50'}`}>
                          {expense.type === 'INCOME' ? '+' : '-'}${expense.amount.toLocaleString()}
                        </span>
                        <p class="text-xxs text-slate-400 dark:text-slate-500">
                          Row #{expense.stt}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar Column */}
          <div class="space-y-6 lg:col-span-1">
            {/* Category breakdown visual charts */}
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-dark-800 dark:bg-dark-900">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 pb-4 border-b border-slate-100 dark:border-dark-800">
              Spending Breakdown
            </h3>

            {/* Interactive Recharts Doughnut Chart */}
            {categoryBreakdown.length > 0 && (
              <div class="h-56 mt-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="amount"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.Other} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
                      contentStyle={{ 
                        borderRadius: '12px', 
                        background: '#0f172a', 
                        color: '#f8fafc', 
                        border: 'none',
                        fontSize: '12px',
                        padding: '8px 12px'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                {/* Center Balance Label */}
                <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                  <span class="text-xxs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Total</span>
                  <span class="text-lg font-black text-slate-800 dark:text-slate-100">${totalExpense.toLocaleString()}</span>
                </div>
              </div>
            )}
            
            {/* Horizontal Percentage Bars (Highly responsive, clean UI design) */}
            <div class="mt-6 space-y-5">
              {categoryBreakdown.map((category) => {
                const style = getTagStyle(category.name)
                return (
                  <div key={category.name} class="space-y-1.5">
                    <div class="flex items-center justify-between text-sm">
                      <span class="font-semibold text-slate-700 dark:text-slate-300">
                        {category.name}
                      </span>
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-slate-900 dark:text-slate-50">
                          ${category.amount.toLocaleString()}
                        </span>
                        <span class="text-xs text-slate-400 dark:text-slate-500">
                          ({category.percentage}%)
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div class="h-2 w-full bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                      <div 
                        class={`h-full rounded-full transition-all duration-1000 ${style.bar}`}
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Hint Notice */}
            <div class="mt-6 flex items-start gap-2.5 rounded-xl bg-slate-50 p-3.5 dark:bg-dark-800/40">
              <Info className="h-4.5 w-4.5 text-slate-400 mt-0.5" />
              <p class="text-xs leading-4 text-slate-500 dark:text-slate-400">
                Categorization is derived directly from the custom <code>Tag</code> field parsed from the server table logs.
              </p>
            </div>
          </div>

          {/* Category Budgets Tracker Card */}
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-dark-800 dark:bg-dark-900">
              <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-800">
                <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
                  Monthly Budgets
                </h3>
                <button
                  onClick={() => setShowBudgetForm(!showBudgetForm)}
                  class="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {showBudgetForm ? 'Cancel' : 'Set Limit'}
                </button>
              </div>

              {/* Set Budget Form */}
              {showBudgetForm && (
                <form onSubmit={handleSaveBudget} class="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-dark-800/40 border border-slate-100 dark:border-dark-800 space-y-3 animate-slide-up">
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                      <select
                        value={budgetTag}
                        onChange={(e) => setBudgetTag(e.target.value)}
                        class="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-400 outline-none dark:border-dark-750 dark:bg-dark-900 dark:text-slate-150"
                      >
                        <option value="Food">Food</option>
                        <option value="Transport">Transport</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Bills">Bills</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Limit ($)</label>
                      <input
                        type="number"
                        placeholder="e.g. 200"
                        value={budgetLimit}
                        onChange={(e) => setBudgetLimit(e.target.value)}
                        class="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-400 outline-none dark:border-dark-750 dark:bg-dark-900 dark:text-slate-150"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={savingBudget}
                    class="w-full flex items-center justify-center rounded-lg bg-primary-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {savingBudget ? 'Saving...' : 'Save Limit'}
                  </button>
                </form>
              )}

              {/* Budgets List */}
              <div class="mt-6 space-y-5">
                {budgets.length === 0 ? (
                  <p class="text-xs text-center py-4 text-slate-400 dark:text-slate-500">
                    No budget limits configured for this month.
                  </p>
                ) : (
                  budgets.map((b) => {
                    let barColor = 'bg-emerald-500'
                    if (b.isExceeded) {
                      barColor = 'bg-rose-500'
                    } else if (b.percentageUsed >= 80.0) {
                      barColor = 'bg-amber-500'
                    }

                    return (
                      <div key={b.tag} class="space-y-1.5">
                        <div class="flex items-center justify-between text-sm">
                          <div class="flex items-center gap-1.5">
                            <span class="font-semibold text-slate-700 dark:text-slate-300">
                              {b.tag}
                            </span>
                            {b.isExceeded && (
                              <span class="inline-flex items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-xxs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/10 dark:bg-rose-950/20 dark:text-rose-450 dark:ring-rose-500/20">
                                Over Limit
                              </span>
                            )}
                          </div>
                          <div class="flex items-center gap-1">
                            <span class="font-bold text-slate-800 dark:text-slate-100">
                              ${b.currentSpending}
                            </span>
                            <span class="text-xs text-slate-400 dark:text-slate-500">
                              / ${b.limitAmount} ({b.percentageUsed}%)
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar Container */}
                        <div class="h-2 w-full bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                          <div 
                            class={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                            style={{ width: `${Math.min(b.percentageUsed, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Pending Invitations Alert Card */}
            {pendingInvitations.length > 0 && (
              <div class="rounded-2xl border border-primary-200 bg-primary-50/30 p-6 shadow-sm dark:border-primary-950/20 dark:bg-primary-950/5">
                <div class="flex items-center gap-2 pb-3 border-b border-primary-100 dark:border-primary-950/20">
                  <Bell class="h-4.5 w-4.5 text-primary-600 dark:text-primary-400 animate-bounce" />
                  <h3 class="text-sm font-bold text-primary-900 dark:text-primary-100">
                    Wallet Invitations ({pendingInvitations.length})
                  </h3>
                </div>
                <div class="mt-4 space-y-4">
                  {pendingInvitations.map((inv) => (
                    <div key={inv.walletId} class="flex items-center justify-between text-xs bg-white dark:bg-dark-900 p-3 rounded-xl border border-slate-100 dark:border-dark-800 shadow-xs">
                      <div>
                        <p class="font-bold text-slate-800 dark:text-slate-200">{inv.walletName}</p>
                        <p class="text-xxs text-slate-400 mt-0.5">Invited you to join</p>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRespondInvitation(inv.walletId, true)}
                          class="rounded-lg p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-400 transition-colors"
                        >
                          <Check class="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRespondInvitation(inv.walletId, false)}
                          class="rounded-lg p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/25 dark:text-rose-450 transition-colors"
                        >
                          <X class="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shared Wallets Manager Card */}
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-dark-800 dark:bg-dark-900">
              <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-800">
                <div class="flex items-center gap-2">
                  <Users class="h-5 w-5 text-slate-400" />
                  <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
                    Shared Wallets
                  </h3>
                </div>
                <button
                  onClick={() => setShowWalletForm(!showWalletForm)}
                  class="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {showWalletForm ? 'Cancel' : 'Create'}
                </button>
              </div>

              {/* Create Wallet Form */}
              {showWalletForm && (
                <form onSubmit={handleCreateWallet} class="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-dark-800/40 border border-slate-100 dark:border-dark-800 space-y-3 animate-slide-up">
                  <div>
                    <label class="block text-xxs font-bold text-black dark:text-slate-400 uppercase tracking-wider mb-1">Wallet Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Family Budget"
                      value={newWalletName}
                      onChange={(e) => setNewWalletName(e.target.value)}
                      class="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-400 outline-none dark:border-dark-750 dark:bg-dark-900 dark:text-slate-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingWallet}
                    class="w-full flex items-center justify-center rounded-lg bg-primary-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {creatingWallet ? 'Creating...' : 'Create Wallet'}
                  </button>
                </form>
              )}

              {/* Wallets List */}
              <div class="mt-6 space-y-4">
                {wallets.length === 0 ? (
                  <p class="text-xs text-center py-4 text-slate-400 dark:text-slate-500">
                    You don't have any shared wallets yet.
                  </p>
                ) : (
                  wallets.map((w) => {
                    const isActive = selectedWalletId === w.id
                    const isOwner = w.ownerId === user?.id

                    return (
                      <div 
                        key={w.id} 
                        class={`rounded-xl border p-3.5 transition-all ${
                          isActive 
                            ? 'border-primary-500 bg-primary-50/10 dark:bg-primary-950/5' 
                            : 'border-slate-100 bg-slate-50/30 hover:border-slate-200 dark:border-dark-800 dark:bg-dark-850/20'
                        }`}
                      >
                        <div class="flex items-center justify-between">
                          <button
                            onClick={() => setSelectedWalletId(isActive ? null : w.id)}
                            class="text-left font-bold text-slate-850 dark:text-slate-150 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm"
                          >
                            {w.name}
                          </button>
                          <div class="flex items-center gap-2">
                            <span class={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xxs font-semibold ${
                              isOwner 
                                ? 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-600/10 dark:bg-primary-950/20 dark:text-primary-400' 
                                : 'bg-slate-50 text-slate-650 ring-1 ring-inset ring-slate-600/10 dark:bg-dark-800 dark:text-slate-400'
                            }`}>
                              {isOwner ? 'Owner' : 'Member'}
                            </span>
                            {isOwner ? (
                              <button
                                onClick={() => handleDisbandWallet(w.id)}
                                class="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 p-1"
                                title="Disband Wallet"
                              >
                                Disband
                              </button>
                            ) : (
                              <button
                                onClick={() => handleLeaveWallet(w.id)}
                                class="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 p-1"
                                title="Leave Wallet"
                              >
                                Leave
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Invite Members section for Owners */}
                        {isOwner && (
                          <div class="mt-3.5 pt-3.5 border-t border-dashed border-slate-150 dark:border-dark-800/80">
                            <div class="flex gap-2">
                              <input
                                type="email"
                                placeholder="Invite by email..."
                                value={inviteEmail[w.id] || ''}
                                onChange={(e) => setInviteEmail(prev => ({ ...prev, [w.id]: e.target.value }))}
                                class="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xxs text-slate-800 outline-none dark:border-dark-750 dark:bg-dark-900 dark:text-slate-150"
                              />
                              <button
                                onClick={() => handleInviteMember(w.id)}
                                disabled={invitingMember[w.id]}
                                class="inline-flex items-center justify-center rounded-lg bg-primary-600 px-2 py-1 text-xxs font-bold text-white shadow-xs hover:bg-primary-700 transition-colors disabled:opacity-50"
                              >
                                <UserPlus class="h-3 w-3 mr-1" />
                                {invitingMember[w.id] ? 'Inviting...' : 'Invite'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
