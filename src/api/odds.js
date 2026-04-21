import api from './axios'

export const oddsApi = {
  async getByFixture(fixtureId) {
    const response = await api.get(`/api/odds/${fixtureId}`)
    const data = response.data.data

    return {
      fixture: data.fixture,
      odds: data.odds || [],
      best_odds: data.best_odds || null
    }
  },

  async getByMatch(matchId) {
    // Alias for getByFixture
    return this.getByFixture(matchId)
  },

  async getBestOdds(fixtureId) {
    const response = await api.get(`/api/odds/fixture/${fixtureId}/best`)
    const data = response.data.data
    return { best_odds: data.best_odds || data }
  },

  async getBookmakers() {
    const response = await api.get('/api/odds/bookmakers')
    const data = response.data.data
    return { bookmakers: data.bookmakers || data || [] }
  },

  async compare(fixtureId) {
    const response = await api.get(`/api/odds/compare/${fixtureId}`)
    const data = response.data.data
    return {
      odds: data.odds || [],
      best_odds: data.best_odds || null
    }
  }
}

export default oddsApi
