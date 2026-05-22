import api from './axios'

const markets = {
  getOverUnder: (params) => api.get('/api/markets/over-under', { params }).then(r => r.data.data),
  getBtts: (params) => api.get('/api/markets/btts', { params }).then(r => r.data.data),
  getDoubleChance: (params) => api.get('/api/markets/double-chance', { params }).then(r => r.data.data),
  getCorners: (params) => api.get('/api/markets/corners', { params }).then(r => r.data.data),
  getHtFt: (params) => api.get('/api/markets/ht-ft', { params }).then(r => r.data.data),
  getValueBets: (params) => api.get('/api/markets/value-bets', { params }).then(r => r.data.data),
  getFixtureMarkets: (id) => api.get(`/api/markets/fixture/${id}`).then(r => r.data.data),
}

export default markets
