import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { parseAsciiExpenses } from '../utils/asciiParser'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { Search, Filter, ArrowUpDown, Plus, Edit2, Trash2, ArrowLeft, ArrowRight, Loader2, DollarSign, Tag, Info } from 'lucide-react'

const STANDARD_TAGS = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other']

const TAG_BADGES = {
  Food: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  Transport: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  Shopping: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
  Bills: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
  Entertainment: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  Other: 'bg-slate-50 text-slate-700 border-slate-250 dark:bg-dark-850 dark:text-slate-400 dark:border-dark-750',
}

const getTagBadge = (tag) => {
  const norm = tag ? tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase() : 'Other'
  return TAG_BADGES[norm] || TAG_BADGES.Other
}

export default function Expenses() {
  const { showToast } = useToast()
  
  // Wallet states
  const [searchParams] = useSearchParams()
  const initialWalletId = searchParams.get('walletId') ? parseInt(searchParams.get('walletId'), 10) : null
  const [selectedWalletId, setSelectedWalletId] = useState(initialWalletId)
  const [wallets, setWallets] = useState([])

  // Data states
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)

  // Filters, search, sorting & pagination states
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sortField, setSortField] = useState('stt') // 'stt' | 'amount' | 'title'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Modal forms states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null) // null for create, object for edit
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tag, setTag] = useState('Food')
  const [type, setType] = useState('EXPENSE')

  // Confirm delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState(null)

  // Input ref for auto-focusing
  const firstInputRef = useRef(null)

  // Load expenses on mount
  // Load expenses on mount
  const loadExpenses = async () => {
    try {
      setLoading(true)
      const url = selectedWalletId ? `/post?walletId=${selectedWalletId}` : '/post'
      const response = await api.get(url)
      const parsed = parseAsciiExpenses(response.data)
      setExpenses(parsed)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      showToast('Could not fetch expenses from the backend server.', 'error')
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  // Load wallets once on mount
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const response = await api.get('/wallet')
        setWallets(response.data)
      } catch (error) {
        console.error('Error loading wallets:', error)
      }
    }
    fetchWallets()
  }, [])

  // Reload expenses whenever selected wallet changes
  useEffect(() => {
    loadExpenses()
  }, [selectedWalletId])

  // Auto-focus the first field when the modal opens
  useEffect(() => {
    if (isModalOpen && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current.focus()
      }, 100)
    }
  }, [isModalOpen])

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingExpense(null)
    setAmount('')
    setTitle('')
    setDescription('')
    setTag('Food')
    setType('EXPENSE')
    setIsModalOpen(true)
  }

  // Open modal for Edit
  const handleOpenEdit = (expense) => {
    setEditingExpense(expense)
    setAmount(expense.amount.toString())
    setTitle(expense.title)
    setDescription(expense.description)
    setTag(STANDARD_TAGS.includes(expense.tag) ? expense.tag : 'Other')
    setType(expense.type === 'INCOME' ? 'INCOME' : 'EXPENSE')
    setIsModalOpen(true)
  }

  // Handle Form Submission (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    const parsedAmount = parseInt(amount, 10)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid amount greater than 0.', 'warning')
      return
    }
    if (!title.trim()) {
      showToast('Please enter a title for the expense.', 'warning')
      return
    }

    const payload = {
      amount: parsedAmount,
      title: title.trim(),
      description: description.trim(),
      tag,
      type,
      walletId: selectedWalletId
    }

    try {
      setMutating(true)
      if (editingExpense) {
        // Update: PUT /post/{stt}
        // Remember standard backend returns HTTP 200 for success, 201 for failure
        const response = await api.put(`/post/${editingExpense.stt}`, payload)
        if (response.status === 200) {
          showToast('Expense updated successfully.', 'success')
          setIsModalOpen(false)
          loadExpenses()
        } else {
          showToast(response.data || 'Failed to update expense.', 'error')
        }
      } else {
        // Create: POST /post
        const response = await api.post('/post', payload)
        if (response.status === 200) {
          showToast('Expense created successfully.', 'success')
          setIsModalOpen(false)
          loadExpenses()
        } else {
          showToast(response.data || 'Failed to create expense.', 'error')
        }
      }
    } catch (error) {
      console.error('Mutate error:', error)
      showToast(error.response?.data || 'Server communication error occurred.', 'error')
    } finally {
      setMutating(false)
    }
  }

  // Handle Delete Confirmation trigger
  const handleDeleteTrigger = (expense) => {
    setExpenseToDelete(expense)
    setDeleteConfirmOpen(true)
  }

  // Confirm delete call
  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return

    try {
      setMutating(true)
      // Delete: DELETE /post/{stt}
      const response = await api.delete(`/post/${expenseToDelete.stt}`)
      if (response.status === 200) {
        showToast('Expense deleted successfully.', 'success')
        loadExpenses()
      } else {
        showToast(response.data || 'Failed to delete expense.', 'error')
      }
    } catch (error) {
      console.error('Delete error:', error)
      showToast(error.response?.data || 'Server communication error occurred.', 'error')
    } finally {
      setMutating(false)
      setExpenseToDelete(null)
    }
  }

  // Sorting Handler
  const requestSort = (field) => {
    let order = 'asc'
    if (sortField === field && sortOrder === 'asc') {
      order = 'desc'
    }
    setSortField(field)
    setSortOrder(order)
  }

  // Process sorting, searching, and filtering client-side
  const filteredExpenses = expenses
    .filter((expense) => {
      const matchSearch =
        expense.title.toLowerCase().includes(search.toLowerCase()) ||
        expense.description.toLowerCase().includes(search.toLowerCase())
      
      const matchCategory =
        categoryFilter === 'All' ||
        expense.tag.toLowerCase() === categoryFilter.toLowerCase()

      return matchSearch && matchCategory
    })
    .sort((a, b) => {
      let multiplier = sortOrder === 'asc' ? 1 : -1
      if (sortField === 'amount') {
        return (a.amount - b.amount) * multiplier
      }
      if (sortField === 'title') {
        return a.title.localeCompare(b.title) * multiplier
      }
      // Default: sort by stt
      return (a.stt - b.stt) * multiplier
    })

  // Pagination bounds
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / itemsPerPage))
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset pagination if filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search, categoryFilter])

  return (
    <div class="space-y-6">
      {/* Top action block */}
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Expenses Log
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Manage your budget, review records, and perform operations directly with the database.
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

          <button
            onClick={handleOpenCreate}
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Search, Filters, and Sorting Controls */}
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-800 dark:bg-dark-900 transition-colors">
        <div class="relative flex-1">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            class="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-950 dark:text-slate-100"
          />
        </div>

        <div class="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div class="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              class="rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm font-semibold text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-905 dark:text-slate-350"
            >
              <option value="All">All Categories</option>
              {STANDARD_TAGS.map(tagOption => (
                <option key={tagOption} value={tagOption}>{tagOption}</option>
              ))}
            </select>
          </div>

          {/* Sort trigger */}
          <div class="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortField(field)
                setSortOrder(order)
              }}
              class="rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm font-semibold text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-905 dark:text-slate-350"
            >
              <option value="stt-desc">Newest First</option>
              <option value="stt-asc">Oldest First</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
              <option value="title-asc">Title: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        /* Loading Skeleton */
        <div class="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-dark-800 dark:bg-dark-900 overflow-hidden">
          <div class="p-6 divide-y divide-slate-100 dark:divide-dark-800">
            {[...Array(5)].map((_, i) => (
              <div key={i} class="flex items-center justify-between py-4">
                <div class="flex items-center gap-3">
                  <div class="h-6 w-16 rounded shimmer"></div>
                  <div class="space-y-2">
                    <div class="h-4 w-32 rounded shimmer"></div>
                    <div class="h-3 w-48 rounded shimmer"></div>
                  </div>
                </div>
                <div class="h-6 w-16 rounded shimmer"></div>
              </div>
            ))}
          </div>
        </div>
      ) : paginatedExpenses.length === 0 ? (
        /* Empty State */
        <div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-dark-800 dark:bg-dark-900">
          <h3 class="text-lg font-bold text-slate-900 dark:text-slate-50">No records found</h3>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Try adjusting your search criteria or category filter parameters to locate the expenses.
          </p>
        </div>
      ) : (
        /* Expenses Table Log */
        <div class="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-dark-800 dark:bg-dark-900 overflow-hidden transition-colors">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
              <thead class="bg-slate-50 text-xs font-bold uppercase text-slate-700 dark:bg-dark-850 dark:text-slate-400">
                <tr>
                  <th scope="col" class="px-6 py-4">STT</th>
                  <th scope="col" class="px-6 py-4">Type</th>
                  <th scope="col" class="px-6 py-4">Title</th>
                  <th scope="col" class="px-6 py-4">Description</th>
                  <th scope="col" class="px-6 py-4">Category</th>
                  <th scope="col" class="px-6 py-4">Created At</th>
                  <th scope="col" class="px-6 py-4">Updated At</th>
                  <th scope="col" class="px-6 py-4 text-right">Amount</th>
                  <th scope="col" class="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-dark-800">
                {paginatedExpenses.map((expense) => (
                  <tr key={expense.stt} class="hover:bg-slate-50/50 dark:hover:bg-dark-800/30 transition-colors">
                    <td class="px-6 py-4 font-semibold text-slate-400 dark:text-slate-500">#{expense.stt}</td>
                    <td class="px-6 py-4">
                      <span class={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                        expense.type === 'INCOME'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                          : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-dark-850 dark:text-slate-450 dark:border-dark-750'
                      }`}>
                        {expense.type || 'EXPENSE'}
                      </span>
                    </td>
                    <td class="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{expense.title}</td>
                    <td class="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate" title={expense.description}>
                      {expense.description || <em class="text-slate-300 dark:text-slate-600">No description</em>}
                    </td>
                    <td class="px-6 py-4">
                      <span class={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getTagBadge(expense.tag)}`}>
                        {expense.tag}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {expense.createdAt || 'N/A'}
                    </td>
                    <td class="px-6 py-4 text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {expense.updatedAt || 'N/A'}
                    </td>
                    <td class="px-6 py-4 text-right font-extrabold text-slate-900 dark:text-slate-100">
                      <span class={expense.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                        {expense.type === 'INCOME' ? '+' : '-'}${expense.amount.toLocaleString()}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <div class="flex items-center justify-center gap-2.5">
                        <button
                          onClick={() => handleOpenEdit(expense)}
                          class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-dark-800 dark:hover:text-primary-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 class="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(expense)}
                          class="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 class="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div class="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4 dark:border-dark-800 dark:bg-dark-900">
              <span class="text-xs text-slate-500 dark:text-slate-400">
                Showing page <strong class="font-bold text-slate-700 dark:text-slate-300">{currentPage}</strong> of <strong class="font-bold text-slate-700 dark:text-slate-300">{totalPages}</strong>
              </span>
              <div class="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  class="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-dark-800 dark:text-slate-450 dark:hover:bg-dark-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  class="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-dark-800 dark:text-slate-450 dark:hover:bg-dark-800 transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? `Edit Expense Record #${editingExpense.stt}` : 'Create New Expense Record'}
      >
        <form onSubmit={handleSubmit} class="space-y-4">
          {/* Transaction Type */}
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Transaction Type
            </label>
            <div class="mt-2 flex gap-4">
              <label class="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="transactionType"
                  value="EXPENSE"
                  checked={type === 'EXPENSE'}
                  onChange={() => setType('EXPENSE')}
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-200 dark:border-dark-800 dark:bg-dark-900"
                />
                <span class="ml-2 text-sm font-semibold text-slate-600 dark:text-slate-400">Expense (Chi)</span>
              </label>
              <label class="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="transactionType"
                  value="INCOME"
                  checked={type === 'INCOME'}
                  onChange={() => setType('INCOME')}
                  class="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-200 dark:border-dark-800 dark:bg-dark-900"
                />
                <span class="ml-2 text-sm font-semibold text-slate-600 dark:text-slate-400">Income (Thu)</span>
              </label>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Amount ($)
            </label>
            <div class="relative mt-1.5 rounded-xl shadow-sm">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <DollarSign className="h-4 w-4 text-slate-400" />
              </div>
              <input
                ref={firstInputRef}
                type="number"
                required
                min="1"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                class="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-950 dark:text-slate-50"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lunch with client, Weekly groceries"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              class="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-950 dark:text-slate-50"
            />
          </div>

          {/* Tag Category Selector */}
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Category
            </label>
            <div class="relative mt-1.5 rounded-xl shadow-sm">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Tag className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                class="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-950 dark:text-slate-50"
              >
                {STANDARD_TAGS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              rows="3"
              placeholder="Details about the transaction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              class="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-800 dark:bg-dark-950 dark:text-slate-50"
            />
          </div>

          {/* Alert explaining update targets stt */}
          <div class="flex items-start gap-2 rounded-xl bg-slate-50 p-3 dark:bg-dark-850">
            <Info className="h-4 w-4 text-slate-450 mt-0.5" />
            <p class="text-xxs leading-4 text-slate-500 dark:text-slate-400">
              Note: This action maps directly to endpoint <code>/post{editingExpense ? `/${editingExpense.stt}` : ''}</code> using the sequential row identifier format.
            </p>
          </div>

          {/* Form Actions */}
          <div class="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-dark-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-dark-700 dark:bg-dark-800 dark:text-slate-300 dark:hover:bg-dark-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutating}
              class="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-700 disabled:opacity-50"
            >
              {mutating && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingExpense ? 'Save Changes' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense Record"
        message={`Are you sure you want to permanently delete the expense "${expenseToDelete?.title}" (Row #${expenseToDelete?.stt})? This action cannot be undone.`}
        confirmText={mutating ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        isDangerous={true}
      />
    </div>
  )
}
