<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import leaguesApi from '@/api/leagues'
import { useLocale } from '@/composables/useLocale'
import { getLeagueLogo } from '@/utils/leagueLogos'
import { usePremium } from '@/composables/usePremium'
import PredictionCard from '@/components/predictions/PredictionCard.vue'
import PremiumBlur from '@/components/predictions/PremiumBlur.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppButton from '@/components/ui/AppButton.vue'
import {
  ArrowLeftIcon,
  TrophyIcon,
  CalendarIcon,
  BoltIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const { formatDate, formatTime } = useLocale()
const { canSeePrediction } = usePremium()

const loading = ref(true)
const league = ref(null)
const activeTab = ref('predictions')
const logoError = ref(false)

// Predictions
const predictions = ref([])
const predPage = ref(1)
const predTotalPages = ref(1)
const predLoading = ref(false)

// Fixtures
const fixtures = ref([])
const fixPage = ref(1)
const fixTotalPages = ref(1)
const fixLoading = ref(false)

async function loadPredictions(page = 1) {
  predLoading.value = true
  try {
    const res = await leaguesApi.getPredictions(route.params.id, { page, per_page: 9 })
    predictions.value = res.predictions || []
    predPage.value = page
    predTotalPages.value = res.total_pages || 1
  } catch {}
  predLoading.value = false
}

async function loadFixtures(page = 1) {
  fixLoading.value = true
  try {
    const res = await leaguesApi.getFixtures(route.params.id, { page, per_page: 15 })
    fixtures.value = res.fixtures || []
    fixPage.value = page
    fixTotalPages.value = res.total_pages || 1
  } catch {}
  fixLoading.value = false
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'fixtures' && fixtures.value.length === 0) loadFixtures(1)
}

onMounted(async () => {
  loading.value = true
  try {
    const [leagueData] = await Promise.all([
      leaguesApi.getById(route.params.id),
      loadPredictions(1),
    ])
    league.value = leagueData.league
  } catch {}
  loading.value = false
})

function kickoffDisplay(kickoff) {
  if (!kickoff) return ''
  const d = new Date(kickoff)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return `Today · ${formatTime(kickoff)}`
  return `${formatDate(kickoff, { month: 'short', day: 'numeric' })} · ${formatTime(kickoff)}`
}
</script>

<template>
  <div class="min-h-screen bg-bg py-8">
    <div class="container-app">

      <!-- Back -->
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-muted hover:text-text transition-colors mb-6 text-sm"
      >
        <ArrowLeftIcon class="w-4 h-4" />
        Back
      </RouterLink>

      <!-- Loading -->
      <div v-if="loading" class="space-y-4">
        <AppSkeleton height="100px" rounded="xl" />
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AppSkeleton v-for="i in 6" :key="i" variant="card" />
        </div>
      </div>

      <template v-else-if="league">

        <!-- League Header -->
        <div class="flex items-center gap-5 mb-8 p-5 rounded-2xl border border-border bg-surface">
          <div class="w-16 h-16 rounded-xl bg-bg border border-border flex items-center justify-center overflow-hidden shrink-0">
            <img
              v-if="(getLeagueLogo(league.name) || league.logo_url || league.logo) && !logoError"
              :src="getLeagueLogo(league.name) || league.logo_url || league.logo"
              :alt="league.name"
              class="w-12 h-12 object-contain"
              @error="logoError = true"
            >
            <TrophyIcon v-else class="w-8 h-8 text-muted/40" />
          </div>
          <div>
            <h1 class="font-display font-bold text-2xl md:text-3xl text-text">{{ league.name }}</h1>
            <p v-if="league.country" class="text-muted text-sm mt-0.5">{{ league.country }}</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-2 mb-6">
          <button
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all',
              activeTab === 'predictions'
                ? 'bg-accent text-bg border-accent'
                : 'bg-surface text-muted border-border hover:border-accent/40 hover:text-text'
            ]"
            @click="switchTab('predictions')"
          >
            <BoltIcon class="w-4 h-4" />
            Predictions
          </button>
          <button
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all',
              activeTab === 'fixtures'
                ? 'bg-accent text-bg border-accent'
                : 'bg-surface text-muted border-border hover:border-accent/40 hover:text-text'
            ]"
            @click="switchTab('fixtures')"
          >
            <CalendarIcon class="w-4 h-4" />
            Fixtures
          </button>
        </div>

        <!-- Predictions Tab -->
        <div v-if="activeTab === 'predictions'">
          <div v-if="predLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AppSkeleton v-for="i in 6" :key="i" variant="card" />
          </div>

          <div v-else-if="predictions.length === 0" class="card p-12 text-center text-muted">
            <BoltIcon class="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>No predictions available for this league yet.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <template v-for="(prediction, index) in predictions" :key="prediction.id">
              <PredictionCard v-if="canSeePrediction(index)" :prediction="prediction" />
              <PremiumBlur v-else height="220px">
                <PredictionCard :prediction="prediction" />
              </PremiumBlur>
            </template>
          </div>

          <!-- Pagination -->
          <div v-if="predTotalPages > 1" class="flex items-center justify-center gap-2 mt-8">
            <button
              class="p-2 rounded-lg border border-border bg-surface text-muted hover:text-text disabled:opacity-40 transition-colors"
              :disabled="predPage === 1"
              @click="loadPredictions(predPage - 1)"
            >
              <ChevronLeftIcon class="w-4 h-4" />
            </button>
            <span class="text-sm text-muted px-2">Page {{ predPage }} of {{ predTotalPages }}</span>
            <button
              class="p-2 rounded-lg border border-border bg-surface text-muted hover:text-text disabled:opacity-40 transition-colors"
              :disabled="predPage === predTotalPages"
              @click="loadPredictions(predPage + 1)"
            >
              <ChevronRightIcon class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Fixtures Tab -->
        <div v-if="activeTab === 'fixtures'">
          <div v-if="fixLoading" class="space-y-2">
            <AppSkeleton v-for="i in 8" :key="i" height="60px" rounded="lg" />
          </div>

          <div v-else-if="fixtures.length === 0" class="card p-12 text-center text-muted">
            <CalendarIcon class="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>No fixtures found for this league.</p>
          </div>

          <div v-else class="card divide-y divide-border overflow-hidden">
            <RouterLink
              v-for="fixture in fixtures"
              :key="fixture.id"
              :to="fixture.prediction_id ? `/match/${fixture.prediction_id}` : '#'"
              class="flex items-center justify-between px-5 py-4 hover:bg-bg/50 transition-colors group"
            >
              <div class="flex items-center gap-4 min-w-0">
                <div class="flex items-center gap-2 min-w-0">
                  <img
                    v-if="fixture.home_team?.logo_url || fixture.home_team?.logo"
                    :src="fixture.home_team.logo_url || fixture.home_team.logo"
                    class="w-5 h-5 object-contain shrink-0"
                  >
                  <span class="text-sm font-medium text-text truncate">{{ fixture.home_team?.name }}</span>
                </div>
                <span class="text-xs text-muted font-bold shrink-0">vs</span>
                <div class="flex items-center gap-2 min-w-0">
                  <img
                    v-if="fixture.away_team?.logo_url || fixture.away_team?.logo"
                    :src="fixture.away_team.logo_url || fixture.away_team.logo"
                    class="w-5 h-5 object-contain shrink-0"
                  >
                  <span class="text-sm font-medium text-text truncate">{{ fixture.away_team?.name }}</span>
                </div>
              </div>
              <div class="text-right text-xs text-muted shrink-0 ml-4">
                {{ kickoffDisplay(fixture.kickoff_at) }}
              </div>
            </RouterLink>
          </div>

          <!-- Pagination -->
          <div v-if="fixTotalPages > 1" class="flex items-center justify-center gap-2 mt-6">
            <button
              class="p-2 rounded-lg border border-border bg-surface text-muted hover:text-text disabled:opacity-40 transition-colors"
              :disabled="fixPage === 1"
              @click="loadFixtures(fixPage - 1)"
            >
              <ChevronLeftIcon class="w-4 h-4" />
            </button>
            <span class="text-sm text-muted px-2">Page {{ fixPage }} of {{ fixTotalPages }}</span>
            <button
              class="p-2 rounded-lg border border-border bg-surface text-muted hover:text-text disabled:opacity-40 transition-colors"
              :disabled="fixPage === fixTotalPages"
              @click="loadFixtures(fixPage + 1)"
            >
              <ChevronRightIcon class="w-4 h-4" />
            </button>
          </div>
        </div>

      </template>

      <!-- Not found -->
      <div v-else class="card p-12 text-center">
        <TrophyIcon class="w-10 h-10 mx-auto mb-3 text-muted opacity-30" />
        <p class="text-muted text-lg mb-4">League not found</p>
        <RouterLink to="/">
          <AppButton>Go Home</AppButton>
        </RouterLink>
      </div>

    </div>
  </div>
</template>
