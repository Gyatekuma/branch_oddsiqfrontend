<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { SparklesIcon, LockClosedIcon, CheckBadgeIcon } from '@heroicons/vue/24/solid'
import api from '@/api/axios'
import { usePremium } from '@/composables/usePremium'

const { isPremium } = usePremium()

const periods = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
]

const activePeriod = ref('today')
const stats = ref(null)
const loading = ref(true)

const current = computed(() => stats.value?.[activePeriod.value] ?? null)

const displayFree = ref(0)
const displayPremium = ref(0)
const hasAnimated = ref(false)

const sectionRef = ref(null)
let observer = null

function animateTo(target, setter, duration = 1200) {
  const start = performance.now()
  function step(now) {
    const p = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    setter(Math.round(eased * target))
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function runAnimation() {
  if (!current.value) return
  animateTo(current.value.free, (v) => (displayFree.value = v))
  animateTo(current.value.total, (v) => (displayPremium.value = v), 1400)
}

watch(activePeriod, () => {
  if (!hasAnimated.value) return
  displayFree.value = current.value?.free ?? 0
  displayPremium.value = current.value?.total ?? 0
  runAnimation()
})

async function fetchStats() {
  try {
    const res = await api.get('/api/predictions/stats')
    stats.value = res.data.data
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchStats()
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !hasAnimated.value) {
        hasAnimated.value = true
        runAnimation()
        observer?.disconnect()
      }
    },
    { threshold: 0.25 }
  )
  if (sectionRef.value) observer.observe(sectionRef.value)
})

onUnmounted(() => observer?.disconnect())

const coveragePct = computed(() => {
  if (isPremium.value) return 100
  if (!current.value || !current.value.total) return 100
  return Math.max(1, Math.round((current.value.free / current.value.total) * 100))
})

const periodLabel = computed(() => ({
  today: 'today',
  week: 'this week',
  month: 'this month',
})[activePeriod.value])

const freeLabel = computed(() => ({
  today: 'per day',
  week: 'this week',
  month: 'this month',
})[activePeriod.value])
</script>

<template>
  <section
    ref="sectionRef"
    class="py-14 md:py-20 bg-bg relative overflow-hidden"
  >
    <!-- Radial glow -->
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div
        class="w-[600px] h-[400px] rounded-full opacity-[0.05]"
        style="background: radial-gradient(ellipse at center, #d4a017 0%, transparent 70%)"
      ></div>
    </div>

    <div class="container-app relative z-10">

      <!-- Header -->
      <div class="text-center mb-8 md:mb-10">
        <p class="section-header mb-2">Coverage</p>
        <h2 class="font-display font-bold text-2xl md:text-3xl text-text">
          Free vs <span class="text-gold">Premium</span>
        </h2>
        <p class="text-muted text-sm mt-2 max-w-xs mx-auto">
          How many predictions you unlock with each plan
        </p>
      </div>

      <!-- Period tabs -->
      <div class="flex justify-center mb-8">
        <div class="inline-flex items-center gap-1 p-1 rounded-xl bg-surface border border-border">
          <button
            v-for="p in periods"
            :key="p.key"
            @click="activePeriod = p.key"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              activePeriod === p.key
                ? 'bg-gold text-bg font-semibold shadow-sm'
                : 'text-muted hover:text-text'
            ]"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <!-- Skeleton -->
      <div v-if="loading" class="max-w-2xl mx-auto">
        <div class="h-48 rounded-2xl bg-surface border border-border animate-pulse"></div>
      </div>

      <!-- No data -->
      <div
        v-else-if="!stats || !current"
        class="max-w-2xl mx-auto text-center py-10 text-muted text-sm"
      >
        Stats unavailable right now
      </div>

      <!-- Main card -->
      <div v-else class="max-w-2xl mx-auto">
        <div
          class="rounded-2xl border border-border bg-surface overflow-hidden"
          style="box-shadow: 0 0 40px rgba(212,160,23,0.06)"
        >

          <!-- Two-column split -->
          <div class="grid grid-cols-2 divide-x divide-border">

            <!-- FREE column -->
            <div class="p-6 md:p-8 flex flex-col items-center text-center">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-widest mb-4">
                <div class="w-1.5 h-1.5 rounded-full bg-muted/60"></div>
                Free
              </div>
              <div class="text-6xl md:text-7xl font-display font-bold text-muted/50 tabular-nums leading-none mb-3">
                {{ hasAnimated ? displayFree : current.free }}
              </div>
              <p class="text-xs text-muted/60">predictions</p>
              <p class="text-xs text-muted/40 mt-1">{{ freeLabel }}</p>
            </div>

            <!-- PREMIUM column -->
            <div
              class="p-6 md:p-8 flex flex-col items-center text-center relative"
              style="background: linear-gradient(160deg, rgba(212,160,23,0.07) 0%, transparent 55%)"
            >
              <!-- Badge -->
              <div class="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] font-semibold">
                <SparklesIcon class="w-2.5 h-2.5" />
                Premium
              </div>

              <div class="flex items-center gap-1.5 text-xs font-semibold text-gold uppercase tracking-widest mb-4">
                <div class="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></div>
                All Picks
              </div>

              <div
                class="text-6xl md:text-7xl font-display font-bold tabular-nums leading-none mb-3"
                style="color: #d4a017; text-shadow: 0 0 30px rgba(212,160,23,0.35)"
              >
                {{ hasAnimated ? displayPremium : current.total }}
              </div>
              <p class="text-xs text-gold/70">predictions</p>
              <p class="text-xs text-gold/40 mt-1">{{ periodLabel }}</p>
            </div>

          </div>

          <!-- Coverage bar -->
          <div class="px-6 md:px-8 py-5 border-t border-border bg-bg/40">
            <div class="flex items-center justify-between text-xs text-muted mb-2">
              <span>Your coverage {{ periodLabel }}</span>
              <span class="font-semibold text-gold">{{ coveragePct }}%</span>
            </div>
            <div class="h-2 rounded-full bg-border overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-1000 ease-out"
                style="background: linear-gradient(90deg, #d4a017, #f5c842)"
                :style="{ width: (hasAnimated ? coveragePct : 0) + '%' }"
              ></div>
            </div>
            <p class="text-[11px] text-muted/60 mt-2.5">
              <template v-if="isPremium">
                You have access to all
                <span class="text-gold font-semibold">{{ current.total }}</span>
                predictions {{ periodLabel }}.
              </template>
              <template v-else>
                Free users see <span class="text-gold font-semibold">{{ current.free }}</span> of
                <span class="font-semibold text-text/70">{{ current.total }}</span>
                predictions. Upgrade for the full picture.
              </template>
            </p>
          </div>

          <!-- CTA -->
          <div class="px-6 md:px-8 py-5 border-t border-border flex flex-col sm:flex-row items-center gap-3">
            <template v-if="isPremium">
              <div class="flex items-center gap-2 text-sm text-gold font-medium">
                <CheckBadgeIcon class="w-4 h-4 shrink-0" />
                You have full access to all predictions
              </div>
              <RouterLink
                to="/predictions"
                class="sm:ml-auto flex-shrink-0 text-sm text-muted hover:text-text transition-colors"
              >
                View all picks →
              </RouterLink>
            </template>
            <template v-else>
              <RouterLink
                to="/premium"
                class="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-bg transition-all duration-200 hover:opacity-90 active:scale-95"
                style="background: linear-gradient(135deg, #d4a017 0%, #f5c842 50%, #d4a017 100%); box-shadow: 0 4px 20px rgba(212,160,23,0.3)"
              >
                <LockClosedIcon class="w-4 h-4" />
                Unlock All Predictions
              </RouterLink>
              <RouterLink
                to="/predictions"
                class="flex-shrink-0 text-sm text-muted hover:text-text transition-colors"
              >
                Browse free picks →
              </RouterLink>
            </template>
          </div>

        </div>

        <!-- Value bets nudge -->
        <p
          v-if="stats?.value_bets_today > 0"
          class="text-center text-xs text-muted mt-4"
        >
          <span class="text-gold font-semibold">{{ stats.value_bets_today }}</span>
          value {{ stats.value_bets_today === 1 ? 'bet' : 'bets' }} identified today — premium only
        </p>
      </div>

    </div>
  </section>
</template>
