<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import {
  HomeIcon,
  ChartBarSquareIcon,
  TrophyIcon,
  UserCircleIcon
} from '@heroicons/vue/24/outline'
import {
  HomeIcon as HomeIconSolid,
  ChartBarSquareIcon as ChartBarSquareIconSolid,
  TrophyIcon as TrophyIconSolid,
  UserCircleIcon as UserCircleIconSolid
} from '@heroicons/vue/24/solid'

const { t } = useI18n()
const route = useRoute()
const { isAuthenticated } = useAuth()

const navItems = [
  {
    name: 'nav.home',
    to: '/',
    icon: HomeIcon,
    iconActive: HomeIconSolid
  },
  {
    name: 'nav.predictions',
    to: '/predictions',
    icon: ChartBarSquareIcon,
    iconActive: ChartBarSquareIconSolid
  },
  {
    name: 'nav.leagues',
    to: '/accuracy',
    icon: TrophyIcon,
    iconActive: TrophyIconSolid
  },
  {
    name: 'nav.dashboard',
    to: isAuthenticated.value ? '/dashboard' : '/login',
    icon: UserCircleIcon,
    iconActive: UserCircleIconSolid,
    authRequired: false
  }
]

function isActive(path) {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border safe-area-bottom">
    <div class="flex items-center justify-around h-16">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex flex-col items-center justify-center flex-1 h-full transition-colors',
          isActive(item.to) ? 'text-accent' : 'text-muted'
        ]"
      >
        <component
          :is="isActive(item.to) ? item.iconActive : item.icon"
          class="w-6 h-6 mb-1"
        />
        <span class="text-xs font-medium">{{ t(item.name) }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
