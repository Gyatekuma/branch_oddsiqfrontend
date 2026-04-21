<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  odds: {
    type: Array,
    default: () => []
  },
  bestOdds: {
    type: Object,
    default: null
  }
})

const { t } = useI18n()

const sortedOdds = computed(() => {
  return [...props.odds].sort((a, b) => {
    const nameA = a.bookmaker || a.bookmaker_name || a.bookmaker?.name || ''
    const nameB = b.bookmaker || b.bookmaker_name || b.bookmaker?.name || ''
    return nameA.localeCompare(nameB)
  })
})

function isBestOdd(odd, type) {
  if (!props.bestOdds || !props.bestOdds[type]) return false
  const bookmakerName = odd.bookmaker || odd.bookmaker_name || odd.bookmaker?.name
  return props.bestOdds[type].bookmaker === bookmakerName
}

function getAffiliateUrl(odd) {
  return odd.affiliate_url || odd.bookmaker?.affiliate_url || odd.bookmaker?.url || '#'
}

function getBookmakerName(odd) {
  return odd.bookmaker || odd.bookmaker_name || odd.bookmaker?.name || 'Unknown'
}

function getHomeOdds(odd) {
  return odd.home_odds || odd.home_win_odds || odd.home || null
}

function getDrawOdds(odd) {
  return odd.draw_odds || odd.draw || null
}

function getAwayOdds(odd) {
  return odd.away_odds || odd.away_win_odds || odd.away || null
}

function formatOdd(value) {
  if (!value && value !== 0) return '-'
  return Number(value).toFixed(2)
}
</script>

<template>
  <div class="card overflow-hidden">
    <div class="p-4 border-b border-border">
      <h3 class="section-header">{{ t('match.odds') }}</h3>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[400px]">
        <thead>
          <tr class="border-b border-border">
            <th class="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
              Bookmaker
            </th>
            <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
              1
            </th>
            <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
              X
            </th>
            <th class="text-center px-4 py-3 text-xs font-display uppercase tracking-wider text-muted">
              2
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="odd in sortedOdds"
            :key="odd.id"
            class="hover:bg-bg/50 transition-colors"
          >
            <!-- Bookmaker -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded bg-surface flex items-center justify-center">
                  <span class="text-xs font-bold text-muted">
                    {{ getBookmakerName(odd)[0] }}
                  </span>
                </div>
                <span class="text-sm font-medium text-text">
                  {{ getBookmakerName(odd) }}
                </span>
              </div>
            </td>

            <!-- Home odds -->
            <td class="px-4 py-3 text-center">
              <a
                :href="getAffiliateUrl(odd)"
                target="_blank"
                rel="noopener noreferrer"
                :class="[
                  'inline-block px-3 py-1.5 rounded font-display font-bold text-sm transition-all',
                  isBestOdd(odd, 'home')
                    ? 'bg-accent/20 text-accent border-b-2 border-accent'
                    : 'hover:bg-surface text-text'
                ]"
              >
                {{ formatOdd(getHomeOdds(odd)) }}
              </a>
            </td>

            <!-- Draw odds -->
            <td class="px-4 py-3 text-center">
              <a
                :href="getAffiliateUrl(odd)"
                target="_blank"
                rel="noopener noreferrer"
                :class="[
                  'inline-block px-3 py-1.5 rounded font-display font-bold text-sm transition-all',
                  isBestOdd(odd, 'draw')
                    ? 'bg-accent/20 text-accent border-b-2 border-accent'
                    : 'hover:bg-surface text-text'
                ]"
              >
                {{ formatOdd(getDrawOdds(odd)) }}
              </a>
            </td>

            <!-- Away odds -->
            <td class="px-4 py-3 text-center">
              <a
                :href="getAffiliateUrl(odd)"
                target="_blank"
                rel="noopener noreferrer"
                :class="[
                  'inline-block px-3 py-1.5 rounded font-display font-bold text-sm transition-all',
                  isBestOdd(odd, 'away')
                    ? 'bg-accent/20 text-accent border-b-2 border-accent'
                    : 'hover:bg-surface text-text'
                ]"
              >
                {{ formatOdd(getAwayOdds(odd)) }}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Best odds summary -->
    <div v-if="bestOdds" class="p-4 bg-bg/50 border-t border-border">
      <p class="text-xs text-muted mb-2">{{ t('match.bestOdds') }}</p>
      <div class="flex items-center justify-around text-sm">
        <div v-if="bestOdds.home" class="text-center">
          <span class="text-accent font-display font-bold">{{ formatOdd(bestOdds.home.odds) }}</span>
          <span class="text-muted ml-1">@ {{ bestOdds.home.bookmaker }}</span>
        </div>
        <div v-if="bestOdds.draw" class="text-center">
          <span class="text-accent font-display font-bold">{{ formatOdd(bestOdds.draw.odds) }}</span>
          <span class="text-muted ml-1">@ {{ bestOdds.draw.bookmaker }}</span>
        </div>
        <div v-if="bestOdds.away" class="text-center">
          <span class="text-accent font-display font-bold">{{ formatOdd(bestOdds.away.odds) }}</span>
          <span class="text-muted ml-1">@ {{ bestOdds.away.bookmaker }}</span>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!odds.length" class="p-8 text-center">
      <p class="text-muted">No odds available</p>
    </div>
  </div>
</template>
