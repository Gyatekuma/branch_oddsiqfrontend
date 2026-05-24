<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import guidesApi from '@/api/guides'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import {
  BookOpenIcon,
  ArrowRightIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  FireIcon,
  ShieldCheckIcon,
  TrophyIcon,
  CalculatorIcon,
  LightBulbIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'

const loading = ref(true)
const guides = ref([])
const selectedCategory = ref('all')

onMounted(async () => {
  try {
    const data = await guidesApi.getAll()
    guides.value = data.guides || []
  } catch (err) {
    console.error('Failed to fetch guides:', err)
  } finally {
    loading.value = false
  }
})

// Category tabs derived from guides
const categories = computed(() => {
  const sports = [...new Set(guides.value.map(g => g.sport).filter(Boolean))]
  return ['all', ...sports]
})

const filtered = computed(() => {
  if (selectedCategory.value === 'all') return guides.value
  if (selectedCategory.value === 'general') return guides.value.filter(g => !g.sport)
  return guides.value.filter(g => g.sport === selectedCategory.value)
})

// Icon + accent colour per guide slug
function guideStyle(guide) {
  const slug = guide.slug || ''
  if (slug.includes('odds'))        return { icon: CalculatorIcon, color: 'text-info',  bg: 'bg-info/10',   border: 'border-info/20'   }
  if (slug.includes('value'))       return { icon: CurrencyDollarIcon, color: 'text-win', bg: 'bg-win/10', border: 'border-win/20'  }
  if (slug.includes('bankroll'))    return { icon: ShieldCheckIcon, color: 'text-win',  bg: 'bg-win/10',   border: 'border-win/20'  }
  if (slug.includes('accumulator')) return { icon: FireIcon,         color: 'text-loss', bg: 'bg-loss/10',  border: 'border-loss/20' }
  if (slug.includes('btts'))        return { icon: ChartBarIcon,     color: 'text-info', bg: 'bg-info/10',  border: 'border-info/20' }
  if (slug.includes('over-under'))  return { icon: ChartBarIcon,     color: 'text-draw', bg: 'bg-draw/10',  border: 'border-draw/20' }
  if (slug.includes('corner'))      return { icon: ChartBarIcon,     color: 'text-muted', bg: 'bg-surface', border: 'border-border'  }
  if (slug.includes('double'))      return { icon: TrophyIcon,       color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' }
  if (slug.includes('ht') || slug.includes('half')) return { icon: ClockIcon, color: 'text-draw', bg: 'bg-draw/10', border: 'border-draw/20' }
  if (slug.includes('1x2'))         return { icon: TrophyIcon,       color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' }
  if (slug.includes('form') || slug.includes('stat')) return { icon: ChartBarIcon, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' }
  if (slug.includes('responsible')) return { icon: ShieldCheckIcon,  color: 'text-win',  bg: 'bg-win/10',   border: 'border-win/20'  }
  if (slug.includes('football'))    return { icon: TrophyIcon,       color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' }
  if (slug.includes('basketball') || slug.includes('nba')) return { icon: FireIcon, color: 'text-loss', bg: 'bg-loss/10', border: 'border-loss/20' }
  return { icon: BookOpenIcon, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' }
}

function readingTime(guide) {
  if (!guide.body) return '5 min'
  const words = guide.body.split(/\s+/).length
  return `${Math.max(1, Math.round(words / 200))} min`
}

// Short description per guide
const DESCRIPTIONS = {
  'how-to-read-betting-odds':         'Understand decimal odds, implied probability, and the bookmaker margin — the essential foundation.',
  'understanding-1x2-market':         'The most popular football bet explained: home win, draw, or away win, and how our AI picks them.',
  'over-under-goals-explained':       'Predict whether a match produces more or fewer goals than the bookmaker\'s line.',
  'both-teams-to-score-guide':        'Will both teams score? Learn how BTTS works and what statistics to look for.',
  'double-chance-betting-explained':  'Cover two of three outcomes in one bet — lower risk, smart for accumulators.',
  'corners-betting-guide':            'Bet on total corner kicks instead of goals. Driven by tactics, not luck.',
  'half-time-full-time-betting-guide':'Predict both the half-time and full-time result for higher odds returns.',
  'what-is-a-value-bet':              'The core concept every profitable bettor knows: find odds that underestimate the true probability.',
  'how-to-build-smart-accumulator':   'Combine multiple selections wisely without destroying your win probability.',
  'bankroll-management-guide':        'Protect your funds and stay in the game long-term with proven staking methods.',
  'using-form-and-statistics':        'How to read team form, goals data, and H2H records to sharpen your picks.',
  'football-betting-markets-strategy':'Leagues, home advantage, injuries, and the markets that offer the most value.',
  'basketball-betting-nba-guide':     'Point spreads, totals, back-to-backs, and pace — NBA betting fundamentals.',
  'responsible-gambling-guide':       'Set limits, recognise warning signs, and keep betting enjoyable and in control.',
}

function getDescription(guide) {
  return DESCRIPTIONS[guide.slug] || `Learn about ${guide.sport || 'betting'} strategies and tips from our experts.`
}
</script>

<template>
  <div class="min-h-screen bg-bg py-10">
    <div class="container-app">

      <!-- Page header -->
      <div class="mb-10">
        <p class="section-header mb-2">Learn</p>
        <h1 class="font-display font-bold text-3xl md:text-4xl text-text mb-2">
          Betting Guides
        </h1>
        <p class="text-muted max-w-xl">
          Learn strategies and tips from our experts — from reading your first odds to building a long-term profitable approach.
        </p>
      </div>

      <!-- Category filter -->
      <div v-if="categories.length > 2" class="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide">
        <button
          v-for="cat in categories"
          :key="cat"
          :class="[
            'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all capitalize',
            selectedCategory === cat
              ? 'bg-accent text-bg border-accent shadow-sm shadow-accent/20'
              : 'bg-surface text-muted border-border hover:border-accent/40 hover:text-text'
          ]"
          @click="selectedCategory = cat"
        >
          {{ cat === 'all' ? 'All Guides' : cat }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AppSkeleton v-for="i in 9" :key="i" variant="card" class="h-44" />
      </div>

      <!-- Guides grid -->
      <div v-else-if="filtered.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <RouterLink
          v-for="guide in filtered"
          :key="guide.id"
          :to="`/guides/${guide.slug}`"
          class="group flex flex-col rounded-2xl border bg-surface overflow-hidden transition-all duration-200 hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
          :class="guideStyle(guide).border"
        >
          <!-- Top accent strip -->
          <div class="h-1 w-full" :class="guideStyle(guide).bg" />

          <div class="p-5 flex flex-col flex-1">
            <!-- Icon row -->
            <div class="flex items-start justify-between mb-4">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center border"
                :class="[guideStyle(guide).bg, guideStyle(guide).border]"
              >
                <component :is="guideStyle(guide).icon" class="w-5 h-5" :class="guideStyle(guide).color" />
              </div>
              <span
                v-if="guide.sport"
                class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                :class="[guideStyle(guide).color, guideStyle(guide).bg, guideStyle(guide).border]"
              >
                {{ guide.sport }}
              </span>
              <span v-else class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-border text-muted bg-bg">
                General
              </span>
            </div>

            <!-- Title -->
            <h3 class="font-display font-bold text-base text-text group-hover:text-accent transition-colors leading-snug mb-2">
              {{ guide.title }}
            </h3>

            <!-- Description -->
            <p class="text-sm text-muted leading-relaxed flex-1 mb-4">
              {{ getDescription(guide) }}
            </p>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-3 border-t border-border/60">
              <span class="flex items-center gap-1 text-xs text-muted">
                <ClockIcon class="w-3.5 h-3.5" />
                {{ readingTime(guide) }} read
              </span>
              <span class="flex items-center gap-1 text-xs font-semibold transition-all" :class="guideStyle(guide).color">
                Read guide
                <ArrowRightIcon class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </RouterLink>
      </div>

      <!-- Empty -->
      <div v-else class="card p-14 text-center">
        <BookOpenIcon class="w-10 h-10 text-muted/30 mx-auto mb-4" />
        <p class="text-muted text-lg">No guides found</p>
      </div>

    </div>
  </div>
</template>
