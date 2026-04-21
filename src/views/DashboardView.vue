<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { usePredictionsStore } from '@/stores/predictions'
import { usePremium } from '@/composables/usePremium'
import { useLocale } from '@/composables/useLocale'
import PredictionCard from '@/components/predictions/PredictionCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import {
  SparklesIcon,
  BookmarkIcon,
  Cog6ToothIcon,
  LockClosedIcon
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const authStore = useAuthStore()
const predictionsStore = usePredictionsStore()
const { isPremium, daysRemaining, isExpiringSoon } = usePremium()
const { formatDate, locale, locales, setLocale } = useLocale()

const activeTab = ref('subscription')
const loading = ref(true)
const passwordForm = ref({
  current: '',
  new: '',
  confirm: ''
})
const passwordLoading = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref(null)
const emailDigest = ref(true)

const tabs = [
  { id: 'subscription', name: 'dashboard.subscription.title', icon: SparklesIcon },
  { id: 'saved', name: 'dashboard.savedPredictions', icon: BookmarkIcon },
  { id: 'settings', name: 'dashboard.preferences.title', icon: Cog6ToothIcon },
  { id: 'security', name: 'dashboard.security.title', icon: LockClosedIcon }
]

onMounted(async () => {
  loading.value = true
  try {
    await predictionsStore.fetchSaved()
  } finally {
    loading.value = false
  }
})

async function handlePasswordChange() {
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    passwordError.value = t('auth.errors.passwordMismatch')
    return
  }

  passwordLoading.value = true
  passwordError.value = null
  passwordSuccess.value = false

  try {
    await authStore.changePassword(passwordForm.value.current, passwordForm.value.new)
    passwordSuccess.value = true
    passwordForm.value = { current: '', new: '', confirm: '' }
  } catch (err) {
    passwordError.value = err.message || 'Failed to change password'
  } finally {
    passwordLoading.value = false
  }
}

async function handleUnsave(id) {
  await predictionsStore.unsavePrediction(id)
}
</script>

<template>
  <div class="py-8">
    <div class="container-app">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="font-display font-bold text-3xl text-text mb-2">
          {{ t('dashboard.title') }}
        </h1>
        <p class="text-muted">
          Welcome back, {{ authStore.user?.name }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Sidebar / Tabs -->
        <div class="lg:col-span-1">
          <nav class="card p-2 space-y-1">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="[
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                activeTab === tab.id
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:text-text hover:bg-bg'
              ]"
              @click="activeTab = tab.id"
            >
              <component :is="tab.icon" class="w-5 h-5" />
              <span class="text-sm font-medium">{{ t(tab.name) }}</span>
            </button>
          </nav>
        </div>

        <!-- Content -->
        <div class="lg:col-span-3">
          <!-- Subscription Tab -->
          <div v-if="activeTab === 'subscription'" class="card p-6">
            <h2 class="font-display font-bold text-xl text-text mb-6">
              {{ t('dashboard.subscription.title') }}
            </h2>

            <div class="flex items-center gap-4 mb-6">
              <div class="flex-1">
                <p class="stat-label mb-1">{{ t('dashboard.subscription.status') }}</p>
                <AppBadge :variant="isPremium ? 'gold' : 'muted'" size="lg">
                  <SparklesIcon v-if="isPremium" class="w-4 h-4 mr-1" />
                  {{ isPremium ? t('dashboard.subscription.active') : t('dashboard.subscription.free') }}
                </AppBadge>
              </div>

              <div v-if="isPremium && authStore.subscriptionExpiresAt">
                <p class="stat-label mb-1">Expires</p>
                <p class="text-text font-medium">
                  {{ formatDate(authStore.subscriptionExpiresAt) }}
                </p>
              </div>
            </div>

            <AppAlert v-if="isExpiringSoon" variant="warning" class="mb-6">
              Your subscription expires in {{ daysRemaining }} days. Renew now to keep access.
            </AppAlert>

            <RouterLink v-if="!isPremium" to="/premium">
              <AppButton variant="gold">
                <SparklesIcon class="w-4 h-4 mr-2" />
                {{ t('dashboard.subscription.upgrade') }}
              </AppButton>
            </RouterLink>
          </div>

          <!-- Saved Predictions Tab -->
          <div v-if="activeTab === 'saved'">
            <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AppSkeleton v-for="i in 4" :key="i" variant="card" />
            </div>

            <div v-else-if="predictionsStore.savedPredictions.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PredictionCard
                v-for="prediction in predictionsStore.savedPredictions"
                :key="prediction.id"
                :prediction="prediction"
                show-save-button
                @unsave="handleUnsave"
              />
            </div>

            <div v-else class="card p-12 text-center">
              <BookmarkIcon class="w-12 h-12 text-muted mx-auto mb-4" />
              <p class="text-muted">{{ t('dashboard.noSaved') }}</p>
              <RouterLink to="/predictions" class="inline-block mt-4">
                <AppButton variant="outline">Browse Predictions</AppButton>
              </RouterLink>
            </div>
          </div>

          <!-- Settings Tab -->
          <div v-if="activeTab === 'settings'" class="card p-6">
            <h2 class="font-display font-bold text-xl text-text mb-6">
              {{ t('dashboard.preferences.title') }}
            </h2>

            <div class="space-y-6">
              <!-- Email digest -->
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-text font-medium">{{ t('dashboard.preferences.emailDigest') }}</p>
                  <p class="text-sm text-muted">Receive daily predictions in your inbox</p>
                </div>
                <button
                  :class="[
                    'relative w-12 h-6 rounded-full transition-colors',
                    emailDigest ? 'bg-accent' : 'bg-muted/30'
                  ]"
                  @click="emailDigest = !emailDigest"
                >
                  <span
                    :class="[
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                      emailDigest ? 'left-7' : 'left-1'
                    ]"
                  />
                </button>
              </div>

              <!-- Language -->
              <div>
                <p class="text-text font-medium mb-2">{{ t('dashboard.preferences.language') }}</p>
                <div class="flex gap-2">
                  <button
                    v-for="loc in locales"
                    :key="loc.code"
                    :class="[
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      locale === loc.code
                        ? 'bg-accent text-bg'
                        : 'bg-surface text-muted hover:text-text border border-border'
                    ]"
                    @click="setLocale(loc.code)"
                  >
                    {{ loc.flag }} {{ loc.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Security Tab -->
          <div v-if="activeTab === 'security'" class="card p-6">
            <h2 class="font-display font-bold text-xl text-text mb-6">
              {{ t('dashboard.security.changePassword') }}
            </h2>

            <AppAlert v-if="passwordSuccess" variant="success" class="mb-6" dismissible @dismiss="passwordSuccess = false">
              Password changed successfully!
            </AppAlert>

            <AppAlert v-if="passwordError" variant="error" class="mb-6" dismissible @dismiss="passwordError = null">
              {{ passwordError }}
            </AppAlert>

            <form class="space-y-4 max-w-md" @submit.prevent="handlePasswordChange">
              <div>
                <label class="block text-sm font-medium text-text mb-2">
                  {{ t('dashboard.security.currentPassword') }}
                </label>
                <input
                  v-model="passwordForm.current"
                  type="password"
                  class="input-field"
                  required
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-text mb-2">
                  {{ t('dashboard.security.newPassword') }}
                </label>
                <input
                  v-model="passwordForm.new"
                  type="password"
                  class="input-field"
                  minlength="8"
                  required
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-text mb-2">
                  {{ t('dashboard.security.confirmPassword') }}
                </label>
                <input
                  v-model="passwordForm.confirm"
                  type="password"
                  class="input-field"
                  required
                >
              </div>

              <AppButton type="submit" :loading="passwordLoading">
                {{ t('dashboard.security.update') }}
              </AppButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
