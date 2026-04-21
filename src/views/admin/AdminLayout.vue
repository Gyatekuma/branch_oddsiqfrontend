<script setup>
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ChartBarSquareIcon,
  UsersIcon,
  BookOpenIcon
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const route = useRoute()

const navItems = [
  { name: 'admin.nav.predictions', to: '/admin/predictions', icon: ChartBarSquareIcon },
  { name: 'admin.nav.users', to: '/admin/users', icon: UsersIcon },
  { name: 'admin.nav.guides', to: '/admin/guides', icon: BookOpenIcon }
]

function isActive(path) {
  return route.path === path
}
</script>

<template>
  <div class="min-h-screen bg-bg">
    <div class="container-app py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="font-display font-bold text-2xl text-text">Admin Panel</h1>
          <p class="text-sm text-muted">Manage predictions, users, and content</p>
        </div>
        <RouterLink
          to="/"
          class="text-sm text-muted hover:text-text transition-colors"
        >
          Back to Site
        </RouterLink>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- Sidebar -->
        <aside class="lg:col-span-1">
          <nav class="card p-2 space-y-1 sticky top-24">
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive(item.to)
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:text-text hover:bg-bg'
              ]"
            >
              <component :is="item.icon" class="w-5 h-5" />
              <span class="text-sm font-medium">{{ t(item.name) }}</span>
            </RouterLink>
          </nav>
        </aside>

        <!-- Main content -->
        <main class="lg:col-span-4">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>
