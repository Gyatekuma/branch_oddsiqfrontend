import api from './axios'

export const predictionsApi = {
  async getAll(params = {}) {
    // Map frontend params to backend params
    const queryParams = {}

    if (params.sport) queryParams.sport = params.sport
    if (params.date) queryParams.date = params.date
    if (params.league) queryParams.league = params.league
    if (params.type) queryParams.type = params.type  // domestic, international, international_club, international_national
    if (params.page) queryParams.page = params.page
    if (params.per_page) queryParams.per_page = params.per_page

    console.log('[PredictionsAPI] getAll called with:', params)
    console.log('[PredictionsAPI] Sending queryParams:', queryParams)

    const response = await api.get('/api/predictions/', { params: queryParams })
    const data = response.data.data

    return {
      predictions: data.predictions || [],
      total: data.total || 0,
      page: data.page || params.page || 1,
      per_page: data.per_page || params.per_page || 20,
      total_pages: data.total_pages || Math.ceil((data.total || 0) / (params.per_page || 20)),
      is_premium_user: data.is_premium_user || false
    }
  },

  async getById(id) {
    console.log('[PredictionsAPI] getById called with ID:', id)
    const response = await api.get(`/api/predictions/${id}`)
    console.log('[PredictionsAPI] getById response:', response.data)
    return { prediction: response.data.data }
  },

  async getToday() {
    const response = await api.get('/api/predictions/today')
    const data = response.data.data
    return {
      predictions: data.predictions || [],
      total: data.total || 0
    }
  },

  async getValueBets(params = {}) {
    const queryParams = {}
    if (params.sport) queryParams.sport = params.sport
    if (params.date) queryParams.date = params.date

    const response = await api.get('/api/predictions/value-bets', { params: queryParams })
    const data = response.data.data
    return {
      predictions: data.predictions || data || []
    }
  },

  async getTopPicks(limit = 3) {
    const response = await api.get('/api/predictions/top-picks', { params: { limit } })
    const data = response.data.data
    return {
      predictions: data.predictions || data || []
    }
  }
}

export default predictionsApi
