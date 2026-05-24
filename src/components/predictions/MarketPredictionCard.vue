<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useLocale } from '@/composables/useLocale'
import { ClockIcon, FireIcon } from '@heroicons/vue/24/outline'
import { SparklesIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  prediction: { type: Object, required: true },
  isPremium: { type: Boolean, default: false }
})

const { formatTime, formatDate } = useLocale()

const fixture = computed(() => props.prediction.fixture || {})
const homeTeam = computed(() => fixture.value.home_team?.name || props.prediction.home_team || '—')
const awayTeam = computed(() => fixture.value.away_team?.name || props.prediction.away_team || '—')
const league = computed(() => fixture.value.league?.name || '')
const marketType = computed(() => props.prediction.market_type)
const allOutcomes = computed(() => props.prediction.all_outcomes || [])
const recommendation = computed(() => props.prediction.predicted_outcome)

const kickoffDisplay = computed(() => {
  const kickoff = fixture.value.kickoff_at
  if (!kickoff) return ''
  const d = new Date(kickoff)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const time = formatTime(kickoff)
  if (isToday) return `Today · ${time}`
  return `${formatDate(kickoff, { month: 'short', day: 'numeric' })} · ${time}`
})

const confidenceValue = computed(() => {
  const raw = props.prediction.confidence_score ?? 0
  let score = Number(raw)
  while (score > 100) score /= 100
  return Math.round(score)
})

const confidenceLabel = computed(() => {
  const v = confidenceValue.value
  if (v >= 70) return { text: 'High', cls: 'text-win' }
  if (v >= 55) return { text: 'Medium', cls: 'text-draw' }
  return { text: 'Low', cls: 'text-muted' }
})

// ── Outcome label helpers ─────────────────────────────────────
function outcomeLabel(o, lineValue) {
  if (!o) return ''
  if (o === 'yes') return 'YES'
  if (o === 'no') return 'NO'
  if (o === 'over') return `Over ${lineValue ?? ''}`
  if (o === 'under') return `Under ${lineValue ?? ''}`
  if (o === '1X') return '1X'
  if (o === 'X2') return 'X2'
  if (o === '12') return '12'
  if (o.includes('_')) {
    const [ht, ft] = o.split('_')
    const m = { home: 'H', draw: 'D', away: 'A' }
    return `${m[ht] || ht} / ${m[ft] || ft}`
  }
  return o
}

function outcomeDesc(o) {
  if (o === '1X') return 'Home or Draw'
  if (o === 'X2') return 'Draw or Away'
  if (o === '12') return 'Home or Away'
  if (o === 'yes') return 'Both score'
  if (o === 'no') return 'Clean sheet'
  return ''
}

// ── Outcome colour map ────────────────────────────────────────
function outcomeColor(outcome) {
  if (!outcome) return { text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30', ring: 'ring-accent/30', bar: 'bg-accent' }
  switch (outcome) {
    case 'yes':   return { text: 'text-win',    bg: 'bg-win/10',    border: 'border-win/30',    ring: 'ring-win/30',    bar: 'bg-win'    }
    case 'no':    return { text: 'text-loss',   bg: 'bg-loss/10',   border: 'border-loss/30',   ring: 'ring-loss/30',   bar: 'bg-loss'   }
    case 'over':  return { text: 'text-info',   bg: 'bg-info/10',   border: 'border-info/30',   ring: 'ring-info/30',   bar: 'bg-info'   }
    case 'under': return { text: 'text-draw',   bg: 'bg-draw/10',   border: 'border-draw/30',   ring: 'ring-draw/30',   bar: 'bg-draw'   }
    case '1X':    return { text: 'text-win',    bg: 'bg-win/10',    border: 'border-win/30',    ring: 'ring-win/30',    bar: 'bg-win'    }
    case 'X2':    return { text: 'text-info',   bg: 'bg-info/10',   border: 'border-info/30',   ring: 'ring-info/30',   bar: 'bg-info'   }
    case '12':    return { text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30', ring: 'ring-accent/30', bar: 'bg-accent' }
    default: {
      if (outcome.endsWith('_home')) return { text: 'text-win',  bg: 'bg-win/10',  border: 'border-win/30',  ring: 'ring-win/30',  bar: 'bg-win'  }
      if (outcome.endsWith('_draw')) return { text: 'text-draw', bg: 'bg-draw/10', border: 'border-draw/30', ring: 'ring-draw/30', bar: 'bg-draw' }
      if (outcome.endsWith('_away')) return { text: 'text-loss', bg: 'bg-loss/10', border: 'border-loss/30', ring: 'ring-loss/30', bar: 'bg-loss' }
      return { text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30', ring: 'ring-accent/30', bar: 'bg-accent' }
    }
  }
}

// ── Layout helpers ────────────────────────────────────────────
// For binary markets (over/under, btts, corners): find the two outcomes
const binaryOutcomes = computed(() => {
  if (!allOutcomes.value.length) return null
  const rec = allOutcomes.value.find(o => o.outcome === recommendation.value)
  const other = allOutcomes.value.find(o => o.outcome !== recommendation.value)
  if (!rec || !other) return null
  const total = (rec.probability ?? 0) + (other.probability ?? 0)
  return {
    recommended: rec,
    other,
    recPct: total > 0 ? Math.round((rec.probability / total) * 100) : rec.probability ?? 0,
    otherPct: total > 0 ? Math.round((other.probability / total) * 100) : other.probability ?? 0,
  }
})

// For double chance: all 3 options sorted by confidence
const dcOutcomes = computed(() => {
  if (!allOutcomes.value.length) return []
  const order = ['1X', 'X2', '12']
  return order.map(o => allOutcomes.value.find(x => x.outcome === o)).filter(Boolean)
})

// For HT/FT: top 3 outcomes by probability
const htftOutcomes = computed(() => {
  if (!allOutcomes.value.length) return []
  return [...allOutcomes.value].sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0)).slice(0, 3)
})

const isBinary = computed(() => ['over_under', 'btts', 'corners'].includes(marketType.value))
const isDoubleChance = computed(() => marketType.value === 'double_chance')
const isHtFt = computed(() => marketType.value === 'ht_ft')

const lineValue = computed(() => props.prediction.line_value)
const isValueBet = computed(() => props.prediction.is_value_bet)
</script>

<template>
  <RouterLink :to="`/match/${prediction.fixture?.id || prediction.fixture_id || prediction.id}`" class="card-hover block p-4 group">

    <!-- Top row: kickoff · value bet badge -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-1.5 text-xs text-muted">
        <ClockIcon class="w-3.5 h-3.5 shrink-0" />
        <span>{{ kickoffDisplay }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span v-if="isValueBet"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] font-bold">
          <FireIcon class="w-3 h-3" /> VALUE
        </span>
        <span v-if="prediction.expert_note"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold">
          <SparklesIcon class="w-3 h-3" /> EXPERT
        </span>
      </div>
    </div>

    <!-- Teams -->
    <div class="mb-2">
      <div class="flex items-center gap-2 text-sm">
        <div class="w-5 h-5 rounded-full bg-bg border border-border flex items-center justify-center shrink-0 overflow-hidden">
          <img v-if="fixture.home_team?.logo_url || fixture.home_team?.logo"
            :src="fixture.home_team.logo_url || fixture.home_team.logo" class="w-3.5 h-3.5 object-contain">
          <span v-else class="text-[8px] font-bold text-muted">H</span>
        </div>
        <span class="font-semibold text-text truncate group-hover:text-accent transition-colors text-sm">{{ homeTeam }}</span>
      </div>
      <div class="flex items-center gap-2 mt-1 text-sm">
        <div class="w-5 h-5 rounded-full bg-bg border border-border flex items-center justify-center shrink-0 overflow-hidden">
          <img v-if="fixture.away_team?.logo_url || fixture.away_team?.logo"
            :src="fixture.away_team.logo_url || fixture.away_team.logo" class="w-3.5 h-3.5 object-contain">
          <span v-else class="text-[8px] font-bold text-muted">A</span>
        </div>
        <span class="font-semibold text-text truncate group-hover:text-accent transition-colors text-sm">{{ awayTeam }}</span>
      </div>
    </div>

    <p v-if="league" class="text-[11px] text-muted mb-3 truncate">{{ league }}</p>

    <div class="border-t border-border mb-3" />

    <!-- ── BINARY MARKET (Over/Under · BTTS · Corners) ── -->
    <template v-if="isBinary && binaryOutcomes">
      <div class="grid grid-cols-2 gap-2 mb-3">
        <!-- Recommended outcome -->
        <div :class="['rounded-lg border-2 p-2.5 text-center', outcomeColor(binaryOutcomes.recommended.outcome).border, outcomeColor(binaryOutcomes.recommended.outcome).bg]">
          <div :class="['text-[10px] font-bold uppercase tracking-wider mb-0.5', outcomeColor(binaryOutcomes.recommended.outcome).text]">Pick</div>
          <div class="font-display font-bold text-base text-text leading-tight">
            {{ outcomeLabel(binaryOutcomes.recommended.outcome, lineValue) }}
          </div>
          <div :class="['text-xs font-semibold mt-1', outcomeColor(binaryOutcomes.recommended.outcome).text]">
            {{ binaryOutcomes.recPct }}%
          </div>
        </div>
        <!-- Other outcome -->
        <div :class="['rounded-lg border p-2.5 text-center opacity-50', outcomeColor(binaryOutcomes.other.outcome).border, outcomeColor(binaryOutcomes.other.outcome).bg]">
          <div :class="['text-[10px] font-semibold uppercase tracking-wider mb-0.5', outcomeColor(binaryOutcomes.other.outcome).text]">Alt</div>
          <div class="font-display font-bold text-base text-muted leading-tight">
            {{ outcomeLabel(binaryOutcomes.other.outcome, lineValue) }}
          </div>
          <div :class="['text-xs mt-1', outcomeColor(binaryOutcomes.other.outcome).text]">
            {{ binaryOutcomes.otherPct }}%
          </div>
        </div>
      </div>
      <!-- Probability bar: rec colour on left, other colour on right -->
      <div class="h-1.5 rounded-full bg-border overflow-hidden mb-3 flex">
        <div :class="['h-full rounded-l-full transition-all', outcomeColor(binaryOutcomes.recommended.outcome).bar]" :style="`width:${binaryOutcomes.recPct}%`" />
        <div :class="['h-full rounded-r-full flex-1 opacity-30', outcomeColor(binaryOutcomes.other.outcome).bar]" />
      </div>
    </template>

    <!-- ── DOUBLE CHANCE (1X · X2 · 12) ── -->
    <template v-else-if="isDoubleChance && dcOutcomes.length">
      <div class="grid grid-cols-3 gap-1.5 mb-3">
        <div v-for="o in dcOutcomes" :key="o.outcome"
          :class="[
            'rounded-lg border p-2 text-center transition-all',
            o.outcome === recommendation
              ? [outcomeColor(o.outcome).border, outcomeColor(o.outcome).bg, 'ring-1', outcomeColor(o.outcome).ring]
              : 'border-border bg-surface/40 opacity-50'
          ]"
        >
          <div :class="['font-display font-bold text-sm leading-none mb-1', o.outcome === recommendation ? outcomeColor(o.outcome).text : 'text-muted']">
            {{ o.outcome }}
          </div>
          <div :class="['text-[11px] font-semibold', o.outcome === recommendation ? 'text-text' : 'text-muted']">
            {{ o.probability != null ? o.probability + '%' : o.confidence_score + '%' }}
          </div>
          <div class="text-[9px] text-muted mt-0.5 leading-tight">{{ outcomeDesc(o.outcome) }}</div>
        </div>
      </div>
    </template>

    <!-- ── HT/FT ── -->
    <template v-else-if="isHtFt">
      <div class="mb-3">
        <!-- Top pick highlighted, coloured by FT result -->
        <div :class="['flex items-center gap-2 p-2.5 rounded-lg border mb-2', outcomeColor(htftOutcomes[0]?.outcome).border, outcomeColor(htftOutcomes[0]?.outcome).bg]">
          <div class="flex-1 text-center">
            <div class="text-[10px] text-muted uppercase tracking-wider">Half Time</div>
            <div class="font-display font-bold text-sm text-text">{{ prediction.ht_label || '—' }}</div>
          </div>
          <div :class="['font-bold text-lg', outcomeColor(htftOutcomes[0]?.outcome).text]">/</div>
          <div class="flex-1 text-center">
            <div class="text-[10px] text-muted uppercase tracking-wider">Full Time</div>
            <div class="font-display font-bold text-sm text-text">{{ prediction.ft_label || '—' }}</div>
          </div>
          <div v-if="htftOutcomes[0]?.probability" :class="['text-xs font-bold ml-1 shrink-0', outcomeColor(htftOutcomes[0]?.outcome).text]">
            {{ htftOutcomes[0].probability }}%
          </div>
        </div>
        <!-- Other top outcomes -->
        <div v-if="htftOutcomes.length > 1" class="flex gap-1.5">
          <div v-for="o in htftOutcomes.slice(1)" :key="o.outcome"
            :class="['flex-1 flex items-center justify-between px-2 py-1 rounded border opacity-50', outcomeColor(o.outcome).border, outcomeColor(o.outcome).bg]">
            <span :class="['text-[11px] font-semibold', outcomeColor(o.outcome).text]">{{ outcomeLabel(o.outcome) }}</span>
            <span :class="['text-[11px]', outcomeColor(o.outcome).text]">{{ o.probability != null ? o.probability + '%' : '' }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- ── FALLBACK (no all_outcomes data) ── -->
    <template v-else>
      <div class="flex items-center justify-between gap-3">
        <span class="inline-block px-2.5 py-1 rounded-full text-xs font-bold border bg-accent/10 text-accent border-accent/20 truncate max-w-[60%]">
          {{ prediction.outcome_display || recommendation }}
        </span>
        <span :class="['text-xs font-semibold', confidenceLabel.cls]">
          {{ confidenceValue }}% · {{ confidenceLabel.text }}
        </span>
      </div>
    </template>


    <!-- Value edge (premium) -->
    <div v-if="isPremium && prediction.value_edge" class="mt-1.5 text-xs text-gold font-semibold">
      +{{ Number(prediction.value_edge).toFixed(1) }}% edge
    </div>

  </RouterLink>
</template>
