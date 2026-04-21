<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  overUnder: {
    type: Array,
    default: () => []
  },
  doubleChance: {
    type: Array,
    default: () => []
  },
  btts: {
    type: Array,
    default: () => []
  }
})

const { t } = useI18n()

// Group over/under by line value and find best odds
const overUnderByLine = computed(() => {
  const grouped = {}
  props.overUnder.forEach(ou => {
    const line = ou.line_value
    if (!grouped[line]) {
      grouped[line] = []
    }
    grouped[line].push(ou)
  })
  // Sort by line value
  return Object.entries(grouped)
    .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
})

// Get best over/under odds for a line
function getBestOverUnder(odds) {
  if (!odds || !odds.length) return null
  let bestOver = { odds: 0, bookmaker: '' }
  let bestUnder = { odds: 0, bookmaker: '' }

  odds.forEach(o => {
    if (o.odds?.over && o.odds.over > bestOver.odds) {
      bestOver = { odds: o.odds.over, bookmaker: o.bookmaker }
    }
    if (o.odds?.under && o.odds.under > bestUnder.odds) {
      bestUnder = { odds: o.odds.under, bookmaker: o.bookmaker }
    }
  })

  return { over: bestOver, under: bestUnder }
}

// Get best double chance odds
const bestDoubleChance = computed(() => {
  if (!props.doubleChance.length) return null
  let best1X = { odds: 0, bookmaker: '' }
  let bestX2 = { odds: 0, bookmaker: '' }
  let best12 = { odds: 0, bookmaker: '' }

  props.doubleChance.forEach(dc => {
    if (dc.odds?.['1X'] && dc.odds['1X'] > best1X.odds) {
      best1X = { odds: dc.odds['1X'], bookmaker: dc.bookmaker }
    }
    if (dc.odds?.['X2'] && dc.odds['X2'] > bestX2.odds) {
      bestX2 = { odds: dc.odds['X2'], bookmaker: dc.bookmaker }
    }
    if (dc.odds?.['12'] && dc.odds['12'] > best12.odds) {
      best12 = { odds: dc.odds['12'], bookmaker: dc.bookmaker }
    }
  })

  return { '1X': best1X, 'X2': bestX2, '12': best12 }
})

// Get best BTTS odds
const bestBtts = computed(() => {
  if (!props.btts.length) return null
  let bestYes = { odds: 0, bookmaker: '' }
  let bestNo = { odds: 0, bookmaker: '' }

  props.btts.forEach(b => {
    if (b.odds?.yes && b.odds.yes > bestYes.odds) {
      bestYes = { odds: b.odds.yes, bookmaker: b.bookmaker }
    }
    if (b.odds?.no && b.odds.no > bestNo.odds) {
      bestNo = { odds: b.odds.no, bookmaker: b.bookmaker }
    }
  })

  return { yes: bestYes, no: bestNo }
})

// Check if any data is available
const hasAnyData = computed(() => {
  return overUnderByLine.value.length > 0 || props.doubleChance.length > 0 || props.btts.length > 0
})

function formatOdd(value) {
  if (!value && value !== 0) return '-'
  return Number(value).toFixed(2)
}

function getAffiliateUrl(item) {
  return item?.affiliate_url || '#'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Over/Under Section -->
    <div v-if="overUnderByLine.length" class="card overflow-hidden">
      <div class="p-4 border-b border-border">
        <h3 class="section-header">Over/Under Goals</h3>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[350px]">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                Line
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                Over
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                Under
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="[line, odds] in overUnderByLine"
              :key="line"
              class="hover:bg-bg/50 transition-colors"
            >
              <td class="px-4 py-3 font-display font-bold text-text">
                {{ line }}
              </td>
              <td class="px-4 py-3 text-center">
                <span class="inline-block px-3 py-1.5 rounded font-display font-bold text-sm bg-accent/20 text-accent">
                  {{ formatOdd(getBestOverUnder(odds)?.over?.odds) }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="inline-block px-3 py-1.5 rounded font-display font-bold text-sm hover:bg-surface text-text">
                  {{ formatOdd(getBestOverUnder(odds)?.under?.odds) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Double Chance Section -->
    <div v-if="doubleChance.length" class="card overflow-hidden">
      <div class="p-4 border-b border-border">
        <h3 class="section-header">Double Chance</h3>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[350px]">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                Bookmaker
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                1X
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                X2
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                12
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="dc in doubleChance"
              :key="dc.bookmaker"
              class="hover:bg-bg/50 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded bg-surface flex items-center justify-center">
                    <span class="text-xs font-bold text-muted">
                      {{ dc.bookmaker[0] }}
                    </span>
                  </div>
                  <span class="text-sm font-medium text-text">
                    {{ dc.bookmaker }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <a
                  :href="getAffiliateUrl(dc)"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="[
                    'inline-block px-3 py-1.5 rounded font-display font-bold text-sm transition-all',
                    bestDoubleChance && bestDoubleChance['1X']?.bookmaker === dc.bookmaker
                      ? 'bg-accent/20 text-accent border-b-2 border-accent'
                      : 'hover:bg-surface text-text'
                  ]"
                >
                  {{ formatOdd(dc.odds?.['1X']) }}
                </a>
              </td>
              <td class="px-4 py-3 text-center">
                <a
                  :href="getAffiliateUrl(dc)"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="[
                    'inline-block px-3 py-1.5 rounded font-display font-bold text-sm transition-all',
                    bestDoubleChance && bestDoubleChance['X2']?.bookmaker === dc.bookmaker
                      ? 'bg-accent/20 text-accent border-b-2 border-accent'
                      : 'hover:bg-surface text-text'
                  ]"
                >
                  {{ formatOdd(dc.odds?.['X2']) }}
                </a>
              </td>
              <td class="px-4 py-3 text-center">
                <a
                  :href="getAffiliateUrl(dc)"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="[
                    'inline-block px-3 py-1.5 rounded font-display font-bold text-sm transition-all',
                    bestDoubleChance && bestDoubleChance['12']?.bookmaker === dc.bookmaker
                      ? 'bg-accent/20 text-accent border-b-2 border-accent'
                      : 'hover:bg-surface text-text'
                  ]"
                >
                  {{ formatOdd(dc.odds?.['12']) }}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Best odds summary -->
      <div v-if="bestDoubleChance" class="p-4 bg-bg/50 border-t border-border">
        <p class="text-xs text-muted mb-2">Best Double Chance Odds</p>
        <div class="flex items-center justify-around text-sm">
          <div v-if="bestDoubleChance['1X']?.odds" class="text-center">
            <span class="text-muted">1X:</span>
            <span class="text-accent font-display font-bold ml-1">{{ formatOdd(bestDoubleChance['1X'].odds) }}</span>
          </div>
          <div v-if="bestDoubleChance['X2']?.odds" class="text-center">
            <span class="text-muted">X2:</span>
            <span class="text-accent font-display font-bold ml-1">{{ formatOdd(bestDoubleChance['X2'].odds) }}</span>
          </div>
          <div v-if="bestDoubleChance['12']?.odds" class="text-center">
            <span class="text-muted">12:</span>
            <span class="text-accent font-display font-bold ml-1">{{ formatOdd(bestDoubleChance['12'].odds) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- BTTS (Both Teams To Score) Section -->
    <div v-if="btts.length" class="card overflow-hidden">
      <div class="p-4 border-b border-border">
        <h3 class="section-header">Both Teams to Score</h3>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[350px]">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                Bookmaker
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                Yes
              </th>
              <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
                No
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="b in btts"
              :key="b.bookmaker"
              class="hover:bg-bg/50 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded bg-surface flex items-center justify-center">
                    <span class="text-xs font-bold text-muted">
                      {{ b.bookmaker[0] }}
                    </span>
                  </div>
                  <span class="text-sm font-medium text-text">
                    {{ b.bookmaker }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <a
                  :href="getAffiliateUrl(b)"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="[
                    'inline-block px-3 py-1.5 rounded font-display font-bold text-sm transition-all',
                    bestBtts && bestBtts.yes?.bookmaker === b.bookmaker
                      ? 'bg-accent/20 text-accent border-b-2 border-accent'
                      : 'hover:bg-surface text-text'
                  ]"
                >
                  {{ formatOdd(b.odds?.yes) }}
                </a>
              </td>
              <td class="px-4 py-3 text-center">
                <a
                  :href="getAffiliateUrl(b)"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="[
                    'inline-block px-3 py-1.5 rounded font-display font-bold text-sm transition-all',
                    bestBtts && bestBtts.no?.bookmaker === b.bookmaker
                      ? 'bg-accent/20 text-accent border-b-2 border-accent'
                      : 'hover:bg-surface text-text'
                  ]"
                >
                  {{ formatOdd(b.odds?.no) }}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Best odds summary -->
      <div v-if="bestBtts" class="p-4 bg-bg/50 border-t border-border">
        <p class="text-xs text-muted mb-2">Best BTTS Odds</p>
        <div class="flex items-center justify-around text-sm">
          <div v-if="bestBtts.yes?.odds" class="text-center">
            <span class="text-muted">Yes:</span>
            <span class="text-accent font-display font-bold ml-1">{{ formatOdd(bestBtts.yes.odds) }}</span>
          </div>
          <div v-if="bestBtts.no?.odds" class="text-center">
            <span class="text-muted">No:</span>
            <span class="text-accent font-display font-bold ml-1">{{ formatOdd(bestBtts.no.odds) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!hasAnyData" class="card p-8 text-center">
      <p class="text-muted">No additional market odds available</p>
    </div>
  </div>
</template>
