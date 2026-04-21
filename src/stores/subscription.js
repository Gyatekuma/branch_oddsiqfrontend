import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import paymentsApi from '@/api/payments'
import { useAuthStore } from './auth'

export const useSubscriptionStore = defineStore('subscription', () => {
  // State
  const plans = ref([])
  const paymentHistory = ref([])
  const currentPayment = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const verifying = ref(false)

  // Getters
  const monthlyPlan = computed(() => plans.value.find(p => p.type === 'monthly'))
  const annualPlan = computed(() => plans.value.find(p => p.type === 'annual'))
  const annualSavings = computed(() => {
    if (!monthlyPlan.value || !annualPlan.value) return 0
    const monthlyTotal = monthlyPlan.value.price * 12
    return Math.round(((monthlyTotal - annualPlan.value.price) / monthlyTotal) * 100)
  })

  // Actions
  async function fetchPlans() {
    loading.value = true
    error.value = null
    try {
      const response = await paymentsApi.getPlans()
      plans.value = response.plans
      return response.plans
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch plans'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function initiatePayment(planType) {
    loading.value = true
    error.value = null
    try {
      const response = await paymentsApi.initiate(planType)
      currentPayment.value = {
        reference: response.reference,
        authorization_url: response.authorization_url
      }
      return response
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to initiate payment'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function verifyPayment(reference) {
    verifying.value = true
    error.value = null
    try {
      const response = await paymentsApi.verify(reference)

      if (response.status === 'success') {
        // Update auth store with new subscription
        const authStore = useAuthStore()
        authStore.updateSubscription(response.subscription_expires_at)
      }

      currentPayment.value = null
      return response
    } catch (err) {
      error.value = err.response?.data?.message || 'Payment verification failed'
      throw err
    } finally {
      verifying.value = false
    }
  }

  async function fetchPaymentHistory() {
    loading.value = true
    try {
      const response = await paymentsApi.getHistory()
      paymentHistory.value = response.payments
      return response.payments
    } catch (err) {
      console.error('Failed to fetch payment history:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  async function cancelSubscription() {
    loading.value = true
    error.value = null
    try {
      const response = await paymentsApi.cancelSubscription()

      // Update auth store
      const authStore = useAuthStore()
      authStore.updateSubscription(null)

      return response
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to cancel subscription'
      throw err
    } finally {
      loading.value = false
    }
  }

  function redirectToPaystack() {
    if (currentPayment.value?.authorization_url) {
      window.location.href = currentPayment.value.authorization_url
    }
  }

  function clearError() {
    error.value = null
  }

  function clearCurrentPayment() {
    currentPayment.value = null
  }

  return {
    // State
    plans,
    paymentHistory,
    currentPayment,
    loading,
    error,
    verifying,
    // Getters
    monthlyPlan,
    annualPlan,
    annualSavings,
    // Actions
    fetchPlans,
    initiatePayment,
    verifyPayment,
    fetchPaymentHistory,
    cancelSubscription,
    redirectToPaystack,
    clearError,
    clearCurrentPayment
  }
})
