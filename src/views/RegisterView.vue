<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import { ChartBarIcon, EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const route = useRoute()
const { register, loading, error, clearError } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const validationError = ref(null)

const isValid = computed(() => {
  return (
    name.value.length > 0 &&
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
  await register(name.value, email.value, password.value)
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
            {{ t('auth.register.title') }}
          </h1>
          <p class="text-muted">
            {{ t('auth.register.subtitle') }}
          </p>
        </div>

        <AppAlert
          v-if="error || validationError"
          variant="error"
          class="mb-6"
          dismissible
          @dismiss="clearError(); validationError = null"
        >
          {{ error || validationError }}
        </AppAlert>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <!-- Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-text mb-2">
              {{ t('auth.register.name') }}
            </label>
            <input
              id="name"
              v-model="name"
              type="text"
              class="input-field"
              :placeholder="t('auth.register.name')"
              required
              autocomplete="name"
            >
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-text mb-2">
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

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-text mb-2">
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
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                @click="showPassword = !showPassword"
              >
                <EyeSlashIcon v-if="showPassword" class="w-5 h-5" />
                <EyeIcon v-else class="w-5 h-5" />
              </button>
            </div>
            <p class="mt-1 text-xs text-muted">Minimum 8 characters</p>
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-text mb-2">
              {{ t('auth.register.confirmPassword') }}
            </label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              class="input-field"
              :placeholder="t('auth.register.confirmPassword')"
              required
              autocomplete="new-password"
            >
          </div>

          <!-- Submit -->
          <AppButton
            type="submit"
            block
            :loading="loading"
            :disabled="!isValid"
          >
            {{ t('auth.register.submit') }}
          </AppButton>
        </form>

        <!-- Sign in link -->
        <p class="mt-6 text-center text-sm text-muted">
          {{ t('auth.register.hasAccount') }}
          <RouterLink to="/login" class="text-accent hover:underline">
            {{ t('auth.register.signIn') }}
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
