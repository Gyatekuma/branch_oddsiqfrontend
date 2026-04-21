<script setup>
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/composables/useLocale'

const props = defineProps({
  matches: {
    type: Array,
    default: () => []
  },
  homeTeamName: {
    type: String,
    default: 'Home'
  },
  awayTeamName: {
    type: String,
    default: 'Away'
  }
})

const { t } = useI18n()
const { formatDate } = useLocale()

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

function getResultLabel(result) {
  switch (result?.toUpperCase()) {
    case 'W':
      return 'Win'
    case 'D':
      return 'Draw'
    case 'L':
      return 'Loss'
    default:
      return '-'
  }
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs text-muted">Recent meetings ({{ props.homeTeamName }} perspective)</p>

    <div v-if="matches.length > 0" class="space-y-2">
      <div
        v-for="(match, index) in matches"
        :key="index"
        class="flex items-center justify-between py-2 px-3 bg-bg rounded-lg"
      >
        <!-- Date -->
        <span class="text-xs text-muted">
          {{ formatDate(match.date, { month: 'short', day: 'numeric', year: '2-digit' }) }}
        </span>

        <!-- Result for home team -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted">{{ getResultLabel(match.result_for_home) }}</span>
          <span
            :class="[
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
              getResultClass(match.result_for_home)
            ]"
          >
            {{ match.result_for_home?.toUpperCase() || '-' }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-4 text-muted text-sm">
      No previous meetings found
    </div>
  </div>
</template>
