import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// Use empty baseURL in development to use Vite's proxy (avoids CORS issues)
// In production, use the full API URL
const isDev = import.meta.env.DEV
const PROD_API_URL = 'https://edi-predictions-backend.vercel.app'
const baseURL = isDev ? '' : (import.meta.env.VITE_API_BASE_URL || PROD_API_URL)

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - attach access token and log requests
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401 and token refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    // Log error response
    if (error.response) {
      console.error(`[API Error] ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`)
      console.error('[API Error Data]', JSON.stringify(error.response.data, null, 2))
    } else if (error.request) {
      console.error('[API Error] No response received', error.message)
    } else {
      console.error('[API Error] Request setup failed', error.message)
    }

    const originalRequest = error.config
    const authStore = useAuthStore()

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('[Axios] 401 error, attempting token refresh...')

      if (isRefreshing) {
        console.log('[Axios] Refresh already in progress, queuing request')
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Attempt to refresh token using stored refresh token
        const refreshToken = authStore.refreshToken
        console.log('[Axios] Refresh token available:', !!refreshToken)

        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const refreshUrl = isDev ? '/api/auth/refresh' : `${api.defaults.baseURL}/api/auth/refresh`
        console.log('[Axios] Calling refresh endpoint:', refreshUrl)

        const response = await axios.post(
          refreshUrl,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        )

        console.log('[Axios] Refresh successful')
        const data = response.data.data
        const access_token = data.access_token
        const new_refresh_token = data.refresh_token

        authStore.setAccessToken(access_token)
        if (new_refresh_token) {
          authStore.setRefreshToken(new_refresh_token)
        }
        if (data.user) {
          authStore.setUser(data.user)
        }

        processQueue(null, access_token)

        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        console.error('[Axios] Token refresh failed:', refreshError.response?.data || refreshError.message)
        processQueue(refreshError, null)

        // Only logout if refresh explicitly failed (not network error)
        if (refreshError.response?.status === 401) {
          console.log('[Axios] Refresh token invalid, logging out')
          authStore.logout()
          router.push({ name: 'login' })
        } else {
          console.warn('[Axios] Refresh failed but may be network issue, not logging out')
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
