<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  HomeIcon,
  ChartBarSquareIcon,
  PresentationChartLineIcon,
  TrophyIcon,
  UserCircleIcon
} from '@heroicons/vue/24/outline'
import {
  HomeIcon as HomeIconSolid,
  ChartBarSquareIcon as ChartBarSquareIconSolid,
  PresentationChartLineIcon as PresentationChartLineIconSolid,
  TrophyIcon as TrophyIconSolid,
  UserCircleIcon as UserCircleIconSolid
} from '@heroicons/vue/24/solid'

const { t } = useI18n()
const route = useRoute()

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
    name: 'nav.markets',
    to: '/markets',
    icon: PresentationChartLineIcon,
    iconActive: PresentationChartLineIconSolid
  },
  {
    name: 'nav.accuracy',
    to: '/accuracy',
    icon: TrophyIcon,
    iconActive: TrophyIconSolid
  },
  {
    name: 'nav.dashboard',
    to: '/dashboard',
    icon: UserCircleIcon,
    iconActive: UserCircleIconSolid
  }
]


function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface/95 backdrop-blur-xl border-t border-border safe-area-bottom">
    <div class="nav-inner flex items-end justify-around px-2">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item flex flex-col items-center justify-end flex-1 pb-2 pt-3 relative"
        :class="isActive(item.to) ? 'active' : ''"
      >
        <span
          v-if="isActive(item.to)"
          class="active-pill absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-accent"
        />
        <component
          :is="isActive(item.to) ? item.iconActive : item.icon"
          class="w-6 h-6 transition-transform"
          :class="isActive(item.to) ? 'text-accent scale-110' : 'text-muted'"
        />
        <span
          class="text-[10px] font-semibold mt-1 tracking-wide transition-colors"
          :class="isActive(item.to) ? 'text-accent' : 'text-muted'"
        >
          {{ t(item.name) }}
        </span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.nav-inner {
  height: 60px;
}

.nav-item {
  min-width: 0;
  transition: opacity 0.15s ease;
}

.nav-item:active {
  opacity: 0.7;
}
</style>
