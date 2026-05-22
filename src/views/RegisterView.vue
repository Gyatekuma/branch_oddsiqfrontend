<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import { EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const { register, loading, error, clearError } = useAuth()

const firstName = ref('')
const lastName = ref('')
const otherNames = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const validationError = ref(null)

const passwordStrength = computed(() => {
  const p = password.value
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})

const strengthLabel = computed(() => {
  const s = passwordStrength.value
  if (s <= 1) return { text: 'Weak', color: 'bg-loss' }
  if (s <= 3) return { text: 'Fair', color: 'bg-draw' }
  return { text: 'Strong', color: 'bg-win' }
})

const isValid = computed(() => {
  return (
    firstName.value.trim().length > 0 &&
    lastName.value.trim().length > 0 &&
    email.value.length > 0 &&
    password.value.length >= 8 &&
    password.value === confirmPassword.value
  )
})

function validate() {
  validationError.value = null
  if (password.value.length < 8) {
    validationError.value = t('auth.errors.weakPassword')
    return false
  }
  if (password.value !== confirmPassword.value) {
    validationError.value = t('auth.errors.passwordMismatch')
    return false
  }
  return true
}

async function handleSubmit() {
  if (!validate()) return
  clearError()
  await register(firstName.value.trim(), lastName.value.trim(), otherNames.value.trim() || null, email.value, password.value)
}
</script>

<template>
  <div class="relative min-h-[100svh] flex items-center justify-center px-4 py-16 hero-grid overflow-hidden">

    <!-- Gold radial glow -->
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div class="w-[700px] h-[700px] rounded-full"
           style="background: radial-gradient(circle, rgba(212,160,23,0.06) 0%, transparent 65%);" />
    </div>

    <div class="relative z-10 w-full max-w-md">

      <!-- Logo -->
      <div class="flex justify-center mb-10">
        <RouterLink to="/" class="flex items-end gap-1.5">
          <span class="text-accent text-4xl leading-none font-display font-bold tracking-tight">EDI</span>
          <span class="text-white font-normal text-xl leading-none font-display mb-0.5">Predictions</span>
        </RouterLink>
      </div>

      <!-- Card -->
      <div class="gold-border-card p-8">

        <div class="text-center mb-7">
          <h1 class="font-display font-bold text-2xl text-text mb-2">
            {{ t('auth.register.title') }}
          </h1>
          <p class="text-muted text-sm">
            {{ t('auth.register.subtitle') }}
          </p>
        </div>

        <AppAlert
          v-if="error || validationError"
          variant="error"
          class="mb-5"
          dismissible
          @dismiss="clearError(); validationError = null"
        >
          {{ error || validationError }}
        </AppAlert>

        <form class="space-y-5" @submit.prevent="handleSubmit">

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="firstName" class="block text-xs font-display font-semibold uppercase tracking-wider text-muted mb-2">
                First Name
              </label>
              <input
                id="firstName"
                v-model="firstName"
                type="text"
                class="input-field"
                placeholder="First name"
                required
                autocomplete="given-name"
              >
            </div>
            <div>
              <label for="lastName" class="block text-xs font-display font-semibold uppercase tracking-wider text-muted mb-2">
                Last Name
              </label>
              <input
                id="lastName"
                v-model="lastName"
                type="text"
                class="input-field"
                placeholder="Last name"
                required
                autocomplete="family-name"
              >
            </div>
          </div>

          <div>
            <label for="otherNames" class="block text-xs font-display font-semibold uppercase tracking-wider text-muted mb-2">
              Other Names <span class="normal-case font-normal text-muted/60">(optional)</span>
            </label>
            <input
              id="otherNames"
              v-model="otherNames"
              type="text"
              class="input-field"
              placeholder="Middle name or other names"
              autocomplete="additional-name"
            >
          </div>

          <div>
            <label for="email" class="block text-xs font-display font-semibold uppercase tracking-wider text-muted mb-2">
              {{ t('auth.register.email') }}
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="input-field"
              :placeholder="t('auth.register.email')"
              required
              autocomplete="email"
            >
          </div>

          <div>
            <label for="password" class="block text-xs font-display font-semibold uppercase tracking-wider text-muted mb-2">
              {{ t('auth.register.password') }}
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="input-field pr-12"
                :placeholder="t('auth.register.password')"
                required
                minlength="8"
                autocomplete="new-password"
              >
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                @click="showPassword = !showPassword"
              >
                <EyeSlashIcon v-if="showPassword" class="w-5 h-5" />
                <EyeIcon v-else class="w-5 h-5" />
              </button>
            </div>
            <!-- Password strength bar -->
            <div v-if="password" class="mt-2 space-y-1">
              <div class="flex gap-1">
                <div v-for="i in 5" :key="i"
                  class="h-1 flex-1 rounded-full transition-all duration-300"
                  :class="i <= passwordStrength ? strengthLabel.color : 'bg-border'"
                />
              </div>
              <p class="text-xs text-muted">
                Strength: <span :class="passwordStrength <= 1 ? 'text-loss' : passwordStrength <= 3 ? 'text-draw' : 'text-win'">{{ strengthLabel.text }}</span>
              </p>
            </div>
            <p v-else class="mt-1 text-xs text-muted">Minimum 8 characters</p>
          </div>

          <div>
            <label for="confirmPassword" class="block text-xs font-display font-semibold uppercase tracking-wider text-muted mb-2">
              {{ t('auth.register.confirmPassword') }}
            </label>
            <div class="relative">
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                class="input-field pr-12"
                :placeholder="t('auth.register.confirmPassword')"
                required
                autocomplete="new-password"
              >
              <div
                v-if="confirmPassword && password === confirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-win/20 flex items-center justify-center"
              >
                <CheckIcon class="w-3 h-3 text-win" />
              </div>
            </div>
          </div>

          <AppButton
            type="submit"
            block
            :loading="loading"
            :disabled="!isValid"
          >
            {{ t('auth.register.submit') }}
          </AppButton>
        </form>

        <div class="flex items-center gap-3 my-6">
          <div class="flex-1 h-px bg-border" />
          <span class="text-xs text-muted px-1">have an account?</span>
          <div class="flex-1 h-px bg-border" />
        </div>

        <RouterLink
          to="/login"
          class="block w-full text-center text-sm font-medium text-text border border-border rounded-lg py-2.5 hover:border-accent/40 hover:text-accent transition-colors"
        >
          {{ t('auth.register.signIn') }}
        </RouterLink>
      </div>

      <!-- Benefits strip -->
      <div class="mt-8 space-y-2.5">
        <div v-for="benefit in [
          'Free predictions across all major leagues',
          'AI-powered multi-market analysis',
          'Upgrade to Premium for full confidence scores',
        ]" :key="benefit"
          class="flex items-center gap-2.5 text-xs text-muted"
        >
          <div class="w-4 h-4 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0">
            <svg class="w-2.5 h-2.5 text-accent" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1l1.5 4.5H14l-3.75 2.75 1.5 4.5L8 10l-3.75 2.75 1.5-4.5L2 5.5h4.5z"/>
            </svg>
          </div>
          {{ benefit }}
        </div>
      </div>
    </div>
  </div>
</template>
