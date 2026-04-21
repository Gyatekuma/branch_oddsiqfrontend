import { defineStore } from 'pinia'
import { ref } from 'vue'
import fixturesApi from '@/api/fixtures'

export const useFixturesStore = defineStore('fixtures', () => {
  // State
  const fixtures = ref([])
  const currentFixture = ref(null)
  const form = ref({ home: [], away: [] })
  const h2h = ref([])
  const stats = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Actions
  async function fetchFixtures(params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await fixturesApi.getAll(params)
      fixtures.value = response.fixtures
      return response.fixtures
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch fixtures'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    loading.value = true
    error.value = null
    try {
      const response = await fixturesApi.getById(id)
      currentFixture.value = response.fixture
      return response.fixture
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch fixture'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchToday(sport = null) {
    loading.value = true
    error.value = null
    try {
      const response = await fixturesApi.getToday(sport)
      fixtures.value = response.fixtures
      return response.fixtures
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch today\'s fixtures'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchByLeague(leagueId) {
    loading.value = true
    error.value = null
    try {
      const response = await fixturesApi.getByLeague(leagueId)
      fixtures.value = response.fixtures
      return response.fixtures
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch league fixtures'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchForm(homeTeamId, awayTeamId, limit = 5) {
    console.log('[FixturesStore] fetchForm called with:', { homeTeamId, awayTeamId, limit })
    try {
      const [homeFormData, awayFormData] = await Promise.all([
        fixturesApi.getForm(homeTeamId, limit),
        fixturesApi.getForm(awayTeamId, limit)
      ])
      console.log('[FixturesStore] Home form data:', homeFormData)
      console.log('[FixturesStore] Away form data:', awayFormData)

      form.value = {
        home: homeFormData.results || [],
        away: awayFormData.results || []
      }
      console.log('[FixturesStore] Form state updated:', form.value)
      return form.value
    } catch (err) {
      console.error('[FixturesStore] Failed to fetch form:', err)
      form.value = { home: [], away: [] }
      return { home: [], away: [] }
    }
  }

  async function fetchH2H(team1Id, team2Id, limit = 5) {
    console.log('[FixturesStore] fetchH2H called with:', { team1Id, team2Id, limit })
    try {
      const response = await fixturesApi.getH2H(team1Id, team2Id, limit)
      console.log('[FixturesStore] H2H response:', response)

      h2h.value = response.matches || []
      console.log('[FixturesStore] H2H state updated:', h2h.value)
      return h2h.value
    } catch (err) {
      console.error('[FixturesStore] Failed to fetch H2H:', err)
      h2h.value = []
      return []
    }
  }

  async function fetchStats(fixtureId) {
    try {
      const response = await fixturesApi.getStats(fixtureId)
      stats.value = response.stats
      return response.stats
    } catch (err) {
      console.error('Failed to fetch stats:', err)
      return null
    }
  }

  function clearCurrent() {
    currentFixture.value = null
    form.value = { home: [], away: [] }
    h2h.value = []
    stats.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    fixtures,
    currentFixture,
    form,
    h2h,
    stats,
    loading,
    error,
    // Actions
    fetchFixtures,
    fetchById,
    fetchToday,
    fetchByLeague,
    fetchForm,
    fetchH2H,
    fetchStats,
    clearCurrent,
    clearError
  }
})
