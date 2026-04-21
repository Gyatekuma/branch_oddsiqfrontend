<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import { ChartBarIcon, EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'

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
  <div class="min-h-[80vh] flex items-center justify-center py-12 px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex items-center gap-2">
          <div class="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
            <ChartBarIcon class="w-6 h-6 text-bg" />
          </div>
          <span class="text-2xl font-display font-bold text-text">
            Odds<span class="text-accent">IQ</span>
          </span>
        </RouterLink>
      </div>

      <div class="card p-8">
        <div class="text-center mb-6">
          <h1 class="font-display font-bold text-2xl text-text mb-2">
            {{ t('auth.login.title') }}
          </h1>
          <p class="text-muted">
            {{ t('auth.login.subtitle') }}
          </p>
        </div>

        <AppAlert
          v-if="error"
          variant="error"
          class="mb-6"
          dismissible
          @dismiss="clearError"
        >
          {{ error }}
        </AppAlert>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-text mb-2">
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

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-text mb-2">
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
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                @click="showPassword = !showPassword"
              >
                <EyeSlashIcon v-if="showPassword" class="w-5 h-5" />
                <EyeIcon v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Forgot password -->
          <div class="text-right">
            <RouterLink to="/forgot-password" class="text-sm text-accent hover:underline">
              {{ t('auth.login.forgotPassword') }}
            </RouterLink>
          </div>

          <!-- Submit -->
          <AppButton
            type="submit"
            block
            :loading="loading"
            :disabled="!isValid"
          >
            {{ t('auth.login.submit') }}
          </AppButton>
        </form>

        <!-- Sign up link -->
        <p class="mt-6 text-center text-sm text-muted">
          {{ t('auth.login.noAccount') }}
          <RouterLink to="/register" class="text-accent hover:underline">
            {{ t('auth.login.signUp') }}
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
