<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSubscriptionStore } from '@/stores/subscription'
import { CheckBadgeIcon, XCircleIcon } from '@heroicons/vue/24/solid'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const subscriptionStore = useSubscriptionStore()

const status = ref('verifying') // 'verifying' | 'success' | 'error'
const message = ref('')

onMounted(async () => {
  const reference = route.query.reference || route.query.trxref
  if (!reference) {
    status.value = 'error'
    message.value = 'No payment reference found.'
    return
  }

  try {
    await subscriptionStore.verifyPayment(reference)
    // Refresh auth state so isPremium flips immediately
    await authStore.fetchProfile()
    status.value = 'success'
    // Redirect to predictions after 2.5s
    setTimeout(() => router.replace('/predictions'), 2500)
  } catch (err) {
    status.value = 'error'
    message.value = err?.response?.data?.error || 'Payment verification failed. Please contact support.'
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg flex items-center justify-center px-4">
    <div class="max-w-sm w-full text-center">

      <!-- Verifying -->
      <template v-if="status === 'verifying'">
        <div class="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-6 animate-pulse">
          <div class="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h1 class="font-display font-bold text-xl text-text mb-2">Confirming payment…</h1>
        <p class="text-muted text-sm">Just a moment</p>
      </template>

      <!-- Success -->
      <template v-else-if="status === 'success'">
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style="background: rgba(212,160,23,0.15); box-shadow: 0 0 30px rgba(212,160,23,0.25)"
        >
          <CheckBadgeIcon class="w-8 h-8 text-gold" />
        </div>
        <h1 class="font-display font-bold text-2xl text-text mb-2">
          Welcome to <span class="text-gold">Premium</span>!
        </h1>
        <p class="text-muted text-sm mb-6">
          Your account has been upgraded. Redirecting you to predictions…
        </p>
        <div class="h-1 rounded-full bg-border overflow-hidden">
          <div class="h-full bg-gold rounded-full animate-[shrink_2.5s_linear_forwards]" style="width:100%"></div>
        </div>
      </template>

      <!-- Error -->
      <template v-else>
        <div class="w-16 h-16 rounded-full bg-loss/10 flex items-center justify-center mx-auto mb-6">
          <XCircleIcon class="w-8 h-8 text-loss" />
        </div>
        <h1 class="font-display font-bold text-xl text-text mb-2">Something went wrong</h1>
        <p class="text-muted text-sm mb-6">{{ message }}</p>
        <div class="flex gap-3 justify-center">
          <RouterLink
            to="/premium"
            class="px-5 py-2.5 rounded-xl text-sm font-semibold text-bg"
            style="background: linear-gradient(135deg, #d4a017, #f5c842)"
          >
            Try again
          </RouterLink>
          <RouterLink
            to="/dashboard"
            class="px-5 py-2.5 rounded-xl text-sm font-medium text-muted border border-border hover:text-text transition-colors"
          >
            My account
          </RouterLink>
        </div>
      </template>

    </div>
  </div>
</template>
