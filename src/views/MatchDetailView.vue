<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePredictionsStore } from '@/stores/predictions'
import { usePremium } from '@/composables/usePremium'
import { useLocale } from '@/composables/useLocale'
import api from '@/api/axios'
import ConfidenceMeter from '@/components/predictions/ConfidenceMeter.vue'
import ValueBetBadge from '@/components/predictions/ValueBetBadge.vue'
import FormTable from '@/components/predictions/FormTable.vue'
import H2HTable from '@/components/predictions/H2HTable.vue'
import PremiumBlur from '@/components/predictions/PremiumBlur.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import {
  ArrowLeftIcon,
  ClockIcon,
  ShareIcon,
  BookmarkIcon,
  SparklesIcon,
  ChartBarIcon,
  XMarkIcon,
  LinkIcon,
} from '@heroicons/vue/24/outline'
import { BookmarkIcon as BookmarkIconSolid, CheckCircleIcon } from '@heroicons/vue/24/solid'

const { t } = useI18n()
const route = useRoute()
const { formatDate, formatTime } = useLocale()
const predictionsStore = usePredictionsStore()
const { isPremium, canSeeExpertAnalysis } = usePremium()

const loading = ref(true)
const copied = ref(false)
const error = ref(null)
const isPremiumGated = ref(false)

const prediction = computed(() => predictionsStore.currentPrediction)
const fixture = computed(() => prediction.value?.fixture)
const analysis = computed(() => prediction.value?.analysis)

// Form data
const homeForm = computed(() => (prediction.value?.home_team_form?.form_string || '').split(''))
const awayForm = computed(() => (prediction.value?.away_team_form?.form_string || '').split(''))
const homeFormStats = computed(() => prediction.value?.home_team_form?.stats || null)
const awayFormStats = computed(() => prediction.value?.away_team_form?.stats || null)
const h2hMatches = computed(() => prediction.value?.head_to_head?.matches || [])

// Confidence
const confidenceValue = computed(() => {
  const raw = prediction.value?.confidence_score ?? 0
  let score = Number(raw)
  while (score > 100) score /= 100
  return Math.round(score)
})

// Outcome label per chip
function outcomeDisplayName(outcome) {
  if (outcome === 'home') return fixture.value?.home_team?.name || 'Home'
  if (outcome === 'away') return fixture.value?.away_team?.name || 'Away'
  return 'Draw'
}

// Kickoff
const kickoffTime = computed(() => fixture.value?.kickoff_at || fixture.value?.kickoff)

// Logos
const homeTeamLogo = computed(() => fixture.value?.home_team?.logo_url || fixture.value?.home_team?.logo)
const awayTeamLogo = computed(() => fixture.value?.away_team?.logo_url || fixture.value?.away_team?.logo)
const leagueLogo = computed(() => fixture.value?.league?.logo_url || fixture.value?.league?.logo)

// ── Team comparison ────────────────────────────────────────────
const homeStats = computed(() => prediction.value?.home_team_form?.stats || null)
const awayStats = computed(() => prediction.value?.away_team_form?.stats || null)

const homeAvgScored = computed(() => {
  const s = homeStats.value
  if (!s?.matches_played) return 0
  return (s.goals_scored / s.matches_played).toFixed(1)
})
const awayAvgScored = computed(() => {
  const s = awayStats.value
  if (!s?.matches_played) return 0
  return (s.goals_scored / s.matches_played).toFixed(1)
})

function splitPct(homeVal, awayVal) {
  const h = Number(homeVal)
  const a = Number(awayVal)
  if (h + a === 0) return 50
  return Math.round((h / (h + a)) * 100)
}

const formSplitPct = computed(() =>
  splitPct(analysis.value?.home_form_score ?? 50, analysis.value?.away_form_score ?? 50)
)
const attackSplitPct = computed(() =>
  splitPct(homeAvgScored.value, awayAvgScored.value)
)

// H2H bar (home % | draws % | away %)
const h2hBar = computed(() => {
  const h2h = prediction.value?.head_to_head
  if (!h2h?.total_matches) return null
  const t = h2h.total_matches
  const homePct = Math.round((h2h.home_wins / t) * 100)
  const drawPct = Math.round((h2h.draws / t) * 100)
  const awayPct = 100 - homePct - drawPct
  return { homePct, drawPct, awayPct }
})

const hasComparisonData = computed(() =>
  (analysis.value?.home_form_score != null) || homeAvgScored.value > 0
)

// ── xG / Poisson λ ────────────────────────────────────────────
const lambdaHome = computed(() => analysis.value?.lambda_home)
const lambdaAway = computed(() => analysis.value?.lambda_away)
const lambdaTotal = computed(() => lambdaHome.value != null ? (lambdaHome.value + lambdaAway.value).toFixed(1) : null)
const lambdaSplitPct = computed(() => splitPct(lambdaHome.value ?? 0, lambdaAway.value ?? 0))

// ── Auto explanation & calibration ────────────────────────────
const autoExplanation = computed(() => analysis.value?.auto_explanation)
const calibration     = computed(() => analysis.value?.calibration)

// ── Market consensus ──────────────────────────────────────────
const marketConsensus = computed(() => analysis.value?.market_consensus)

// ── Market picks ───────────────────────────────────────────────
const marketPicks = ref({})
const marketPicksLoading = ref(false)

const marketPicksArray = computed(() => {
  const order = ['over_under', 'btts', 'double_chance', 'corners', 'ht_ft']
  return order
    .filter(k => marketPicks.value[k])
    .map(k => {
      const m = marketPicks.value[k]
      const top = m.predictions?.[0]
      if (!top) return null
      return {
        key: k,
        label: m.market_name || k,
        outcome: top.outcome_display || top.predicted_outcome,
        confidence: (() => {
          let s = Number(top.confidence_score ?? 0)
          while (s > 100) s /= 100
          return Math.round(s)
        })(),
        isValueBet: top.is_value_bet,
      }
    })
    .filter(Boolean)
})

// ── Vote widget ────────────────────────────────────────────────
const userVote = ref(null)
const voteKey = computed(() => `edi_vote_${fixture.value?.id || route.params.id}`)

function loadVote() {
  try { userVote.value = localStorage.getItem(voteKey.value) || null } catch {}
}

function castVote(outcome) {
  if (userVote.value) return
  userVote.value = outcome
  try { localStorage.setItem(voteKey.value, outcome) } catch {}
}

const voteAgreesWithAI = computed(() =>
  userVote.value && prediction.value?.predicted_outcome === userVote.value
)

// ── Share modal ────────────────────────────────────────────────
const showShareModal = ref(false)
const shareCopied = ref(false)

async function openShare() { showShareModal.value = true }

async function copyShareLink() {
  const url = window.location.href
  try { await navigator.clipboard.writeText(url) } catch {
    const el = document.createElement('input')
    el.value = url
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  shareCopied.value = true
  setTimeout(() => { shareCopied.value = false }, 2000)
}

async function nativeShare() {
  if (!navigator.share) { await copyShareLink(); return }
  const home = fixture.value?.home_team?.name || 'Home'
  const away = fixture.value?.away_team?.name || 'Away'
  const outcome = prediction.value?.predicted_outcome
  const label = outcome === 'home' ? home : outcome === 'away' ? away : 'Draw'
  try {
    await navigator.share({
      title: `${home} vs ${away} — edi predictions`,
      text: `AI predicts: ${label} with ${confidenceValue.value}% confidence`,
      url: window.location.href,
    })
  } catch {}
}

onMounted(async () => {
  loading.value = true
  error.value = null
  const predictionId = route.params.id
  try {
    const pred = await predictionsStore.fetchById(predictionId)
    if (!pred) {
      error.value = 'Prediction not found'
      loading.value = false
      return
    }
    // Load market picks and vote in parallel after main prediction resolves
    const fixtureId = pred.fixture?.id || pred.fixture_id
    if (fixtureId) {
      loadVote()
      marketPicksLoading.value = true
      api.get(`/api/markets/fixture/${fixtureId}`)
        .then(res => { marketPicks.value = res.data?.data?.markets || {} })
        .catch(() => {})
        .finally(() => { marketPicksLoading.value = false })
    }
  } catch (err) {
    if (err.response?.status === 403) {
      isPremiumGated.value = true
    } else {
      error.value = err.response?.data?.error || err.response?.data?.message || 'Failed to load match details'
    }
  } finally {
    loading.value = false
  }
})

function handleShare() { openShare() }

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

      <!-- Back -->
      <RouterLink to="/predictions"
        class="inline-flex items-center gap-2 text-muted hover:text-text transition-colors mb-6 text-sm">
        <ArrowLeftIcon class="w-4 h-4" />
        {{ t('common.back') }}
      </RouterLink>

      <!-- Loading -->
      <div v-if="loading" class="space-y-6">
        <AppSkeleton height="260px" rounded="lg" />
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AppSkeleton height="300px" rounded="lg" class="lg:col-span-2" />
          <AppSkeleton height="300px" rounded="lg" />
        </div>
      </div>

      <!-- Premium gate -->
      <div v-else-if="isPremiumGated" class="card p-12 text-center max-w-md mx-auto">
        <SparklesIcon class="w-12 h-12 text-gold mx-auto mb-4" />
        <h2 class="font-display font-bold text-xl text-text mb-2">Premium Prediction</h2>
        <p class="text-muted mb-6">Upgrade to Premium to unlock this match analysis, confidence breakdown, and expert notes.</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <RouterLink to="/premium"><AppButton variant="primary">Upgrade to Premium</AppButton></RouterLink>
          <RouterLink to="/predictions"><AppButton variant="outline">Back to Predictions</AppButton></RouterLink>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="card p-12 text-center">
        <p class="text-loss text-lg mb-4">{{ error }}</p>
        <RouterLink to="/predictions"><AppButton>Back to Predictions</AppButton></RouterLink>
      </div>

      <!-- Main content -->
      <template v-else-if="prediction && fixture">

        <!-- ── Match Header ─────────────────────────────────── -->
        <div class="card p-6 mb-6">

          <!-- League + actions row -->
          <div class="flex items-center justify-between mb-6">
            <div v-if="fixture.league" class="flex items-center gap-2">
              <img v-if="leagueLogo" :src="leagueLogo" :alt="fixture.league.name" class="w-5 h-5 object-contain">
              <span class="text-sm text-muted">{{ fixture.league.name }}</span>
              <span v-if="fixture.league.country" class="text-xs text-muted/60">· {{ fixture.league.country }}</span>
            </div>
            <div class="flex items-center gap-2">
              <AppButton variant="ghost" size="sm" @click="handleSave">
                <BookmarkIconSolid v-if="prediction.is_saved" class="w-4 h-4 text-accent" />
                <BookmarkIcon v-else class="w-4 h-4" />
              </AppButton>
              <AppButton variant="ghost" size="sm" @click="handleShare">
                <ShareIcon class="w-4 h-4" />
                <span class="ml-1 text-xs">Share</span>
              </AppButton>
            </div>
          </div>

          <!-- Teams row -->
          <div class="flex items-center gap-4 md:gap-8 mb-6">
            <!-- Home -->
            <div class="flex-1 text-center">
              <div class="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface border border-border mx-auto mb-3 flex items-center justify-center overflow-hidden">
                <img v-if="homeTeamLogo" :src="homeTeamLogo" :alt="fixture.home_team?.name" class="w-12 h-12 md:w-14 md:h-14 object-contain">
                <span v-else class="text-2xl font-bold text-muted">H</span>
              </div>
              <h2 class="font-display font-bold text-base md:text-lg text-text leading-tight">{{ fixture.home_team?.name || 'Home Team' }}</h2>
              <span class="text-xs text-muted">Home</span>
            </div>

            <!-- VS -->
            <div class="text-center shrink-0">
              <div class="text-muted font-bold text-sm mb-2">VS</div>
              <div class="flex items-center gap-1.5 text-xs text-muted justify-center">
                <ClockIcon class="w-3.5 h-3.5 shrink-0" />
                <span>{{ formatTime(kickoffTime) }}</span>
              </div>
              <span class="text-xs text-muted/60">{{ formatDate(kickoffTime, { month: 'short', day: 'numeric' }) }}</span>
            </div>

            <!-- Away -->
            <div class="flex-1 text-center">
              <div class="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface border border-border mx-auto mb-3 flex items-center justify-center overflow-hidden">
                <img v-if="awayTeamLogo" :src="awayTeamLogo" :alt="fixture.away_team?.name" class="w-12 h-12 md:w-14 md:h-14 object-contain">
                <span v-else class="text-2xl font-bold text-muted">A</span>
              </div>
              <h2 class="font-display font-bold text-base md:text-lg text-text leading-tight">{{ fixture.away_team?.name || 'Away Team' }}</h2>
              <span class="text-xs text-muted">Away</span>
            </div>
          </div>

          <!-- ── Prediction Summary ───────────────────────── -->
          <div class="border-t border-border pt-5">
            <p class="text-[10px] text-muted text-center uppercase tracking-widest mb-4">AI Recommendation</p>

            <div class="flex items-stretch gap-2 md:gap-3 justify-center">
              <div v-for="outcome in ['home', 'draw', 'away']" :key="outcome"
                :class="[
                  'flex-1 max-w-[160px] px-3 py-3.5 rounded-xl text-center border transition-all',
                  outcome === prediction.predicted_outcome
                    ? 'border-accent/40 bg-accent/8 ring-1 ring-accent/25'
                    : 'border-border bg-surface/40 opacity-55'
                ]">
                <div :class="['text-[10px] uppercase tracking-wider font-semibold mb-1.5 truncate', outcome === prediction.predicted_outcome ? 'text-accent' : 'text-muted']">
                  {{ outcomeDisplayName(outcome) }}
                </div>
                <div v-if="outcome === prediction.predicted_outcome">
                  <span class="font-display font-bold text-3xl text-text leading-none">{{ confidenceValue }}</span>
                  <span class="text-sm text-muted">%</span>
                  <div class="text-[10px] text-accent mt-1">confidence</div>
                </div>
                <div v-else class="font-display font-bold text-xl text-muted leading-none mt-1">—</div>
              </div>
            </div>

            <div v-if="prediction.is_value_bet" class="flex justify-center mt-4">
              <ValueBetBadge size="md" />
            </div>
          </div>
        </div>

        <!-- ── Main Grid ────────────────────────────────────── -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Left col (2/3) -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Team Comparison -->
            <div v-if="hasComparisonData" class="card p-6">
              <div class="flex items-center justify-between mb-5">
                <div class="flex items-center gap-2">
                  <ChartBarIcon class="w-5 h-5 text-accent" />
                  <h3 class="section-header">Team Comparison</h3>
                </div>
                <span class="text-xs text-muted">Last 5 games</span>
              </div>

              <!-- Team name headers -->
              <div class="grid grid-cols-[1fr_90px_1fr] gap-2 mb-4">
                <span class="text-xs font-semibold text-text truncate text-right" :title="fixture.home_team?.name">
                  {{ fixture.home_team?.name }}
                </span>
                <span></span>
                <span class="text-xs font-semibold text-text truncate" :title="fixture.away_team?.name">
                  {{ fixture.away_team?.name }}
                </span>
              </div>

              <div class="space-y-5">

                <!-- Form score -->
                <div v-if="analysis?.home_form_score != null">
                  <div class="grid grid-cols-[1fr_90px_1fr] items-center gap-2 mb-1.5">
                    <span class="text-sm font-bold text-text text-right">{{ analysis.home_form_score }}%</span>
                    <span class="text-[11px] text-muted text-center">Form Rating</span>
                    <span class="text-sm font-bold text-text">{{ analysis.away_form_score }}%</span>
                  </div>
                  <div class="h-2 rounded-full bg-border overflow-hidden">
                    <div class="h-full rounded-full bg-accent transition-all duration-700" :style="`width:${formSplitPct}%`" />
                  </div>
                </div>

                <!-- Avg goals scored -->
                <div v-if="Number(homeAvgScored) > 0 || Number(awayAvgScored) > 0">
                  <div class="grid grid-cols-[1fr_90px_1fr] items-center gap-2 mb-1.5">
                    <span class="text-sm font-bold text-text text-right">{{ homeAvgScored }}</span>
                    <span class="text-[11px] text-muted text-center">Avg Goals</span>
                    <span class="text-sm font-bold text-text">{{ awayAvgScored }}</span>
                  </div>
                  <div class="h-2 rounded-full bg-border overflow-hidden">
                    <div class="h-full rounded-full bg-win transition-all duration-700" :style="`width:${attackSplitPct}%`" />
                  </div>
                </div>

                <!-- W/D/L summary -->
                <div v-if="homeStats && awayStats">
                  <div class="grid grid-cols-[1fr_90px_1fr] items-center gap-2">
                    <div class="flex items-center gap-1 justify-end">
                      <span class="text-xs text-win font-bold">{{ homeStats.wins }}W</span>
                      <span class="text-xs text-draw font-bold">{{ homeStats.draws }}D</span>
                      <span class="text-xs text-loss font-bold">{{ homeStats.losses }}L</span>
                    </div>
                    <span class="text-[11px] text-muted text-center">Record</span>
                    <div class="flex items-center gap-1">
                      <span class="text-xs text-win font-bold">{{ awayStats.wins }}W</span>
                      <span class="text-xs text-draw font-bold">{{ awayStats.draws }}D</span>
                      <span class="text-xs text-loss font-bold">{{ awayStats.losses }}L</span>
                    </div>
                  </div>
                </div>

                <!-- xG / Expected goals (Poisson λ) -->
                <div v-if="lambdaHome != null">
                  <div class="grid grid-cols-[1fr_90px_1fr] items-center gap-2 mb-1.5">
                    <span class="text-sm font-bold text-gold text-right">{{ lambdaHome }}</span>
                    <div class="text-center">
                      <span class="text-[11px] text-muted block">xG</span>
                      <span class="text-[9px] text-muted/60">({{ lambdaTotal }} total)</span>
                    </div>
                    <span class="text-sm font-bold text-gold">{{ lambdaAway }}</span>
                  </div>
                  <div class="h-2 rounded-full bg-border overflow-hidden">
                    <div class="h-full rounded-full bg-gold transition-all duration-700" :style="`width:${lambdaSplitPct}%`" />
                  </div>
                </div>


                <!-- H2H dominance -->
                <div v-if="h2hBar && prediction.head_to_head?.total_matches">
                  <div class="grid grid-cols-[1fr_90px_1fr] items-center gap-2 mb-1.5">
                    <span class="text-sm font-bold text-text text-right">{{ prediction.head_to_head.home_wins }}W</span>
                    <span class="text-[11px] text-muted text-center">H2H Record</span>
                    <span class="text-sm font-bold text-text">{{ prediction.head_to_head.away_wins }}W</span>
                  </div>
                  <div class="h-2 rounded-full overflow-hidden flex">
                    <div class="h-full bg-accent transition-all duration-700" :style="`width:${h2hBar.homePct}%`" />
                    <div class="h-full bg-draw transition-all duration-700" :style="`width:${h2hBar.drawPct}%`" />
                    <div class="h-full bg-loss flex-1" />
                  </div>
                  <div class="flex justify-between text-[10px] text-muted mt-1">
                    <span>{{ h2hBar.homePct }}% home</span>
                    <span>{{ h2hBar.drawPct }}% draws</span>
                    <span>{{ h2hBar.awayPct }}% away</span>
                  </div>
                </div>

              </div>
            </div>

            <!-- Market Picks -->
            <div v-if="marketPicksArray.length" class="card p-6">
              <div class="flex items-center gap-2 mb-4">
                <ChartBarIcon class="w-5 h-5 text-accent" />
                <h3 class="section-header">Market Predictions</h3>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div v-for="pick in marketPicksArray" :key="pick.key"
                  class="p-3 rounded-xl border border-border bg-bg hover:border-accent/30 transition-colors">
                  <p class="text-[10px] text-muted uppercase tracking-wider mb-1 truncate">{{ pick.label }}</p>
                  <p class="font-display font-bold text-sm text-accent leading-tight truncate">{{ pick.outcome }}</p>
                  <div class="flex items-center justify-between mt-1.5">
                    <span class="text-xs text-muted">{{ pick.confidence }}% conf.</span>
                    <span v-if="pick.isValueBet"
                      class="text-[9px] font-bold text-gold bg-gold/10 border border-gold/20 px-1.5 py-0.5 rounded-full">VALUE</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="marketPicksLoading" class="card p-6">
              <div class="flex gap-3">
                <div v-for="i in 3" :key="i" class="flex-1 h-20 rounded-xl bg-surface animate-pulse" />
              </div>
            </div>

            <!-- How We Predicted This -->
            <div class="card p-6">
              <div class="flex items-center gap-2 mb-4">
                <SparklesIcon class="w-5 h-5 text-accent" />
                <h3 class="section-header">How We Predicted This</h3>
              </div>

              <!-- Auto-generated explanation -->
              <p v-if="autoExplanation" class="text-sm text-text leading-relaxed mb-4">
                {{ autoExplanation }}
              </p>

              <!-- Calibration badge -->
              <div v-if="calibration"
                class="flex items-center gap-3 p-3 rounded-xl bg-bg border border-border mb-4">
                <div class="text-center px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 shrink-0">
                  <span class="font-display font-bold text-lg text-accent leading-none">{{ calibration.accuracy }}%</span>
                  <p class="text-[9px] text-muted mt-0.5">hist. acc.</p>
                </div>
                <div class="text-xs text-muted leading-relaxed">
                  In <span class="text-text font-semibold">{{ calibration.total }}</span> past predictions
                  with similar confidence ({{ calibration.band }}), our model was correct
                  <span class="text-accent font-semibold">{{ calibration.correct }}</span> times.
                </div>
              </div>

              <!-- Factor weights -->
              <div class="space-y-2">
                <div v-for="factor in analysis.factors" :key="factor.name"
                  class="flex items-center justify-between p-3 bg-bg rounded-lg">
                  <div class="flex-1 min-w-0 pr-3">
                    <p class="text-sm font-semibold text-text">{{ factor.name }}</p>
                    <p class="text-xs text-muted">{{ factor.description }}</p>
                  </div>
                  <span class="text-sm font-display font-bold text-accent shrink-0">{{ factor.weight }}</span>
                </div>
              </div>
            </div>

            <!-- Expert Analysis -->
            <div v-if="prediction.expert_note" class="card p-6">
              <div class="flex items-center gap-2 mb-4">
                <SparklesIcon class="w-5 h-5 text-gold" />
                <h3 class="section-header">Expert Analysis</h3>
              </div>
              <template v-if="canSeeExpertAnalysis">
                <p class="text-text leading-relaxed">{{ prediction.expert_note }}</p>
              </template>
              <PremiumBlur v-else height="100px">
                <p class="text-text leading-relaxed">Our expert analysis reveals key factors that make this prediction stand out...</p>
              </PremiumBlur>
            </div>

          </div>

          <!-- Right col (1/3) -->
          <div class="space-y-6">

            <!-- Your Pick widget -->
            <div class="card p-4">
              <h3 class="section-header mb-3">Your Pick</h3>
              <template v-if="!userVote">
                <p class="text-xs text-muted mb-3">Who do you think wins?</p>
                <div class="flex gap-2">
                  <button v-for="outcome in ['home', 'draw', 'away']" :key="outcome"
                    @click="castVote(outcome)"
                    class="flex-1 py-2.5 rounded-lg border border-border bg-surface text-xs font-semibold text-muted hover:border-accent/40 hover:text-text hover:bg-accent/5 transition-all truncate px-1">
                    {{ outcome === 'home' ? (fixture.home_team?.name || 'Home') : outcome === 'away' ? (fixture.away_team?.name || 'Away') : 'Draw' }}
                  </button>
                </div>
              </template>
              <template v-else>
                <div class="flex items-center gap-2 p-3 rounded-lg bg-bg mb-3">
                  <CheckCircleIcon class="w-4 h-4 text-accent shrink-0" />
                  <div>
                    <p class="text-xs text-muted">You picked</p>
                    <p class="text-sm font-bold text-text">
                      {{ userVote === 'home' ? (fixture.home_team?.name || 'Home') : userVote === 'away' ? (fixture.away_team?.name || 'Away') : 'Draw' }}
                    </p>
                  </div>
                </div>
                <p v-if="voteAgreesWithAI" class="text-xs text-win font-semibold">
                  You agree with our AI prediction
                </p>
                <p v-else class="text-xs text-muted">
                  AI picked <span class="text-accent font-semibold">{{ prediction.predicted_outcome }}</span> — you disagree
                </p>
              </template>
            </div>

            <!-- Market Odds Breakdown -->
            <div v-if="marketConsensus" class="card p-4">
              <h3 class="section-header mb-3">Market Odds</h3>
              <p class="text-[10px] text-muted mb-3 uppercase tracking-wider">
                {{ marketConsensus.bookmaker || 'Bookmaker' }} implied probability
              </p>
              <div class="space-y-2.5">
                <div v-for="(label, key) in { home: fixture.home_team?.name || 'Home', draw: 'Draw', away: fixture.away_team?.name || 'Away' }"
                  :key="key"
                  :class="['flex items-center gap-2', !marketConsensus[key] ? 'opacity-40' : '']">
                  <span class="text-xs text-muted w-20 truncate shrink-0">{{ label }}</span>
                  <div class="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-700"
                      :class="key === 'home' ? 'bg-accent' : key === 'draw' ? 'bg-draw' : 'bg-loss'"
                      :style="`width:${marketConsensus[key] || 0}%`" />
                  </div>
                  <span class="text-xs font-bold text-text w-9 text-right shrink-0">
                    {{ marketConsensus[key] != null ? marketConsensus[key] + '%' : '—' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Recent Form -->
            <FormTable
              :home-team="fixture.home_team?.name"
              :away-team="fixture.away_team?.name"
              :home-form="homeForm"
              :away-form="awayForm"
              :home-stats="homeFormStats"
              :away-stats="awayFormStats"
            />

            <!-- Head to Head -->
            <div v-if="prediction.head_to_head" class="card p-4">
              <h3 class="section-header mb-4">Head to Head</h3>

              <div v-if="prediction.head_to_head.total_matches > 0" class="space-y-4">
                <!-- Win/Draw stats -->
                <div class="grid grid-cols-3 gap-2 text-center">
                  <div class="p-3 bg-bg rounded-lg">
                    <p class="text-2xl font-display font-bold text-accent">{{ prediction.head_to_head.home_wins }}</p>
                    <p class="text-xs text-muted truncate">{{ fixture.home_team?.name }}</p>
                  </div>
                  <div class="p-3 bg-bg rounded-lg">
                    <p class="text-2xl font-display font-bold text-draw">{{ prediction.head_to_head.draws }}</p>
                    <p class="text-xs text-muted">Draws</p>
                  </div>
                  <div class="p-3 bg-bg rounded-lg">
                    <p class="text-2xl font-display font-bold text-loss">{{ prediction.head_to_head.away_wins }}</p>
                    <p class="text-xs text-muted truncate">{{ fixture.away_team?.name }}</p>
                  </div>
                </div>

                <!-- Dominance bar -->
                <div v-if="h2hBar" class="space-y-1">
                  <div class="h-1.5 rounded-full overflow-hidden flex">
                    <div class="h-full bg-accent" :style="`width:${h2hBar.homePct}%`" />
                    <div class="h-full bg-draw" :style="`width:${h2hBar.drawPct}%`" />
                    <div class="h-full bg-loss flex-1" />
                  </div>
                  <div class="flex justify-between text-[10px] text-muted">
                    <span>{{ h2hBar.homePct }}%</span>
                    <span>{{ h2hBar.drawPct }}% draws</span>
                    <span>{{ h2hBar.awayPct }}%</span>
                  </div>
                </div>

                <!-- Recent meetings -->
                <H2HTable
                  v-if="h2hMatches.length"
                  :matches="h2hMatches"
                  :home-team-name="fixture.home_team?.name"
                  :away-team-name="fixture.away_team?.name"
                />
              </div>

              <div v-else class="text-center py-6 text-muted text-sm">No head-to-head history found</div>
            </div>

          </div>
        </div>

      </template>

      <!-- Not found -->
      <div v-else class="card p-12 text-center">
        <p class="text-muted text-lg mb-4">Match not found</p>
        <RouterLink to="/predictions"><AppButton>Back to Predictions</AppButton></RouterLink>
      </div>

    </div>
  </div>

  <!-- ── Share Modal ────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showShareModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        @click.self="showShareModal = false">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showShareModal = false" />

        <div class="relative w-full max-w-sm rounded-2xl bg-surface border border-border overflow-hidden shadow-2xl">
          <!-- Modal header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 class="font-display font-bold text-text">Share Prediction</h3>
            <button @click="showShareModal = false" class="text-muted hover:text-text transition-colors">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Share card preview -->
          <div class="p-5">
            <div class="rounded-xl border border-border bg-bg p-4 mb-4">
              <!-- Brand -->
              <div class="flex items-center gap-1.5 mb-3">
                <span class="text-gold font-display font-black text-sm">EDI</span>
                <span class="text-text text-xs font-semibold">Predictions</span>
              </div>
              <!-- Teams -->
              <div class="flex items-center justify-between gap-2 mb-3">
                <span class="font-display font-bold text-sm text-text truncate">{{ fixture?.home_team?.name }}</span>
                <span class="text-xs text-muted shrink-0 px-2">vs</span>
                <span class="font-display font-bold text-sm text-text truncate text-right">{{ fixture?.away_team?.name }}</span>
              </div>
              <!-- Prediction chip -->
              <div class="flex items-center justify-between">
                <div class="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
                  <span class="text-xs text-muted">Pick: </span>
                  <span class="text-sm font-bold text-accent">
                    {{ prediction?.predicted_outcome === 'home' ? fixture?.home_team?.name : prediction?.predicted_outcome === 'away' ? fixture?.away_team?.name : 'Draw' }}
                  </span>
                </div>
                <span class="font-display font-bold text-2xl text-text">{{ confidenceValue }}<span class="text-sm text-muted">%</span></span>
              </div>
              <!-- URL hint -->
              <p class="text-[10px] text-muted mt-3">edipredictions.com</p>
            </div>

            <!-- Action buttons -->
            <div class="space-y-2">
              <button v-if="'share' in navigator"
                @click="nativeShare"
                class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-bg font-semibold text-sm hover:bg-accent/90 transition-colors">
                <ShareIcon class="w-4 h-4" />
                Share via...
              </button>
              <button @click="copyShareLink"
                class="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-surface text-text font-semibold text-sm hover:border-accent/40 transition-colors">
                <LinkIcon class="w-4 h-4" />
                {{ shareCopied ? 'Link Copied!' : 'Copy Link' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
