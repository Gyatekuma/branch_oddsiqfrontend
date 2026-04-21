import api from './axios'

export const fixturesApi = {
  async getAll(params = {}) {
    const queryParams = {}

    if (params.league) queryParams.league = params.league
    if (params.date) queryParams.date = params.date
    if (params.status) queryParams.status = params.status
    if (params.page) queryParams.page = params.page
    if (params.per_page) queryParams.per_page = params.per_page

    const response = await api.get('/api/fixtures/', { params: queryParams })
    const data = response.data.data

    return {
      fixtures: data.fixtures || [],
      page: data.page || 1,
      per_page: data.per_page || 20,
      total: data.total || 0,
      total_pages: data.total_pages || 1
    }
  },

  async getById(id) {
    const response = await api.get(`/api/fixtures/${id}`)
    return { fixture: response.data.data }
  },

  async getToday() {
    const response = await api.get('/api/fixtures/today')
    const data = response.data.data
    return { fixtures: data.fixtures || data || [] }
  },

  async getByDate(date) {
    const response = await api.get('/api/fixtures/by-date', { params: { date } })
    const data = response.data.data
    return { fixtures: data.fixtures || data || [] }
  },

  async getBySport(sport) {
    const response = await api.get(`/api/fixtures/sport/${sport}`)
    const data = response.data.data
    return { fixtures: data.fixtures || data || [] }
  },

  async getByLeague(leagueId) {
    const response = await api.get(`/api/fixtures/league/${leagueId}`)
    const data = response.data.data
    return { fixtures: data.fixtures || data || [] }
  },

  async getUpcoming(sport = null, limit = 10) {
    const params = { limit }
    if (sport) params.sport = sport

    const response = await api.get('/api/fixtures/upcoming', { params })
    const data = response.data.data
    return { fixtures: data.fixtures || data || [] }
  },

  async getLive() {
    const response = await api.get('/api/fixtures/live')
    const data = response.data.data
    return { fixtures: data.fixtures || data || [] }
  },

  async getForm(teamId, limit = 5) {
    console.log('[FixturesAPI] getForm called for team:', teamId)
    const response = await api.get(`/api/fixtures/team/${teamId}/form`, { params: { limit } })
    const data = response.data.data
    console.log('[FixturesAPI] getForm response:', data)
    return {
      team: data.team,
      results: data.results || [],
      records: data.records || []
    }
  },

  async getH2H(team1Id, team2Id, limit = 5) {
    console.log('[FixturesAPI] getH2H called for teams:', team1Id, team2Id)
    const response = await api.get(`/api/fixtures/h2h/${team1Id}/${team2Id}`, { params: { limit } })
    const data = response.data.data
    console.log('[FixturesAPI] getH2H response:', data)
    return {
      team1: data.team1,
      team2: data.team2,
      matches: data.matches || [],
      total: data.total || 0
    }
  },

  async getStats(fixtureId) {
    const response = await api.get(`/api/fixtures/${fixtureId}/stats`)
    const data = response.data.data
    return { stats: data.stats || data }
  }
}

export default fixturesApi
