<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  homeTeam: {
    type: String,
    required: true
  },
  awayTeam: {
    type: String,
    required: true
  },
  homeForm: {
    type: Array,
    default: () => []
  },
  awayForm: {
    type: Array,
    default: () => []
  },
  homeStats: {
    type: Object,
    default: () => null
  },
  awayStats: {
    type: Object,
    default: () => null
  }
})

const { t } = useI18n()

function getResultClass(result) {
  switch (result?.toUpperCase()) {
    case 'W':
      return 'bg-win text-bg'
    case 'D':
      return 'bg-draw text-bg'
    case 'L':
      return 'bg-loss text-white'
    default:
      return 'bg-muted/30 text-muted'
  }
}

// Format stats summary
function formatStats(stats) {
  if (!stats) return null
  const { wins = 0, draws = 0, losses = 0, goals_scored = 0, goals_conceded = 0 } = stats
  return {
    record: `${wins}W ${draws}D ${losses}L`,
    goals: `${goals_scored} GF, ${goals_conceded} GA`,
    goalDiff: goals_scored - goals_conceded
  }
}

const homeStatsFormatted = computed(() => formatStats(props.homeStats))
const awayStatsFormatted = computed(() => formatStats(props.awayStats))
</script>

<template>
  <div class="card p-4">
    <h3 class="section-header mb-4">{{ t('match.form') }}</h3>
    <p class="text-xs text-muted mb-4">{{ t('match.lastMatches', { count: 5 }) }}</p>

    <div class="space-y-4">
      <!-- Home team form -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-text truncate max-w-[120px]" :title="homeTeam">
            {{ homeTeam }}
          </span>
          <div class="flex items-center gap-1.5">
            <span
              v-for="(result, index) in homeForm.slice(0, 5)"
              :key="index"
              :class="[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                getResultClass(result)
              ]"
            >
              {{ result?.toUpperCase() || '-' }}
            </span>
            <!-- Fill remaining slots if less than 5 -->
            <span
              v-for="i in Math.max(0, 5 - homeForm.length)"
              :key="`empty-home-${i}`"
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-muted/30 text-muted"
            >
              -
            </span>
          </div>
        </div>
        <!-- Home stats -->
        <div v-if="homeStatsFormatted" class="flex items-center justify-between text-xs text-muted pl-1">
          <span>{{ homeStatsFormatted.record }}</span>
          <span :class="homeStatsFormatted.goalDiff > 0 ? 'text-win' : homeStatsFormatted.goalDiff < 0 ? 'text-loss' : ''">
            {{ homeStatsFormatted.goals }} ({{ homeStatsFormatted.goalDiff > 0 ? '+' : '' }}{{ homeStatsFormatted.goalDiff }})
          </span>
        </div>
      </div>

      <!-- Away team form -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-text truncate max-w-[120px]" :title="awayTeam">
            {{ awayTeam }}
          </span>
          <div class="flex items-center gap-1.5">
            <span
              v-for="(result, index) in awayForm.slice(0, 5)"
              :key="index"
              :class="[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                getResultClass(result)
              ]"
            >
              {{ result?.toUpperCase() || '-' }}
            </span>
            <span
              v-for="i in Math.max(0, 5 - awayForm.length)"
              :key="`empty-away-${i}`"
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-muted/30 text-muted"
            >
              -
            </span>
          </div>
        </div>
        <!-- Away stats -->
        <div v-if="awayStatsFormatted" class="flex items-center justify-between text-xs text-muted pl-1">
          <span>{{ awayStatsFormatted.record }}</span>
          <span :class="awayStatsFormatted.goalDiff > 0 ? 'text-win' : awayStatsFormatted.goalDiff < 0 ? 'text-loss' : ''">
            {{ awayStatsFormatted.goals }} ({{ awayStatsFormatted.goalDiff > 0 ? '+' : '' }}{{ awayStatsFormatted.goalDiff }})
          </span>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
      <div class="flex items-center gap-1.5">
        <span class="w-4 h-4 rounded-full bg-win"></span>
        <span class="text-xs text-muted">Win</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-4 h-4 rounded-full bg-draw"></span>
        <span class="text-xs text-muted">Draw</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-4 h-4 rounded-full bg-loss"></span>
        <span class="text-xs text-muted">Loss</span>
      </div>
    </div>
  </div>
</template>
