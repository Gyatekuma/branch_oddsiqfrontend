<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePredictionsStore } from '@/stores/predictions'
import { usePremium } from '@/composables/usePremium'
import { useAuthStore } from '@/stores/auth'
import SportsTabs from '@/components/layout/SportsTabs.vue'
import PredictionCard from '@/components/predictions/PredictionCard.vue'
import PremiumBlur from '@/components/predictions/PremiumBlur.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { FunnelIcon, CalendarIcon, GlobeAltIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const predictionsStore = usePredictionsStore()
const authStore = useAuthStore()
const { canSeePrediction } = usePremium()

const selectedSport = ref(null)
const selectedDate = ref('')  // Empty = no date filter (show all)
const selectedLeagueType = ref('')  // Empty = all types
const showFilters = ref(false)

// League type options (computed for i18n)
const leagueTypeOptions = computed(() => [
  { value: '', label: t('predictions.filters.allCompetitions') },
  { value: 'domestic', label: t('predictions.filters.domestic') },
  { value: 'international', label: t('predictions.filters.international') },
  { value: 'international_club', label: t('predictions.filters.internationalClub') },
  { value: 'international_national', label: t('predictions.filters.internationalNational') }
])

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
        <div class="flex items-center justify-between">
          <SportsTabs
            :model-value="selectedSport"
            @update:model-value="handleSportChange"
          />

          <button
            class="md:hidden p-2 text-muted hover:text-text"
            @click="showFilters = !showFilters"
          >
            <FunnelIcon class="w-5 h-5" />
          </button>
        </div>

        <div :class="['flex flex-wrap items-center gap-4', showFilters ? 'block' : 'hidden md:flex']">
          <!-- League Type Filter -->
          <div class="relative">
            <GlobeAltIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <select
              v-model="selectedLeagueType"
              class="input-field pl-10 pr-8 py-2 w-full md:w-auto cursor-pointer appearance-none bg-surface"
            >
              <option
                v-for="option in leagueTypeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Date picker -->
          <div class="relative">
            <CalendarIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              v-model="selectedDate"
              type="date"
              class="input-field pl-10 pr-4 py-2 w-full md:w-auto cursor-pointer"
            >
          </div>
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

      <!-- Predictions grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <template v-for="(prediction, index) in predictionsStore.predictions" :key="prediction.id">
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
