<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/composables/useLocale'
import ConfidenceMeter from './ConfidenceMeter.vue'
import ValueBetBadge from './ValueBetBadge.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { ClockIcon, BookmarkIcon } from '@heroicons/vue/24/outline'
import { BookmarkIcon as BookmarkIconSolid, SparklesIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  prediction: {
    type: Object,
    required: true
  },
  showSaveButton: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'unsave'])

const { t } = useI18n()
const { formatTime, formatDate } = useLocale()

const kickoffDateTime = computed(() => {
  const kickoff = props.prediction.fixture?.kickoff_at || props.prediction.fixture?.kickoff || props.prediction.kickoff_at || props.prediction.kickoff
  if (!kickoff) return ''

  const date = formatDate(kickoff, { month: 'short', day: 'numeric' })
  const time = formatTime(kickoff)
  return `${date}, ${time}`
})

const confidenceValue = computed(() => {
  const raw = props.prediction.confidence_score ?? props.prediction.confidence ?? 0
  console.log('[ConfidenceDebug] Raw score:', raw, 'Type:', typeof raw)

  let score = Number(raw)

  // Normalize to 0-100 range
  while (score > 100) {
    score = score / 100
  }

  const result = Math.round(score)
  console.log('[ConfidenceDebug] Final score:', result)
  return result
})

const hasExpertNote = computed(() => {
  return props.prediction.expert_note || props.prediction.has_expert_note
})

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
    :to="`/match/${prediction.id}`"
    class="card-hover block p-4 group"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2 text-sm text-muted">
        <ClockIcon class="w-4 h-4" />
        <span>{{ kickoffDateTime }}</span>
      </div>

      <div class="flex items-center gap-2">
        <ValueBetBadge v-if="prediction.is_value_bet" size="sm" />
        <AppBadge
          v-if="hasExpertNote"
          variant="gold"
          size="sm"
        >
          <SparklesIcon class="w-3 h-3 mr-1" />
          Expert
        </AppBadge>
        <button
          v-if="showSaveButton"
          class="p-1 text-muted hover:text-accent transition-colors"
          @click="handleSaveClick"
        >
          <BookmarkIconSolid v-if="prediction.is_saved" class="w-5 h-5 text-accent" />
          <BookmarkIcon v-else class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Teams -->
    <div class="space-y-3 mb-4">
      <!-- Home team -->
      <div class="flex items-center gap-3">
        <div
          v-if="prediction.fixture?.home_team?.logo_url || prediction.fixture?.home_team?.logo"
          class="w-8 h-8 rounded-full bg-bg flex items-center justify-center overflow-hidden"
        >
          <img
            :src="prediction.fixture.home_team.logo_url || prediction.fixture.home_team.logo"
            :alt="prediction.fixture.home_team.name"
            class="w-6 h-6 object-contain"
          >
        </div>
        <div v-else class="w-8 h-8 rounded-full bg-bg flex items-center justify-center">
          <span class="text-xs font-bold text-muted">H</span>
        </div>
        <span class="font-display font-semibold text-lg text-text group-hover:text-accent transition-colors">
          {{ prediction.fixture?.home_team?.name || prediction.home_team }}
        </span>
      </div>

      <!-- Away team -->
      <div class="flex items-center gap-3">
        <div
          v-if="prediction.fixture?.away_team?.logo_url || prediction.fixture?.away_team?.logo"
          class="w-8 h-8 rounded-full bg-bg flex items-center justify-center overflow-hidden"
        >
          <img
            :src="prediction.fixture.away_team.logo_url || prediction.fixture.away_team.logo"
            :alt="prediction.fixture.away_team.name"
            class="w-6 h-6 object-contain"
          >
        </div>
        <div v-else class="w-8 h-8 rounded-full bg-bg flex items-center justify-center">
          <span class="text-xs font-bold text-muted">A</span>
        </div>
        <span class="font-display font-semibold text-lg text-text group-hover:text-accent transition-colors">
          {{ prediction.fixture?.away_team?.name || prediction.away_team }}
        </span>
      </div>
    </div>

    <!-- League -->
    <div v-if="prediction.fixture?.league" class="mb-4">
      <span class="text-xs text-muted">
        {{ prediction.fixture.league.name }}
      </span>
    </div>

    <!-- Prediction & Confidence -->
    <div class="flex items-center justify-between pt-3 border-t border-border">
      <div>
        <p class="stat-label mb-1">{{ t('match.prediction') }}</p>
        <AppBadge :variant="outcomeVariant" size="md">
          {{ outcomeLabel }}
        </AppBadge>
      </div>

      <ConfidenceMeter
        :value="confidenceValue"
        size="sm"
      />
    </div>
  </RouterLink>
</template>
