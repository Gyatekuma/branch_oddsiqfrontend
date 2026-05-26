<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { SparklesIcon, LockClosedIcon } from '@heroicons/vue/24/solid'
import { ChartBarIcon } from '@heroicons/vue/24/outline'
import api from '@/api/axios'

const periods = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
]

const activePeriod = ref('today')
const stats = ref(null)
const loading = ref(true)

const current = computed(() => stats.value?.[activePeriod.value] ?? null)

// Animated display values
const displayFree = ref(0)
const displayPremium = ref(0)
const hasAnimated = ref(false)

const sectionRef = ref(null)
let observer = null

function animateTo(target, setter, duration = 1200) {
  const start = performance.now()
  const from = 0
  function step(now) {
    const p = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    setter(Math.round(from + eased * (target - from)))
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
  if (!current.value || !current.value.total) return 100
  return Math.max(1, Math.round((current.value.free / current.value.total) * 100))
})

const periodLabel = computed(() => ({
  today: 'today',
  week: 'this week',
  month: 'this month',
})[activePeriod.value])
</script>

<template>
  <section
    ref="sectionRef"
    class="py-14 md:py-20 bg-bg relative overflow-hidden"
  >
    <!-- Subtle radial glow behind the card -->
    <div
      class="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
    >
      <div
        class="w-[600px] h-[400px] rounded-full opacity-[0.06]"
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
        <p class="text-muted text-sm mt-2 max-w-xs mx-auto leading-relaxed">
          See exactly how many predictions you're missing
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
        <div class="h-52 rounded-2xl bg-surface border border-border animate-pulse"></div>
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
          style="box-shadow: 0 0 40px rgba(212, 160, 23, 0.06)"
        >

          <!-- Two-column split -->
          <div class="grid grid-cols-2 divide-x divide-border">

            <!-- FREE column -->
            <div class="p-6 md:p-8 flex flex-col items-center text-center gap-3">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-widest">
                <div class="w-1.5 h-1.5 rounded-full bg-muted/60"></div>
                Free
              </div>
              <div class="text-5xl md:text-6xl font-display font-bold text-muted/60 tabular-nums leading-none">
                {{ hasAnimated ? displayFree : current.free }}
              </div>
              <p class="text-xs text-muted/60 leading-relaxed">
                predictions<br>{{ periodLabel }}
              </p>
              <!-- Blurred fake rows to hint at locked content -->
              <div class="w-full mt-2 flex flex-col gap-1.5">
                <div
                  v-for="i in 3"
                  :key="i"
                  class="h-6 rounded-md bg-border/60"
                  :style="{ opacity: 1 - i * 0.2 }"
                ></div>
              </div>
            </div>

            <!-- PREMIUM column -->
            <div
              class="p-6 md:p-8 flex flex-col items-center text-center gap-3 relative"
              style="background: linear-gradient(160deg, rgba(212,160,23,0.06) 0%, transparent 60%)"
            >
              <!-- Corner sparkle badge -->
              <div class="absolute top-3 right-3">
                <div class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] font-semibold">
                  <SparklesIcon class="w-2.5 h-2.5" />
                  Premium
                </div>
              </div>

              <div class="flex items-center gap-1.5 text-xs font-semibold text-gold uppercase tracking-widest">
                <div class="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></div>
                All Picks
              </div>

              <div
                class="text-5xl md:text-6xl font-display font-bold tabular-nums leading-none"
                style="color: #d4a017; text-shadow: 0 0 30px rgba(212,160,23,0.4)"
              >
                {{ hasAnimated ? displayPremium : current.total }}
              </div>
              <p class="text-xs text-gold/70 leading-relaxed">
                predictions<br>{{ periodLabel }}
              </p>
              <!-- Gold shimmer rows hinting at premium content -->
              <div class="w-full mt-2 flex flex-col gap-1.5">
                <div
                  v-for="i in 3"
                  :key="i"
                  class="h-6 rounded-md"
                  :style="{
                    background: 'linear-gradient(90deg, rgba(212,160,23,0.15), rgba(212,160,23,0.06))',
                    opacity: 1 - i * 0.15
                  }"
                ></div>
              </div>
            </div>

          </div>

          <!-- Coverage bar -->
          <div class="px-6 md:px-8 py-5 border-t border-border bg-bg/40">
            <div class="flex items-center justify-between text-xs text-muted mb-2">
              <span class="flex items-center gap-1.5">
                <ChartBarIcon class="w-3.5 h-3.5" />
                Your coverage {{ periodLabel }}
              </span>
              <span class="font-semibold text-gold">{{ coveragePct }}%</span>
            </div>
            <div class="h-2 rounded-full bg-border overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-1000 ease-out"
                style="background: linear-gradient(90deg, #d4a017, #f5c842)"
                :style="{ width: hasAnimated ? coveragePct + '%' : '0%' }"
              ></div>
            </div>
            <p class="text-[11px] text-muted/60 mt-2">
              You're seeing
              <span class="text-gold font-semibold">{{ current.free }} of {{ current.total }}</span>
              predictions. Upgrade to unlock all {{ current.total }}.
            </p>
          </div>

          <!-- CTA -->
          <div class="px-6 md:px-8 py-5 border-t border-border flex flex-col sm:flex-row items-center gap-3">
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
