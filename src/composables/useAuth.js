import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isAdmin = computed(() => authStore.isAdmin)
  const user = computed(() => authStore.user)
  const loading = computed(() => authStore.loading)
  const error = computed(() => authStore.error)

  async function login(email, password) {
    try {
      await authStore.login(email, password)
      const redirect = route.query.redirect || '/predictions'
      router.push(redirect)
      return true
    } catch (err) {
      return false
    }
  }

  async function register(firstName, lastName, otherNames, email, password) {
    try {
      await authStore.register(email, password, firstName, lastName, otherNames)
      router.push('/predictions')
      return true
    } catch (err) {
      return false
    }
  }

  async function logout() {
    await authStore.logout()
    router.push('/predictions')
  }

  function clearError() {
    authStore.clearError()
  }

  function requireAuth() {
    if (!isAuthenticated.value) {
      router.push({ name: 'login', query: { redirect: route.fullPath } })
      return false
    }
    return true
  }

  function requireAdmin() {
    if (!isAdmin.value) {
      router.push({ name: 'home' })
      return false
    }
    return true
  }

  return {
    isAuthenticated,
    isAdmin,
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    requireAuth,
    requireAdmin
  }
}
