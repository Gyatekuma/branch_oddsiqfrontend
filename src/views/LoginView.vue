<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const { login, loading, error, clearError } = useAuth()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

const isValid = computed(() => {
  return email.value.length > 0 && password.value.length > 0
})

async function handleSubmit() {
  if (!isValid.value) return
  clearError()
  await login(email.value, password.value)
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
            {{ t('auth.login.title') }}
          </h1>
          <p class="text-muted text-sm">
            {{ t('auth.login.subtitle') }}
          </p>
        </div>

        <AppAlert
          v-if="error"
          variant="error"
          class="mb-5"
          dismissible
          @dismiss="clearError"
        >
          {{ error }}
        </AppAlert>

        <form class="space-y-5" @submit.prevent="handleSubmit">

          <div>
            <label for="email" class="block text-xs font-display font-semibold uppercase tracking-wider text-muted mb-2">
              {{ t('auth.login.email') }}
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="input-field"
              :placeholder="t('auth.login.email')"
              required
              autocomplete="email"
            >
          </div>

          <div>
            <label for="password" class="block text-xs font-display font-semibold uppercase tracking-wider text-muted mb-2">
              {{ t('auth.login.password') }}
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="input-field pr-12"
                :placeholder="t('auth.login.password')"
                required
                autocomplete="current-password"
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
            <div class="mt-2 text-right">
              <RouterLink to="/forgot-password" class="text-xs text-accent hover:text-accent/80 transition-colors">
                {{ t('auth.login.forgotPassword') }}
              </RouterLink>
            </div>
          </div>

          <AppButton
            type="submit"
            block
            :loading="loading"
            :disabled="!isValid"
          >
            {{ t('auth.login.submit') }}
          </AppButton>
        </form>

        <div class="flex items-center gap-3 my-6">
          <div class="flex-1 h-px bg-border" />
          <span class="text-xs text-muted px-1">no account?</span>
          <div class="flex-1 h-px bg-border" />
        </div>

        <RouterLink
          to="/register"
          class="block w-full text-center text-sm font-medium text-text border border-border rounded-lg py-2.5 hover:border-accent/40 hover:text-accent transition-colors"
        >
          {{ t('auth.login.signUp') }}
        </RouterLink>
      </div>

      <!-- Feature strip -->
      <div class="mt-8 grid grid-cols-3 gap-4">
        <div v-for="feat in [
          { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'AI-Powered' },
          { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Live Odds' },
          { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Multi-Market' },
        ]" :key="feat.label"
          class="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border/50 bg-surface/50"
        >
          <svg class="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" :d="feat.icon" />
          </svg>
          <span class="text-xs text-muted">{{ feat.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
