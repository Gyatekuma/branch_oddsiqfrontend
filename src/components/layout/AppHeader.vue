<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import AppButton from '@/components/ui/AppButton.vue'
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'
import { SparklesIcon } from '@heroicons/vue/24/solid'

const { t } = useI18n()
const route = useRoute()
const { isAuthenticated, isAdmin, user, logout } = useAuth()

const userMenuOpen = ref(false)
const userMenuRef = ref(null)

// Close dropdown on route change
watch(route, () => {
  userMenuOpen.value = false
})

// Close dropdown on click outside
function handleClickOutside(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    userMenuOpen.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

const navLinks = [
  { name: 'nav.home', to: '/' },
  { name: 'nav.predictions', to: '/predictions' },
  { name: 'nav.markets', to: '/markets' },
  { name: 'nav.accuracy', to: '/accuracy' },
  { name: 'nav.guides', to: '/guides' }
]

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function handleLogout() {
  userMenuOpen.value = false
  logout()
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
    <div class="container-app">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-end gap-1.5">
          <span class="text-accent text-5xl leading-none font-display font-bold tracking-tight">EDI</span>
          <span class="text-white font-normal text-2xl leading-none font-display mb-0.5">Predictions</span>
        </RouterLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-1">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              route.path === link.to
                ? 'text-accent bg-accent/10'
                : 'text-muted hover:text-text hover:bg-surface'
            ]"
          >
            {{ t(link.name) }}
          </RouterLink>
        </nav>

        <!-- Right side -->
        <div class="flex items-center gap-3">
          <!-- Premium Button -->
          <RouterLink
            v-if="!isAuthenticated"
            to="/premium"
            class="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gold bg-gold/10 border border-gold/30 rounded-full hover:bg-gold/20 transition-colors"
          >
            <SparklesIcon class="w-4 h-4" />
            {{ t('nav.premium') }}
          </RouterLink>

          <!-- Auth buttons / User menu -->
          <template v-if="isAuthenticated">
            <div ref="userMenuRef" class="relative hidden md:block">
              <button
                class="flex items-end gap-0.5 px-3 py-2 rounded-lg hover:bg-surface transition-colors"
                @click="toggleUserMenu"
              >
                <UserCircleIcon class="w-6 h-6 text-muted" />
                <span class="text-sm text-text">{{ user?.name?.split(' ')[0] }}</span>
              </button>

              <Transition name="dropdown">
                <div
                  v-if="userMenuOpen"
                  class="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
                >
                  <RouterLink
                    to="/dashboard"
                    class="flex items-center gap-3 px-4 py-3 text-sm text-text hover:bg-bg transition-colors"
                    @click="userMenuOpen = false"
                  >
                    <Cog6ToothIcon class="w-4 h-4 text-muted" />
                    {{ t('nav.dashboard') }}
                  </RouterLink>
                  <RouterLink
                    v-if="isAdmin"
                    to="/admin"
                    class="flex items-center gap-3 px-4 py-3 text-sm text-text hover:bg-bg transition-colors"
                    @click="userMenuOpen = false"
                  >
                    <ChartBarIcon class="w-4 h-4 text-muted" />
                    {{ t('nav.admin') }}
                  </RouterLink>
                  <button
                    class="w-full flex items-center gap-3 px-4 py-3 text-sm text-loss hover:bg-bg transition-colors"
                    @click="handleLogout"
                  >
                    <ArrowRightOnRectangleIcon class="w-4 h-4" />
                    {{ t('nav.logout') }}
                  </button>
                </div>
              </Transition>
            </div>
          </template>
          <template v-else>
            <div class="hidden md:flex items-end gap-0.5">
              <RouterLink to="/login">
                <AppButton variant="ghost" size="sm">
                  {{ t('nav.login') }}
                </AppButton>
              </RouterLink>
              <RouterLink to="/register">
                <AppButton size="sm">
                  {{ t('nav.register') }}
                </AppButton>
              </RouterLink>
            </div>
          </template>

        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
