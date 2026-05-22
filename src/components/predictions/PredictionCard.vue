<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/composables/useLocale'
import ConfidenceMeter from './ConfidenceMeter.vue'
import ValueBetBadge from './ValueBetBadge.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { ClockIcon, BookmarkIcon } from '@heroicons/vue/24/outline'
import { BookmarkIcon as BookmarkIconSolid, SparklesIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  prediction: { type: Object, required: true },
  showSaveButton: { type: Boolean, default: false }
})

const emit = defineEmits(['save', 'unsave'])

const { t } = useI18n()
const { formatTime, formatDate } = useLocale()

// ── Fixture status ─────────────────────────────────────────────
const fixtureStatus = computed(() => props.prediction.fixture?.status)
const isLive = computed(() => fixtureStatus.value === 'live')
const isFinished = computed(() => fixtureStatus.value === 'finished')
const homeScore = computed(() => props.prediction.fixture?.home_score)
const awayScore = computed(() => props.prediction.fixture?.away_score)

const actualOutcome = computed(() => {
  if (!isFinished.value || homeScore.value == null || awayScore.value == null) return null
  if (homeScore.value > awayScore.value) return 'home'
  if (awayScore.value > homeScore.value) return 'away'
  return 'draw'
})

const wasCorrect = computed(() => {
  if (!actualOutcome.value) return null
  return actualOutcome.value === props.prediction.predicted_outcome
})

// ── Countdown ─────────────────────────────────────────────────
const now = ref(Date.now())
let timer = null

onMounted(() => {
  if (fixtureStatus.value === 'upcoming') {
    timer = setInterval(() => { now.value = Date.now() }, 30000)
  }
})
onUnmounted(() => { if (timer) clearInterval(timer) })

const kickoffDisplay = computed(() => {
  const kickoff = props.prediction.fixture?.kickoff_at || props.prediction.fixture?.kickoff || props.prediction.kickoff_at
  if (!kickoff) return ''
  if (isLive.value || isFinished.value) return ''

  const kickoffMs = new Date(kickoff).getTime()
  const diffMs = kickoffMs - now.value

  if (diffMs <= 0) return 'Starting soon'

  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `Kicks off in ${diffMins}m`

  const diffHours = Math.floor(diffMins / 60)
  const remainMins = diffMins % 60
  const today = new Date()
  const kickoffDate = new Date(kickoff)
  const isToday = kickoffDate.toDateString() === today.toDateString()

  if (isToday) {
    return remainMins > 0
      ? `Kicks off in ${diffHours}h ${remainMins}m`
      : `Kicks off in ${diffHours}h`
  }

  return `${formatDate(kickoff, { month: 'short', day: 'numeric' })}, ${formatTime(kickoff)}`
})

// ── Confidence ────────────────────────────────────────────────
const confidenceValue = computed(() => {
  const raw = props.prediction.confidence_score ?? props.prediction.confidence ?? 0
  let score = Number(raw)
  while (score > 100) score /= 100
  return Math.round(score)
})

const hasExpertNote = computed(() => props.prediction.expert_note || props.prediction.has_expert_note)

const outcomeLabel = computed(() => {
  const outcome = props.prediction.predicted_outcome
  if (outcome === 'home') return t('match.outcomes.home')
  if (outcome === 'draw') return t('match.outcomes.draw')
  if (outcome === 'away') return t('match.outcomes.away')
  if (outcome?.startsWith('over')) return t('match.outcomes.over', { value: outcome.split('_')[1] })
  if (outcome?.startsWith('under')) return t('match.outcomes.under', { value: outcome.split('_')[1] })
  return outcome
})

const outcomeVariant = computed(() => {
  const outcome = props.prediction.predicted_outcome
  if (outcome === 'home') return 'success'
  if (outcome === 'draw') return 'warning'
  if (outcome === 'away') return 'danger'
  return 'default'
})

function handleSaveClick(e) {
  e.preventDefault()
  e.stopPropagation()
  if (props.prediction.is_saved) {
    emit('unsave', props.prediction.id)
  } else {
    emit('save', props.prediction.id)
  }
}
</script>

<template>
  <RouterLink
    :to="`/match/${prediction.fixture?.id || prediction.fixture_id || prediction.id}`"
    :class="[
      'card-hover block p-4 group relative overflow-hidden',
      isFinished && wasCorrect === true ? 'ring-1 ring-win/20' : '',
      isFinished && wasCorrect === false ? 'ring-1 ring-loss/20' : '',
    ]"
  >
    <!-- Finished: faint tint across whole card -->
    <div v-if="isFinished && wasCorrect !== null"
      :class="['absolute inset-0 pointer-events-none opacity-[0.04]', wasCorrect ? 'bg-win' : 'bg-loss']" />

    <!-- Header row -->
    <div class="flex items-center justify-between mb-3">
      <!-- Status / kickoff -->
      <div class="flex items-center gap-2">
        <!-- LIVE badge -->
        <template v-if="isLive">
          <span class="relative flex h-2 w-2 shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-win opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-win"></span>
          </span>
          <span class="text-xs font-bold text-win uppercase tracking-wider">Live</span>
        </template>
        <!-- Score for finished -->
        <template v-else-if="isFinished && homeScore != null">
          <span class="text-xs font-bold text-muted">FT</span>
          <span class="text-sm font-display font-bold text-text">{{ homeScore }} – {{ awayScore }}</span>
        </template>
        <!-- Countdown for upcoming -->
        <template v-else>
          <ClockIcon class="w-4 h-4 text-muted shrink-0" />
          <span class="text-sm text-muted">{{ kickoffDisplay }}</span>
        </template>
      </div>

      <div class="flex items-center gap-2">
        <ValueBetBadge v-if="prediction.is_value_bet" size="sm" />
        <AppBadge v-if="hasExpertNote" variant="gold" size="sm">
          <SparklesIcon class="w-3 h-3 mr-1" />
          Expert
        </AppBadge>
        <button v-if="showSaveButton" class="p-1 text-muted hover:text-accent transition-colors" @click="handleSaveClick">
          <BookmarkIconSolid v-if="prediction.is_saved" class="w-5 h-5 text-accent" />
          <BookmarkIcon v-else class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Teams -->
    <div class="space-y-3 mb-4">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-full bg-bg flex items-center justify-center overflow-hidden shrink-0">
            <img v-if="prediction.fixture?.home_team?.logo_url || prediction.fixture?.home_team?.logo"
              :src="prediction.fixture.home_team.logo_url || prediction.fixture.home_team.logo"
              :alt="prediction.fixture.home_team.name" class="w-6 h-6 object-contain">
            <span v-else class="text-xs font-bold text-muted">H</span>
          </div>
          <span class="font-display font-semibold text-text group-hover:text-accent transition-colors truncate">
            {{ prediction.fixture?.home_team?.name || prediction.home_team }}
          </span>
        </div>
        <div v-if="prediction.home_form?.form_string" class="flex gap-0.5 shrink-0">
          <span v-for="(r, i) in prediction.home_form.form_string" :key="i"
            :class="['w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center',
              r === 'W' ? 'bg-win/20 text-win' : r === 'D' ? 'bg-draw/20 text-draw' : 'bg-loss/20 text-loss']">
            {{ r }}
          </span>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-full bg-bg flex items-center justify-center overflow-hidden shrink-0">
            <img v-if="prediction.fixture?.away_team?.logo_url || prediction.fixture?.away_team?.logo"
              :src="prediction.fixture.away_team.logo_url || prediction.fixture.away_team.logo"
              :alt="prediction.fixture.away_team.name" class="w-6 h-6 object-contain">
            <span v-else class="text-xs font-bold text-muted">A</span>
          </div>
          <span class="font-display font-semibold text-text group-hover:text-accent transition-colors truncate">
            {{ prediction.fixture?.away_team?.name || prediction.away_team }}
          </span>
        </div>
        <div v-if="prediction.away_form?.form_string" class="flex gap-0.5 shrink-0">
          <span v-for="(r, i) in prediction.away_form.form_string" :key="i"
            :class="['w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center',
              r === 'W' ? 'bg-win/20 text-win' : r === 'D' ? 'bg-draw/20 text-draw' : 'bg-loss/20 text-loss']">
            {{ r }}
          </span>
        </div>
      </div>
    </div>

    <!-- H2H summary -->
    <div v-if="prediction.h2h_summary?.total_matches > 0"
      class="flex items-center gap-3 mb-4 px-3 py-2 rounded-lg bg-bg text-xs">
      <span class="text-muted shrink-0">H2H</span>
      <div class="flex items-center gap-2 font-medium">
        <span class="text-win">{{ prediction.h2h_summary.home_wins }}W</span>
        <span class="text-muted">·</span>
        <span class="text-draw">{{ prediction.h2h_summary.draws }}D</span>
        <span class="text-muted">·</span>
        <span class="text-loss">{{ prediction.h2h_summary.away_wins }}L</span>
      </div>
      <span class="text-muted ml-auto">last {{ prediction.h2h_summary.total_matches }}</span>
    </div>

    <!-- League -->
    <div v-if="prediction.fixture?.league" class="mb-4">
      <span class="text-xs text-muted">{{ prediction.fixture.league.name }}</span>
    </div>

    <!-- Prediction & Confidence -->
    <div class="flex items-center justify-between pt-3 border-t border-border">
      <div>
        <p class="stat-label mb-1">{{ t('match.prediction') }}</p>
        <AppBadge :variant="outcomeVariant" size="md">{{ outcomeLabel }}</AppBadge>
      </div>
      <ConfidenceMeter :value="confidenceValue" size="sm" />
    </div>

    <!-- Result stamp -->
    <div v-if="isFinished && wasCorrect !== null"
      :class="['mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold border',
        wasCorrect
          ? 'bg-win/8 text-win border-win/20'
          : 'bg-loss/8 text-loss border-loss/20']">
      <CheckCircleIcon v-if="wasCorrect" class="w-3.5 h-3.5" />
      <XCircleIcon v-else class="w-3.5 h-3.5" />
      {{ wasCorrect ? 'Correct Prediction' : 'Incorrect Prediction' }}
    </div>
  </RouterLink>
</template>
