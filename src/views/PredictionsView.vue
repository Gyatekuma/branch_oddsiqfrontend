<script setup>
import { ref, computed, watch, onMounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePredictionsStore } from '@/stores/predictions'
import { usePremium } from '@/composables/usePremium'
import { useAuthStore } from '@/stores/auth'
import SportsTabs from '@/components/layout/SportsTabs.vue'
import PredictionCard from '@/components/predictions/PredictionCard.vue'
import PremiumBlur from '@/components/predictions/PremiumBlur.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import PullToRefreshIndicator from '@/components/ui/PullToRefreshIndicator.vue'
import { usePullToRefresh } from '@/composables/usePullToRefresh'
import { FunnelIcon, CalendarIcon, GlobeAltIcon, BoltIcon, FireIcon, ArrowsUpDownIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const predictionsStore = usePredictionsStore()
const authStore = useAuthStore()
const { canSeePrediction } = usePremium()

const selectedSport = ref(null)
const selectedDate = ref('')
const selectedLeagueType = ref('')
const showFilters = ref(false)
const dateInputRef = useTemplateRef('dateInput')

// ── Client-side filters ───────────────────────────────────────
const confidenceFilter = ref('all')  // all | high | medium | low | value
const sortBy = ref('kickoff')        // kickoff | confidence

const confidenceChips = [
  { key: 'all',    label: 'All' },
  { key: 'high',   label: 'High 70%+' },
  { key: 'medium', label: 'Medium' },
  { key: 'low',    label: 'Low' },
  { key: 'value',  label: 'Value Bets' },
]

function normaliseConf(raw) {
  let s = Number(raw ?? 0)
  while (s > 100) s /= 100
  return Math.round(s)
}

const filteredAndSorted = computed(() => {
  let list = [...(predictionsStore.predictions || [])]

  // Confidence / value filter
  if (confidenceFilter.value === 'high') {
    list = list.filter(p => normaliseConf(p.confidence_score) >= 70)
  } else if (confidenceFilter.value === 'medium') {
    list = list.filter(p => { const c = normaliseConf(p.confidence_score); return c >= 55 && c < 70 })
  } else if (confidenceFilter.value === 'low') {
    list = list.filter(p => normaliseConf(p.confidence_score) < 55)
  } else if (confidenceFilter.value === 'value') {
    list = list.filter(p => p.is_value_bet)
  }

  // Sort
  if (sortBy.value === 'confidence') {
    list.sort((a, b) => normaliseConf(b.confidence_score) - normaliseConf(a.confidence_score))
  } else {
    // kickoff ascending
    list.sort((a, b) => {
      const ta = new Date(a.fixture?.kickoff_at || a.kickoff_at || 0).getTime()
      const tb = new Date(b.fixture?.kickoff_at || b.kickoff_at || 0).getTime()
      return ta - tb
    })
  }

  return list
})

// League type options (computed for i18n)
const leagueTypeOptions = computed(() => [
  { value: '', label: t('predictions.filters.allCompetitions') },
  { value: 'domestic', label: t('predictions.filters.domestic') },
  { value: 'international', label: t('predictions.filters.international') },
  { value: 'international_club', label: t('predictions.filters.internationalClub') },
  { value: 'international_national', label: t('predictions.filters.internationalNational') }
])

const { isPulling, isRefreshing, pullDistance } = usePullToRefresh(fetchPredictions)

onMounted(async () => {
  await fetchPredictions()
})

async function fetchPredictions() {
  const params = {}
  if (selectedSport.value) params.sport = selectedSport.value
  if (selectedDate.value) params.date = selectedDate.value
  if (selectedLeagueType.value) params.type = selectedLeagueType.value

  console.log('[PredictionsView] Fetching with params:', params)
  await predictionsStore.fetchPredictions(params)
}

function handleSportChange(sport) {
  selectedSport.value = sport
  fetchPredictions()
}

// Watch for filter changes
watch(selectedDate, (newDate) => {
  console.log('[PredictionsView] Date changed to:', newDate)
  fetchPredictions()
})

watch(selectedLeagueType, (newType) => {
  console.log('[PredictionsView] League type changed to:', newType)
  fetchPredictions()
})

async function handleSave(id) {
  if (!authStore.isAuthenticated) return
  await predictionsStore.savePrediction(id)
}

async function handleUnsave(id) {
  await predictionsStore.unsavePrediction(id)
}

function clearFilters() {
  selectedSport.value = null
  selectedDate.value = ''
  selectedLeagueType.value = ''
  fetchPredictions()
}
</script>

<template>
  <div class="py-8">
    <PullToRefreshIndicator :is-pulling="isPulling" :is-refreshing="isRefreshing" :pull-distance="pullDistance" />
    <div class="container-app">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="font-display font-bold text-3xl md:text-4xl text-text mb-2">
          {{ t('predictions.title') }}
        </h1>
        <p class="text-muted">
          Today's expert predictions with confidence ratings
        </p>
      </div>

      <!-- Filters -->
      <div class="mb-6 space-y-4">
        <div class="flex items-center gap-2">
          <div class="flex-1 min-w-0">
            <SportsTabs
              :model-value="selectedSport"
              @update:model-value="handleSportChange"
            />
          </div>
          <button
            class="md:hidden p-2 text-muted hover:text-text shrink-0"
            @click="showFilters = !showFilters"
          >
            <FunnelIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Confidence chips — always visible -->
        <div class="flex flex-wrap items-center gap-2">
          <button v-for="chip in confidenceChips" :key="chip.key"
            @click="confidenceFilter = chip.key"
            :class="[
              'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
              confidenceFilter === chip.key
                ? 'bg-accent text-bg border-accent'
                : 'bg-surface border-border text-muted hover:border-accent/40 hover:text-text'
            ]">
            <FireIcon v-if="chip.key === 'value'" class="w-3 h-3 inline mr-1 text-gold" />
            {{ chip.label }}
          </button>
          <span v-if="confidenceFilter !== 'all' || sortBy !== 'kickoff'" class="text-xs text-muted ml-1">
            {{ filteredAndSorted.length }} shown
          </span>
        </div>

        <!-- Date / league / sort — hidden on mobile behind funnel -->
        <div :class="['flex flex-wrap items-center gap-3', showFilters ? 'flex' : 'hidden md:flex']">
          <!-- League Type Filter -->
          <div class="relative">
            <GlobeAltIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <select v-model="selectedLeagueType"
              class="input-field pl-10 pr-8 py-2 w-full md:w-auto cursor-pointer appearance-none bg-surface text-sm">
              <option v-for="option in leagueTypeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>

          <!-- Date picker -->
          <div class="relative">
            <CalendarIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none z-10" />
            <input ref="dateInput" v-model="selectedDate" type="date"
              class="input-field pl-10 pr-4 py-2 w-full md:w-auto cursor-pointer text-sm"
              @click="dateInputRef?.showPicker()">
          </div>

          <!-- Sort -->
          <button
            @click="sortBy = sortBy === 'kickoff' ? 'confidence' : 'kickoff'"
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-muted hover:text-text hover:border-accent/40 transition-all">
            <ArrowsUpDownIcon class="w-4 h-4" />
            {{ sortBy === 'kickoff' ? 'By Time' : 'By Confidence' }}
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="predictionsStore.loading && !predictionsStore.predictions.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AppSkeleton v-for="i in 9" :key="i" variant="card" />
      </div>

      <!-- Empty state -->
      <div v-else-if="!predictionsStore.predictions.length" class="card p-12 text-center">
        <p class="text-muted text-lg mb-4">
          {{ t('predictions.noResults') }}
        </p>
        <AppButton variant="outline" @click="clearFilters">
          Clear Filters
        </AppButton>
      </div>

      <!-- Empty after filter -->
      <div v-else-if="filteredAndSorted.length === 0" class="card p-12 text-center">
        <p class="text-muted text-lg mb-4">No predictions match this filter</p>
        <AppButton variant="outline" @click="confidenceFilter = 'all'">Clear Filter</AppButton>
      </div>

      <!-- Predictions grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <template v-for="(prediction, index) in filteredAndSorted" :key="prediction.id">
          <PredictionCard
            v-if="canSeePrediction(index)"
            :prediction="prediction"
            :show-save-button="authStore.isAuthenticated"
            @save="handleSave"
            @unsave="handleUnsave"
          />
          <PremiumBlur v-else height="220px">
            <PredictionCard :prediction="prediction" />
          </PremiumBlur>
        </template>
      </div>

      <!-- Load more -->
      <div v-if="predictionsStore.hasMore" class="mt-8 text-center">
        <AppButton
          variant="outline"
          :loading="predictionsStore.loading"
          @click="predictionsStore.loadMore()"
        >
          {{ t('predictions.loadMore') }}
        </AppButton>
      </div>

      <!-- Pagination info -->
      <div v-if="predictionsStore.pagination.total > 0" class="mt-6 text-center text-sm text-muted">
        Showing {{ predictionsStore.predictions.length }} of {{ predictionsStore.pagination.total }} predictions
      </div>
    </div>
  </div>
</template>
