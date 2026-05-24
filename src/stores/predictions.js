import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import predictionsApi from '@/api/predictions'

export const usePredictionsStore = defineStore('predictions', () => {
  // State
  const predictions = ref([])
  const currentPrediction = ref(null)
  const topPicks = ref([])
  const valueBets = ref([])
  const savedPredictions = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    perPage: 12,
    total: 0,
    totalPages: 0
  })
  const filters = ref({
    sport: null,
    league: null,
    date: null
  })

  // Getters
  const hasMore = computed(() => pagination.value.page < pagination.value.totalPages)

  // Actions
  async function fetchPredictions(params = {}) {
    loading.value = true
    error.value = null
    try {
      // Reset to page 1 when filters change
      if (Object.keys(params).length > 0) {
        pagination.value.page = 1
      }

      const queryParams = {
        page: pagination.value.page,
        per_page: pagination.value.perPage,
        ...filters.value,
        ...params
      }
      // Remove null/undefined values
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === null || queryParams[key] === undefined) delete queryParams[key]
      })

      console.log('[PredictionsStore] Fetching with params:', queryParams)

      const response = await predictionsApi.getAll(queryParams)
      predictions.value = response.predictions
      pagination.value = {
        page: response.page,
        perPage: response.per_page,
        total: response.total,
        totalPages: response.total_pages,
        totalAvailable: response.total_available ?? response.total
      }
      return response
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch predictions'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loading.value) return
    pagination.value.page++
    loading.value = true
    try {
      const queryParams = {
        page: pagination.value.page,
        per_page: pagination.value.perPage,
        ...filters.value
      }
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === null) delete queryParams[key]
      })

      const response = await predictionsApi.getAll(queryParams)
      predictions.value = [...predictions.value, ...response.predictions]
      pagination.value.totalPages = response.total_pages
      return response
    } catch (err) {
      pagination.value.page--
      error.value = err.response?.data?.message || 'Failed to load more'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    currentPrediction.value = null
    loading.value = true
    error.value = null
    console.log('[PredictionsStore] fetchById called with:', id)
    try {
      const response = await predictionsApi.getById(id)
      console.log('[PredictionsStore] fetchById response:', response)
      currentPrediction.value = response.prediction
      console.log('[PredictionsStore] currentPrediction set to:', currentPrediction.value)
      return response.prediction
    } catch (err) {
      console.error('[PredictionsStore] fetchById error:', err)
      error.value = err.response?.data?.message || 'Failed to fetch prediction'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTopPicks(limit = 3) {
    const CACHE_KEY = `edi_top_picks_${limit}`
    const TTL = 5 * 60 * 1000

    // Serve stale data immediately so the hero card renders without waiting
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (cached && Date.now() - cached.ts < TTL && cached.data?.length) {
        topPicks.value = cached.data
      }
    } catch {}

    try {
      const response = await predictionsApi.getTopPicks(limit)
      topPicks.value = response.predictions
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: response.predictions }))
      } catch {}
      return response.predictions
    } catch (err) {
      console.error('Failed to fetch top picks:', err)
      return topPicks.value
    }
  }

  async function fetchValueBets() {
    try {
      const response = await predictionsApi.getValueBets()
      valueBets.value = response.predictions
      return response.predictions
    } catch (err) {
      console.error('Failed to fetch value bets:', err)
      return []
    }
  }

  // Note: Backend doesn't have save/unsave prediction endpoints
  // These functions store locally only
  async function fetchSaved() {
    // Return locally saved predictions
    return savedPredictions.value
  }

  function savePrediction(id) {
    const prediction = predictions.value.find(p => p.id === id)
    if (prediction && !savedPredictions.value.find(p => p.id === id)) {
      savedPredictions.value.push({ ...prediction, is_saved: true })
    }
    if (currentPrediction.value?.id === id) {
      currentPrediction.value.is_saved = true
    }
  }

  function unsavePrediction(id) {
    savedPredictions.value = savedPredictions.value.filter(p => p.id !== id)
    const prediction = predictions.value.find(p => p.id === id)
    if (prediction) {
      prediction.is_saved = false
    }
    if (currentPrediction.value?.id === id) {
      currentPrediction.value.is_saved = false
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1
  }

  function resetFilters() {
    filters.value = { sport: null, league: null, date: null }
    pagination.value.page = 1
  }

  function clearCurrent() {
    currentPrediction.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    predictions,
    currentPrediction,
    topPicks,
    valueBets,
    savedPredictions,
    loading,
    error,
    pagination,
    filters,
    // Getters
    hasMore,
    // Actions
    fetchPredictions,
    loadMore,
    fetchById,
    fetchTopPicks,
    fetchValueBets,
    fetchSaved,
    savePrediction,
    unsavePrediction,
    setFilters,
    resetFilters,
    clearCurrent,
    clearError
  }
})
