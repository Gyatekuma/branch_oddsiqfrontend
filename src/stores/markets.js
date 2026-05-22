import { defineStore } from 'pinia'
import { ref } from 'vue'
import marketsApi from '@/api/markets'

export const useMarketsStore = defineStore('markets', () => {
  const predictions = ref([])
  const loading = ref(false)
  const error = ref(null)
  const total = ref(0)
  const isPremiumUser = ref(false)

  // Pagination
  const page = ref(1)
  const perPage = ref(20)
  const totalPages = ref(1)

  const fetchers = {
    over_under: (p) => marketsApi.getOverUnder(p),
    btts: (p) => marketsApi.getBtts(p),
    double_chance: (p) => marketsApi.getDoubleChance(p),
    corners: (p) => marketsApi.getCorners(p),
    ht_ft: (p) => marketsApi.getHtFt(p),
    value_bets: (p) => marketsApi.getValueBets(p),
  }

  async function fetchMarket(tab, params = {}) {
    loading.value = true
    error.value = null
    try {
      const fn = fetchers[tab]
      if (!fn) return
      const data = await fn({ ...params, page: page.value, per_page: perPage.value })
      predictions.value = data.predictions || []
      total.value = data.total || 0
      totalPages.value = data.total_pages || 1
      isPremiumUser.value = data.is_premium_user || false
    } catch {
      error.value = 'Failed to load predictions'
      predictions.value = []
    } finally {
      loading.value = false
    }
  }

  function resetPage() {
    page.value = 1
  }

  return { predictions, loading, error, total, totalPages, page, perPage, isPremiumUser, fetchMarket, resetPage }
})
