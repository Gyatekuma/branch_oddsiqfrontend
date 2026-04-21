import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import oddsApi from '@/api/odds'

export const useOddsStore = defineStore('odds', () => {
  // State
  const odds = ref([])
  const bestOdds = ref(null)
  const bookmakers = ref([])
  const movements = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const sortedOdds = computed(() => {
    return [...odds.value].sort((a, b) => {
      // Sort by bookmaker name alphabetically
      return a.bookmaker.name.localeCompare(b.bookmaker.name)
    })
  })

  const bestHomeOdds = computed(() => {
    if (!odds.value.length) return null
    return odds.value.reduce((best, current) => {
      if (!best || current.home > best.home) return current
      return best
    }, null)
  })

  const bestDrawOdds = computed(() => {
    if (!odds.value.length) return null
    return odds.value.reduce((best, current) => {
      if (!best || current.draw > best.draw) return current
      return best
    }, null)
  })

  const bestAwayOdds = computed(() => {
    if (!odds.value.length) return null
    return odds.value.reduce((best, current) => {
      if (!best || current.away > best.away) return current
      return best
    }, null)
  })

  // Actions
  async function fetchByFixture(fixtureId) {
    loading.value = true
    error.value = null
    try {
      const response = await oddsApi.getByFixture(fixtureId)
      odds.value = response.odds || []
      bestOdds.value = response.best_odds || null
      return response.odds
    } catch (err) {
      error.value = err.response?.data?.error || err.response?.data?.message || 'Failed to fetch odds'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchBestOdds(fixtureId) {
    try {
      const response = await oddsApi.getBestOdds(fixtureId)
      bestOdds.value = response.best_odds
      return response.best_odds
    } catch (err) {
      console.error('Failed to fetch best odds:', err)
      return null
    }
  }

  async function fetchBookmakers() {
    try {
      const response = await oddsApi.getBookmakers()
      bookmakers.value = response.bookmakers
      return response.bookmakers
    } catch (err) {
      console.error('Failed to fetch bookmakers:', err)
      return []
    }
  }

  async function fetchMovements(fixtureId) {
    try {
      const response = await oddsApi.getMovements(fixtureId)
      movements.value = response.movements
      return response.movements
    } catch (err) {
      console.error('Failed to fetch odds movements:', err)
      return []
    }
  }

  function clear() {
    odds.value = []
    bestOdds.value = null
    movements.value = []
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    odds,
    bestOdds,
    bookmakers,
    movements,
    loading,
    error,
    // Getters
    sortedOdds,
    bestHomeOdds,
    bestDrawOdds,
    bestAwayOdds,
    // Actions
    fetchByFixture,
    fetchBestOdds,
    fetchBookmakers,
    fetchMovements,
    clear,
    clearError
  }
})
