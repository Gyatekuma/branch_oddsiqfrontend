import api from './axios'

export const accuracyApi = {
  // Get comprehensive accuracy stats
  async getOverall() {
    const response = await api.get('/api/accuracy/')
    const data = response.data.data

    return {
      overall: data.overall || {},
      bySport: data.by_sport || {},
      byOutcome: data.by_outcome || {},
      byConfidence: data.by_confidence || [],
      valueBets: data.value_bets || {}
    }
  },

  // Get quick summary (today, week, month, all-time)
  async getSummary() {
    const response = await api.get('/api/accuracy/summary')
    const data = response.data.data

    return {
      today: data.today || {},
      thisWeek: data.this_week || {},
      thisMonth: data.this_month || {},
      allTime: data.all_time || {}
    }
  },

  // Get accuracy trends for chart (last 30 days)
  async getTrends() {
    const response = await api.get('/api/accuracy/trends')
    const data = response.data.data

    return {
      trends: data.trends || []
    }
  },

  // Get recent prediction results
  async getRecent(limit = 20) {
    const response = await api.get('/api/accuracy/recent', { params: { limit } })
    const data = response.data.data

    return {
      recent: data.recent || [],
      currentStreak: data.current_streak || null
    }
  },

  // Get accuracy by league
  async getByLeague() {
    const response = await api.get('/api/accuracy/leagues')
    const data = response.data.data

    return {
      leagues: data.leagues || []
    }
  },

  // Get accuracy for specific sport
  async getForSport(sportName) {
    const response = await api.get(`/api/accuracy/${sportName}`)
    const data = response.data.data

    return {
      sport: data.sport || {},
      accuracy: data.accuracy || {}
    }
  }
}

export default accuracyApi
