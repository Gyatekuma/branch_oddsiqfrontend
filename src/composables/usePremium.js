import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function usePremium() {
  const authStore = useAuthStore()
  const router = useRouter()

  const isPremium = computed(() => authStore.isPremium)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const subscriptionExpiresAt = computed(() => authStore.subscriptionExpiresAt)

  const daysRemaining = computed(() => {
    if (!subscriptionExpiresAt.value) return 0
    const now = new Date()
    const expires = new Date(subscriptionExpiresAt.value)
    const diffTime = expires - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  })

  const isExpiringSoon = computed(() => {
    return daysRemaining.value > 0 && daysRemaining.value <= 7
  })

  function canAccessPremiumContent() {
    return isPremium.value
  }

  function requirePremium() {
    if (!isPremium.value) {
      router.push({ name: 'premium' })
      return false
    }
    return true
  }

  function promptUpgrade() {
    if (!isAuthenticated.value) {
      router.push({ name: 'register', query: { redirect: '/premium' } })
    } else {
      router.push({ name: 'premium' })
    }
  }

  // Check if user can see a prediction (freemium model)
  function canSeePrediction(index) {
    // Free users can see first 3 predictions
    if (isPremium.value) return true
    return index < 3
  }

  // Check if user can see expert analysis
  function canSeeExpertAnalysis() {
    return isPremium.value
  }

  // Check if user can see value bets
  function canSeeValueBets() {
    return isPremium.value
  }

  return {
    isPremium,
    isAuthenticated,
    subscriptionExpiresAt,
    daysRemaining,
    isExpiringSoon,
    canAccessPremiumContent,
    requirePremium,
    promptUpgrade,
    canSeePrediction,
    canSeeExpertAnalysis,
    canSeeValueBets
  }
}
