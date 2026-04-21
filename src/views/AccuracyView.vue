<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import accuracyApi from '@/api/accuracy'
import { useLocale } from '@/composables/useLocale'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
} from 'chart.js'
import {
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  FireIcon,
  TrophyIcon
} from '@heroicons/vue/24/outline'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
)

const { t } = useI18n()
const { formatDate } = useLocale()

const loading = ref(true)
const overall = ref(null)
const bySport = ref({})
const byConfidence = ref([])
const valueBets = ref(null)
const trends = ref([])
const recent = ref([])
const currentStreak = ref(null)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111827',
      titleColor: '#f3f4f6',
      bodyColor: '#f3f4f6',
      borderColor: '#1f2937',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      grid: { color: '#1f2937' },
      ticks: { color: '#6b7280' }
    },
    y: {
      min: 0,
      max: 100,
      grid: { color: '#1f2937' },
      ticks: { color: '#6b7280', callback: (v) => v + '%' }
    }
  }
}

const chartData = ref({
  labels: [],
  datasets: [{
    label: 'Accuracy',
    data: [],
    fill: true,
    borderColor: '#00e676',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    tension: 0.4,
    pointBackgroundColor: '#00e676',
    pointBorderColor: '#00e676'
  }]
})

onMounted(async () => {
  loading.value = true
  try {
    const [overallData, trendsData, recentData] = await Promise.all([
      accuracyApi.getOverall(),
      accuracyApi.getTrends(),
      accuracyApi.getRecent(20)
    ])

    // Set overall stats
    overall.value = overallData.overall || {}
    bySport.value = overallData.bySport || {}
    byConfidence.value = overallData.byConfidence || []
    valueBets.value = overallData.valueBets || {}

    // Set trends for chart
    trends.value = trendsData.trends || []

    // Set recent predictions
    recent.value = recentData.recent || []
    currentStreak.value = recentData.currentStreak

    // Prepare chart data
    if (trends.value.length) {
      chartData.value.labels = trends.value.map(t => formatDate(t.date, { month: 'short', day: 'numeric' }))
      chartData.value.datasets[0].data = trends.value.map(t => t.accuracy_percentage || 0)
    }
  } catch (err) {
    console.error('Failed to fetch accuracy data:', err)
  } finally {
    loading.value = false
  }
})

// Convert bySport object to array for display
function getSportsArray() {
  return Object.entries(bySport.value).map(([sport, stats]) => ({
    sport,
    ...stats
  }))
}

function getSportEmoji(sport) {
  const emojis = {
    'football': '⚽',
    'basketball': '🏀',
    'tennis': '🎾'
  }
  return emojis[sport] || '🏆'
}

function getResultVariant(wasCorrect) {
  if (wasCorrect === true) return 'success'
  if (wasCorrect === false) return 'danger'
  return 'muted'
}

function getResultLabel(wasCorrect) {
  if (wasCorrect === true) return t('accuracy.correct')
  if (wasCorrect === false) return t('accuracy.incorrect')
  return t('accuracy.pending')
}
</script>

<template>
  <div class="py-8">
    <div class="container-app">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="font-display font-bold text-3xl md:text-4xl text-text mb-2">
          {{ t('accuracy.title') }}
        </h1>
        <p class="text-muted">
          {{ t('accuracy.subtitle') }}
        </p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-6">
        <AppSkeleton height="200px" rounded="lg" />
        <AppSkeleton height="300px" rounded="lg" />
      </div>

      <template v-else>
        <!-- Overall Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <!-- Overall Accuracy -->
          <div class="card p-6 text-center">
            <ChartBarIcon class="w-8 h-8 text-accent mx-auto mb-3" />
            <p class="stat-label mb-2">{{ t('accuracy.overall') }}</p>
            <p class="text-4xl font-display font-bold text-gradient-accent">
              {{ overall?.accuracy_percentage || 0 }}%
            </p>
            <p class="text-sm text-muted mt-2">
              {{ overall?.correct_predictions || 0 }} / {{ overall?.total_predictions || 0 }} correct
            </p>
          </div>

          <!-- Value Bets Accuracy -->
          <div class="card p-6 text-center">
            <TrophyIcon class="w-8 h-8 text-gold mx-auto mb-3" />
            <p class="stat-label mb-2">Value Bets</p>
            <p class="text-4xl font-display font-bold text-gold">
              {{ valueBets?.accuracy_percentage || 0 }}%
            </p>
            <p class="text-sm text-muted mt-2">
              {{ valueBets?.correct || 0 }} / {{ valueBets?.total || 0 }} correct
            </p>
          </div>

          <!-- Current Streak -->
          <div class="card p-6 text-center">
            <FireIcon class="w-8 h-8 mx-auto mb-3" :class="currentStreak?.type === 'winning' ? 'text-accent' : 'text-danger'" />
            <p class="stat-label mb-2">Current Streak</p>
            <p class="text-4xl font-display font-bold" :class="currentStreak?.type === 'winning' ? 'text-accent' : 'text-danger'">
              {{ currentStreak?.count || 0 }}
            </p>
            <p class="text-sm text-muted mt-2 capitalize">
              {{ currentStreak?.type || 'N/A' }}
            </p>
          </div>

          <!-- Period Stats -->
          <div class="card p-6 text-center">
            <p class="stat-label mb-2">{{ overall?.period || 'All Time' }}</p>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Total:</span>
                <span class="text-text font-medium">{{ overall?.total_predictions || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Correct:</span>
                <span class="text-accent font-medium">{{ overall?.correct_predictions || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Incorrect:</span>
                <span class="text-danger font-medium">{{ overall?.incorrect_predictions || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- By Sport -->
        <div class="card p-6 mb-8" v-if="Object.keys(bySport).length">
          <h3 class="section-header mb-4">{{ t('accuracy.bySport') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              v-for="sport in getSportsArray()"
              :key="sport.sport"
              class="flex items-center gap-4 p-4 bg-bg rounded-lg"
            >
              <div class="text-3xl">{{ getSportEmoji(sport.sport) }}</div>
              <div class="flex-1">
                <p class="font-display font-bold text-xl text-text capitalize">
                  {{ sport.sport }}
                </p>
                <p class="text-sm text-muted">
                  {{ sport.correct_predictions }} / {{ sport.total_predictions }} correct
                </p>
              </div>
              <div class="text-right">
                <p class="font-display font-bold text-2xl text-accent">
                  {{ sport.accuracy_percentage }}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- By Confidence Level -->
        <div class="card p-6 mb-8" v-if="byConfidence.length">
          <h3 class="section-header mb-4">Accuracy by Confidence</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="conf in byConfidence"
              :key="conf.level"
              class="p-4 bg-bg rounded-lg"
            >
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-muted capitalize">{{ conf.level }} ({{ conf.range }})</span>
                <span class="font-display font-bold text-lg text-accent">{{ conf.accuracy_percentage }}%</span>
              </div>
              <div class="w-full bg-surface rounded-full h-2">
                <div
                  class="bg-accent rounded-full h-2 transition-all"
                  :style="{ width: conf.accuracy_percentage + '%' }"
                />
              </div>
              <p class="text-xs text-muted mt-2">
                {{ conf.correct }} / {{ conf.total }} correct
              </p>
            </div>
          </div>
        </div>

        <!-- Chart -->
        <div class="card p-6 mb-8" v-if="trends.length">
          <h3 class="section-header mb-4">{{ t('accuracy.last30Days') }}</h3>
          <div class="h-64">
            <Line :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Recent Predictions -->
        <div class="card overflow-hidden">
          <div class="p-4 border-b border-border">
            <h3 class="section-header">{{ t('accuracy.recentPredictions') }}</h3>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[600px]">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                    Match
                  </th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                    Score
                  </th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                    Predicted
                  </th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                    Actual
                  </th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr
                  v-for="pred in recent"
                  :key="pred.prediction_id"
                  class="hover:bg-bg/50 transition-colors"
                >
                  <td class="px-4 py-3">
                    <div class="text-sm text-text">
                      {{ pred.fixture?.home_team || '-' }} vs {{ pred.fixture?.away_team || '-' }}
                    </div>
                    <div class="text-xs text-muted">
                      {{ pred.fixture?.league || '' }} • {{ formatDate(pred.fixture?.kickoff_at) }}
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="text-sm font-medium text-text">
                      {{ pred.fixture?.home_score ?? '-' }} - {{ pred.fixture?.away_score ?? '-' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="text-sm text-text capitalize">{{ pred.predicted_outcome }}</span>
                    <div class="text-xs text-muted">{{ pred.confidence_score }}%</div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="text-sm text-text capitalize">{{ pred.actual_outcome || '-' }}</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <AppBadge :variant="getResultVariant(pred.was_correct)" size="sm">
                      <CheckCircleIcon v-if="pred.was_correct === true" class="w-3 h-3 mr-1" />
                      <XCircleIcon v-else-if="pred.was_correct === false" class="w-3 h-3 mr-1" />
                      {{ getResultLabel(pred.was_correct) }}
                    </AppBadge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="!recent.length" class="p-8 text-center text-muted">
            No predictions to display yet
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
