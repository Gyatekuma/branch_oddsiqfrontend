import api from './axios'

export const newsletterApi = {
  async subscribe(email) {
    const response = await api.post('/api/newsletter/subscribe', { email })
    return response.data
  },

  async unsubscribe(email) {
    const response = await api.post('/api/newsletter/unsubscribe', { email })
    return response.data
  }
}

export default newsletterApi
