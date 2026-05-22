<script setup>
import { ref, computed, onMounted } from 'vue'
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
  TrophyIcon,
  CalendarDaysIcon,
  TableCellsIcon,
} from '@heroicons/vue/24/outline'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

const { t } = useI18n()
const { formatDate } = useLocale()

// ── State ────────────────────────────────────────────────────
const loading = ref(true)
const periodLoading = ref(false)
const activePeriod = ref('all')

const overall = ref(null)
const bySport = ref({})
const byOutcome = ref({})
const byConfidence = ref([])
const valueBets = ref(null)
const currentStreak = ref(null)

const summary = ref(null)
const leagues = ref([])
const trends = ref([])
const recent = ref([])

const periods = [
  { key: 'all',   label: 'All Time' },
  { key: 'month', label: 'This Month' },
  { key: 'week',  label: 'This Week' },
  { key: 'today', label: 'Today' },
]

// ── Chart ────────────────────────────────────────────────────
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0d1018',
      titleColor: '#f1f5f9',
      bodyColor: '#f1f5f9',
      borderColor: '#1a2035',
      borderWidth: 1,
    }
  },
  scales: {
    x: { grid: { color: '#1a2035' }, ticks: { color: '#64748b' } },
    y: {
      min: 0, max: 100,
      grid: { color: '#1a2035' },
      ticks: { color: '#64748b', callback: v => v + '%' }
    }
  }
}

const chartData = ref({
  labels: [],
  datasets: [{
    label: 'Accuracy',
    data: [],
    fill: true,
    borderColor: '#d4a017',
    backgroundColor: 'rgba(212,160,23,0.08)',
    tension: 0.4,
    pointBackgroundColor: '#d4a017',
    pointBorderColor: '#d4a017',
    pointRadius: 3,
  }]
})

// ── Data loading ─────────────────────────────────────────────
async function loadOverall(period = 'all') {
  const data = await accuracyApi.getOverall({ period })
  overall.value = data.overall || {}
  bySport.value = data.bySport || {}
  byOutcome.value = data.byOutcome || {}
  byConfidence.value = data.byConfidence || []
  valueBets.value = data.valueBets || {}
}

async function switchPeriod(period) {
  if (activePeriod.value === period) return
  activePeriod.value = period
  periodLoading.value = true
  try {
    await loadOverall(period)
  } finally {
    periodLoading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const [, trendsData, recentData, summaryData, leagueData] = await Promise.all([
      loadOverall('all'),
      accuracyApi.getTrends(),
      accuracyApi.getRecent(20),
      accuracyApi.getSummary(),
      accuracyApi.getByLeague(),
    ])

    trends.value = trendsData.trends || []
    recent.value = recentData.recent || []
    currentStreak.value = recentData.currentStreak
    summary.value = summaryData
    leagues.value = leagueData.leagues || []

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

// ── Helpers ──────────────────────────────────────────────────
const sportsArray = computed(() =>
  Object.entries(bySport.value).map(([sport, stats]) => ({ sport, ...stats }))
)

const outcomeArray = computed(() => {
  const labels = { home: 'Home Win', draw: 'Draw', away: 'Away Win' }
  const colours = { home: 'text-win bg-win/10 border-win/20', draw: 'text-draw bg-draw/10 border-draw/20', away: 'text-info bg-info/10 border-info/20' }
  const bars = { home: 'bg-win', draw: 'bg-draw', away: 'bg-info' }
  return ['home', 'draw', 'away']
    .filter(k => byOutcome.value[k])
    .map(k => ({
      key: k,
      label: labels[k],
      colour: colours[k],
      bar: bars[k],
      ...byOutcome.value[k]
    }))
})

function sportEmoji(sport) {
  return { football: '⚽', basketball: '🏀', tennis: '🎾' }[sport] || '🏆'
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
  <div class="py-8 min-h-screen bg-bg">
    <div class="container-app">

      <!-- Header -->
      <div class="mb-8">
        <p class="section-header mb-2">Statistics</p>
        <h1 class="font-display font-bold text-3xl md:text-4xl text-text mb-2">
          {{ t('accuracy.title') }}
        </h1>
        <p class="text-muted text-sm">{{ t('accuracy.subtitle') }}</p>
      </div>

      <!-- Streak banner -->
      <div v-if="!loading && currentStreak && currentStreak.count >= 2"
        :class="[
          'flex items-center gap-3 px-5 py-3.5 rounded-xl border mb-6',
          currentStreak.type === 'winning'
            ? 'bg-win/8 border-win/20 text-win'
            : 'bg-loss/8 border-loss/20 text-loss'
        ]">
        <FireIcon :class="['w-5 h-5 shrink-0', currentStreak.type === 'winning' ? 'text-gold' : 'text-loss']" />
        <div class="flex-1">
          <span class="font-display font-bold text-lg leading-none">
            {{ currentStreak.count }}-{{ currentStreak.type === 'winning' ? 'Win' : 'Loss' }} Streak
          </span>
          <span class="text-xs opacity-70 ml-2">
            {{ currentStreak.type === 'winning' ? 'Keep riding the wave 🔥' : 'The tide will turn' }}
          </span>
        </div>
        <span :class="['font-display font-bold text-2xl', currentStreak.type === 'winning' ? 'text-gold' : 'text-loss']">
          {{ currentStreak.count }}
        </span>
      </div>

      <div v-if="loading" class="space-y-6">
        <AppSkeleton height="80px" rounded="lg" />
        <AppSkeleton height="180px" rounded="lg" />
        <AppSkeleton height="280px" rounded="lg" />
      </div>

      <template v-else>

        <!-- ── Period summary strip ──────────────────────────── -->
        <div v-if="summary" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div v-for="p in [
            { label: 'All Time',   data: summary.allTime },
            { label: 'This Month', data: summary.thisMonth },
            { label: 'This Week',  data: summary.thisWeek },
            { label: 'Today',      data: summary.today },
          ]" :key="p.label"
            class="card p-4 text-center"
          >
            <p class="text-[10px] font-display font-semibold uppercase tracking-wider text-muted mb-1">{{ p.label }}</p>
            <p class="font-display font-bold text-2xl text-accent">{{ p.data?.accuracy ?? 0 }}%</p>
            <p class="text-xs text-muted mt-1">{{ p.data?.correct ?? 0 }}/{{ p.data?.total ?? 0 }}</p>
          </div>
        </div>

        <!-- ── Period tabs ──────────────────────────────────── -->
        <div class="flex gap-2 mb-6">
          <button
            v-for="p in periods" :key="p.key"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-semibold border transition-all',
              activePeriod === p.key
                ? 'bg-accent text-bg border-accent'
                : 'bg-surface text-muted border-border hover:border-accent/40 hover:text-text'
            ]"
            @click="switchPeriod(p.key)"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- Period loading overlay -->
        <div v-if="periodLoading" class="flex justify-center py-8">
          <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>

        <template v-else>

          <!-- ── Overall stat cards ───────────────────────────── -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="card p-6 text-center">
              <ChartBarIcon class="w-7 h-7 text-accent mx-auto mb-2" />
              <p class="stat-label mb-2">{{ t('accuracy.overall') }}</p>
              <p class="text-4xl font-display font-bold text-gradient-accent">
                {{ overall?.accuracy_percentage ?? 0 }}%
              </p>
              <p class="text-xs text-muted mt-2">
                {{ overall?.correct_predictions ?? 0 }} / {{ overall?.total_predictions ?? 0 }} correct
              </p>
            </div>

            <div class="card p-6 text-center">
              <TrophyIcon class="w-7 h-7 text-gold mx-auto mb-2" />
              <p class="stat-label mb-2">Value Bets</p>
              <p class="text-4xl font-display font-bold text-gold">
                {{ valueBets?.accuracy_percentage ?? 0 }}%
              </p>
              <p class="text-xs text-muted mt-2">
                {{ valueBets?.correct ?? 0 }} / {{ valueBets?.total ?? 0 }} correct
              </p>
            </div>

            <div class="card p-6 text-center">
              <FireIcon class="w-7 h-7 mx-auto mb-2"
                :class="currentStreak?.type === 'winning' ? 'text-accent' : 'text-loss'" />
              <p class="stat-label mb-2">Current Streak</p>
              <p class="text-4xl font-display font-bold"
                :class="currentStreak?.type === 'winning' ? 'text-accent' : 'text-loss'">
                {{ currentStreak?.count ?? 0 }}
              </p>
              <p class="text-xs text-muted mt-2 capitalize">
                {{ currentStreak?.type ?? 'N/A' }}
              </p>
            </div>

            <div class="card p-6">
              <p class="stat-label mb-3">Breakdown</p>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted">Total</span>
                  <span class="text-text font-medium">{{ overall?.total_predictions ?? 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Correct</span>
                  <span class="text-win font-medium">{{ overall?.correct_predictions ?? 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Incorrect</span>
                  <span class="text-loss font-medium">{{ overall?.incorrect_predictions ?? 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── By Outcome ────────────────────────────────────── -->
          <div v-if="outcomeArray.length" class="card p-6 mb-8">
            <p class="section-header mb-4">Accuracy by Outcome</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="o in outcomeArray" :key="o.key" class="p-4 rounded-lg border bg-bg"
                :class="o.colour.split(' ').slice(1).join(' ')">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm font-semibold" :class="o.colour.split(' ')[0]">{{ o.label }}</span>
                  <span class="font-display font-bold text-xl" :class="o.colour.split(' ')[0]">
                    {{ o.accuracy_percentage }}%
                  </span>
                </div>
                <div class="w-full h-2 rounded-full bg-surface mb-2">
                  <div class="h-2 rounded-full transition-all" :class="o.bar"
                    :style="{ width: o.accuracy_percentage + '%' }" />
                </div>
                <p class="text-xs text-muted">{{ o.correct }} / {{ o.total }} correct</p>
              </div>
            </div>
            <p class="text-xs text-muted mt-4">
              Draws are the hardest outcome to predict — a lower draw accuracy is expected across all models.
            </p>
          </div>

          <!-- ── By Confidence ─────────────────────────────────── -->
          <div v-if="byConfidence.length" class="card p-6 mb-8">
            <p class="section-header mb-4">Accuracy by Confidence Level</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="conf in byConfidence" :key="conf.level" class="p-4 bg-bg rounded-lg">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-muted capitalize">
                    {{ conf.level }} <span class="text-xs">({{ conf.range }})</span>
                  </span>
                  <span class="font-display font-bold text-lg text-accent">{{ conf.accuracy_percentage }}%</span>
                </div>
                <div class="w-full bg-surface rounded-full h-2 mb-2">
                  <div class="bg-accent rounded-full h-2 transition-all"
                    :style="{ width: conf.accuracy_percentage + '%' }" />
                </div>
                <p class="text-xs text-muted">{{ conf.correct }} / {{ conf.total }} correct</p>
              </div>
            </div>
          </div>

          <!-- ── By Sport ──────────────────────────────────────── -->
          <div v-if="sportsArray.length" class="card p-6 mb-8">
            <p class="section-header mb-4">{{ t('accuracy.bySport') }}</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="s in sportsArray" :key="s.sport"
                class="flex items-center gap-4 p-4 bg-bg rounded-lg">
                <div class="text-2xl">{{ sportEmoji(s.sport) }}</div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-text capitalize">{{ s.sport }}</p>
                  <p class="text-xs text-muted">{{ s.correct_predictions }} / {{ s.total_predictions }} correct</p>
                </div>
                <p class="font-display font-bold text-2xl text-accent shrink-0">{{ s.accuracy_percentage }}%</p>
              </div>
            </div>
          </div>

        </template><!-- end period template -->

        <!-- ── By League ─────────────────────────────────────── -->
        <div v-if="leagues.length" class="card overflow-hidden mb-8">
          <div class="p-4 border-b border-border flex items-center gap-2">
            <TableCellsIcon class="w-4 h-4 text-muted" />
            <p class="section-header">Accuracy by League</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[480px]">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">League</th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Predictions</th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Correct</th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Accuracy</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="lg in leagues" :key="lg.league_id" class="hover:bg-surface/50 transition-colors">
                  <td class="px-4 py-3">
                    <span class="text-sm font-medium text-text">{{ lg.league_name }}</span>
                  </td>
                  <td class="px-4 py-3 text-center text-sm text-muted">{{ lg.total_predictions }}</td>
                  <td class="px-4 py-3 text-center text-sm text-win font-medium">{{ lg.correct_predictions }}</td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <div class="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                        <div class="h-full rounded-full bg-accent" :style="{ width: lg.accuracy_percentage + '%' }" />
                      </div>
                      <span class="font-display font-bold text-sm text-accent w-10 text-right">
                        {{ lg.accuracy_percentage }}%
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ── 30-day trend chart ─────────────────────────────── -->
        <div v-if="trends.length" class="card p-6 mb-8">
          <div class="flex items-center gap-2 mb-4">
            <CalendarDaysIcon class="w-4 h-4 text-muted" />
            <p class="section-header">{{ t('accuracy.last30Days') }}</p>
          </div>
          <div class="h-64">
            <Line :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <!-- ── Recent predictions table ─────────────────────── -->
        <div class="card overflow-hidden">
          <div class="p-4 border-b border-border">
            <p class="section-header">{{ t('accuracy.recentPredictions') }}</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[600px]">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Match</th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Score</th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Predicted</th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Actual</th>
                  <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">Result</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="pred in recent" :key="pred.prediction_id"
                  class="hover:bg-surface/50 transition-colors">
                  <td class="px-4 py-3">
                    <div class="text-sm text-text">
                      {{ pred.fixture?.home_team || '-' }} vs {{ pred.fixture?.away_team || '-' }}
                    </div>
                    <div class="text-xs text-muted">
                      {{ pred.fixture?.league || '' }}
                      <span v-if="pred.fixture?.kickoff_at"> · {{ formatDate(pred.fixture.kickoff_at) }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="text-sm font-medium text-text">
                      {{ pred.fixture?.home_score ?? '-' }} – {{ pred.fixture?.away_score ?? '-' }}
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
          <div v-if="!recent.length" class="p-8 text-center text-muted text-sm">
            No predictions logged yet
          </div>
        </div>

      </template>
    </div>
  </div>
</template>
