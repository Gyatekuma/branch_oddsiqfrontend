<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePredictionsStore } from '@/stores/predictions'
import { useOddsStore } from '@/stores/odds'
import { usePremium } from '@/composables/usePremium'
import { useLocale } from '@/composables/useLocale'
import ConfidenceMeter from '@/components/predictions/ConfidenceMeter.vue'
import ValueBetBadge from '@/components/predictions/ValueBetBadge.vue'
import FormTable from '@/components/predictions/FormTable.vue'
import H2HTable from '@/components/predictions/H2HTable.vue'
import PremiumBlur from '@/components/predictions/PremiumBlur.vue'
import OddsTable from '@/components/odds/OddsTable.vue'
import MarketOddsTable from '@/components/odds/MarketOddsTable.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import {
  ArrowLeftIcon,
  ClockIcon,
  ShareIcon,
  BookmarkIcon,
  SparklesIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/vue/24/solid'

const { t } = useI18n()
const route = useRoute()
const { formatDate, formatTime } = useLocale()
const predictionsStore = usePredictionsStore()
const oddsStore = useOddsStore()
const { isPremium, canSeeExpertAnalysis } = usePremium()

const loading = ref(true)
const copied = ref(false)
const error = ref(null)

// Get prediction from store
const prediction = computed(() => predictionsStore.currentPrediction)

// Extract fixture from prediction
const fixture = computed(() => prediction.value?.fixture)

// Extract form data from prediction response
const homeForm = computed(() => {
  const formString = prediction.value?.home_team_form?.form_string || ''
  return formString.split('')
})

const awayForm = computed(() => {
  const formString = prediction.value?.away_team_form?.form_string || ''
  return formString.split('')
})

// Extract form stats from prediction response
const homeFormStats = computed(() => {
  return prediction.value?.home_team_form?.stats || null
})

const awayFormStats = computed(() => {
  return prediction.value?.away_team_form?.stats || null
})

// Extract H2H data from prediction response
const h2hMatches = computed(() => {
  return prediction.value?.head_to_head?.matches || []
})

// Extract odds from prediction response or odds store
const oddsData = computed(() => {
  return prediction.value?.odds_comparison || oddsStore.odds || []
})

// Calculate best odds from odds_comparison
const bestOdds = computed(() => {
  const odds = oddsData.value
  if (!odds || !odds.length) return oddsStore.bestOdds || null

  let best = { home: null, draw: null, away: null }

  odds.forEach(odd => {
    const bookmaker = odd.bookmaker || odd.bookmaker_name
    const homeOdds = odd.home_odds || odd.home_win_odds
    const drawOdds = odd.draw_odds
    const awayOdds = odd.away_odds || odd.away_win_odds

    if (homeOdds && (!best.home || homeOdds > best.home.odds)) {
      best.home = { odds: homeOdds, bookmaker }
    }
    if (drawOdds && (!best.draw || drawOdds > best.draw.odds)) {
      best.draw = { odds: drawOdds, bookmaker }
    }
    if (awayOdds && (!best.away || awayOdds > best.away.odds)) {
      best.away = { odds: awayOdds, bookmaker }
    }
  })

  return best
})

// Extract market odds (Over/Under, Double Chance)
const overUnderOdds = computed(() => {
  return prediction.value?.market_odds?.over_under || []
})

const doubleChanceOdds = computed(() => {
  return prediction.value?.market_odds?.double_chance || []
})

const bttsOdds = computed(() => {
  return prediction.value?.market_odds?.btts || []
})

// Extract analysis data
const analysis = computed(() => prediction.value?.analysis)

// Confidence value - backend already returns percentage (e.g., 85.5)
const confidenceValue = computed(() => {
  const raw = prediction.value?.confidence_score ?? 0
  let score = Number(raw)
  while (score > 100) {
    score = score / 100
  }
  return Math.round(score)
})

const outcomeLabel = computed(() => {
  const outcome = prediction.value?.predicted_outcome
  if (outcome === 'home') return t('match.outcomes.home')
  if (outcome === 'draw') return t('match.outcomes.draw')
  if (outcome === 'away') return t('match.outcomes.away')
  return outcome
})

const outcomeVariant = computed(() => {
  const outcome = prediction.value?.predicted_outcome
  if (outcome === 'home') return 'success'
  if (outcome === 'draw') return 'warning'
  if (outcome === 'away') return 'danger'
  return 'default'
})

// Get kickoff time
const kickoffTime = computed(() => {
  return fixture.value?.kickoff_at || fixture.value?.kickoff
})

// Get team logos
const homeTeamLogo = computed(() => {
  return fixture.value?.home_team?.logo_url || fixture.value?.home_team?.logo
})

const awayTeamLogo = computed(() => {
  return fixture.value?.away_team?.logo_url || fixture.value?.away_team?.logo
})

// Get league logo
const leagueLogo = computed(() => {
  return fixture.value?.league?.logo_url || fixture.value?.league?.logo
})

onMounted(async () => {
  loading.value = true
  error.value = null
  const predictionId = route.params.id

  console.log('[MatchDetail] Loading prediction ID:', predictionId)

  try {
    // Fetch the prediction (which includes fixture, form, h2h, odds data)
    const pred = await predictionsStore.fetchById(predictionId)
    console.log('[MatchDetail] Fetched prediction:', pred)

    if (!pred) {
      error.value = 'Prediction not found'
      loading.value = false
      return
    }

    // If odds not included in prediction, fetch separately
    if (!pred.odds_comparison?.length && pred.fixture_id) {
      try {
        await oddsStore.fetchByFixture(pred.fixture_id)
      } catch (oddsErr) {
        console.warn('[MatchDetail] Could not fetch odds:', oddsErr.message)
      }
    }

    console.log('[MatchDetail] Final prediction state:', prediction.value)
  } catch (err) {
    console.error('[MatchDetail] Failed to load match details:', err)
    error.value = err.response?.data?.message || 'Failed to load match details'
  } finally {
    loading.value = false
  }
})

async function handleShare() {
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    const input = document.createElement('input')
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

async function handleSave() {
  if (prediction.value?.is_saved) {
    await predictionsStore.unsavePrediction(prediction.value.id)
  } else {
    await predictionsStore.savePrediction(prediction.value.id)
  }
}
</script>

<template>
  <div class="py-8">
    <div class="container-app">
      <!-- Back button -->
      <RouterLink
        to="/predictions"
        class="inline-flex items-center gap-2 text-muted hover:text-text transition-colors mb-6"
      >
        <ArrowLeftIcon class="w-4 h-4" />
        {{ t('common.back') }}
      </RouterLink>

      <!-- Loading state -->
      <div v-if="loading" class="space-y-6">
        <AppSkeleton height="200px" rounded="lg" />
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AppSkeleton height="300px" rounded="lg" class="lg:col-span-2" />
          <AppSkeleton height="300px" rounded="lg" />
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="card p-12 text-center">
        <p class="text-danger text-lg mb-4">{{ error }}</p>
        <RouterLink to="/predictions">
          <AppButton>Back to Predictions</AppButton>
        </RouterLink>
      </div>

      <!-- Main content -->
      <template v-else-if="prediction && fixture">
        <!-- Match Header -->
        <div class="card p-6 mb-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <!-- League info -->
            <div v-if="fixture.league" class="flex items-center gap-2">
              <img
                v-if="leagueLogo"
                :src="leagueLogo"
                :alt="fixture.league.name"
                class="w-6 h-6"
              >
              <span class="text-sm text-muted">{{ fixture.league.name }}</span>
              <span v-if="fixture.league.country" class="text-xs text-muted">
                ({{ fixture.league.country }})
              </span>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <AppButton variant="ghost" size="sm" @click="handleSave">
                <BookmarkIconSolid v-if="prediction.is_saved" class="w-4 h-4 text-accent" />
                <BookmarkIcon v-else class="w-4 h-4" />
              </AppButton>
              <AppButton variant="ghost" size="sm" @click="handleShare">
                <ShareIcon class="w-4 h-4" />
                <span class="ml-1">{{ copied ? 'Copied!' : t('match.share') }}</span>
              </AppButton>
            </div>
          </div>

          <!-- Teams -->
          <div class="flex items-center justify-center gap-8 mb-6">
            <!-- Home team -->
            <div class="text-center flex-1">
              <div class="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface mx-auto mb-3 flex items-center justify-center overflow-hidden">
                <img
                  v-if="homeTeamLogo"
                  :src="homeTeamLogo"
                  :alt="fixture.home_team?.name"
                  class="w-12 h-12 md:w-14 md:h-14 object-contain"
                >
                <span v-else class="text-2xl font-bold text-muted">H</span>
              </div>
              <h2 class="font-display font-bold text-lg md:text-xl text-text">
                {{ fixture.home_team?.name || 'Home Team' }}
              </h2>
            </div>

            <!-- VS -->
            <div class="text-center">
              <div class="text-muted text-sm mb-1">VS</div>
              <div class="flex items-center gap-2 text-sm text-muted">
                <ClockIcon class="w-4 h-4" />
                <span>{{ formatTime(kickoffTime) }}</span>
              </div>
              <div class="text-xs text-muted mt-1">
                {{ formatDate(kickoffTime) }}
              </div>
            </div>

            <!-- Away team -->
            <div class="text-center flex-1">
              <div class="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface mx-auto mb-3 flex items-center justify-center overflow-hidden">
                <img
                  v-if="awayTeamLogo"
                  :src="awayTeamLogo"
                  :alt="fixture.away_team?.name"
                  class="w-12 h-12 md:w-14 md:h-14 object-contain"
                >
                <span v-else class="text-2xl font-bold text-muted">A</span>
              </div>
              <h2 class="font-display font-bold text-lg md:text-xl text-text">
                {{ fixture.away_team?.name || 'Away Team' }}
              </h2>
            </div>
          </div>

          <!-- Prediction summary -->
          <div class="flex flex-col md:flex-row items-center justify-center gap-6 pt-6 border-t border-border">
            <div class="text-center">
              <p class="stat-label mb-2">{{ t('match.prediction') }}</p>
              <AppBadge :variant="outcomeVariant" size="lg">
                {{ outcomeLabel }}
              </AppBadge>
            </div>

            <ConfidenceMeter :value="confidenceValue" size="lg" />

            <ValueBetBadge v-if="prediction.is_value_bet" size="lg" />
          </div>
        </div>

        <!-- Main content grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left column -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Analysis Breakdown -->
            <div v-if="analysis" class="card p-6">
              <div class="flex items-center gap-2 mb-4">
                <ChartBarIcon class="w-5 h-5 text-accent" />
                <h3 class="section-header">Analysis Breakdown</h3>
              </div>

              <!-- Analysis Factors -->
              <div v-if="analysis.factors?.length" class="space-y-3 mb-6">
                <div
                  v-for="factor in analysis.factors"
                  :key="factor.name"
                  class="flex items-center justify-between p-3 bg-bg rounded-lg"
                >
                  <div>
                    <p class="text-sm font-medium text-text">{{ factor.name }}</p>
                    <p class="text-xs text-muted">{{ factor.description }}</p>
                  </div>
                  <span class="text-sm font-display font-bold text-accent">{{ factor.weight }}</span>
                </div>
              </div>

              <!-- Score Comparison -->
              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-bg rounded-lg text-center">
                  <p class="text-xs text-muted mb-2">{{ fixture.home_team?.name }}</p>
                  <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-muted">Form</span>
                      <span class="font-medium text-text">{{ analysis.home_form_score?.toFixed(0) || 50 }}%</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-muted">H2H</span>
                      <span class="font-medium text-text">{{ analysis.home_h2h_score?.toFixed(0) || 50 }}%</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-muted">Advantage</span>
                      <span class="font-medium text-accent">{{ analysis.home_advantage?.toFixed(0) || 50 }}%</span>
                    </div>
                  </div>
                </div>
                <div class="p-4 bg-bg rounded-lg text-center">
                  <p class="text-xs text-muted mb-2">{{ fixture.away_team?.name }}</p>
                  <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-muted">Form</span>
                      <span class="font-medium text-text">{{ analysis.away_form_score?.toFixed(0) || 50 }}%</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-muted">H2H</span>
                      <span class="font-medium text-text">{{ analysis.away_h2h_score?.toFixed(0) || 50 }}%</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-muted">Advantage</span>
                      <span class="font-medium text-text">{{ analysis.away_advantage?.toFixed(0) || 50 }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Expert Analysis -->
            <div v-if="prediction.expert_note" class="card p-6">
              <div class="flex items-center gap-2 mb-4">
                <SparklesIcon class="w-5 h-5 text-gold" />
                <h3 class="section-header">{{ t('match.expertAnalysis') }}</h3>
              </div>

              <template v-if="canSeeExpertAnalysis">
                <p class="text-text leading-relaxed">
                  {{ prediction.expert_note }}
                </p>
              </template>
              <PremiumBlur v-else height="100px">
                <p class="text-text leading-relaxed">
                  Our expert analysis reveals key factors that make this prediction stand out...
                </p>
              </PremiumBlur>
            </div>

            <!-- Odds Table (1X2) -->
            <OddsTable
              :odds="oddsData"
              :best-odds="bestOdds"
            />

            <!-- Market Odds (Over/Under, Double Chance, BTTS) -->
            <MarketOddsTable
              :over-under="overUnderOdds"
              :double-chance="doubleChanceOdds"
              :btts="bttsOdds"
            />
          </div>

          <!-- Right column -->
          <div class="space-y-6">
            <!-- Form -->
            <FormTable
              :home-team="fixture.home_team?.name"
              :away-team="fixture.away_team?.name"
              :home-form="homeForm"
              :away-form="awayForm"
              :home-stats="homeFormStats"
              :away-stats="awayFormStats"
            />

            <!-- H2H Summary -->
            <div v-if="prediction.head_to_head" class="card p-4">
              <h3 class="section-header mb-4">{{ t('match.h2h') }}</h3>

              <div v-if="prediction.head_to_head.total_matches > 0" class="space-y-4">
                <!-- H2H Stats -->
                <div class="grid grid-cols-3 gap-2 text-center">
                  <div class="p-3 bg-bg rounded-lg">
                    <p class="text-2xl font-display font-bold text-accent">
                      {{ prediction.head_to_head.home_wins }}
                    </p>
                    <p class="text-xs text-muted truncate">{{ fixture.home_team?.name }}</p>
                  </div>
                  <div class="p-3 bg-bg rounded-lg">
                    <p class="text-2xl font-display font-bold text-draw">
                      {{ prediction.head_to_head.draws }}
                    </p>
                    <p class="text-xs text-muted">Draws</p>
                  </div>
                  <div class="p-3 bg-bg rounded-lg">
                    <p class="text-2xl font-display font-bold text-text">
                      {{ prediction.head_to_head.away_wins }}
                    </p>
                    <p class="text-xs text-muted truncate">{{ fixture.away_team?.name }}</p>
                  </div>
                </div>

                <!-- H2H Summary text -->
                <p class="text-xs text-muted text-center">
                  {{ prediction.head_to_head.summary }}
                </p>

                <!-- Recent H2H matches -->
                <H2HTable
                  v-if="h2hMatches.length"
                  :matches="h2hMatches"
                  :home-team-name="fixture.home_team?.name"
                  :away-team-name="fixture.away_team?.name"
                />
              </div>

              <div v-else class="text-center py-6 text-muted text-sm">
                No head-to-head history found
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Not found -->
      <div v-else class="card p-12 text-center">
        <p class="text-muted text-lg mb-4">Match not found</p>
        <RouterLink to="/predictions">
          <AppButton>Back to Predictions</AppButton>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
