import axios from 'axios'

// Set up the Axios instance pointing to VITE_API_URL (which uses Vite dev proxy in dev mode)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach the RAW JWT token directly in the Authorization header
// Do NOT include the 'Bearer ' prefix, as the backend's Custom HttpExchange splits list representation [token]
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Catch auth errors (401) and redirect to login
api.interceptors.response.use(
  (response) => {
    // Custom backend handling: the backend returns HTTP 201 with error message on failure
    // for endpoints POST /post, PUT /post/*, DELETE /post/*
    return response
  },
  (error) => {
    const status = error.response ? error.response.status : null

    if (status === 401) {
      // Clear token and redirect to login page on unauthorized response
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Prevent infinite redirect loops if already on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login?expired=true'
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
