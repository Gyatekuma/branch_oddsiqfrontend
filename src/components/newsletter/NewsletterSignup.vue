<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import newsletterApi from '@/api/newsletter'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import { EnvelopeIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()

const email = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref(null)

async function handleSubmit() {
  if (!email.value || loading.value) return

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    error.value = t('auth.errors.invalidEmail')
    return
  }

  loading.value = true
  error.value = null

  try {
    await newsletterApi.subscribe(email.value)
    success.value = true
    email.value = ''
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to subscribe. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card p-6">
    <div class="flex items-start gap-4">
      <div class="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
        <EnvelopeIcon class="w-6 h-6 text-accent" />
      </div>

      <div class="flex-1">
        <h3 class="font-display font-bold text-lg text-text mb-1">
          Stay Updated
        </h3>
        <p class="text-sm text-muted mb-4">
          Get daily predictions and value bets delivered to your inbox.
        </p>

        <!-- Success state -->
        <div v-if="success" class="flex items-center gap-2 text-win">
          <CheckCircleIcon class="w-5 h-5" />
          <span class="text-sm font-medium">Thanks for subscribing!</span>
        </div>

        <!-- Form -->
        <form v-else class="space-y-3" @submit.prevent="handleSubmit">
          <AppAlert
            v-if="error"
            variant="error"
            dismissible
            @dismiss="error = null"
          >
            {{ error }}
          </AppAlert>

          <div class="flex gap-2">
            <input
              v-model="email"
              type="email"
              placeholder="Enter your email"
              class="input-field flex-1"
              :disabled="loading"
            >
            <AppButton
              type="submit"
              :loading="loading"
              :disabled="!email"
            >
              Subscribe
            </AppButton>
          </div>

          <p class="text-xs text-muted">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
