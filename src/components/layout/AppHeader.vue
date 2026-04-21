<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import LanguageToggle from '@/components/ui/LanguageToggle.vue'
import AppButton from '@/components/ui/AppButton.vue'
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'
import { SparklesIcon } from '@heroicons/vue/24/solid'

const { t } = useI18n()
const route = useRoute()
const { isAuthenticated, isAdmin, user, logout } = useAuth()

const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)

const navLinks = [
  { name: 'nav.home', to: '/' },
  { name: 'nav.predictions', to: '/predictions' },
  { name: 'nav.accuracy', to: '/accuracy' },
  { name: 'nav.guides', to: '/guides' }
]

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
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
        <RouterLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
            <ChartBarIcon class="w-5 h-5 text-bg" />
          </div>
          <span class="text-xl font-display font-bold text-text">
            Odds<span class="text-accent">IQ</span>
          </span>
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
          <LanguageToggle class="hidden md:block" />

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
            <div class="relative hidden md:block">
              <button
                class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface transition-colors"
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
            <div class="hidden md:flex items-center gap-2">
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

          <!-- Mobile menu button -->
          <button
            class="md:hidden p-2 text-muted hover:text-text"
            @click="toggleMobileMenu"
          >
            <Bars3Icon v-if="!mobileMenuOpen" class="w-6 h-6" />
            <XMarkIcon v-else class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition name="slide">
      <div
        v-if="mobileMenuOpen"
        class="md:hidden border-t border-border bg-surface"
      >
        <nav class="container-app py-4 space-y-1">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            :class="[
              'block px-4 py-3 text-base font-medium rounded-lg transition-colors',
              route.path === link.to
                ? 'text-accent bg-accent/10'
                : 'text-text hover:bg-bg'
            ]"
            @click="closeMobileMenu"
          >
            {{ t(link.name) }}
          </RouterLink>

          <div class="pt-4 border-t border-border mt-4">
            <template v-if="isAuthenticated">
              <RouterLink
                to="/dashboard"
                class="block px-4 py-3 text-base font-medium text-text hover:bg-bg rounded-lg"
                @click="closeMobileMenu"
              >
                {{ t('nav.dashboard') }}
              </RouterLink>
              <button
                class="w-full text-left px-4 py-3 text-base font-medium text-loss hover:bg-bg rounded-lg"
                @click="handleLogout"
              >
                {{ t('nav.logout') }}
              </button>
            </template>
            <template v-else>
              <RouterLink
                to="/login"
                class="block px-4 py-3 text-base font-medium text-text hover:bg-bg rounded-lg"
                @click="closeMobileMenu"
              >
                {{ t('nav.login') }}
              </RouterLink>
              <RouterLink
                to="/register"
                class="block px-4 py-3 text-base font-medium text-accent hover:bg-bg rounded-lg"
                @click="closeMobileMenu"
              >
                {{ t('nav.register') }}
              </RouterLink>
            </template>
          </div>

          <div class="pt-4">
            <LanguageToggle />
          </div>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

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
