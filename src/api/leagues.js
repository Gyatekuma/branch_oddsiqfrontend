import api from './axios'

export const leaguesApi = {
  async getAll() {
    const response = await api.get('/api/leagues/')
    const data = response.data.data
    // Response is grouped by sport: { football: [...], basketball: [...], tennis: [...] }
    return { leagues: data }
  },

  async getById(id) {
    const response = await api.get(`/api/leagues/${id}`)
    return { league: response.data.data }
  },

  async getBySport(sport) {
    const response = await api.get(`/api/leagues/by-sport/${sport}`)
    const data = response.data.data
    return { leagues: data.leagues || data || [] }
  },

  async getTeams(leagueId) {
    const response = await api.get(`/api/leagues/${leagueId}/teams`)
    const data = response.data.data
    return { teams: data.teams || data || [] }
  },

  async getFixtures(leagueId, params = {}) {
    const queryParams = {}
    if (params.status) queryParams.status = params.status
    if (params.page) queryParams.page = params.page
    if (params.per_page) queryParams.per_page = params.per_page

    const response = await api.get(`/api/leagues/${leagueId}/fixtures`, { params: queryParams })
    const data = response.data.data
    return {
      fixtures: data.fixtures || data || [],
      page: data.page,
      per_page: data.per_page,
      total: data.total,
      total_pages: data.total_pages
    }
  },

  // Note: The backend doesn't have a dedicated predictions by league endpoint
  // Predictions are fetched via /api/predictions/?league=<id>
  async getPredictions(leagueId, params = {}) {
    const queryParams = { league: leagueId }
    if (params.page) queryParams.page = params.page
    if (params.per_page) queryParams.per_page = params.per_page

    const response = await api.get('/api/predictions/', { params: queryParams })
    const data = response.data.data
    return {
      predictions: data.predictions || [],
      total: data.total || 0,
      total_pages: data.total_pages || 1
    }
  }
}

export default leaguesApi
