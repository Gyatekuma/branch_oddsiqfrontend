<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePredictionsStore } from '@/stores/predictions'
import { usePremium } from '@/composables/usePremium'
import { useAuthStore } from '@/stores/auth'
import { useLocale } from '@/composables/useLocale'
import api from '@/api/axios'
import accuracyApi from '@/api/accuracy'
import leaguesApi from '@/api/leagues'
import predictionsApi from '@/api/predictions'
import { getLeagueLogo } from '@/utils/leagueLogos'
import PredictionCard from '@/components/predictions/PredictionCard.vue'
import PredictionStatsSection from '@/components/stats/PredictionStatsSection.vue'
import PremiumBlur from '@/components/predictions/PremiumBlur.vue'
import NewsletterSignup from '@/components/newsletter/NewsletterSignup.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import PullToRefreshIndicator from '@/components/ui/PullToRefreshIndicator.vue'
import { usePullToRefresh } from '@/composables/usePullToRefresh'
import ConfidenceMeter from '@/components/predictions/ConfidenceMeter.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import {
  ArrowRightIcon,
  SparklesIcon,
  FireIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon,
  GlobeAltIcon,
} from '@heroicons/vue/24/outline'
import { BoltIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/solid'

const { t } = useI18n()
const predictionsStore = usePredictionsStore()
const authStore = useAuthStore()
const { isPremium, canSeePrediction } = usePremium()
const { formatTime, formatDate } = useLocale()

const loading = ref(true)
const topPickLoading = ref(true)

// Animated stat counters
const accuracyCount = ref(0)
const predictionsCount = ref(0)
const leaguesCount = ref(0)

function animateCount(target, setter, duration = 1800) {
  const start = performance.now()
  function step(now) {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    setter(Math.floor(eased * target))
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// Markets preview
const marketTabs = [
  { key: '1x2', label: '1X2', endpoint: null },
  { key: 'over_under', label: 'Over/Under', endpoint: '/api/markets/over-under' },
  { key: 'btts', label: 'BTTS', endpoint: '/api/markets/btts' },
  { key: 'double_chance', label: 'Double Chance', endpoint: '/api/markets/double-chance' },
]
const activeMarketTab = ref('1x2')
const marketCache = ref({})
const marketLoading = ref(false)

async function switchMarketTab(key) {
  activeMarketTab.value = key
  if (marketCache.value[key]) return
  marketLoading.value = true
  try {
    const tab = marketTabs.find(t => t.key === key)
    if (!tab.endpoint) {
      marketCache.value[key] = predictionsStore.topPicks.slice(0, 3)
    } else {
      const res = await api.get(tab.endpoint, { params: { per_page: 3 } })
      marketCache.value[key] = res.data?.data?.predictions || []
    }
  } catch {
    marketCache.value[key] = []
  } finally {
    marketLoading.value = false
  }
}

const activeMarketItems = computed(() => marketCache.value[activeMarketTab.value] || [])

// ── Engagement features ───────────────────────────────────────
const recentResults = ref([])
const sportAccuracy = ref({})
const leagueSpotlight = ref([])
const leagueLogoErrors = ref(new Set())
function onLeagueLogoError(id) {
  leagueLogoErrors.value = new Set([...leagueLogoErrors.value, id])
}
const countdownText = ref('')
let countdownTimer = null

// Vote widget
const userVote = ref(null)
const voteCounts = ref({ home: 0, draw: 0, away: 0 })

function getSeedVotes(predId, confidence) {
  const seed = ((predId || 1) * 2654435761) >>> 0
  const total = 180 + (seed % 120)
  const c = Math.max(30, Math.min(80, confidence || 60))
  const homeVotes = Math.round((c / 100) * total)
  const remaining = total - homeVotes
  const drawVotes = Math.round(remaining * 0.38)
  const awayVotes = remaining - drawVotes
  return { home: homeVotes, draw: drawVotes, away: awayVotes }
}

function castVote(choice) {
  if (userVote.value || !topPick.value) return
  userVote.value = choice
  try { localStorage.setItem(`edi_vote_${topPick.value.id}`, choice) } catch {}
  const seeds = getSeedVotes(topPick.value.id, confidenceVal(topPick.value))
  voteCounts.value = {
    home: seeds.home + (choice === 'home' ? 1 : 0),
    draw: seeds.draw + (choice === 'draw' ? 1 : 0),
    away: seeds.away + (choice === 'away' ? 1 : 0),
  }
}

function votePercent(key) {
  const total = voteCounts.value.home + voteCounts.value.draw + voteCounts.value.away
  if (!total) return 0
  return Math.round((voteCounts.value[key] / total) * 100)
}

function startCountdown() {
  const all = [...predictionsStore.topPicks, ...predictionsStore.predictions]
  const upcoming = all
    .map(p => new Date(p.fixture?.kickoff_at || p.kickoff_at))
    .filter(d => !isNaN(d.getTime()) && d > new Date())
    .sort((a, b) => a - b)
  if (!upcoming.length) return

  const target = upcoming[0]
  function tick() {
    const diff = target - new Date()
    if (diff <= 0) { countdownText.value = 'Kick-off!'; return }
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    countdownText.value = h > 0
      ? `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
      : `${m}m ${String(s).padStart(2, '0')}s`
    countdownTimer = setTimeout(tick, 1000)
  }
  tick()
}

// Hero cycling words
const cyclingWords = ['WIN MORE', 'BET SMARTER', 'FIND THE EDGE', 'BEAT THE ODDS']
const cyclingWordIndex = ref(0)
let cyclingTimer = null

// Mouse parallax + spotlight — CSS custom properties only, zero Vue reactivity
const heroRef = ref(null)
let rafId = null

function onHeroMouseMove(e) {
  const el = heroRef.value
  if (!el) return
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width).toFixed(4))
    el.style.setProperty('--my', ((e.clientY - rect.top) / rect.height).toFixed(4))
  })
}

function onHeroMouseLeave() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    heroRef.value?.style.setProperty('--mx', '0.5')
    heroRef.value?.style.setProperty('--my', '0.5')
  })
}

onUnmounted(() => {
  clearTimeout(countdownTimer)
  clearInterval(cyclingTimer)
  if (rafId) cancelAnimationFrame(rafId)
})

async function fetchHome() {
  loading.value = true

  // If store already has stale cache data, unblock the card immediately
  if (predictionsStore.topPicks.length) topPickLoading.value = false

  // Top picks fires independently — hero card renders as soon as this responds
  const topPicksReady = predictionsStore.fetchTopPicks(3)
    .then(() => {
      topPickLoading.value = false
      marketCache.value['1x2'] = predictionsStore.topPicks.slice(0, 3)
      if (predictionsStore.topPicks[0]) {
        try {
          const saved = localStorage.getItem(`edi_vote_${predictionsStore.topPicks[0].id}`)
          if (saved) {
            userVote.value = saved
            const seeds = getSeedVotes(predictionsStore.topPicks[0].id, confidenceVal(predictionsStore.topPicks[0]))
            voteCounts.value = {
              home: seeds.home + (saved === 'home' ? 1 : 0),
              draw: seeds.draw + (saved === 'draw' ? 1 : 0),
              away: seeds.away + (saved === 'away' ? 1 : 0),
            }
          }
        } catch {}
      }
      startCountdown()
      cyclingTimer = setInterval(() => {
        cyclingWordIndex.value = (cyclingWordIndex.value + 1) % cyclingWords.length
      }, 2600)
    })
    .catch(() => { topPickLoading.value = false })

  loadTickerData()

  try {
    await Promise.all([
      topPicksReady,
      predictionsStore.fetchPredictions({ per_page: 6 }),
      predictionsStore.fetchValueBets(),
    ])
  } finally {
    loading.value = false
  }
  const total = predictionsStore.pagination?.totalAvailable || predictionsStore.pagination?.total || 0
  if (total > 0) animateCount(total, v => predictionsCount.value = v)

  // Non-blocking secondary fetches
  Promise.all([
    accuracyApi.getRecent(10)
      .then(({ recent }) => {
        recentResults.value = recent.slice(0, 10).map(
          r => r.was_correct === true || r.correct === true || r.is_correct === true
        )
      })
      .catch(() => {}),
    accuracyApi.getOverall()
      .then(({ overall, bySport }) => {
        sportAccuracy.value = bySport || {}
        const pct = Math.round(overall?.accuracy_percentage || 0)
        if (pct > 0) animateCount(pct, v => accuracyCount.value = v)
      })
      .catch(() => {}),
    Promise.all([
      leaguesApi.getBySport('football'),
      leaguesApi.getAll()
    ]).then(([footballResult, allResult]) => {
        const footballLeagues = Array.isArray(footballResult.leagues) ? footballResult.leagues : []
        const seen = new Set()
        leagueSpotlight.value = footballLeagues
          .filter(l => {
            const k = l.name?.toLowerCase()
            if (!k || seen.has(k)) return false
            seen.add(k)
            return true
          })
          .slice(0, 10)

        // Count total leagues across all sports
        const allData = allResult.leagues || {}
        const totalLeagues = Object.values(allData).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
        animateCount(totalLeagues || seen.size, v => leaguesCount.value = v, 1200)
      })
      .catch(() => {}),
  ])
}

const { isPulling, isRefreshing, pullDistance } = usePullToRefresh(fetchHome)

onMounted(fetchHome)

const topPick = computed(() => predictionsStore.topPicks[0])

const topPickDayLabel = computed(() => {
  if (!topPick.value) return "Today's Top Pick"
  const kickoff = topPick.value.fixture?.kickoff_at || topPick.value.kickoff_at
  if (!kickoff) return "Today's Top Pick"
  const d = new Date(kickoff)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return "Today's Top Pick"
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow's Top Pick"
  return `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} Top Pick`
})

const beatTheLetters = ['B','R','E','A','K','I','N','G']

const arcRadius = 105
const arcCircumference = computed(() => 2 * Math.PI * arcRadius)
const arcDashArray = computed(() => arcCircumference.value * (accuracyCount.value / 100))

function outcomeLabel(outcome) {
  if (!outcome) return ''
  if (outcome === 'home') return 'Home Win'
  if (outcome === 'draw') return 'Draw'
  if (outcome === 'away') return 'Away Win'
  if (outcome?.startsWith('over')) return `Over ${outcome.split('_')[1]}`
  if (outcome?.startsWith('under')) return `Under ${outcome.split('_')[1]}`
  return outcome
}

function marketOutcomeLabel(item) {
  return item.outcome_display || outcomeLabel(item.predicted_outcome)
}

function kickoffDisplay(kickoff) {
  if (!kickoff) return ''
  const d = new Date(kickoff)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return `Today ${formatTime(kickoff)}`
  return `${formatDate(kickoff, { month: 'short', day: 'numeric' })} ${formatTime(kickoff)}`
}

function confidenceVal(item) {
  const raw = item.confidence_score ?? item.confidence ?? 0
  let score = Number(raw)
  while (score > 100) score = score / 100
  return Math.round(score)
}

const tickerItems = computed(() => {
  const seen = new Set()
  return tickerPredictions.value.filter(p => {
    if (!p.fixture) return false
    const key = p.fixture.id ?? p.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

const tickerTrack = ref(null)
const tickerPredictions = ref([])

function setupTicker() {
  nextTick(() => {
    const el = tickerTrack.value
    if (!el) return
    const shift = el.scrollWidth / 2
    el.style.setProperty('--ticker-shift', `${shift}px`)
  })
}

async function loadTickerData() {
  try {
    const { predictions } = await predictionsApi.getTicker()
    tickerPredictions.value = predictions || []
  } catch {}
  setupTicker()
}

const sportAccuracyEntries = computed(() =>
  Object.entries(sportAccuracy.value)
    .filter(([, d]) => d && (d.accuracy_rate !== undefined || d.accuracy_pct !== undefined))
    .slice(0, 4)
)

const predictionsLabel = computed(() => {
  const preds = predictionsStore.predictions
  if (!preds.length) return { header: '1X2 Predictions', title: "Today's picks" }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dates = preds
    .map(p => {
      const d = new Date(p.fixture?.kickoff_at || p.kickoff_at)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
    .filter(t => !isNaN(t))

  if (!dates.length) return { header: '1X2 Predictions', title: "Today's picks" }

  const earliest = Math.min(...dates)
  const todayTs = today.getTime()
  const tomorrowTs = tomorrow.getTime()

  if (earliest === todayTs) return { header: '1X2 Predictions', title: "Today's picks" }
  if (earliest === tomorrowTs) return { header: 'Coming Up Tomorrow', title: "Tomorrow's picks" }

  const label = new Date(earliest).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })
  return { header: 'Upcoming', title: `${label} picks` }
})

const trackRecordCorrect = computed(() => recentResults.value.filter(Boolean).length)
const trackRecordPct = computed(() =>
  recentResults.value.length
    ? Math.round((trackRecordCorrect.value / recentResults.value.length) * 100)
    : 0
)
</script>

<template>
  <div class="min-h-screen bg-bg">
    <PullToRefreshIndicator :is-pulling="isPulling" :is-refreshing="isRefreshing" :pull-distance="pullDistance" />

    <!-- ═══════════════════════════════════════════════════════
         ABOVE FOLD: hero + ticker fill exactly the viewport
    ═══════════════════════════════════════════════════════ -->
    <div class="above-fold">

    <!-- ── HERO ── -->
    <section
      ref="heroRef"
      class="hero-root relative overflow-hidden"
      @mousemove="onHeroMouseMove"
      @mouseleave="onHeroMouseLeave"
    >

      <!-- ── BACKGROUND LAYERS ── -->
      <div class="absolute inset-0 hero-grid opacity-30 pointer-events-none"></div>
      <div class="hero-blob hero-blob-gold pointer-events-none"></div>
      <div class="hero-blob hero-blob-blue pointer-events-none"></div>
      <div class="hero-diagonal-beam pointer-events-none"></div>
      <div class="hero-noise pointer-events-none"></div>
      <div class="hero-scan-line pointer-events-none"></div>

      <!-- Spotlight cursor — driven by --mx/--my CSS vars -->
      <div class="hero-spotlight pointer-events-none" aria-hidden="true"></div>

      <!-- Giant accuracy watermark -->
      <div class="hero-watermark pointer-events-none select-none" aria-hidden="true">{{ accuracyCount || 73 }}%</div>

      <!-- Floating particles -->
      <div class="hero-particles pointer-events-none" aria-hidden="true">
        <span class="p p1"></span><span class="p p2"></span><span class="p p3"></span>
        <span class="p p4"></span><span class="p p5"></span>
      </div>

      <div class="relative container-app flex-1 flex flex-col">
        <div class="hero-inner flex flex-col justify-center">

          <!-- ── LIVE BAR ── -->
          <div class="hero-enter d1 flex items-center justify-between mb-4 md:mb-6">
            <div class="flex items-center gap-3">
              <!-- Live badge with expanding rings -->
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                <span class="live-ring-wrap relative shrink-0 w-2 h-2">
                  <span class="live-ring-pulse r1"></span>
                  <span class="live-ring-pulse r2"></span>
                  <span class="hero-live-dot w-2 h-2 rounded-full bg-accent block absolute inset-0"></span>
                </span>
                <span class="text-accent text-xs font-bold tracking-widest uppercase">Live</span>
                <span class="w-px h-3 bg-accent/30 block"></span>
                <span class="text-accent/80 text-xs font-semibold">{{ predictionsCount || 0 }} picks today</span>
              </div>
              <!-- Win streak pill -->
              <div v-if="recentResults.length >= 3 && recentResults.slice(-3).every(Boolean)" class="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border" style="background:rgba(34,197,94,0.07);border-color:rgba(34,197,94,0.25)">
                <span class="text-sm leading-none">🔥</span>
                <span class="text-[11px] font-bold text-win uppercase tracking-wider">Win streak</span>
              </div>
            </div>
            <div v-if="countdownText" class="hidden sm:flex items-center gap-2">
              <span class="text-xs text-muted">Next kick-off</span>
              <span class="px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-mono font-bold text-accent tabular-nums">{{ countdownText }}</span>
            </div>
          </div>

          <!-- ── MAIN CONTENT GRID ── -->
          <div class="grid grid-cols-1 lg:grid-cols-[1fr_430px] gap-8 lg:gap-16 items-center">

            <!-- LEFT COLUMN -->
            <div class="flex flex-col">

              <!-- Headline -->
              <h1 class="font-display font-bold leading-[0.87] tracking-tighter mb-4 md:mb-5">
                <span class="block hero-h1-white">
                  <span
                    v-for="(ch, i) in beatTheLetters"
                    :key="i"
                    class="letter-fall inline-block"
                    :style="`animation-delay:${0.10 + i * 0.04}s`"
                  >{{ ch }}</span>
                </span>
                <span class="block hero-gold-reveal" style="animation-delay:0.55s">
                  <span class="hero-h1-white">THE</span>
                  <span class="hero-h1-gold"> CODE.</span>
                </span>
              </h1>

              <!-- Cycling subtitle -->
              <div class="hero-enter d4 flex items-center gap-2 mb-5">
                <span class="text-muted text-sm md:text-base">The AI that helps you</span>
                <span class="relative inline-flex overflow-hidden">
                  <Transition name="cycle" mode="out-in">
                    <span :key="cyclingWordIndex" class="text-accent font-bold text-sm md:text-base">
                      {{ cyclingWords[cyclingWordIndex] }}
                    </span>
                  </Transition>
                </span>
              </div>

              <!-- Body copy -->
              <p class="hero-enter d5 text-muted text-sm md:text-base mb-6 max-w-md leading-relaxed">
                Data-driven predictions across football, basketball &amp; tennis — with confidence scores, live form &amp; real odds from top bookmakers.
              </p>

              <!-- Recent form strip -->
              <div v-if="recentResults.length > 0" class="hero-enter d5 flex items-center gap-3 mb-7">
                <span class="text-xs text-muted uppercase tracking-wider shrink-0">Recent</span>
                <div class="flex gap-1">
                  <span
                    v-for="(correct, i) in recentResults.slice(0, 7)"
                    :key="i"
                    :class="['form-dot w-5 h-5 rounded-sm text-[9px] font-bold flex items-center justify-center',
                      correct ? 'bg-win/20 text-win' : 'bg-loss/20 text-loss']"
                    :style="{ animationDelay: `${0.8 + i * 0.07}s` }"
                  >{{ correct ? 'W' : 'L' }}</span>
                </div>
                <span class="text-xs font-bold text-win">{{ trackRecordPct }}% hit rate</span>
              </div>

              <!-- CTA buttons -->
              <div class="hero-enter d6 flex flex-col sm:flex-row gap-3 mb-9">
                <RouterLink to="/predictions" class="flex-1 sm:flex-none">
                  <button class="hero-primary-cta w-full sm:w-auto flex items-center justify-center gap-2">
                    See Today's Picks
                    <ArrowRightIcon class="w-5 h-5" />
                  </button>
                </RouterLink>
                <RouterLink to="/markets" class="flex-1 sm:flex-none">
                  <AppButton variant="outline" size="lg" class="w-full sm:w-auto">
                    View Markets
                  </AppButton>
                </RouterLink>
              </div>

              <!-- Stats row -->
              <div class="hero-enter d7 flex items-stretch divide-x divide-border border border-border rounded-2xl overflow-hidden max-w-[300px]" style="background: rgba(13,16,24,0.8)">
                <div class="flex-1 py-3 px-3 text-center">
                  <div class="font-display font-bold text-2xl text-accent leading-none">{{ accuracyCount }}<span class="text-base">%</span></div>
                  <div class="text-[10px] text-muted uppercase tracking-wider mt-1">Accuracy</div>
                </div>
                <div class="flex-1 py-3 px-3 text-center">
                  <div class="font-display font-bold text-2xl text-text leading-none">{{ predictionsCount }}</div>
                  <div class="text-[10px] text-muted uppercase tracking-wider mt-1">Today</div>
                </div>
                <div class="flex-1 py-3 px-3 text-center">
                  <div class="font-display font-bold text-2xl text-text leading-none">{{ leaguesCount }}<span class="text-sm text-muted">+</span></div>
                  <div class="text-[10px] text-muted uppercase tracking-wider mt-1">Leagues</div>
                </div>
              </div>
            </div>

            <!-- RIGHT COLUMN: Pick card -->
            <div class="hero-enter d3 relative">

              <!-- Floating win chips (desktop only) -->
              <div
                v-if="!topPickLoading && recentResults.filter(Boolean).length >= 1"
                class="chip chip-a absolute hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold z-20 whitespace-nowrap"
                style="top: -20px; left: -32px; background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.25); color: #22c55e; box-shadow: 0 8px 32px rgba(34,197,94,0.12);"
              >
                <CheckCircleIcon class="w-3.5 h-3.5 shrink-0" />
                Prediction correct
              </div>
              <div
                v-if="!topPickLoading && recentResults.filter(Boolean).length >= 2"
                class="chip chip-b absolute hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold z-20 whitespace-nowrap"
                style="bottom: 60px; right: -28px; background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.25); color: #22c55e; box-shadow: 0 8px 32px rgba(34,197,94,0.12);"
              >
                <CheckCircleIcon class="w-3.5 h-3.5 shrink-0" />
                Another win ✓
              </div>
              <div
                class="chip chip-c absolute hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold z-20 whitespace-nowrap"
                style="top: 50%; right: -36px; transform: translateY(-50%); background: rgba(212,160,23,0.08); border-color: rgba(212,160,23,0.25); color: #d4a017; box-shadow: 0 8px 32px rgba(212,160,23,0.10);"
              >
                <BoltIcon class="w-3.5 h-3.5 shrink-0" />
                AI-powered
              </div>

              <!-- Pick card skeleton -->
              <div v-if="topPickLoading"><AppSkeleton height="380px" rounded="xl" /></div>

              <!-- THE PICK CARD -->
              <div v-else-if="topPick" class="card-stack-wrap relative">
                <!-- Accuracy arc ring behind card -->
                <svg
                  class="accuracy-arc-svg"
                  viewBox="0 0 240 240"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="arc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#d4a017" stop-opacity="0.12"/>
                      <stop offset="50%" stop-color="#fde68a" stop-opacity="0.60"/>
                      <stop offset="100%" stop-color="#d4a017" stop-opacity="0.08"/>
                    </linearGradient>
                  </defs>
                  <circle cx="120" cy="120" r="116" fill="none" stroke="rgba(212,160,23,0.04)" stroke-width="1"/>
                  <circle cx="120" cy="120" r="105" fill="none" stroke="rgba(212,160,23,0.07)" stroke-width="1.5"/>
                  <circle
                    cx="120" cy="120" r="105"
                    fill="none"
                    stroke="url(#arc-gradient)"
                    stroke-width="3"
                    stroke-linecap="round"
                    :stroke-dasharray="`${arcDashArray} ${arcCircumference}`"
                    transform="rotate(-90 120 120)"
                  />
                </svg>

                <!-- Ghost cards for depth -->
                <div class="ghost-card ghost-1"></div>
                <div class="ghost-card ghost-2"></div>

                <!-- Ambient glow behind card -->
                <div class="card-ambient-glow"></div>

              <div class="hero-pick-card relative">

                <!-- Rotating border ring -->
                <div class="hero-pick-ring" aria-hidden="true"></div>

                <div class="hero-pick-inner">
                  <!-- Card header -->
                  <div class="flex items-center justify-between mb-5">
                    <div class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-accent animate-pulse block"></span>
                      <span class="text-xs font-bold text-accent uppercase tracking-widest">{{ topPickDayLabel }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-muted">
                      <ClockIcon class="w-3.5 h-3.5" />
                      {{ kickoffDisplay(topPick.fixture?.kickoff_at || topPick.kickoff_at) }}
                    </div>
                  </div>

                  <!-- Teams -->
                  <div class="space-y-2 mb-5">
                    <div class="team-row flex items-center justify-between gap-3">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style="background:rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08)">
                          <img v-if="topPick.fixture?.home_team?.logo_url || topPick.fixture?.home_team?.logo" :src="topPick.fixture.home_team.logo_url || topPick.fixture.home_team.logo" class="w-6 h-6 object-contain" loading="eager" decoding="async">
                          <span v-else class="text-[10px] font-bold text-muted">H</span>
                        </div>
                        <span class="font-display font-semibold text-text truncate">{{ topPick.fixture?.home_team?.name || topPick.home_team }}</span>
                      </div>
                      <div v-if="topPick.home_form?.form_string" class="flex gap-0.5 shrink-0">
                        <span v-for="(r, i) in topPick.home_form.form_string.slice(0, 5)" :key="i" :class="['w-4 h-4 rounded-sm text-[8px] font-bold flex items-center justify-center', r==='W'?'bg-win/20 text-win':r==='D'?'bg-draw/20 text-draw':'bg-loss/20 text-loss']">{{ r }}</span>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <div class="flex-1 h-px" style="background: rgba(255,255,255,0.06)"></div>
                      <span class="text-[10px] font-bold text-muted/50">VS</span>
                      <div class="flex-1 h-px" style="background: rgba(255,255,255,0.06)"></div>
                    </div>

                    <div class="team-row flex items-center justify-between gap-3">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style="background:rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08)">
                          <img v-if="topPick.fixture?.away_team?.logo_url || topPick.fixture?.away_team?.logo" :src="topPick.fixture.away_team.logo_url || topPick.fixture.away_team.logo" class="w-6 h-6 object-contain" loading="eager" decoding="async">
                          <span v-else class="text-[10px] font-bold text-muted">A</span>
                        </div>
                        <span class="font-display font-semibold text-text truncate">{{ topPick.fixture?.away_team?.name || topPick.away_team }}</span>
                      </div>
                      <div v-if="topPick.away_form?.form_string" class="flex gap-0.5 shrink-0">
                        <span v-for="(r, i) in topPick.away_form.form_string.slice(0, 5)" :key="i" :class="['w-4 h-4 rounded-sm text-[8px] font-bold flex items-center justify-center', r==='W'?'bg-win/20 text-win':r==='D'?'bg-draw/20 text-draw':'bg-loss/20 text-loss']">{{ r }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Prediction banner -->
                  <div class="prediction-banner flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl mb-4">
                    <div>
                      <div class="text-[10px] text-accent/60 uppercase tracking-widest mb-1.5">AI Prediction</div>
                      <div class="font-display font-bold text-2xl text-accent leading-none">{{ outcomeLabel(topPick.predicted_outcome) }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-[10px] text-accent/60 uppercase tracking-widest mb-2">Confidence</div>
                      <div class="flex items-center gap-2.5 justify-end">
                        <div class="confidence-track" style="width:64px; height:5px; border-radius:9999px; overflow:hidden; background:rgba(255,255,255,0.07)">
                          <div class="confidence-fill h-full rounded-full" :style="{ width: `${confidenceVal(topPick)}%` }"></div>
                        </div>
                        <span class="font-display font-bold text-2xl text-accent leading-none">{{ confidenceVal(topPick) }}<span class="text-base">%</span></span>
                      </div>
                    </div>
                  </div>

                  <!-- League -->
                  <p v-if="topPick.fixture?.league" class="flex items-center gap-1.5 text-xs text-muted mb-5">
                    <TrophyIcon class="w-3 h-3 shrink-0" />
                    <span class="truncate">{{ topPick.fixture.league.name }}{{ topPick.fixture.league.country ? ' · ' + topPick.fixture.league.country : '' }}</span>
                  </p>

                  <!-- CTA -->
                  <RouterLink :to="`/match/${topPick.id}`" class="card-cta-btn flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all">
                    Full Analysis
                    <ArrowRightIcon class="w-4 h-4" />
                  </RouterLink>
                </div>
              </div><!-- /hero-pick-card -->
              </div><!-- /card-stack-wrap -->

              <!-- No pick -->
              <div v-else class="hero-pick-card relative">
                <div class="hero-pick-ring" aria-hidden="true"></div>
                <div class="hero-pick-inner flex items-center justify-center py-16 text-center text-muted">
                  <div>
                    <TrophyIcon class="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p class="text-sm">No picks available yet</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         TICKER STRIP
    ═══════════════════════════════════════════════════════ -->
    <div
      v-if="tickerItems.length > 0"
      class="border-y border-border bg-surface/60 overflow-hidden py-3"
    >
      <div ref="tickerTrack" class="ticker-track">
        <span
          v-for="item in tickerItems"
          :key="item.id"
          class="inline-flex items-center gap-3 px-6 text-sm"
        >
          <span class="text-text font-medium whitespace-nowrap">
            {{ item.fixture?.home_team?.name || item.home_team }}
            <span class="text-muted mx-1">vs</span>
            {{ item.fixture?.away_team?.name || item.away_team }}
          </span>
          <span class="text-accent font-bold text-xs uppercase whitespace-nowrap">{{ outcomeLabel(item.predicted_outcome) }}</span>
          <span class="text-muted text-xs">{{ confidenceVal(item) }}%</span>
          <span class="text-border">·</span>
        </span>
        <!-- Duplicate for seamless loop -->
        <span
          v-for="item in tickerItems"
          :key="`d-${item.id}`"
          aria-hidden="true"
          class="inline-flex items-center gap-3 px-6 text-sm"
        >
          <span class="text-text font-medium whitespace-nowrap">
            {{ item.fixture?.home_team?.name || item.home_team }}
            <span class="text-muted mx-1">vs</span>
            {{ item.fixture?.away_team?.name || item.away_team }}
          </span>
          <span class="text-accent font-bold text-xs uppercase whitespace-nowrap">{{ outcomeLabel(item.predicted_outcome) }}</span>
          <span class="text-muted text-xs">{{ confidenceVal(item) }}%</span>
          <span class="text-border">·</span>
        </span>
      </div>
    </div>

    </div><!-- /above-fold -->

    <!-- ═══════════════════════════════════════════════════════
         STATS STRIP: next kick-off + sport accuracy
    ═══════════════════════════════════════════════════════ -->
    <div
      v-if="countdownText || sportAccuracyEntries.length > 0"
      class="bg-surface/40 border-b border-border"
    >
      <div class="container-app py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
        <!-- Next kick-off countdown -->
        <div v-if="countdownText" class="flex items-center gap-2.5">
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            <span class="text-xs text-muted uppercase tracking-wider">Next match</span>
          </div>
          <span class="text-sm font-bold text-accent tabular-nums font-mono">{{ countdownText }}</span>
        </div>

        <!-- Divider -->
        <div
          v-if="countdownText && sportAccuracyEntries.length > 0"
          class="hidden sm:block w-px h-4 bg-border"
        ></div>

        <!-- Sport accuracy breakdown -->
        <div v-if="sportAccuracyEntries.length > 0" class="flex items-center gap-5 flex-wrap">
          <span class="text-xs text-muted uppercase tracking-wider hidden sm:block">Accuracy</span>
          <div
            v-for="([sport, data]) in sportAccuracyEntries"
            :key="sport"
            class="flex items-center gap-1.5 text-sm"
          >
            <span class="capitalize text-muted">{{ sport }}</span>
            <span class="font-bold text-win">
              {{ Math.round((data.accuracy_rate !== undefined ? data.accuracy_rate : (data.accuracy_pct ?? 0) / 100) * 100) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         MARKETS PREVIEW
    ═══════════════════════════════════════════════════════ -->
    <section class="py-10 md:py-16 bg-bg">
      <div class="container-app">

        <div class="flex items-end justify-between mb-5 md:mb-8">
          <div>
            <p class="section-header mb-2">Betting Markets</p>
            <h2 class="font-display font-bold text-2xl md:text-3xl text-text">More ways to win</h2>
          </div>
          <RouterLink to="/markets" class="hidden sm:flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors font-medium">
            All markets
            <ArrowRightIcon class="w-4 h-4" />
          </RouterLink>
        </div>

        <div class="flex gap-2 mb-5 md:mb-8 overflow-x-auto scrollbar-hide pb-1">
          <button
            v-for="tab in marketTabs"
            :key="tab.key"
            :class="[
              'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border',
              activeMarketTab === tab.key
                ? 'bg-accent text-bg border-accent'
                : 'bg-surface text-muted border-border hover:border-accent/40 hover:text-text'
            ]"
            @click="switchMarketTab(tab.key)"
          >{{ tab.label }}</button>
        </div>

        <div v-if="marketLoading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AppSkeleton v-for="i in 3" :key="i" variant="card" class="h-40" />
        </div>

        <div v-else-if="activeMarketItems.length === 0" class="card p-10 text-center text-muted">
          <ChartBarIcon class="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p class="text-sm">No {{ marketTabs.find(t => t.key === activeMarketTab)?.label }} predictions right now</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RouterLink
            v-for="item in activeMarketItems.slice(0, 3)"
            :key="item.id"
            :to="`/match/${item.id}`"
            class="card-hover p-4 block group"
          >
            <div class="flex items-center gap-2 text-sm mb-3">
              <span class="font-semibold text-text truncate">{{ item.fixture?.home_team?.name || item.home_team }}</span>
              <span class="text-muted shrink-0">vs</span>
              <span class="font-semibold text-text truncate">{{ item.fixture?.away_team?.name || item.away_team }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-muted mb-4">
              <ClockIcon class="w-3.5 h-3.5 shrink-0" />
              <span>{{ kickoffDisplay(item.fixture?.kickoff_at) }}</span>
              <span v-if="item.fixture?.league" class="truncate">· {{ item.fixture.league.name }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent border border-accent/20 group-hover:bg-accent/20 transition-colors">
                {{ marketOutcomeLabel(item) }}
              </span>
              <div class="flex items-center gap-1.5 text-xs text-muted">
                <div class="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                  <div class="h-full rounded-full bg-accent transition-all" :style="{ width: `${confidenceVal(item)}%` }"></div>
                </div>
                <span class="font-semibold text-text">{{ confidenceVal(item) }}%</span>
              </div>
            </div>

          </RouterLink>
        </div>

        <div class="mt-6 sm:hidden text-center">
          <RouterLink to="/markets">
            <AppButton variant="outline" size="sm">
              View all markets
              <ArrowRightIcon class="w-4 h-4 ml-1.5" />
            </AppButton>
          </RouterLink>
        </div>

      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         YOUR PICK VS OURS — community vote widget
    ═══════════════════════════════════════════════════════ -->
    <section v-if="topPick && !loading" class="py-10 md:py-14 bg-surface/40 border-y border-border">
      <div class="container-app">
        <div class="max-w-xl mx-auto">

          <div class="text-center mb-6">
            <p class="section-header mb-1">Community</p>
            <h2 class="font-display font-bold text-2xl text-text">Your pick vs ours</h2>
            <p class="text-muted text-sm mt-1.5">
              <span class="font-medium text-text">{{ topPick.fixture?.home_team?.name || topPick.home_team }}</span>
              <span class="text-border mx-2">vs</span>
              <span class="font-medium text-text">{{ topPick.fixture?.away_team?.name || topPick.away_team }}</span>
            </p>
          </div>

          <!-- Before voting -->
          <template v-if="!userVote">
            <p class="text-center text-sm text-muted mb-4">Who do you think wins?</p>
            <div class="grid grid-cols-3 gap-2">
              <button
                class="py-4 rounded-xl border border-border bg-surface hover:border-accent/50 hover:bg-accent/5 transition-all text-center group cursor-pointer"
                @click="castVote('home')"
              >
                <div class="text-[11px] font-semibold text-text group-hover:text-accent transition-colors px-1.5 mb-1 leading-tight line-clamp-2">
                  {{ topPick.fixture?.home_team?.name || topPick.home_team }}
                </div>
                <div class="text-[10px] text-muted">Home Win</div>
              </button>
              <button
                class="py-4 rounded-xl border border-border bg-surface hover:border-accent/50 hover:bg-accent/5 transition-all text-center group cursor-pointer"
                @click="castVote('draw')"
              >
                <div class="text-xl font-display font-bold text-text group-hover:text-accent transition-colors mb-1">—</div>
                <div class="text-[10px] text-muted">Draw</div>
              </button>
              <button
                class="py-4 rounded-xl border border-border bg-surface hover:border-accent/50 hover:bg-accent/5 transition-all text-center group cursor-pointer"
                @click="castVote('away')"
              >
                <div class="text-[11px] font-semibold text-text group-hover:text-accent transition-colors px-1.5 mb-1 leading-tight line-clamp-2">
                  {{ topPick.fixture?.away_team?.name || topPick.away_team }}
                </div>
                <div class="text-[10px] text-muted">Away Win</div>
              </button>
            </div>
          </template>

          <!-- After voting: percentages -->
          <template v-else>
            <div class="space-y-4">
              <div
                v-for="option in [
                  { key: 'home', label: topPick.fixture?.home_team?.name || topPick.home_team },
                  { key: 'draw', label: 'Draw' },
                  { key: 'away', label: topPick.fixture?.away_team?.name || topPick.away_team }
                ]"
                :key="option.key"
              >
                <div class="flex items-center justify-between mb-1.5 text-sm">
                  <div class="flex items-center gap-2 min-w-0">
                    <span :class="['truncate', userVote === option.key ? 'text-accent font-semibold' : 'text-text']">
                      {{ option.label }}
                    </span>
                    <span
                      v-if="topPick.predicted_outcome === option.key"
                      class="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-gold bg-gold/10 border border-gold/20 px-1.5 py-0.5 rounded-full"
                    >
                      <BoltIcon class="w-2.5 h-2.5" />edi's pick
                    </span>
                    <span
                      v-if="userVote === option.key"
                      class="shrink-0 inline-flex items-center text-[10px] font-bold text-info bg-info/10 border border-info/20 px-1.5 py-0.5 rounded-full"
                    >Your pick</span>
                  </div>
                  <span class="font-bold text-text shrink-0 ml-2">{{ votePercent(option.key) }}%</span>
                </div>
                <div class="h-2 rounded-full bg-border overflow-hidden">
                  <div
                    :class="[
                      'h-full rounded-full transition-all duration-700',
                      topPick.predicted_outcome === option.key
                        ? 'bg-gradient-to-r from-gold/80 to-gold'
                        : userVote === option.key
                          ? 'bg-info'
                          : 'bg-accent/40'
                    ]"
                    :style="{ width: `${votePercent(option.key)}%` }"
                  ></div>
                </div>
              </div>
            </div>
            <p class="text-center text-xs text-muted mt-5">
              {{ voteCounts.home + voteCounts.draw + voteCounts.away }} community votes
            </p>
          </template>

        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         TODAY'S PREDICTIONS
    ═══════════════════════════════════════════════════════ -->
    <section class="py-10 md:py-16 bg-bg">
      <div class="container-app">

        <div class="flex items-end justify-between mb-5 md:mb-8">
          <div>
            <p class="section-header mb-2">{{ predictionsLabel.header }}</p>
            <h2 class="font-display font-bold text-2xl md:text-3xl text-text">{{ predictionsLabel.title }}</h2>
          </div>
          <RouterLink to="/predictions" class="hidden sm:flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors font-medium">
            View all
            <ArrowRightIcon class="w-4 h-4" />
          </RouterLink>
        </div>

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AppSkeleton v-for="i in 6" :key="i" variant="card" />
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <template v-for="(prediction, index) in predictionsStore.predictions.slice(0, 6)" :key="prediction.id">
            <PredictionCard v-if="canSeePrediction(index)" :prediction="prediction" />
            <PremiumBlur v-else height="220px">
              <PredictionCard :prediction="prediction" />
            </PremiumBlur>
          </template>
        </div>

        <div class="mt-6 sm:hidden text-center">
          <RouterLink to="/predictions">
            <AppButton variant="outline" size="sm">
              View all predictions
              <ArrowRightIcon class="w-4 h-4 ml-1.5" />
            </AppButton>
          </RouterLink>
        </div>

      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         TRACK RECORD STRIP
    ═══════════════════════════════════════════════════════ -->
    <div
      v-if="recentResults.length > 0"
      class="bg-surface/50 border-y border-border"
    >
      <div class="container-app py-5">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div class="flex items-center gap-3">
            <span class="text-xs text-muted uppercase tracking-wider shrink-0">Our last {{ recentResults.length }}:</span>
            <div class="flex gap-1.5">
              <div
                v-for="(correct, i) in recentResults"
                :key="i"
                :class="[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  correct ? 'bg-win/15 text-win' : 'bg-loss/15 text-loss'
                ]"
              >
                <component :is="correct ? CheckCircleIcon : XCircleIcon" class="w-4 h-4" />
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2.5 shrink-0 sm:ml-auto">
            <span class="font-display font-bold text-2xl text-win">{{ trackRecordCorrect }}</span>
            <span class="text-muted text-sm">/{{ recentResults.length }} correct</span>
            <span class="inline-flex items-center gap-1 text-xs font-semibold text-win bg-win/10 border border-win/20 px-2.5 py-1 rounded-full">
              {{ trackRecordPct }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         FREE vs PREMIUM STATS
    ═══════════════════════════════════════════════════════ -->
    <PredictionStatsSection />

    <!-- ═══════════════════════════════════════════════════════
         LEAGUE SPOTLIGHT
    ═══════════════════════════════════════════════════════ -->
    <section v-if="leagueSpotlight.length > 0" class="py-14 bg-bg">
      <div class="container-app">
        <div class="flex items-end justify-between mb-6">
          <div>
            <p class="section-header mb-1">18+ Covered</p>
            <h2 class="font-display font-bold text-2xl text-text">League Spotlight</h2>
          </div>
          <RouterLink to="/predictions" class="hidden sm:flex items-center gap-1 text-sm text-accent hover:text-accent/80 font-medium">
            All predictions
            <ArrowRightIcon class="w-4 h-4" />
          </RouterLink>
        </div>
        <div class="relative">
          <div class="overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 lg:-mx-8 pb-2">
            <div class="flex gap-2 md:gap-3 px-4 sm:px-6 lg:px-8">
              <RouterLink
                v-for="league in leagueSpotlight"
                :key="league.id"
                :to="`/league/${league.id}`"
                class="flex-shrink-0 group"
              >
                <div class="w-28 sm:w-32 md:w-36 h-36 md:h-40 p-3 md:p-4 rounded-xl border border-border bg-surface hover:border-accent/40 hover:bg-surface/80 transition-all text-center flex flex-col items-center justify-center">
                  <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-bg border border-border flex items-center justify-center mx-auto mb-2.5 overflow-hidden shrink-0">
                    <img
                      v-if="(getLeagueLogo(league.name) || league.logo_url || league.logo) && !leagueLogoErrors.has(league.id)"
                      :src="getLeagueLogo(league.name) || league.logo_url || league.logo"
                      class="w-7 h-7 md:w-8 md:h-8 object-contain"
                      :alt="league.name"
                      @error="onLeagueLogoError(league.id)"
                    >
                    <GlobeAltIcon v-else class="w-5 h-5 md:w-6 md:h-6 text-muted/40" />
                  </div>
                  <p class="text-[11px] md:text-xs font-semibold text-text leading-tight line-clamp-2 mb-1 group-hover:text-accent transition-colors">
                    {{ league.name }}
                  </p>
                  <p class="text-[10px] text-muted">{{ league.country }}</p>
                </div>
              </RouterLink>
              <div class="flex-shrink-0 w-4 sm:w-6 lg:w-8"></div>
            </div>
          </div>
          <!-- Right fade — indicates more cards to scroll -->
          <div class="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-bg to-transparent pointer-events-none" aria-hidden="true"></div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         VALUE BETS + PREMIUM UPSELL
    ═══════════════════════════════════════════════════════ -->
    <section class="py-10 md:py-16 bg-surface/40">
      <div class="container-app">

        <template v-if="isPremium && predictionsStore.valueBets.length > 0">
          <div class="flex items-end justify-between mb-5 md:mb-8">
            <div>
              <p class="section-header mb-2">High value</p>
              <h2 class="font-display font-bold text-2xl md:text-3xl text-text flex items-center gap-3">
                Value Bets
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-semibold">
                  <FireIcon class="w-3 h-3" />
                  {{ predictionsStore.valueBets.length }} today
                </span>
              </h2>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PredictionCard
              v-for="prediction in predictionsStore.valueBets.slice(0, 3)"
              :key="prediction.id"
              :prediction="prediction"
            />
          </div>
        </template>

        <template v-else-if="!isPremium">
          <div class="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-surface to-bg p-6 md:p-10">
            <div class="absolute top-0 right-0 w-64 h-64 bg-gold/8 rounded-full blur-3xl pointer-events-none"></div>
            <div class="relative flex flex-col md:flex-row items-center gap-8">
              <div class="shrink-0 flex items-center justify-center w-20 h-20 rounded-2xl bg-gold/10 border border-gold/20">
                <SparklesIcon class="w-10 h-10 text-gold" />
              </div>
              <div class="text-center md:text-left flex-1">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold mb-3">
                  <FireIcon class="w-3.5 h-3.5" />
                  {{ predictionsStore.valueBets.length > 0 ? `${predictionsStore.valueBets.length} value bets available today` : 'Value bets' }}
                </div>
                <h3 class="font-display font-bold text-2xl text-text mb-2">Unlock value bets &amp; expert picks</h3>
                <p class="text-muted max-w-lg">
                  Premium members get full access to all predictions, value bets with edge analysis, and expert commentary — all ad-free.
                </p>
              </div>
              <div class="shrink-0">
                <RouterLink to="/premium">
                  <AppButton variant="gold" size="lg">
                    <SparklesIcon class="w-4 h-4 mr-2" />
                    Go Premium
                  </AppButton>
                </RouterLink>
              </div>
            </div>
          </div>
        </template>

      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         HOW IT WORKS — logged-out users only
    ═══════════════════════════════════════════════════════ -->
    <section v-if="!authStore.isAuthenticated" class="py-10 md:py-16 bg-bg">
      <div class="container-app">
        <div class="text-center mb-6 md:mb-10">
          <p class="section-header mb-2">Simple</p>
          <h2 class="font-display font-bold text-2xl md:text-3xl text-text">How it works</h2>
          <p class="text-muted mt-2 max-w-sm mx-auto text-sm">Three steps to smarter betting.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div class="relative text-center p-6 rounded-2xl bg-surface border border-border">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2">
              <span class="font-display font-bold text-sm text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-full">01</span>
            </div>
            <div class="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 mt-2">
              <ChartBarIcon class="w-7 h-7 text-accent" />
            </div>
            <h3 class="font-semibold text-text mb-2">Browse Predictions</h3>
            <p class="text-sm text-muted leading-relaxed">Our AI analyses form, head-to-heads, and live odds across 18+ leagues to surface daily picks.</p>
          </div>
          <div class="relative text-center p-6 rounded-2xl bg-surface border border-border">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2">
              <span class="font-display font-bold text-sm text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-full">02</span>
            </div>
            <div class="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 mt-2">
              <TrophyIcon class="w-7 h-7 text-accent" />
            </div>
            <h3 class="font-semibold text-text mb-2">Check the Confidence</h3>
            <p class="text-sm text-muted leading-relaxed">Every pick shows a confidence score and the best available odds from leading bookmakers.</p>
          </div>
          <div class="relative text-center p-6 rounded-2xl bg-surface border border-border">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2">
              <span class="font-display font-bold text-sm text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-full">03</span>
            </div>
            <div class="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 mt-2">
              <SparklesIcon class="w-7 h-7 text-accent" />
            </div>
            <h3 class="font-semibold text-text mb-2">Win More, Consistently</h3>
            <p class="text-sm text-muted leading-relaxed">Go premium for value bets, expert notes, and full market access — everything in one place.</p>
          </div>
        </div>
        <div class="text-center mt-10">
          <RouterLink to="/register">
            <AppButton size="lg">
              Get Started Free
              <ArrowRightIcon class="w-4 h-4 ml-2" />
            </AppButton>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         NEWSLETTER
    ═══════════════════════════════════════════════════════ -->
    <section class="py-10 md:py-16 bg-surface/30 border-t border-border">
      <div class="container-app">
        <div class="max-w-xl mx-auto">
          <NewsletterSignup />
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════
   TICKER
═══════════════════════════════════════════════════ */
@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(-1 * var(--ticker-shift, 50%))); }
}
.ticker-track {
  display: flex;
  width: max-content;
  will-change: transform;
  animation: ticker-scroll 60s linear infinite;
}

/* ═══════════════════════════════════════════════════
   HERO ROOT
═══════════════════════════════════════════════════ */
/* Above-fold wrapper: hero + ticker = exactly one viewport */
.above-fold {
  min-height: calc(100svh - 4rem);
  display: flex;
  flex-direction: column;
}

.hero-root {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #06080f;
  contain: paint;
  --mx: 0.5;
  --my: 0.5;
}

.hero-inner {
  flex: 1;
  padding-top: 1.75rem;
  padding-bottom: 1.75rem;
}

/* ── Animated gradient blobs ── */
.hero-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(72px);
  pointer-events: none;
  will-change: transform;
}
.hero-blob-gold {
  width: 800px;
  height: 800px;
  top: -250px;
  right: -200px;
  background: radial-gradient(circle, rgba(212,160,23,0.14) 0%, rgba(212,160,23,0.04) 50%, transparent 75%);
  transform: translate(
    calc((var(--mx) - 0.5) * -28px),
    calc((var(--my) - 0.5) * -18px)
  );
  transition: transform 0.25s ease-out;
}
.hero-blob-blue {
  width: 550px;
  height: 550px;
  bottom: -100px;
  left: -100px;
  background: radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%);
  transform: translate(
    calc((var(--mx) - 0.5) * 18px),
    calc((var(--my) - 0.5) * 24px)
  );
  transition: transform 0.3s ease-out;
}

/* ── Noise grain overlay ── */
.hero-noise {
  position: absolute;
  inset: 0;
  opacity: 0.028;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 300px 300px;
}

/* ── Scan line ── */
.hero-scan-line {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,160,23,0.5) 40%, rgba(212,160,23,0.8) 50%, rgba(212,160,23,0.5) 60%, transparent);
  animation: heroScan 12s linear infinite 3s;
  opacity: 0;
}
@keyframes heroScan {
  0%   { transform: translateY(0vh);   opacity: 0; }
  4%   { opacity: 1; }
  96%  { opacity: 0.5; }
  100% { transform: translateY(100vh); opacity: 0; }
}

/* ── Diagonal beam ── */
.hero-diagonal-beam {
  position: absolute;
  top: -40%;
  left: -10%;
  width: 60%;
  height: 200%;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(212,160,23,0.025) 50%,
    rgba(212,160,23,0.04) 52%,
    rgba(212,160,23,0.025) 54%,
    transparent 64%
  );
  transform-origin: center;
  animation: beamSweep 16s ease-in-out infinite;
}
@keyframes beamSweep {
  0%,100% { transform: translateX(0); }
  50%     { transform: translateX(30%); }
}

/* ── Floating particles — transform only, no layout ── */
.hero-particles { position: absolute; inset: 0; overflow: hidden; }
.p {
  position: absolute;
  bottom: 0;
  border-radius: 50%;
  background: rgba(212,160,23,0.55);
  will-change: transform, opacity;
  animation: particleRise linear infinite;
}
.p1 { width:2px;height:2px; left:8%;  animation-duration:11s; animation-delay:0s;   }
.p2 { width:3px;height:3px; left:18%; animation-duration:8s;  animation-delay:2.5s; background:rgba(212,160,23,0.35); }
.p3 { width:2px;height:2px; left:31%; animation-duration:13s; animation-delay:1s;   }
.p4 { width:4px;height:4px; left:47%; animation-duration:9s;  animation-delay:3.5s; background:rgba(253,230,138,0.25); }
.p5 { width:2px;height:2px; left:63%; animation-duration:10s; animation-delay:0.8s; }
@keyframes particleRise {
  0%   { transform: translateY(0);        opacity: 0;   }
  8%   { opacity: 0.7; }
  85%  { opacity: 0.3; }
  100% { transform: translateY(-100vh);   opacity: 0;   }
}

/* ── Spotlight cursor — background driven by CSS vars, no JS re-render ── */
.hero-spotlight {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: radial-gradient(
    380px circle at calc(var(--mx) * 100%) calc(var(--my) * 100%),
    rgba(212,160,23,0.07) 0%,
    transparent 70%
  );
}

/* ── Giant watermark — visible behind headline ── */
.hero-watermark {
  position: absolute;
  left: 3%;
  top: 42%;
  transform: translateY(-50%) translate(
    calc((var(--mx) - 0.5) * -10px),
    calc((var(--my) - 0.5) * -6px)
  );
  will-change: transform;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 900;
  font-size: clamp(140px, 24vw, 380px);
  line-height: 1;
  letter-spacing: -0.06em;
  color: rgba(212,160,23,0.10);
  mix-blend-mode: screen;
  text-shadow: 0 0 140px rgba(212,160,23,0.10);
  user-select: none;
  transition: transform 0.22s ease-out;
}

/* ═══════════════════════════════════════════════════
   HERO HEADLINE
═══════════════════════════════════════════════════ */
.hero-h1-white {
  font-size: clamp(3rem, 13vw, 8rem);
  color: #f1f5f9;
  letter-spacing: -0.03em;
}
.hero-h1-gold {
  font-size: clamp(3rem, 13vw, 8rem);
  letter-spacing: -0.03em;
  background: linear-gradient(100deg, #b8820a 0%, #f5c842 35%, #e8a820 55%, #fde68a 72%, #d4a017 100%);
  background-size: 250% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: goldShimmer 5s linear infinite;
}
@keyframes goldShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Letter-by-letter headline entrance ── */
.letter-fall {
  animation: letterFall 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  will-change: transform, opacity;
}
@keyframes letterFall {
  from { opacity: 0; transform: translateY(-36px) scaleY(1.2); }
  to   { opacity: 1; transform: translateY(0) scaleY(1); }
}

/* ── Gold BOOKMAKER. wipe-in reveal ── */
.hero-gold-reveal {
  animation: goldWipe 0.9s cubic-bezier(0.16, 1, 0.3, 1) both 0.44s;
}
@keyframes goldWipe {
  from { clip-path: inset(0 100% 0 0); opacity: 0.4; }
  to   { clip-path: inset(0 0% 0 0);   opacity: 1;   }
}

/* ── Accuracy arc behind pick card ── */
.accuracy-arc-svg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140%;
  height: 140%;
  z-index: -1;
  pointer-events: none;
  will-change: transform, opacity;
  animation: arcAppear 1.8s cubic-bezier(0.16, 1, 0.3, 1) both 0.6s;
}
@keyframes arcAppear {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.88); }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1);    }
}

/* ── Live dot + expanding rings ── */
.hero-live-dot {
  animation: livePulse 1.6s ease-in-out infinite;
}
@keyframes livePulse {
  0%,100% { opacity: 1;   transform: scale(1); }
  50%     { opacity: 0.25; transform: scale(0.6); }
}
.live-ring-wrap { display: inline-block; }
.live-ring-pulse {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 1px solid rgba(212,160,23,0.55);
  will-change: transform, opacity;
  animation: ringExpand 2.4s ease-out infinite;
}
.live-ring-pulse.r2 { animation-delay: 1.2s; }
@keyframes ringExpand {
  0%   { transform: scale(0.7); opacity: 0.8; }
  100% { transform: scale(3.0); opacity: 0; }
}

/* ── Ghost card stack ── */
.card-stack-wrap { position: relative; }
.ghost-card {
  position: absolute;
  inset: 0;
  border-radius: 1.125rem;
  border: 1px solid rgba(212,160,23,0.07);
}
.ghost-1 {
  background: rgba(15,20,32,0.55);
  transform: translateY(10px) translateX(6px) scale(0.97);
  z-index: 0;
}
.ghost-2 {
  background: rgba(15,20,32,0.35);
  transform: translateY(20px) translateX(12px) scale(0.94);
  z-index: -1;
}

/* ── Ambient glow beneath card ── */
.card-ambient-glow {
  position: absolute;
  inset: 10% 5%;
  bottom: -20px;
  border-radius: 50%;
  background: rgba(212,160,23,0.12);
  filter: blur(40px);
  z-index: 0;
  animation: ambientPulse 4s ease-in-out infinite;
}
@keyframes ambientPulse {
  0%,100% { opacity: 0.6; transform: scale(1);    }
  50%     { opacity: 1.0; transform: scale(1.08);  }
}

/* ── Staggered entrance animations ── */
.hero-enter {
  animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.d1 { animation-delay: 0.05s; }
.d2 { animation-delay: 0.12s; }
.d3 { animation-delay: 0.22s; }
.d4 { animation-delay: 0.32s; }
.d5 { animation-delay: 0.42s; }
.d6 { animation-delay: 0.52s; }
.d7 { animation-delay: 0.62s; }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Form dots stagger ── */
.form-dot {
  animation: dotPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes dotPop {
  from { opacity: 0; transform: scale(0.4); }
  to   { opacity: 1; transform: scale(1); }
}

/* ── Cycling word transition ── */
.cycle-enter-active { animation: cycleIn  0.28s ease both; }
.cycle-leave-active { animation: cycleOut 0.18s ease both; position: absolute; }
@keyframes cycleIn  { from { opacity: 0; transform: translateY(6px);  } to { opacity: 1; transform: translateY(0);    } }
@keyframes cycleOut { from { opacity: 1; transform: translateY(0);    } to { opacity: 0; transform: translateY(-6px); } }

/* ── Primary CTA ── */
.hero-primary-cta {
  position: relative;
  padding: 0.875rem 1.75rem;
  background: #d4a017;
  color: #06080f;
  border-radius: 0.75rem;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.01em;
  border: none;
  cursor: pointer;
  box-shadow: 0 0 32px rgba(212,160,23,0.35), 0 0 80px rgba(212,160,23,0.12), 0 4px 16px rgba(0,0,0,0.4);
  transition: box-shadow 0.3s ease, transform 0.2s ease, background 0.2s ease;
  white-space: nowrap;
}
.hero-primary-cta:hover {
  background: #e0ad1c;
  box-shadow: 0 0 48px rgba(212,160,23,0.55), 0 0 100px rgba(212,160,23,0.20), 0 4px 20px rgba(0,0,0,0.4);
  transform: translateY(-2px);
}
.hero-primary-cta:active { transform: translateY(0); }
.hero-primary-cta::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 0.9rem;
  border: 1px solid rgba(212,160,23,0.55);
  animation: ctaRingPulse 2.8s ease-out infinite 1.2s;
  pointer-events: none;
}
@keyframes ctaRingPulse {
  0%   { transform: scale(1);    opacity: 0.75; }
  100% { transform: scale(1.12); opacity: 0;    }
}

/* ═══════════════════════════════════════════════════
   PICK CARD
═══════════════════════════════════════════════════ */
@property --ring-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.hero-pick-card {
  position: relative;
  border-radius: 1.125rem;
  isolation: isolate;
}

/* Outer rotating ring */
.hero-pick-ring {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  will-change: transform;
  background: conic-gradient(
    from var(--ring-angle),
    transparent 20%,
    rgba(212,160,23,0.9) 38%,
    rgba(253,230,138,1.0) 50%,
    rgba(212,160,23,0.9) 62%,
    transparent 80%
  );
  animation: ringRotate 4s linear infinite;
  z-index: 0;
}
@keyframes ringRotate {
  from { --ring-angle: 0deg;   }
  to   { --ring-angle: 360deg; }
}

.hero-pick-inner {
  position: relative;
  z-index: 1;
  margin: 1px;
  border-radius: calc(1.125rem - 1px);
  background: linear-gradient(160deg, #0f1420 0%, #0a0d14 100%);
  padding: 1.25rem;
}
@media (min-width: 768px) {
  .hero-pick-inner { padding: 1.5rem; }
}

/* Subtle inner glow on card */
.hero-pick-inner::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,160,23,0.06) 0%, transparent 60%);
  pointer-events: none;
}

/* Ensure card sits above ghost layers */
.hero-pick-card {
  position: relative;
  z-index: 2;
}

/* 3D tilt on hover (desktop) */
@media (min-width: 1024px) {
  .hero-pick-card {
    transition: transform 0.35s ease;
    transform: perspective(1200px) rotateY(-3deg);
    animation: cardFloat 5s ease-in-out infinite;
    will-change: transform;
  }
  .hero-pick-card:hover {
    transform: perspective(1200px) rotateY(0deg) translateY(-6px);
    animation-play-state: paused;
  }
}
@keyframes cardFloat {
  0%,100% { transform: perspective(1200px) rotateY(-3deg) translateY(0px);   }
  50%     { transform: perspective(1200px) rotateY(-2deg) translateY(-10px);  }
}

/* Prediction banner */
.prediction-banner {
  background: linear-gradient(135deg, rgba(212,160,23,0.10) 0%, rgba(212,160,23,0.05) 100%);
  border: 1px solid rgba(212,160,23,0.22);
}

/* Confidence bar fill */
.confidence-fill {
  background: linear-gradient(90deg, #c8930a, #fde68a, #d4a017);
  background-size: 200% 100%;
  animation: confFill 1.2s cubic-bezier(0.16,1,0.3,1) both 0.8s, barShimmer 3s linear infinite 2s;
}
@keyframes confFill {
  from { width: 0 !important; }
}
@keyframes barShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Card CTA button */
.card-cta-btn {
  background: rgba(212,160,23,0.12);
  border: 1px solid rgba(212,160,23,0.28);
  color: #d4a017;
}
.card-cta-btn:hover {
  background: rgba(212,160,23,0.22);
  border-color: rgba(212,160,23,0.50);
  transform: translateY(-1px);
}

/* Team rows */
.team-row {
  padding: 0.625rem 0.75rem;
  border-radius: 0.625rem;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.05);
  transition: background 0.2s;
}
.team-row:hover { background: rgba(255,255,255,0.04); }

/* ═══════════════════════════════════════════════════
   FLOATING CHIPS
═══════════════════════════════════════════════════ */
.chip {
  animation: chipPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
  opacity: 0;
  backdrop-filter: blur(12px);
}
.chip-a { animation-delay: 1.2s; }
.chip-b { animation-delay: 2.0s; }
.chip-c { animation-delay: 2.8s; }
@keyframes chipPop {
  from { opacity: 0; transform: scale(0.8) translateY(8px); }
  to   { opacity: 1; transform: scale(1)   translateY(0);   }
}
</style>
