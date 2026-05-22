<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useMarketsStore } from '@/stores/markets'
import { useAuthStore } from '@/stores/auth'
import { usePremium } from '@/composables/usePremium'
import MarketPredictionCard from '@/components/predictions/MarketPredictionCard.vue'
import PremiumBlur from '@/components/predictions/PremiumBlur.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import {
  ChartBarIcon,
  SparklesIcon,
  FireIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline'

const marketsStore = useMarketsStore()
const authStore = useAuthStore()
const { isPremium } = usePremium()

// ── Tab config ──────────────────────────────────────────────
const tabs = [
  {
    key: 'over_under',
    label: 'Over/Under',
    description: 'Total goals line',
    lines: [1.5, 2.5, 3.5, 4.5],
    defaultLine: 2.5
  },
  {
    key: 'btts',
    label: 'BTTS',
    description: 'Both Teams To Score',
    lines: null
  },
  {
    key: 'double_chance',
    label: 'Double Chance',
    description: '1X · X2 · 12',
    lines: null
  },
  {
    key: 'corners',
    label: 'Corners',
    description: 'Total corners line',
    lines: [8.5, 9.5, 10.5, 11.5],
    defaultLine: 9.5
  },
  {
    key: 'ht_ft',
    label: 'HT / FT',
    description: 'Half-time / Full-time',
    lines: null
  },
  {
    key: 'value_bets',
    label: 'Value Bets',
    description: 'Highest edge picks',
    lines: null,
    premium: true
  },
]

const activeTab = ref('over_under')
const activeLine = ref(2.5)

const currentTab = computed(() => tabs.find(t => t.key === activeTab.value))
const showLineSelector = computed(() => currentTab.value?.lines?.length > 0)

// ── Free user gating ─────────────────────────────────────────
// Free users see 5 results; beyond that gets blurred
const FREE_LIMIT = 5
const visiblePredictions = computed(() => marketsStore.predictions.slice(0, FREE_LIMIT))
const lockedPredictions = computed(() => marketsStore.predictions.slice(FREE_LIMIT))
const hasLocked = computed(() => !isPremium.value && marketsStore.predictions.length > FREE_LIMIT)

// ── Fetch ────────────────────────────────────────────────────
async function load() {
  const params = {}
  if (showLineSelector.value) params.line = activeLine.value
  await marketsStore.fetchMarket(activeTab.value, params)
}

async function switchTab(key) {
  const tab = tabs.find(t => t.key === key)
  activeTab.value = key
  if (tab?.defaultLine) activeLine.value = tab.defaultLine
  marketsStore.resetPage()
  await load()
}

async function switchLine(line) {
  activeLine.value = line
  marketsStore.resetPage()
  await load()
}

async function goToPage(p) {
  marketsStore.page = p
  await load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(activeTab, () => {}) // handled by switchTab

onMounted(load)
</script>

<template>
  <div class="py-10 min-h-screen bg-bg">
    <div class="container-app">

      <!-- Page header -->
      <div class="mb-10">
        <p class="section-header mb-2">Betting Markets</p>
        <h1 class="font-display font-bold text-3xl md:text-4xl text-text mb-2">
          Markets
        </h1>
        <p class="text-muted">
          AI-powered predictions across Over/Under, BTTS, Double Chance, Corners, and more.
        </p>
      </div>

      <!-- Market tabs -->
      <div class="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-2">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all',
            activeTab === tab.key
              ? 'bg-accent text-bg border-accent shadow-lg shadow-accent/20'
              : 'bg-surface text-muted border-border hover:border-accent/40 hover:text-text'
          ]"
          @click="switchTab(tab.key)"
        >
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.premium"
            class="ml-1.5 text-[10px] font-bold text-gold"
          >★</span>
        </button>
      </div>

      <!-- Tab description -->
      <p class="text-xs text-muted mb-6">{{ currentTab?.description }}</p>

      <!-- Line selector (Over/Under + Corners) -->
      <div v-if="showLineSelector" class="flex items-center gap-2 mb-8">
        <span class="text-xs text-muted uppercase tracking-wider mr-1">Line:</span>
        <button
          v-for="line in currentTab.lines"
          :key="line"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-bold border transition-all',
            activeLine === line
              ? 'bg-accent/15 text-accent border-accent/40'
              : 'bg-surface text-muted border-border hover:border-accent/30 hover:text-text'
          ]"
          @click="switchLine(line)"
        >
          {{ line }}
        </button>
      </div>

      <!-- Value bets premium notice (if tab is value_bets and user is free) -->
      <div
        v-if="activeTab === 'value_bets' && !isPremium"
        class="card p-6 mb-8 flex items-center gap-4 border-gold/20 bg-gradient-to-r from-surface to-bg"
      >
        <SparklesIcon class="w-8 h-8 text-gold shrink-0" />
        <div class="flex-1">
          <p class="font-semibold text-text mb-0.5">Premium feature</p>
          <p class="text-sm text-muted">Value bets show predictions where our model finds the most edge over the bookmaker's odds.</p>
        </div>
        <RouterLink to="/premium" class="shrink-0">
          <AppButton variant="gold" size="sm">Upgrade</AppButton>
        </RouterLink>
      </div>

      <!-- Loading skeletons -->
      <div
        v-if="marketsStore.loading"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AppSkeleton v-for="i in 6" :key="i" variant="card" class="h-52" />
      </div>

      <!-- Error -->
      <div v-else-if="marketsStore.error" class="card p-10 text-center">
        <p class="text-muted mb-4">{{ marketsStore.error }}</p>
        <AppButton variant="outline" size="sm" @click="load">Retry</AppButton>
      </div>

      <!-- Empty -->
      <div
        v-else-if="marketsStore.predictions.length === 0"
        class="card p-14 text-center"
      >
        <ChartBarIcon class="w-10 h-10 text-muted/30 mx-auto mb-4" />
        <p class="text-muted text-lg mb-1">No predictions available</p>
        <p class="text-sm text-muted/60">Check back later or try a different market.</p>
      </div>

      <!-- Predictions grid -->
      <template v-else>
        <!-- Visible predictions (free: 0-4, premium: all) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MarketPredictionCard
            v-for="prediction in (isPremium ? marketsStore.predictions : visiblePredictions)"
            :key="prediction.id"
            :prediction="prediction"
            :is-premium="isPremium"
          />
        </div>

        <!-- Locked cards for free users (5+) -->
        <div v-if="hasLocked" class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PremiumBlur
            v-for="prediction in lockedPredictions"
            :key="prediction.id"
            height="210px"
          >
            <MarketPredictionCard :prediction="prediction" />
          </PremiumBlur>
        </div>

        <!-- Premium upgrade nudge (shown once, after free limit) -->
        <div
          v-if="hasLocked"
          class="mt-8 relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-surface to-bg p-8 text-center"
        >
          <div class="absolute top-0 right-0 w-48 h-48 bg-gold/6 rounded-full blur-3xl pointer-events-none"></div>
          <div class="relative">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold mb-4">
              <FireIcon class="w-3.5 h-3.5" />
              {{ marketsStore.predictions.length - FREE_LIMIT }} more predictions locked
            </div>
            <h3 class="font-display font-bold text-xl text-text mb-2">
              Unlock all {{ currentTab?.label }} predictions
            </h3>
            <p class="text-muted text-sm mb-6 max-w-md mx-auto">
              Premium gives you every prediction, value edges, expert notes, and best odds — across all markets.
            </p>
            <RouterLink to="/premium">
              <AppButton variant="gold" size="lg">
                <SparklesIcon class="w-4 h-4 mr-2" />
                Go Premium
              </AppButton>
            </RouterLink>
          </div>
        </div>

        <!-- Pagination (premium users) -->
        <div v-if="isPremium && marketsStore.totalPages > 1" class="mt-8 flex items-center justify-center gap-2">
          <button
            :disabled="marketsStore.page <= 1"
            class="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium text-muted transition-all disabled:opacity-40 hover:border-accent/40 hover:text-text"
            @click="goToPage(marketsStore.page - 1)"
          >
            <ChevronLeftIcon class="w-4 h-4" />
            Prev
          </button>

          <div class="flex gap-1">
            <template v-for="p in marketsStore.totalPages" :key="p">
              <button
                v-if="p === 1 || p === marketsStore.totalPages || Math.abs(p - marketsStore.page) <= 1"
                :class="[
                  'w-9 h-9 rounded-lg text-sm font-semibold border transition-all',
                  p === marketsStore.page
                    ? 'bg-accent text-bg border-accent'
                    : 'bg-surface text-muted border-border hover:border-accent/40 hover:text-text'
                ]"
                @click="goToPage(p)"
              >{{ p }}</button>
              <span
                v-else-if="p === marketsStore.page - 2 || p === marketsStore.page + 2"
                class="w-9 h-9 flex items-end justify-center text-muted pb-1 text-sm"
              >…</span>
            </template>
          </div>

          <button
            :disabled="marketsStore.page >= marketsStore.totalPages"
            class="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium text-muted transition-all disabled:opacity-40 hover:border-accent/40 hover:text-text"
            @click="goToPage(marketsStore.page + 1)"
          >
            Next
            <ChevronRightIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Result count -->
        <div v-if="isPremium && marketsStore.total > 0" class="mt-4 text-center text-sm text-muted">
          Showing {{ (marketsStore.page - 1) * marketsStore.perPage + 1 }}–{{ Math.min(marketsStore.page * marketsStore.perPage, marketsStore.total) }} of {{ marketsStore.total }} predictions
        </div>
      </template>

    </div>
  </div>
</template>
