import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authApi from '@/api/auth'

// LocalStorage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'oddsiq_access_token',
  REFRESH_TOKEN: 'oddsiq_refresh_token',
  USER: 'oddsiq_user'
}

// Helper functions for localStorage
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('Failed to save to localStorage:', e)
  }
}

function getFromStorage(key) {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (e) {
    console.warn('Failed to read from localStorage:', e)
    return null
  }
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.warn('Failed to remove from localStorage:', e)
  }
}

export const useAuthStore = defineStore('auth', () => {
  // State - Initialize from localStorage
  const storedUser = getFromStorage(STORAGE_KEYS.USER)
  const storedAccessToken = getFromStorage(STORAGE_KEYS.ACCESS_TOKEN)
  const storedRefreshToken = getFromStorage(STORAGE_KEYS.REFRESH_TOKEN)

  console.log('[AuthStore] Initializing from localStorage:')
  console.log('[AuthStore] - User:', storedUser?.email || 'none')
  console.log('[AuthStore] - Access token:', storedAccessToken ? 'present' : 'none')
  console.log('[AuthStore] - Refresh token:', storedRefreshToken ? 'present' : 'none')

  const user = ref(storedUser)
  const accessToken = ref(storedAccessToken)
  const refreshToken = ref(storedRefreshToken)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isPremium = computed(() => {
    if (!user.value) return false
    if (user.value.role === 'admin') return true
    if (user.value.role === 'premium') return true
    if (user.value.is_premium) return true
    if (!user.value.subscription_expires_at) return false
    return new Date(user.value.subscription_expires_at) > new Date()
  })
  const subscriptionExpiresAt = computed(() => user.value?.subscription_expires_at)

  // Actions
  function setAccessToken(token) {
    accessToken.value = token
    if (token) {
      saveToStorage(STORAGE_KEYS.ACCESS_TOKEN, token)
    } else {
      removeFromStorage(STORAGE_KEYS.ACCESS_TOKEN)
    }
  }

  function setRefreshToken(token) {
    refreshToken.value = token
    if (token) {
      saveToStorage(STORAGE_KEYS.REFRESH_TOKEN, token)
    } else {
      removeFromStorage(STORAGE_KEYS.REFRESH_TOKEN)
    }
  }

  function setUser(userData) {
    user.value = userData
    if (userData) {
      saveToStorage(STORAGE_KEYS.USER, userData)
    } else {
      removeFromStorage(STORAGE_KEYS.USER)
    }
  }

  async function login(email, password) {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.login(email, password)
      // Use setters to persist to localStorage
      setAccessToken(response.access_token)
      setRefreshToken(response.refresh_token)
      setUser(response.user)
      return response
    } catch (err) {
      error.value = err.response?.data?.error || err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(email, password, firstName, lastName, otherNames) {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.register(email, password, firstName, lastName, otherNames)
      user.value = response
      return response
    } catch (err) {
      error.value = err.response?.data?.error || err.response?.data?.message || 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (err) {
      // Ignore logout errors
    } finally {
      // Clear all auth state and localStorage
      setAccessToken(null)
      setRefreshToken(null)
      setUser(null)
    }
  }

  async function fetchProfile() {
    if (!accessToken.value) return null
    loading.value = true
    try {
      const response = await authApi.getProfile()
      // Backend returns user object directly, not { user: ... }
      const userData = response.user || response
      console.log('[Auth] Profile fetched:', userData)
      setUser(userData)
      return userData
    } catch (err) {
      // Only clear auth state if token is actually invalid (401/403)
      // Don't clear on network errors or other issues
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('[Auth] Token invalid, clearing auth state')
        setAccessToken(null)
        setRefreshToken(null)
        setUser(null)
      } else {
        console.warn('[Auth] Profile fetch failed but keeping auth state:', err.message)
      }
      return null
    } finally {
      loading.value = false
    }
  }

  // Initialize auth state on app load
  async function initializeAuth() {
    if (accessToken.value) {
      // We have a stored token, try to fetch the user profile
      await fetchProfile()
    }
  }

  async function updateProfile(data) {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.updateProfile(data)
      setUser(response.user)
      return response
    } catch (err) {
      error.value = err.response?.data?.message || 'Update failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function changePassword(currentPassword, newPassword) {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.changePassword(currentPassword, newPassword)
      return response
    } catch (err) {
      error.value = err.response?.data?.message || 'Password change failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  function updateSubscription(expiresAt) {
    if (user.value) {
      user.value.subscription_expires_at = expiresAt
      // Persist updated user to localStorage
      saveToStorage(STORAGE_KEYS.USER, user.value)
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    // Getters
    isAuthenticated,
    isAdmin,
    isPremium,
    subscriptionExpiresAt,
    // Actions
    setAccessToken,
    setRefreshToken,
    setUser,
    login,
    register,
    logout,
    fetchProfile,
    initializeAuth,
    updateProfile,
    changePassword,
    updateSubscription,
    clearError
  }
})
